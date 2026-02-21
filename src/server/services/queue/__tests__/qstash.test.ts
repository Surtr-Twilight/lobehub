// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPublishJSON } = vi.hoisted(() => ({
  mockPublishJSON: vi.fn(),
}));

vi.mock('@upstash/qstash', () => ({
  Client: vi.fn(() => ({
    publishJSON: mockPublishJSON,
  })),
}));

describe('QStashQueueServiceImpl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw when qstashToken is empty string', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');

      expect(() => new QStashQueueServiceImpl({ qstashToken: '' })).toThrow(
        'QStash token is required for queue service',
      );
    });

    it('should create instance when qstashToken is provided', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');

      const impl = new QStashQueueServiceImpl({ qstashToken: 'valid-token' });

      expect(impl).toBeDefined();
    });

    it('should accept optional publishUrl along with token', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');

      const impl = new QStashQueueServiceImpl({
        publishUrl: 'https://custom-publish.example.com',
        qstashToken: 'valid-token',
      });

      expect(impl).toBeDefined();
    });
  });

  describe('scheduleMessage', () => {
    it('should call publishJSON and return the messageId from response', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON.mockResolvedValue({ messageId: 'msg-abc-123' });

      const taskId = await impl.scheduleMessage({
        context: { phase: 'user_input' } as any,
        endpoint: 'http://api.test.com/process',
        operationId: 'op-123',
        priority: 'normal',
        stepIndex: 0,
      });

      expect(taskId).toBe('msg-abc-123');
    });

    it('should publish with correct body structure including timestamp', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON.mockResolvedValue({ messageId: 'msg-123' });

      const context = { phase: 'tool_calls' };
      await impl.scheduleMessage({
        context: context as any,
        endpoint: 'http://api.test.com/process',
        operationId: 'my-op',
        payload: { data: 'value' },
        priority: 'high',
        stepIndex: 5,
      });

      expect(mockPublishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            context,
            operationId: 'my-op',
            payload: { data: 'value' },
            priority: 'high',
            stepIndex: 5,
            timestamp: expect.any(Number),
          }),
        }),
      );
    });

    it('should convert delay from milliseconds to seconds using Math.ceil', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON.mockResolvedValue({ messageId: 'msg-123' });

      await impl.scheduleMessage({
        context: {} as any,
        delay: 2500, // 2.5 seconds -> ceil = 3
        endpoint: 'http://test.com',
        operationId: 'op',
        priority: 'normal',
        stepIndex: 0,
      });

      expect(mockPublishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          delay: 3, // ceil(2500 / 1000) = 3
        }),
      );
    });

    it('should use default delay of 50ms (ceil(50/1000) = 1 second) when not specified', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON.mockResolvedValue({ messageId: 'msg-123' });

      await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'op',
        priority: 'normal',
        stepIndex: 0,
      });

      expect(mockPublishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          delay: 1, // ceil(50 / 1000) = 1
        }),
      );
    });

    it('should include correct request headers', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON.mockResolvedValue({ messageId: 'msg-123' });

      await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'operation-xyz',
        priority: 'high',
        stepIndex: 7,
      });

      expect(mockPublishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-Agent-Operation-Id': 'operation-xyz',
            'X-Agent-Priority': 'high',
            'X-Agent-Step-Index': '7',
          },
        }),
      );
    });

    it('should use default retries of 3 when not specified', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON.mockResolvedValue({ messageId: 'msg-123' });

      await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'op',
        priority: 'normal',
        stepIndex: 0,
      });

      expect(mockPublishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          retries: 3,
        }),
      );
    });

    it('should use custom retries when specified', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON.mockResolvedValue({ messageId: 'msg-123' });

      await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'op',
        priority: 'normal',
        retries: 5,
        stepIndex: 0,
      });

      expect(mockPublishJSON).toHaveBeenCalledWith(expect.objectContaining({ retries: 5 }));
    });

    it('should return fallback scheduled ID when response has no messageId', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON.mockResolvedValue({}); // No messageId in response

      const taskId = await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'op',
        priority: 'normal',
        stepIndex: 0,
      });

      expect(taskId).toMatch(/^scheduled-\d+$/);
    });

    it('should throw error when publishJSON fails', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON.mockRejectedValue(new Error('Network error'));

      await expect(
        impl.scheduleMessage({
          context: {} as any,
          endpoint: 'http://test.com',
          operationId: 'op',
          priority: 'normal',
          stepIndex: 0,
        }),
      ).rejects.toThrow('Network error');
    });

    it('should set correct endpoint URL in publishJSON call', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON.mockResolvedValue({ messageId: 'msg-123' });

      await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'https://my-app.vercel.app/api/queue/process',
        operationId: 'op',
        priority: 'normal',
        stepIndex: 0,
      });

      expect(mockPublishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://my-app.vercel.app/api/queue/process',
        }),
      );
    });

    it('should handle low priority messages', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON.mockResolvedValue({ messageId: 'msg-123' });

      await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'op',
        priority: 'low',
        stepIndex: 2,
      });

      expect(mockPublishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Agent-Priority': 'low',
          }),
        }),
      );
    });
  });

  describe('scheduleBatchMessages', () => {
    it('should schedule messages concurrently and return IDs in order', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON
        .mockResolvedValueOnce({ messageId: 'msg-1' })
        .mockResolvedValueOnce({ messageId: 'msg-2' })
        .mockResolvedValueOnce({ messageId: 'msg-3' });

      const taskIds = await impl.scheduleBatchMessages([
        {
          context: {} as any,
          endpoint: 'http://test.com',
          operationId: 'op-1',
          priority: 'normal',
          stepIndex: 0,
        },
        {
          context: {} as any,
          endpoint: 'http://test.com',
          operationId: 'op-2',
          priority: 'normal',
          stepIndex: 1,
        },
        {
          context: {} as any,
          endpoint: 'http://test.com',
          operationId: 'op-3',
          priority: 'high',
          stepIndex: 2,
        },
      ]);

      expect(taskIds).toHaveLength(3);
      expect(taskIds).toEqual(['msg-1', 'msg-2', 'msg-3']);
    });

    it('should return empty array for empty input', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      const taskIds = await impl.scheduleBatchMessages([]);

      expect(taskIds).toHaveLength(0);
      expect(mockPublishJSON).not.toHaveBeenCalled();
    });

    it('should throw when any message scheduling fails', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON
        .mockResolvedValueOnce({ messageId: 'msg-1' })
        .mockRejectedValueOnce(new Error('Scheduling failed for op-2'));

      await expect(
        impl.scheduleBatchMessages([
          {
            context: {} as any,
            endpoint: 'http://test.com',
            operationId: 'op-1',
            priority: 'normal',
            stepIndex: 0,
          },
          {
            context: {} as any,
            endpoint: 'http://test.com',
            operationId: 'op-2',
            priority: 'normal',
            stepIndex: 1,
          },
        ]),
      ).rejects.toThrow('Scheduling failed for op-2');
    });

    it('should call publishJSON for each message', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      mockPublishJSON
        .mockResolvedValueOnce({ messageId: 'msg-1' })
        .mockResolvedValueOnce({ messageId: 'msg-2' });

      await impl.scheduleBatchMessages([
        {
          context: {} as any,
          endpoint: 'http://test.com',
          operationId: 'op-1',
          priority: 'normal',
          stepIndex: 0,
        },
        {
          context: {} as any,
          endpoint: 'http://test.com',
          operationId: 'op-2',
          priority: 'normal',
          stepIndex: 1,
        },
      ]);

      expect(mockPublishJSON).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancelScheduledTask', () => {
    it('should resolve without throwing (currently a no-op)', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      await expect(impl.cancelScheduledTask('msg-to-cancel')).resolves.toBeUndefined();
    });

    it('should resolve for any message ID', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      await expect(impl.cancelScheduledTask('')).resolves.toBeUndefined();
      await expect(impl.cancelScheduledTask('msg-12345')).resolves.toBeUndefined();
    });
  });

  describe('getQueueStats', () => {
    it('should return all-zero stats', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      const stats = await impl.getQueueStats();

      expect(stats).toEqual({
        completedCount: 0,
        failedCount: 0,
        pendingCount: 0,
        processingCount: 0,
      });
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status with ready message', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      const result = await impl.healthCheck();

      expect(result).toEqual({
        healthy: true,
        message: 'QStash queue service is ready',
      });
    });

    it('should always report as healthy', async () => {
      const { QStashQueueServiceImpl } = await import('../impls/qstash');
      const impl = new QStashQueueServiceImpl({ qstashToken: 'test-token' });

      const result = await impl.healthCheck();

      expect(result.healthy).toBe(true);
    });
  });
});
