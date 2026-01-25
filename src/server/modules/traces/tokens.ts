/**
 * Dependency injection tokens for the traces module.
 */
import { TRACE_SERVICE_TOKEN } from 'server/shared/ports';

const TOKENS = {
  ITraceService: TRACE_SERVICE_TOKEN,
  ITraceRepository: Symbol('ITraceRepository'),
} as const;

export default TOKENS;
