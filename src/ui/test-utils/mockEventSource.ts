/**
 * Mock EventSource for testing SSE streams.
 *
 * Usage:
 * ```typescript
 * import { MockEventSource, installMockEventSource } from 'test-utils/mockEventSource';
 *
 * beforeEach(() => {
 *   installMockEventSource();
 * });
 *
 * afterEach(() => {
 *   MockEventSource.reset();
 * });
 *
 * it('receives SSE messages', async () => {
 *   // Render component that uses EventSource
 *   render(<MyComponent />);
 *
 *   // Get the instance
 *   const eventSource = MockEventSource.instances[0];
 *
 *   // Simulate connection open
 *   act(() => {
 *     eventSource.simulateOpen();
 *   });
 *
 *   // Simulate message
 *   act(() => {
 *     eventSource.simulateMessage({ id: 1, data: 'test' });
 *   });
 *
 *   // Assert on rendered content
 * });
 * ```
 */
export class MockEventSource {
  /** All created instances (for test access) */
  static instances: MockEventSource[] = [];

  /** Event handlers */
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  /** Connection state */
  readyState: number = 0; // 0 = CONNECTING

  /** Constants matching real EventSource */
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  readonly CONNECTING = MockEventSource.CONNECTING;
  readonly OPEN = MockEventSource.OPEN;
  readonly CLOSED = MockEventSource.CLOSED;

  constructor(public url: string) {
    MockEventSource.instances.push(this);
    // Simulate async connection
    setTimeout(() => {
      if (this.readyState === MockEventSource.CONNECTING) {
        this.simulateOpen();
      }
    }, 0);
  }

  /**
   * Close the connection.
   */
  close(): void {
    this.readyState = MockEventSource.CLOSED;
  }

  /**
   * Add event listener (for compatibility).
   */
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void {
    if (type === 'open') {
      this.onopen = listener as (event: Event) => void;
    } else if (type === 'message') {
      this.onmessage = listener as (event: MessageEvent) => void;
    } else if (type === 'error') {
      this.onerror = listener as (event: Event) => void;
    }
  }

  /**
   * Remove event listener (for compatibility).
   */
  removeEventListener(): void {
    // No-op for testing
  }

  // ============ Test Helpers ============

  /**
   * Simulate the connection opening.
   */
  simulateOpen(): void {
    this.readyState = MockEventSource.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  /**
   * Simulate receiving a message.
   * @param data - Data to send (will be JSON.stringify'd)
   */
  simulateMessage(data: unknown): void {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: typeof data === 'string' ? data : JSON.stringify(data),
      });
      this.onmessage(event);
    }
  }

  /**
   * Simulate an error.
   */
  simulateError(): void {
    this.readyState = MockEventSource.CLOSED;
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  /**
   * Reset all instances (call in afterEach).
   */
  static reset(): void {
    MockEventSource.instances.forEach((instance) => instance.close());
    MockEventSource.instances = [];
  }

  /**
   * Get the most recent instance.
   */
  static getLatest(): MockEventSource | undefined {
    return MockEventSource.instances[MockEventSource.instances.length - 1];
  }
}

/**
 * Install MockEventSource as global.EventSource.
 * Call in beforeEach.
 */
export function installMockEventSource(): void {
  // @ts-expect-error - Replacing global EventSource
  global.EventSource = MockEventSource;
}

/**
 * Restore original EventSource.
 * Call in afterEach if needed.
 */
export function restoreEventSource(): void {
  // In jsdom, EventSource is usually undefined anyway
  // @ts-expect-error - Removing mock
  delete global.EventSource;
}
