import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import { useAxeAudit } from '../hooks/useAxeAudit';
import styles from '../accessibility.module.scss';
import type { Result } from 'axe-core';

function getScoreClass(score: number): string {
  if (score >= 90) return styles.scoreGood;
  if (score >= 50) return styles.scoreModerate;
  return styles.scorePoor;
}

interface ViolationDetailsProps {
  violation: Result;
}

const ViolationDetails: React.FC<ViolationDetailsProps> = ({ violation }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <li className={styles.violationItem}>
      <div className={styles.violationHeader}>
        <button
          className={styles.violationToggle}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={`violation-${violation.id}`}
        >
          <span
            className={styles.violationImpact}
            data-impact={violation.impact}
          >
            {violation.impact}
          </span>
          <span className={styles.violationDesc}>{violation.help}</span>
          <span className={styles.violationNodes}>
            {violation.nodes.length} element
            {violation.nodes.length !== 1 ? 's' : ''}
          </span>
          <span className={styles.expandIcon} aria-hidden="true">
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>
      </div>

      {isExpanded && (
        <div id={`violation-${violation.id}`} className={styles.violationBody}>
          <p className={styles.violationFullDesc}>{violation.description}</p>

          <div className={styles.affectedElements}>
            <h4 className={styles.affectedTitle}>Affected Elements:</h4>
            <ul className={styles.nodeList}>
              {violation.nodes.map((node, idx) => (
                <li key={idx} className={styles.nodeItem}>
                  <code className={styles.nodeSelector}>
                    {node.target
                      .map((t) => (typeof t === 'string' ? t : t.join(' > ')))
                      .join(' > ')}
                  </code>
                  <pre className={styles.nodeHtml}>{node.html}</pre>
                  {node.failureSummary && (
                    <div className={styles.failureSummary}>
                      <strong>Fix:</strong>{' '}
                      {node.failureSummary.replace(
                        /^Fix (any|all) of the following:\n?/i,
                        '',
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <a
            href={violation.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.violationHelp}
          >
            Learn more about this rule →
          </a>
        </div>
      )}
    </li>
  );
};

export const AxeAuditPanel: React.FC = () => {
  const { result, isRunning, run } = useAxeAudit();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accessibility Audit</CardTitle>
      </CardHeader>
      <CardContent>
        <button
          onClick={run}
          disabled={isRunning}
          className={styles.auditButton}
        >
          {isRunning ? 'Running...' : 'Run Audit'}
        </button>

        {result && (
          <div className={styles.auditResults}>
            <div
              className={`${styles.scoreBadge} ${getScoreClass(result.score)}`}
            >
              {result.score}/100
            </div>

            <div className={styles.auditSummary}>
              <span>{result.passes.length} passed</span>
              <span>{result.violations.length} violations</span>
              <span>{result.incomplete.length} incomplete</span>
            </div>

            {result.violations.length > 0 && (
              <ul
                className={styles.violationList}
                aria-label="Accessibility violations"
              >
                {result.violations.map((v) => (
                  <ViolationDetails key={v.id} violation={v} />
                ))}
              </ul>
            )}

            {result.violations.length === 0 && (
              <p className={styles.noViolations}>
                ✓ No accessibility violations detected!
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
