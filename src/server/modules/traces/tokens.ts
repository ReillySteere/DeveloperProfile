/**
 * Dependency injection tokens for the traces module.
 */
import { TRACE_SERVICE_TOKEN } from 'server/shared/ports';

const TOKENS = {
  ITraceService: TRACE_SERVICE_TOKEN,
  ITraceRepository: Symbol('ITraceRepository'),
  ITraceAlertService: Symbol('ITraceAlertService'),
} as const;

export default TOKENS;
