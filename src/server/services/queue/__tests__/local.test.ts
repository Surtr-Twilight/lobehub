// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LocalQueueServiceImpl } from '../impls/local';

describe('LocalQueueServiceImpl', () => {
  let impl: LocalQueueServiceImpl;

  beforeEach(() => {
    impl = new LocalQueueServiceImpl();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('scheduleMessage', () => {
    it('should return task ID with correct format', async () => {
      const taskId = await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'test-op',
        priority: 'normal',
        stepIndex: 0,
      });

      expect(taskId).toMatch(/^local-test-op-0-\d+$/);
    });

    it('should include stepIndex in the task ID', async () => {
      const taskId = await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'my-operation',
        priority: 'normal',
        stepIndex: 7,
      });

      expect(taskId).toMatch(/^local-my-operation-7-\d+$/);
    });

    it('should use default delay of 50ms when delay is not specified', async () => {
      vi.useFakeTimers();
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

      await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'test-op',
        priority: 'normal',
        stepIndex: 1,
      });

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 50);
    });

    it('should use specified delay when provided', async () => {
      vi.useFakeTimers();
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

      await impl.scheduleMessage({
        context: {} as any,
        delay: 300,
        endpoint: 'http://test.com',
        operationId: 'test-op',
        priority: 'normal',
        stepIndex: 1,
      });

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300);
    });

    it('should invoke execution callback with correct arguments', async () => {
      vi.useFakeTimers();
      const callback = vi.fn().mockResolvedValue(undefined);
      impl.setExecutionCallback(callback);

      const context = { phase: 'tool_calls' };
      await impl.scheduleMessage({
        context: context as any,
        endpoint: 'http://test.com',
        operationId: 'my-operation',
        priority: 'normal',
        stepIndex: 3,
      });

      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalledWith('my-operation', 3, context);
    });

    it('should not throw when no execution callback is set', async () => {
      vi.useFakeTimers();

      await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'test-op',
        priority: 'normal',
        stepIndex: 0,
      });

      await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
    });

    it('should handle callback errors gracefully without propagating', async () => {
      vi.useFakeTimers();
      const callback = vi.fn().mockRejectedValue(new Error('Callback failed'));
      impl.setExecutionCallback(callback);

      await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'test-op',
        priority: 'normal',
        stepIndex: 0,
      });

      // Should not throw despite callback error
      await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
    });

    it('should still invoke callback for subsequent messages after an error', async () => {
      vi.useFakeTimers();
      const callback = vi
        .fn()
        .mockRejectedValueOnce(new Error('First call fails'))
        .mockResolvedValue(undefined);
      impl.setExecutionCallback(callback);

      await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'op-1',
        priority: 'normal',
        stepIndex: 0,
      });

      await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'op-2',
        priority: 'normal',
        stepIndex: 1,
      });

      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('scheduleBatchMessages', () => {
    it('should schedule multiple messages and return task IDs', async () => {
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
          priority: 'high',
          stepIndex: 1,
        },
      ]);

      expect(taskIds).toHaveLength(2);
      expect(taskIds[0]).toMatch(/^local-op-1-0-\d+$/);
      expect(taskIds[1]).toMatch(/^local-op-2-1-\d+$/);
    });

    it('should return empty array for empty input', async () => {
      const taskIds = await impl.scheduleBatchMessages([]);

      expect(taskIds).toHaveLength(0);
    });

    it('should invoke callback for each message', async () => {
      vi.useFakeTimers();
      const callback = vi.fn().mockResolvedValue(undefined);
      impl.setExecutionCallback(callback);

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

      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should process messages sequentially', async () => {
      const callOrder: string[] = [];
      const scheduleMessageSpy = vi
        .spyOn(impl, 'scheduleMessage')
        .mockImplementation(async (msg) => {
          callOrder.push(msg.operationId);
          return `local-${msg.operationId}-${msg.stepIndex}`;
        });

      await impl.scheduleBatchMessages([
        {
          context: {} as any,
          endpoint: 'http://test.com',
          operationId: 'first',
          priority: 'normal',
          stepIndex: 0,
        },
        {
          context: {} as any,
          endpoint: 'http://test.com',
          operationId: 'second',
          priority: 'normal',
          stepIndex: 1,
        },
        {
          context: {} as any,
          endpoint: 'http://test.com',
          operationId: 'third',
          priority: 'normal',
          stepIndex: 2,
        },
      ]);

      expect(callOrder).toEqual(['first', 'second', 'third']);
      scheduleMessageSpy.mockRestore();
    });
  });

  describe('cancelScheduledTask', () => {
    it('should resolve without throwing (no-op in local mode)', async () => {
      await expect(impl.cancelScheduledTask('task-123')).resolves.toBeUndefined();
    });

    it('should resolve for any task ID value', async () => {
      await expect(impl.cancelScheduledTask('')).resolves.toBeUndefined();
      await expect(
        impl.cancelScheduledTask('very-long-task-id-123456789'),
      ).resolves.toBeUndefined();
    });
  });

  describe('getQueueStats', () => {
    it('should return zero counts when no pending executions', async () => {
      const stats = await impl.getQueueStats();

      expect(stats).toEqual({
        completedCount: 0,
        failedCount: 0,
        pendingCount: 0,
        processingCount: 0,
      });
    });

    it('should always return 0 for completedCount, failedCount, processingCount', async () => {
      const stats = await impl.getQueueStats();

      expect(stats.completedCount).toBe(0);
      expect(stats.failedCount).toBe(0);
      expect(stats.processingCount).toBe(0);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status with 0 pending executions', async () => {
      const result = await impl.healthCheck();

      expect(result).toEqual({
        healthy: true,
        message: 'Local queue service healthy, 0 pending executions',
      });
    });

    it('should always report as healthy', async () => {
      const result = await impl.healthCheck();

      expect(result.healthy).toBe(true);
    });
  });

  describe('setExecutionCallback', () => {
    it('should replace a previously set callback', async () => {
      vi.useFakeTimers();
      const callback1 = vi.fn().mockResolvedValue(undefined);
      const callback2 = vi.fn().mockResolvedValue(undefined);

      impl.setExecutionCallback(callback1);
      impl.setExecutionCallback(callback2);

      await impl.scheduleMessage({
        context: {} as any,
        endpoint: 'http://test.com',
        operationId: 'test-op',
        priority: 'normal',
        stepIndex: 0,
      });

      await vi.runAllTimersAsync();

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledOnce();
    });

    it('should pass context correctly to callback', async () => {
      vi.useFakeTimers();
      const callback = vi.fn().mockResolvedValue(undefined);
      impl.setExecutionCallback(callback);

      const context = { userId: 'user-123', sessionId: 'session-456' };
      await impl.scheduleMessage({
        context: context as any,
        endpoint: 'http://test.com',
        operationId: 'context-test',
        priority: 'normal',
        stepIndex: 0,
      });

      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalledWith('context-test', 0, context);
    });
  });
});
