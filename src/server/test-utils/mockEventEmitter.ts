import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Mock EventEmitter2 for testing SSE streams and event-driven code.
 *
 * This utility provides a controllable way to test event emission
 * without relying on actual EventEmitter2 behavior.
 *
 * @example
 * ```typescript
 * const mockEmitter = createMockEventEmitter();
 *
 * // Set up the controller with the mock
 * const controller = new TraceController(service, alertService, mockEmitter);
 *
 * // Subscribe to the stream
 * const events: MessageEvent[] = [];
 * const subscription = controller.streamTraces().subscribe(e => events.push(e));
 *
 * // Emit a test event
 * mockEmitter.simulateEvent('trace.created', testTrace);
 *
 * // Verify the transformation
 * expect(events[0].data).toEqual(testTrace);
 * ```
 */
export interface MockEventEmitter extends EventEmitter2 {
  /**
   * Simulates an event emission that listeners will receive.
   */
  simulateEvent: (event: string, payload: unknown) => void;

  /**
   * Gets all registered listeners for an event.
   */
  getListeners: (event: string) => Array<(payload: unknown) => void>;
}

/**
 * Creates a mock EventEmitter2 for testing.
 *
 * The mock:
 * - Tracks all registered listeners
 * - Provides `simulateEvent` to trigger listeners synchronously
 * - Works with rxjs `fromEvent` operator
 */
export function createMockEventEmitter(): MockEventEmitter {
  const listeners = new Map<string, Array<(payload: unknown) => void>>();

  const mockEmitter = {
    on: jest.fn((event: string, listener: (payload: unknown) => void) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(listener);
      return mockEmitter;
    }),

    off: jest.fn((event: string, listener: (payload: unknown) => void) => {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index !== -1) {
          eventListeners.splice(index, 1);
        }
      }
      return mockEmitter;
    }),

    emit: jest.fn((event: string, payload: unknown) => {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach((listener) => listener(payload));
      }
      return true;
    }),

    once: jest.fn((event: string, listener: (payload: unknown) => void) => {
      const wrappedListener = (payload: unknown) => {
        listener(payload);
        mockEmitter.off(event, wrappedListener);
      };
      mockEmitter.on(event, wrappedListener);
      return mockEmitter;
    }),

    removeAllListeners: jest.fn((event?: string) => {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
      return mockEmitter;
    }),

    simulateEvent: (event: string, payload: unknown) => {
      mockEmitter.emit(event, payload);
    },

    getListeners: (event: string) => {
      return listeners.get(event) ?? [];
    },
  } as unknown as MockEventEmitter;

  return mockEmitter;
}

/**
 * Helper to test SSE stream transformations.
 *
 * @param observable - The SSE observable to test
 * @param emitter - The mock emitter to trigger events
 * @param eventName - The event name to simulate
 * @param payload - The event payload
 * @returns Promise resolving to the transformed MessageEvent
 */
export async function testSseStream<T>(
  observable: import('rxjs').Observable<{ data: T }>,
  emitter: MockEventEmitter,
  eventName: string,
  payload: T,
): Promise<{ data: T }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      reject(new Error('SSE stream test timed out'));
    }, 1000);

    const subscription = observable.subscribe({
      next: (event) => {
        clearTimeout(timeout);
        subscription.unsubscribe();
        resolve(event);
      },
      error: (err) => {
        clearTimeout(timeout);
        subscription.unsubscribe();
        reject(err);
      },
    });

    // Simulate the event after subscription is set up
    setImmediate(() => {
      emitter.simulateEvent(eventName, payload);
    });
  });
}
