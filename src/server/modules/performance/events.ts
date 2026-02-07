/**
 * Event constants for the performance module.
 * Follows the event-driven architecture pattern (ADR-011).
 */

export const PERFORMANCE_REPORTED = 'performance.reported' as const;

export const PERFORMANCE_EVENTS = {
  PERFORMANCE_REPORTED,
} as const;

export default PERFORMANCE_EVENTS;
