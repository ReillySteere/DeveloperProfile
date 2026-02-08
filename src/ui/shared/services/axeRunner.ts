import axe from 'axe-core';

export interface AuditResult {
  violations: axe.Result[];
  passes: axe.Result[];
  incomplete: axe.Result[];
  score: number;
  timestamp: number;
}

export async function runAudit(
  context?: axe.ElementContext,
): Promise<AuditResult> {
  const results = await axe.run(context ?? document);
  const total = results.passes.length + results.violations.length;
  const score =
    total > 0 ? Math.round((results.passes.length / total) * 100) : 100;

  return {
    violations: results.violations,
    passes: results.passes,
    incomplete: results.incomplete,
    score,
    timestamp: Date.now(),
  };
}
