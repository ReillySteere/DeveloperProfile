/**
 * Event constants for the case-studies module.
 *
 * Following the project's event-driven architecture pattern (ADR-011),
 * event names are defined as constants using the pattern: `<domain>.<action>`.
 *
 * @example
 * ```typescript
 * import { CASE_STUDY_EVENTS } from './events';
 *
 * // Emitting events
 * this.eventEmitter.emit(CASE_STUDY_EVENTS.CREATED, caseStudy);
 *
 * // Consuming with @OnEvent decorator
 * @OnEvent(CASE_STUDY_EVENTS.CREATED)
 * handleCaseStudyCreated(caseStudy: CaseStudy) { ... }
 * ```
 */

/**
 * Event emitted when a new case study is created.
 * Payload: CaseStudy entity
 */
export const CASE_STUDY_CREATED = 'case-study.created' as const;

/**
 * Event emitted when a case study is updated.
 * Payload: CaseStudy entity (updated version)
 */
export const CASE_STUDY_UPDATED = 'case-study.updated' as const;

/**
 * Event emitted when a case study is deleted.
 * Payload: { id: string } - The ID of the deleted case study
 */
export const CASE_STUDY_DELETED = 'case-study.deleted' as const;

/**
 * Namespace object for all case-study module events.
 * Use this for consistent event name references across the module.
 */
export const CASE_STUDY_EVENTS = {
  CREATED: CASE_STUDY_CREATED,
  UPDATED: CASE_STUDY_UPDATED,
  DELETED: CASE_STUDY_DELETED,
} as const;

export default CASE_STUDY_EVENTS;
