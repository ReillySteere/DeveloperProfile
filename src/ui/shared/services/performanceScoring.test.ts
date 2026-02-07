import { calculateScore, getScoreColor } from './performanceScoring';

describe('performanceScoring', () => {
  describe('calculateScore', () => {
    it('returns 100 when value is at or below good threshold', () => {
      expect(calculateScore(1000, { good: 2500, poor: 4000 })).toBe(100);
      expect(calculateScore(2500, { good: 2500, poor: 4000 })).toBe(100);
    });

    it('returns 0 when value is at or above poor threshold', () => {
      expect(calculateScore(4000, { good: 2500, poor: 4000 })).toBe(0);
      expect(calculateScore(5000, { good: 2500, poor: 4000 })).toBe(0);
    });

    it('interpolates linearly between good and poor', () => {
      expect(calculateScore(3250, { good: 2500, poor: 4000 })).toBe(50);
    });
  });

  describe('getScoreColor', () => {
    it('returns green for scores >= 90', () => {
      expect(getScoreColor(90)).toBe('#22c55e');
      expect(getScoreColor(100)).toBe('#22c55e');
    });

    it('returns yellow for scores 50-89', () => {
      expect(getScoreColor(50)).toBe('#eab308');
      expect(getScoreColor(89)).toBe('#eab308');
    });

    it('returns red for scores below 50', () => {
      expect(getScoreColor(49)).toBe('#ef4444');
      expect(getScoreColor(0)).toBe('#ef4444');
    });
  });
});
