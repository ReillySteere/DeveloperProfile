/**
 * Test utilities for NestJS scheduled tasks (cron jobs).
 *
 * When testing cron-decorated methods, you typically want to:
 * 1. Call the method directly (don't wait for the cron trigger)
 * 2. Verify the method executes correctly
 * 3. Optionally test timing behavior with fake timers
 *
 * Usage:
 * ```typescript
 * import { testCronMethod, createMockSchedulerRegistry } from 'server/test-utils/cronTestUtils';
 *
 * describe('MyScheduledService', () => {
 *   it('executes scheduled task', async () => {
 *     const service = new MyScheduledService(mockDeps);
 *
 *     // Call the cron method directly
 *     await service.myScheduledMethod();
 *
 *     expect(mockDeps.repository.cleanup).toHaveBeenCalled();
 *   });
 *
 *   it('handles errors gracefully', async () => {
 *     mockDeps.repository.cleanup.mockRejectedValue(new Error('DB error'));
 *
 *     // Should not throw
 *     await expect(service.myScheduledMethod()).resolves.not.toThrow();
 *   });
 * });
 * ```
 */

import type { SchedulerRegistry } from '@nestjs/schedule';

/**
 * Create a mock SchedulerRegistry for testing.
 * Useful when your service injects SchedulerRegistry directly.
 */
export function createMockSchedulerRegistry(): jest.Mocked<SchedulerRegistry> {
  return {
    getCronJob: jest.fn(),
    getCronJobs: jest.fn().mockReturnValue(new Map()),
    addCronJob: jest.fn(),
    deleteCronJob: jest.fn(),
    doesExist: jest.fn().mockReturnValue(false),
    getInterval: jest.fn(),
    getIntervals: jest.fn().mockReturnValue([]),
    addInterval: jest.fn(),
    deleteInterval: jest.fn(),
    getTimeout: jest.fn(),
    getTimeouts: jest.fn().mockReturnValue([]),
    addTimeout: jest.fn(),
    deleteTimeout: jest.fn(),
  } as unknown as jest.Mocked<SchedulerRegistry>;
}

/**
 * Test helper type for async cron methods.
 */
export type CronMethod = () => Promise<void> | void;

/**
 * Wrapper to safely test a cron method.
 * Catches errors and returns them for assertion.
 *
 * Usage:
 * ```typescript
 * const { error, result } = await testCronMethod(() => service.cleanup());
 * expect(error).toBeNull();
 * ```
 */
export async function testCronMethod<T>(
  method: () => Promise<T> | T,
): Promise<{ result: T | null; error: Error | null; durationMs: number }> {
  const start = performance.now();
  try {
    const result = await method();
    return {
      result,
      error: null,
      durationMs: performance.now() - start,
    };
  } catch (error) {
    return {
      result: null,
      error: error instanceof Error ? error : new Error(String(error)),
      durationMs: performance.now() - start,
    };
  }
}

/**
 * Setup fake timers for testing time-dependent cron behavior.
 * Returns cleanup function to restore real timers.
 *
 * Usage:
 * ```typescript
 * const cleanup = setupFakeTimers();
 *
 * // Advance time by 1 hour
 * jest.advanceTimersByTime(60 * 60 * 1000);
 *
 * cleanup();
 * ```
 */
export function setupFakeTimers(): () => void {
  jest.useFakeTimers();
  return () => jest.useRealTimers();
}

/**
 * Advance fake timers by specified duration.
 * Convenience wrapper around jest.advanceTimersByTime.
 */
export function advanceTime(options: {
  hours?: number;
  minutes?: number;
  seconds?: number;
  ms?: number;
}): void {
  const totalMs =
    (options.hours ?? 0) * 60 * 60 * 1000 +
    (options.minutes ?? 0) * 60 * 1000 +
    (options.seconds ?? 0) * 1000 +
    (options.ms ?? 0);
  jest.advanceTimersByTime(totalMs);
}

/**
 * Run all pending timers (useful for async operations).
 */
export async function runAllTimersAsync(): Promise<void> {
  await jest.runAllTimersAsync();
}

/**
 * Create a mock EventEmitter2 for testing event-driven cron tasks.
 */
export function createMockEventEmitter(): {
  emit: jest.Mock;
  on: jest.Mock;
  once: jest.Mock;
  removeListener: jest.Mock;
} {
  return {
    emit: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
  };
}
