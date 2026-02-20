import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BuiltinToolsExecutor } from '../builtin';
import * as serverRuntimes from '../serverRuntimes';

// Mock external services
vi.mock('@/server/services/market', () => ({ MarketService: vi.fn() }));
vi.mock('@/server/services/klavis', () => ({ KlavisService: vi.fn() }));
vi.mock('../serverRuntimes', () => ({
  hasServerRuntime: vi.fn(),
  getServerRuntime: vi.fn(),
  getServerRuntimeIdentifiers: vi.fn(),
}));
vi.mock('debug', () => ({ default: () => vi.fn() }));

const makePayload = (overrides: Record<string, any> = {}) => ({
  identifier: 'test-tool',
  apiName: 'run',
  arguments: '{"key":"value"}',
  source: 'builtin',
  ...overrides,
});

const makeContext = (overrides: Record<string, any> = {}) => ({
  toolManifestMap: {},
  userId: 'user-1',
  ...overrides,
});

describe('BuiltinToolsExecutor', () => {
  let executor: BuiltinToolsExecutor;
  let mockMarketService: any;
  let mockKlavisService: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { MarketService } = await import('@/server/services/market');
    const { KlavisService } = await import('@/server/services/klavis');

    mockMarketService = {
      executeLobehubSkill: vi.fn().mockResolvedValue({ content: 'lobehub result', success: true }),
    };
    mockKlavisService = {
      executeKlavisTool: vi.fn().mockResolvedValue({ content: 'klavis result', success: true }),
    };

    vi.mocked(MarketService).mockImplementation(() => mockMarketService);
    vi.mocked(KlavisService).mockImplementation(() => mockKlavisService);

    executor = new BuiltinToolsExecutor({} as any, 'user-1');
  });

  describe('execute', () => {
    it('should route lobehubSkill to MarketService', async () => {
      const payload = makePayload({
        source: 'lobehubSkill',
        identifier: 'my-skill',
        apiName: 'run',
      });
      const context = makeContext();

      const result = await executor.execute(payload as any, context as any);

      expect(mockMarketService.executeLobehubSkill).toHaveBeenCalledWith({
        args: { key: 'value' },
        provider: 'my-skill',
        toolName: 'run',
      });
      expect(result.content).toBe('lobehub result');
      expect(result.success).toBe(true);
    });

    it('should route klavis source to KlavisService', async () => {
      const payload = makePayload({
        source: 'klavis',
        identifier: 'klavis-tool',
        apiName: 'query',
      });
      const context = makeContext();

      const result = await executor.execute(payload as any, context as any);

      expect(mockKlavisService.executeKlavisTool).toHaveBeenCalledWith({
        args: { key: 'value' },
        identifier: 'klavis-tool',
        toolName: 'query',
      });
      expect(result.content).toBe('klavis result');
      expect(result.success).toBe(true);
    });

    it('should throw when identifier has no server runtime', async () => {
      vi.mocked(serverRuntimes.hasServerRuntime).mockReturnValue(false);

      const payload = makePayload({ source: 'builtin', identifier: 'unknown-tool' });

      await expect(executor.execute(payload as any, makeContext() as any)).rejects.toThrow(
        'Builtin tool "unknown-tool" is not implemented',
      );
    });

    it('should throw when apiName is not implemented in runtime', async () => {
      vi.mocked(serverRuntimes.hasServerRuntime).mockReturnValue(true);
      vi.mocked(serverRuntimes.getServerRuntime).mockReturnValue({
        otherMethod: vi.fn(),
        // 'run' not present
      });

      const payload = makePayload({ source: 'builtin', identifier: 'my-tool', apiName: 'run' });

      await expect(executor.execute(payload as any, makeContext() as any)).rejects.toThrow(
        "Builtin tool my-tool's run is not implemented",
      );
    });

    it('should execute server runtime method successfully', async () => {
      const mockRunMethod = vi.fn().mockResolvedValue({ content: 'runtime result', success: true });
      vi.mocked(serverRuntimes.hasServerRuntime).mockReturnValue(true);
      vi.mocked(serverRuntimes.getServerRuntime).mockReturnValue({ run: mockRunMethod });

      const payload = makePayload({ source: 'builtin', identifier: 'my-tool', apiName: 'run' });
      const context = makeContext();

      const result = await executor.execute(payload as any, context as any);

      expect(mockRunMethod).toHaveBeenCalledWith({ key: 'value' }, context);
      expect(result.content).toBe('runtime result');
      expect(result.success).toBe(true);
    });

    it('should return error result when runtime method throws', async () => {
      const mockRunMethod = vi.fn().mockRejectedValue(new Error('runtime error'));
      vi.mocked(serverRuntimes.hasServerRuntime).mockReturnValue(true);
      vi.mocked(serverRuntimes.getServerRuntime).mockReturnValue({ run: mockRunMethod });

      const payload = makePayload({ source: 'builtin', identifier: 'my-tool', apiName: 'run' });

      const result = await executor.execute(payload as any, makeContext() as any);

      expect(result.success).toBe(false);
      expect(result.content).toBe('runtime error');
      expect(result.error).toBeDefined();
    });

    it('should parse arguments as JSON', async () => {
      const mockRunMethod = vi.fn().mockResolvedValue({ content: 'ok', success: true });
      vi.mocked(serverRuntimes.hasServerRuntime).mockReturnValue(true);
      vi.mocked(serverRuntimes.getServerRuntime).mockReturnValue({ search: mockRunMethod });

      const payload = makePayload({
        source: 'builtin',
        apiName: 'search',
        arguments: '{"query":"hello","limit":10}',
      });

      await executor.execute(payload as any, makeContext() as any);

      expect(mockRunMethod).toHaveBeenCalledWith({ query: 'hello', limit: 10 }, expect.any(Object));
    });

    it('should fallback to empty object when arguments are invalid JSON', async () => {
      const mockRunMethod = vi.fn().mockResolvedValue({ content: 'ok', success: true });
      vi.mocked(serverRuntimes.hasServerRuntime).mockReturnValue(true);
      vi.mocked(serverRuntimes.getServerRuntime).mockReturnValue({ run: mockRunMethod });

      const payload = makePayload({
        source: 'builtin',
        apiName: 'run',
        arguments: 'not-valid-json',
      });

      await executor.execute(payload as any, makeContext() as any);

      expect(mockRunMethod).toHaveBeenCalledWith({}, expect.any(Object));
    });
  });
});
