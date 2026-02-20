import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToolExecutionService } from '../index';
import { type ToolExecutionContext } from '../types';

// Mock external dependencies
vi.mock('@/server/services/discover');
vi.mock('@/server/services/mcp/contentProcessor', () => ({
  contentBlocksToString: vi.fn((blocks: any[]) => blocks.map((b: any) => b.text ?? '').join('')),
}));
vi.mock('@/server/utils/truncateToolResult', () => ({
  DEFAULT_TOOL_RESULT_MAX_LENGTH: 25_000,
  truncateToolResult: vi.fn((content: string, maxLength?: number) => {
    const limit = maxLength ?? 25_000;
    if (!content || content.length <= limit) return content;
    return content.slice(0, limit) + '\n\n[Content truncated]';
  }),
}));
vi.mock('debug', () => ({ default: () => vi.fn() }));

const makeContext = (overrides: Partial<ToolExecutionContext> = {}): ToolExecutionContext => ({
  toolManifestMap: {},
  userId: 'user-1',
  ...overrides,
});

describe('ToolExecutionService', () => {
  let mockBuiltinExecutor: any;
  let mockMcpService: any;
  let mockPluginGatewayService: any;
  let service: ToolExecutionService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockBuiltinExecutor = {
      execute: vi.fn().mockResolvedValue({ content: 'builtin result', success: true }),
    };
    mockMcpService = {
      callTool: vi.fn().mockResolvedValue('mcp result'),
    };
    mockPluginGatewayService = {
      execute: vi.fn().mockResolvedValue({ content: 'plugin result', success: true }),
    };

    service = new ToolExecutionService({
      builtinToolsExecutor: mockBuiltinExecutor,
      mcpService: mockMcpService,
      pluginGatewayService: mockPluginGatewayService,
    });
  });

  describe('executeTool', () => {
    it('should route builtin type to builtinToolsExecutor', async () => {
      const payload: any = {
        identifier: 'my-tool',
        apiName: 'run',
        type: 'builtin',
        arguments: '{}',
      };
      const context = makeContext();

      const result = await service.executeTool(payload, context);

      expect(mockBuiltinExecutor.execute).toHaveBeenCalledWith(payload, context);
      expect(result.content).toBe('builtin result');
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should route plugin type to pluginGatewayService', async () => {
      const payload: any = {
        identifier: 'my-plugin',
        apiName: 'action',
        type: 'standalone',
        arguments: '{}',
      };
      const context = makeContext();

      const result = await service.executeTool(payload, context);

      expect(mockPluginGatewayService.execute).toHaveBeenCalledWith(payload, context);
      expect(result.content).toBe('plugin result');
      expect(result.success).toBe(true);
    });

    it('should include executionTime in result', async () => {
      const payload: any = {
        identifier: 'my-tool',
        apiName: 'run',
        type: 'builtin',
        arguments: '{}',
      };

      const result = await service.executeTool(payload, makeContext());

      expect(typeof result.executionTime).toBe('number');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should return error response when execution throws', async () => {
      mockBuiltinExecutor.execute.mockRejectedValue(new Error('execution failed'));

      const payload: any = {
        identifier: 'my-tool',
        apiName: 'run',
        type: 'builtin',
        arguments: '{}',
      };

      const result = await service.executeTool(payload, makeContext());

      expect(result.success).toBe(false);
      expect(result.content).toContain('execution failed');
      expect(result.error).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should truncate result content when it exceeds maxLength', async () => {
      const longContent = 'a'.repeat(30_000);
      mockBuiltinExecutor.execute.mockResolvedValue({ content: longContent, success: true });

      const payload: any = {
        identifier: 'my-tool',
        apiName: 'run',
        type: 'builtin',
        arguments: '{}',
      };

      const result = await service.executeTool(payload, makeContext({ toolResultMaxLength: 100 }));

      expect(result.content.length).toBeLessThan(longContent.length);
      expect(result.content).toContain('[Content truncated]');
    });

    it('should not truncate content within limit', async () => {
      const shortContent = 'hello world';
      mockBuiltinExecutor.execute.mockResolvedValue({ content: shortContent, success: true });

      const payload: any = {
        identifier: 'my-tool',
        apiName: 'run',
        type: 'builtin',
        arguments: '{}',
      };

      const result = await service.executeTool(payload, makeContext());

      expect(result.content).toBe(shortContent);
    });

    describe('mcp type routing', () => {
      it('should return error when manifest is not found', async () => {
        const payload: any = {
          identifier: 'unknown-mcp',
          apiName: 'run',
          type: 'mcp',
          arguments: '{}',
        };
        const context = makeContext({ toolManifestMap: {} });

        const result = await service.executeTool(payload, context);

        expect(result.success).toBe(false);
        expect(result.content).toContain('Manifest not found');
        expect(result.error?.code).toBe('MANIFEST_NOT_FOUND');
      });

      it('should return error when MCP config is missing in manifest', async () => {
        const payload: any = {
          identifier: 'my-mcp',
          apiName: 'run',
          type: 'mcp',
          arguments: '{}',
        };
        const context = makeContext({
          toolManifestMap: { 'my-mcp': { identifier: 'my-mcp' } as any },
        });

        const result = await service.executeTool(payload, context);

        expect(result.success).toBe(false);
        expect(result.content).toContain('MCP configuration not found');
        expect(result.error?.code).toBe('MCP_CONFIG_NOT_FOUND');
      });

      it('should call mcpService for stdio MCP tools', async () => {
        const payload: any = {
          identifier: 'my-mcp',
          apiName: 'search',
          type: 'mcp',
          arguments: '{"query":"test"}',
        };
        const mcpParams = { type: 'stdio', command: 'npx', args: ['tool'] };
        const context = makeContext({
          toolManifestMap: {
            'my-mcp': { identifier: 'my-mcp', mcpParams } as any,
          },
        });

        const result = await service.executeTool(payload, context);

        expect(mockMcpService.callTool).toHaveBeenCalledWith({
          argsStr: '{"query":"test"}',
          clientParams: mcpParams,
          toolName: 'search',
        });
        expect(result.success).toBe(true);
        expect(result.content).toBe('mcp result');
      });

      it('should return error when standard MCP callTool fails', async () => {
        mockMcpService.callTool.mockRejectedValue(new Error('connection refused'));

        const payload: any = {
          identifier: 'my-mcp',
          apiName: 'run',
          type: 'mcp',
          arguments: '{}',
        };
        const context = makeContext({
          toolManifestMap: {
            'my-mcp': {
              identifier: 'my-mcp',
              mcpParams: { type: 'http', url: 'http://host' },
            } as any,
          },
        });

        const result = await service.executeTool(payload, context);

        expect(result.success).toBe(false);
        expect(result.content).toBe('connection refused');
        expect(result.error?.code).toBe('MCP_EXECUTION_ERROR');
      });

      it('should route cloud MCP tools to cloud handler', async () => {
        const { DiscoverService } = await import('@/server/services/discover');
        const mockCallCloud = vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'cloud result' }],
          isError: false,
        });
        vi.mocked(DiscoverService).mockImplementation(
          () => ({ callCloudMcpEndpoint: mockCallCloud }) as any,
        );

        const payload: any = {
          identifier: 'cloud-mcp',
          apiName: 'query',
          type: 'mcp',
          arguments: '{"q":"data"}',
        };
        const mcpParams = { type: 'cloud', endpoint: 'https://api.example.com' };
        const context = makeContext({
          toolManifestMap: {
            'cloud-mcp': { identifier: 'cloud-mcp', mcpParams } as any,
          },
        });

        const result = await service.executeTool(payload, context);

        expect(mockCallCloud).toHaveBeenCalledWith({
          apiParams: { q: 'data' },
          identifier: 'cloud-mcp',
          toolName: 'query',
        });
        expect(result.success).toBe(true);
        expect(result.content).toBe('cloud result');
      });

      it('should return isError=true from cloud as success=false', async () => {
        const { DiscoverService } = await import('@/server/services/discover');
        vi.mocked(DiscoverService).mockImplementation(
          () =>
            ({
              callCloudMcpEndpoint: vi.fn().mockResolvedValue({
                content: [{ type: 'text', text: 'error content' }],
                isError: true,
              }),
            }) as any,
        );

        const payload: any = {
          identifier: 'cloud-mcp',
          apiName: 'query',
          type: 'mcp',
          arguments: '{}',
        };
        const context = makeContext({
          toolManifestMap: {
            'cloud-mcp': {
              identifier: 'cloud-mcp',
              mcpParams: { type: 'cloud' },
            } as any,
          },
        });

        const result = await service.executeTool(payload, context);

        expect(result.success).toBe(false);
      });

      it('should handle cloud MCP execution errors', async () => {
        const { DiscoverService } = await import('@/server/services/discover');
        vi.mocked(DiscoverService).mockImplementation(
          () =>
            ({
              callCloudMcpEndpoint: vi.fn().mockRejectedValue(new Error('cloud error')),
            }) as any,
        );

        const payload: any = {
          identifier: 'cloud-mcp',
          apiName: 'query',
          type: 'mcp',
          arguments: '{}',
        };
        const context = makeContext({
          toolManifestMap: {
            'cloud-mcp': {
              identifier: 'cloud-mcp',
              mcpParams: { type: 'cloud' },
            } as any,
          },
        });

        const result = await service.executeTool(payload, context);

        expect(result.success).toBe(false);
        expect(result.content).toBe('cloud error');
        expect(result.error?.code).toBe('CLOUD_MCP_EXECUTION_ERROR');
      });
    });
  });
});
