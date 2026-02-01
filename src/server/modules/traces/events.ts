/**
 * Event constants for the traces module.
 *
 * Following the project's event-driven architecture pattern (ADR-011),
 * event names are defined as constants using the pattern: `<domain>.<action>`.
 *
 * @example
 * ```typescript
 * import { TRACE_EVENTS } from './events';
 *
 * // Emitting events
 * this.eventEmitter.emit(TRACE_EVENTS.TRACE_CREATED, trace);
 *
 * // Consuming with fromEvent (for SSE streams)
 * fromEvent(this.eventEmitter, TRACE_EVENTS.TRACE_CREATED).pipe(...)
 *
 * // Consuming with @OnEvent decorator
 * @OnEvent(TRACE_EVENTS.TRACE_CREATED)
 * handleTraceCreated(trace: RequestTrace) { ... }
 * ```
 */

/**
 * Event emitted when a new request trace is recorded.
 * Payload: RequestTrace entity
 */
export const TRACE_CREATED = 'trace.created' as const;

/**
 * Event emitted when an alert rule is triggered.
 * Payload: AlertEvent object
 */
export const ALERT_TRIGGERED = 'alert.triggered' as const;

/**
 * Namespace object for all trace module events.
 * Use this for consistent event name references across the module.
 */
export const TRACE_EVENTS = {
  TRACE_CREATED,
  ALERT_TRIGGERED,
} as const;

export default TRACE_EVENTS;
