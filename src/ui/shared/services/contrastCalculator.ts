export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return [r, g, b];
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(color1: string, color2: string): number {
  const l1 = relativeLuminance(...hexToRgb(color1));
  const l2 = relativeLuminance(...hexToRgb(color2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getWCAGLevel(
  ratio: number,
  isLargeText: boolean,
): 'AAA' | 'AA' | 'Fail' {
  if (isLargeText) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3) return 'AA';
    return 'Fail';
  }
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Fail';
}
