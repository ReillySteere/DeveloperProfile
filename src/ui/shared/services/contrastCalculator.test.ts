import {
  hexToRgb,
  relativeLuminance,
  contrastRatio,
  getWCAGLevel,
} from './contrastCalculator';

describe('contrastCalculator', () => {
  describe('hexToRgb', () => {
    it('parses black', () => {
      expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
    });

    it('parses white', () => {
      expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
    });

    it('parses without hash', () => {
      expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
    });

    it('parses arbitrary color', () => {
      expect(hexToRgb('#4f46e5')).toEqual([79, 70, 229]);
    });
  });

  describe('relativeLuminance', () => {
    it('returns 0 for black', () => {
      expect(relativeLuminance(0, 0, 0)).toBe(0);
    });

    it('returns 1 for white', () => {
      expect(relativeLuminance(255, 255, 255)).toBe(1);
    });

    it('calculates luminance for a mid-range color', () => {
      const lum = relativeLuminance(128, 128, 128);
      expect(lum).toBeGreaterThan(0);
      expect(lum).toBeLessThan(1);
    });

    it('handles low sRGB values (below 0.03928 threshold)', () => {
      const lum = relativeLuminance(10, 10, 10);
      expect(lum).toBeGreaterThan(0);
      expect(lum).toBeLessThan(0.01);
    });
  });

  describe('contrastRatio', () => {
    it('returns 21:1 for black and white', () => {
      expect(contrastRatio('#000000', '#ffffff')).toBe(21);
    });

    it('returns 21:1 regardless of order', () => {
      expect(contrastRatio('#ffffff', '#000000')).toBe(21);
    });

    it('returns 1:1 for same color', () => {
      expect(contrastRatio('#4f46e5', '#4f46e5')).toBe(1);
    });

    it('calculates ratio for site colors', () => {
      const ratio = contrastRatio('#0f172a', '#f8fafc');
      expect(ratio).toBeGreaterThan(15);
    });
  });

  describe('getWCAGLevel', () => {
    it('returns AAA for 7+ ratio on normal text', () => {
      expect(getWCAGLevel(7, false)).toBe('AAA');
    });

    it('returns AA for 4.5+ ratio on normal text', () => {
      expect(getWCAGLevel(4.5, false)).toBe('AA');
    });

    it('returns Fail for <4.5 ratio on normal text', () => {
      expect(getWCAGLevel(3, false)).toBe('Fail');
    });

    it('returns AAA for 4.5+ ratio on large text', () => {
      expect(getWCAGLevel(4.5, true)).toBe('AAA');
    });

    it('returns AA for 3+ ratio on large text', () => {
      expect(getWCAGLevel(3, true)).toBe('AA');
    });

    it('returns Fail for <3 ratio on large text', () => {
      expect(getWCAGLevel(2.5, true)).toBe('Fail');
    });
  });
});
