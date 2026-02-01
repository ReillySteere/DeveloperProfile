import { TRACE_EVENTS, TRACE_CREATED, ALERT_TRIGGERED } from './events';
import TRACE_EVENTS_DEFAULT from './events';

describe('events', () => {
  describe('TRACE_EVENTS', () => {
    it('should export TRACE_CREATED constant', () => {
      expect(TRACE_CREATED).toBe('trace.created');
      expect(TRACE_EVENTS.TRACE_CREATED).toBe('trace.created');
    });

    it('should export ALERT_TRIGGERED constant', () => {
      expect(ALERT_TRIGGERED).toBe('alert.triggered');
      expect(TRACE_EVENTS.ALERT_TRIGGERED).toBe('alert.triggered');
    });

    it('should export default TRACE_EVENTS object', () => {
      expect(TRACE_EVENTS_DEFAULT).toBe(TRACE_EVENTS);
      expect(TRACE_EVENTS_DEFAULT.TRACE_CREATED).toBe('trace.created');
      expect(TRACE_EVENTS_DEFAULT.ALERT_TRIGGERED).toBe('alert.triggered');
    });
  });
});
