# ADR-011: Event-Driven Architecture with EventEmitter2

## Status

Accepted - January 24, 2026

## Context

The Request Tracing feature (ADR-010) requires real-time streaming of new traces to
connected SSE clients. This creates a coupling problem: the `TraceService` (which records
traces) must somehow notify the `TraceController` (which streams them).

Options for decoupling this communication:

| Approach         | Pros                          | Cons                                |
| ---------------- | ----------------------------- | ----------------------------------- |
| Direct injection | Simple, typed                 | Tight coupling, hard to test        |
| RxJS Subject     | Reactive, testable            | Manual lifecycle management         |
| EventEmitter2    | Loose coupling, NestJS native | String-based events, less type-safe |
| External broker  | Scalable, persistent          | Overkill for single-process app     |

## Decision

We will use **EventEmitter2** (via `@nestjs/event-emitter`) for internal event-driven
communication.

### How It Works

1. **Producer** (TraceService) emits events after recording traces:

   ```typescript
   import { TRACE_EVENTS } from './events';
   this.eventEmitter.emit(TRACE_EVENTS.TRACE_CREATED, trace);
   ```

2. **Consumer** (TraceController) subscribes via RxJS `fromEvent()`:

   ```typescript
   // Note: Do NOT use explicit type parameters with fromEvent (deprecated in RxJS v8)
   // Instead, use type assertions in the callback
   return fromEvent(this.eventEmitter, TRACE_EVENTS.TRACE_CREATED).pipe(
     map((trace) => ({ data: trace as RequestTrace })),
   );
   ```

### Event Naming Convention

Events follow a `<domain>.<action>` pattern:

- `trace.created` - New trace recorded
- `alert.triggered` - Alert rule triggered
- `blog.published` - Blog post published (future)

### Event Constants

Event names are defined as constants in dedicated `events.ts` files:

```typescript
// src/server/modules/traces/events.ts
export const TRACE_CREATED = 'trace.created' as const;
export const ALERT_TRIGGERED = 'alert.triggered' as const;

export const TRACE_EVENTS = {
  TRACE_CREATED,
  ALERT_TRIGGERED,
} as const;
```

## Consequences

### Positive

- **Loose coupling**: Producer doesn't know about consumers
- **Extensible**: Multiple consumers can subscribe without producer changes
- **NestJS native**: First-party support via `@nestjs/event-emitter`
- **SSE compatible**: Works seamlessly with NestJS `@Sse()` decorator

### Negative

- **String-based events**: Event names are strings, reducing type safety
- **Testing complexity**: EventEmitter interactions are harder to test (see below)
- **No persistence**: Events are lost if no subscribers are listening

## Testing Challenges & Mitigations

### The Problem

Testing EventEmitter-based code is challenging because:

1. **Async nature**: Events are asynchronous and may not trigger predictably
2. **Integration coupling**: `fromEvent()` requires a real EventEmitter instance
3. **SSE complexity**: Testing SSE endpoints with events requires mock EventSource

### Current Approach

We use a **hybrid testing strategy**:

1. **Unit tests** for the service verify `emit()` is called:

   ```typescript
   it('should emit trace.created event', async () => {
     await service.recordTrace(input);
     expect(mockEventEmitter.emit).toHaveBeenCalledWith(
       TRACE_EVENTS.TRACE_CREATED,
       expect.any(Object),
     );
   });
   ```

2. **Integration tests** for SSE verify the endpoint format works with proper
   test utilities like `mockEventEmitter` from `server/test-utils/mockEventEmitter.ts`.

3. **Mock utilities** are available in `src/server/test-utils/` for:
   - `mockEventEmitter.ts` - Mock EventEmitter2 with observer support
   - `mockSentry.ts` - Mock @sentry/node for error tracking tests
   - `mockNodemailer.ts` - Mock nodemailer for email alert tests
   - `cronTestUtils.ts` - Utilities for testing scheduled tasks

### Future Improvements

1. **Typed events**: Consider `typed-emitter` or custom generic wrapper
2. **Observable testing**: Use RxJS `TestScheduler` for more control

## Related Documentation

- [ADR-010: Request Tracing](ADR-010-request-tracing-observability.md)
- [Component: Traces](../components/traces.md)
- [Copilot Instructions: EDA Section](../../.github/copilot-instructions.md)
