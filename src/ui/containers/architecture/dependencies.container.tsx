import React, { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { Frame, Button, QueryState } from 'ui/shared/components';
import {
  useDependencyGraphs,
  useDependencyGraph,
} from './hooks/useArchitecture';
import { DependencyGraph } from './components';
import styles from './architecture.module.scss';

type Scope = 'ui' | 'server';

/**
 * Dependencies Container
 * Displays interactive dependency graph visualization.
 * Allows selecting between UI containers and Server modules.
 *
 * @see architecture/components/architecture.md
 */
export default function DependenciesContainer() {
  const [scope, setScope] = useState<Scope>('ui');
  const [selectedTarget, setSelectedTarget] = useState<string>('');

  // Fetch all graphs metadata to populate selectors
  const graphsQuery = useDependencyGraphs();

  // Get available targets for current scope
  const targets = useMemo(() => {
    if (!graphsQuery.data) return [];
    return scope === 'ui'
      ? graphsQuery.data.ui.containers
      : graphsQuery.data.server.modules;
  }, [graphsQuery.data, scope]);

  // Auto-select first target when scope changes or data loads
  React.useEffect(() => {
    if (targets.length > 0 && !targets.find((t) => t.name === selectedTarget)) {
      setSelectedTarget(targets[0].name);
    }
  }, [targets, selectedTarget]);

  // Fetch the selected graph
  const graphQuery = useDependencyGraph(
    scope,
    selectedTarget,
    !!selectedTarget,
  );

  const handleScopeChange = (newScope: Scope) => {
    setScope(newScope);
    setSelectedTarget(''); // Reset target when scope changes
  };

  return (
    <Frame id="dependencies">
      <div className={styles.container}>
        <header className={styles.header}>
          <Link to="/architecture" className={styles.backLink}>
            <Button variant="secondary">← Back to Architecture</Button>
          </Link>
          <h1>Dependency Graph</h1>
          <p className={styles.subtitle}>
            Visualize dependencies for UI containers and Server modules
          </p>
        </header>

        <QueryState
          isLoading={graphsQuery.isLoading}
          isError={graphsQuery.isError}
          error={graphsQuery.error}
          data={graphsQuery.data}
          refetch={graphsQuery.refetch}
          isEmpty={() => false}
        >
          {() => (
            <>
              <div className={styles.scopeSelector}>
                <div className={styles.selectorGroup}>
                  <label htmlFor="scope-select" className={styles.label}>
                    Scope:
                  </label>
                  <select
                    id="scope-select"
                    value={scope}
                    onChange={(e) => handleScopeChange(e.target.value as Scope)}
                    className={styles.select}
                    aria-label="Select dependency scope"
                  >
                    <option value="ui">UI Containers</option>
                    <option value="server">Server Modules</option>
                  </select>
                </div>

                <div className={styles.selectorGroup}>
                  <label htmlFor="target-select" className={styles.label}>
                    {scope === 'ui' ? 'Container:' : 'Module:'}
                  </label>
                  <select
                    id="target-select"
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className={styles.select}
                    aria-label={`Select ${scope === 'ui' ? 'container' : 'module'}`}
                    disabled={targets.length === 0}
                  >
                    {targets.map((target) => (
                      <option key={target.name} value={target.name}>
                        {target.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <QueryState
                isLoading={graphQuery.isLoading}
                isError={graphQuery.isError}
                error={graphQuery.error}
                data={graphQuery.data}
                refetch={graphQuery.refetch}
                isEmpty={(data) => data.nodes.length === 0}
                emptyComponent={<p>No dependencies found for this target.</p>}
              >
                {(graph) => (
                  <DependencyGraph
                    graph={{
                      scope: scope,
                      nodes: graph.nodes,
                      edges: graph.edges,
                      generatedAt: graphsQuery.data!.generatedAt,
                    }}
                    title={`${graph.label} Dependencies`}
                  />
                )}
              </QueryState>
            </>
          )}
        </QueryState>
      </div>
    </Frame>
  );
}
