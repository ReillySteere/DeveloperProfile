import { useState, useCallback } from 'react';
import { runAudit, type AuditResult } from 'ui/shared/services/axeRunner';

export function useAxeAudit() {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback(async () => {
    setIsRunning(true);
    try {
      const auditResult = await runAudit();
      setResult(auditResult);
    } finally {
      setIsRunning(false);
    }
  }, []);

  return { result, isRunning, run };
}
