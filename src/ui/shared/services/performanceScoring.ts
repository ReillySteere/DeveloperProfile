export function calculateScore(
  value: number,
  thresholds: { good: number; poor: number },
): number {
  if (value <= thresholds.good) return 100;
  if (value >= thresholds.poor) return 0;
  // Linear interpolation between good and poor
  const range = thresholds.poor - thresholds.good;
  return Math.round(100 - ((value - thresholds.good) / range) * 100);
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}
