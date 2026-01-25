import React, { useState, useCallback } from 'react';
import { Button } from 'ui/shared/components';
import { TraceFilters as TraceFiltersType } from 'shared/types';
import styles from './TraceFilters.module.scss';

interface TraceFiltersProps {
  onFiltersChange: (filters: TraceFiltersType) => void;
  initialFilters?: TraceFiltersType;
}

export function TraceFilters({
  onFiltersChange,
  initialFilters = {},
}: TraceFiltersProps): React.ReactNode {
  const [method, setMethod] = useState(initialFilters.method ?? '');
  const [path, setPath] = useState(initialFilters.path ?? '');
  const [statusCode, setStatusCode] = useState(
    initialFilters.statusCode ? String(initialFilters.statusCode) : '',
  );
  const [limit, setLimit] = useState(String(initialFilters.limit ?? 50));

  const handleApply = useCallback(() => {
    const filters: TraceFiltersType = {
      method: method || undefined,
      path: path || undefined,
      statusCode: statusCode ? parseInt(statusCode, 10) : undefined,
      limit: parseInt(limit, 10),
    };
    onFiltersChange(filters);
  }, [method, path, statusCode, limit, onFiltersChange]);

  const handleReset = useCallback(() => {
    setMethod('');
    setPath('');
    setStatusCode('');
    setLimit('50');
    onFiltersChange({ limit: 50 });
  }, [onFiltersChange]);

  return (
    <div className={styles.filters}>
      <div className={styles.filterRow}>
        <div className={styles.field}>
          <label htmlFor="trace-method" className={styles.label}>
            Method
          </label>
          <select
            id="trace-method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={styles.select}
          >
            <option value="">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="trace-path" className={styles.label}>
            Path
          </label>
          <input
            id="trace-path"
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/api/..."
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="trace-status" className={styles.label}>
            Status
          </label>
          <input
            id="trace-status"
            type="number"
            value={statusCode}
            onChange={(e) => setStatusCode(e.target.value)}
            placeholder="e.g., 200"
            className={styles.input}
            min="100"
            max="599"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="trace-limit" className={styles.label}>
            Limit
          </label>
          <select
            id="trace-limit"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className={styles.select}
          >
            <option value="25">25 traces</option>
            <option value="50">50 traces</option>
            <option value="100">100 traces</option>
            <option value="200">200 traces</option>
          </select>
        </div>
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="primary" onClick={handleApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
