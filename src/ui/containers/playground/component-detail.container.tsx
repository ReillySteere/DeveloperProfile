import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Frame, QueryState } from 'ui/shared/components';
import { useComponentDetail } from './hooks/useComponentMetadata';
import { useComponentMetadata } from './hooks/useComponentMetadata';
import { usePlaygroundStore } from './hooks/usePlaygroundStore';
import { useCodeGeneration } from './hooks/useCodeGeneration';
import { ComponentList } from './components/ComponentList';
import { ComponentPreview } from './components/ComponentPreview';
import { PropEditor } from './components/PropEditor';
import { CodeOutput } from './components/CodeOutput';
import { ViewportToggle } from './components/ViewportToggle';
import { MDXDocPanel } from './components/MDXDocPanel';
import { Grid3x3 } from 'lucide-react';
import styles from './playground.module.scss';

function buildDefaultProps(component: {
  props: {
    name: string;
    controlType: string;
    defaultValue?: string;
    options?: { value: string }[];
  }[];
  sampleData?: Record<string, unknown>;
}): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const prop of component.props) {
    if (prop.controlType === 'function' || prop.controlType === 'node')
      continue;
    if (prop.controlType === 'json') {
      if (
        component.sampleData &&
        component.sampleData[prop.name] !== undefined
      ) {
        defaults[prop.name] = component.sampleData[prop.name];
      }
      continue;
    }
    if (prop.defaultValue !== undefined) {
      if (prop.controlType === 'boolean') {
        defaults[prop.name] = prop.defaultValue === 'true';
      } else if (prop.controlType === 'number') {
        defaults[prop.name] = Number(prop.defaultValue);
      } else {
        defaults[prop.name] = prop.defaultValue;
      }
    } else if (prop.options && prop.options.length > 0) {
      defaults[prop.name] = prop.options[0].value;
    } else if (prop.controlType === 'boolean') {
      defaults[prop.name] = false;
    } else if (prop.controlType === 'string') {
      defaults[prop.name] = '';
    } else if (prop.controlType === 'number') {
      defaults[prop.name] = 0;
    }
  }
  return defaults;
}

/**
 * Component Detail Container
 * Displays preview, prop editor, and code output for a single component.
 */
export default function ComponentDetailContainer() {
  const { componentId } = useParams({ from: '/playground/$componentId' });
  const {
    data: component,
    isLoading,
    isError,
    error,
    refetch,
  } = useComponentDetail(componentId);
  const { data: allComponents } = useComponentMetadata();

  const navigate = useNavigate();
  const props = usePlaygroundStore((s) => s.props);
  const activeTab = usePlaygroundStore((s) => s.activeTab);
  const setActiveTab = usePlaygroundStore((s) => s.setActiveTab);
  const viewport = usePlaygroundStore((s) => s.viewport);
  const theme = usePlaygroundStore((s) => s.theme);
  const showGrid = usePlaygroundStore((s) => s.showGrid);
  const updateProp = usePlaygroundStore((s) => s.updateProp);
  const resetProps = usePlaygroundStore((s) => s.resetProps);
  const setViewport = usePlaygroundStore((s) => s.setViewport);
  const toggleGrid = usePlaygroundStore((s) => s.toggleGrid);

  const code = useCodeGeneration(component ?? null, props);

  useEffect(() => {
    if (component) {
      resetProps(buildDefaultProps(component));
    }
  }, [component, resetProps]);

  const handleReset = useCallback(() => {
    if (component) {
      resetProps(buildDefaultProps(component));
    }
  }, [component, resetProps]);

  const isSelfContained = component?.selfContained === true;

  return (
    <Frame id="playground">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Component Playground</h1>
          <p className={styles.subtitle}>
            Browse, customize, and preview shared UI components
          </p>
        </header>

        <div
          className={styles.tabBar}
          role="tablist"
          aria-label="Playground views"
        >
          <button
            className={`${styles.tab} ${activeTab === 'components' ? styles.tabActive : ''}`}
            role="tab"
            aria-selected={activeTab === 'components'}
            onClick={() => setActiveTab('components')}
          >
            Components
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'compositions' ? styles.tabActive : ''}`}
            role="tab"
            aria-selected={activeTab === 'compositions'}
            onClick={() => {
              setActiveTab('compositions');
              navigate({ to: '/playground' });
            }}
          >
            Compositions
          </button>
        </div>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            {allComponents && (
              <ComponentList
                components={allComponents}
                activeComponent={componentId}
              />
            )}
          </aside>
          <div className={styles.mainContent}>
            <QueryState
              isLoading={isLoading}
              isError={isError}
              error={error}
              data={component}
              refetch={refetch}
              isEmpty={() => false}
            >
              {(comp) => (
                <>
                  <div className={styles.previewSection}>
                    <div className={styles.previewToolbar}>
                      <h3>{comp.name}</h3>
                      <div className={styles.previewToolbarActions}>
                        <ViewportToggle
                          viewport={viewport}
                          onChange={setViewport}
                        />
                        <button
                          className={`${styles.viewportButton} ${showGrid ? styles.viewportButtonActive : ''}`}
                          onClick={toggleGrid}
                          aria-label="Toggle grid"
                          aria-pressed={showGrid}
                        >
                          <Grid3x3 size={16} />
                        </button>
                      </div>
                    </div>
                    <ComponentPreview
                      component={comp}
                      props={props}
                      viewport={viewport}
                      theme={theme}
                      showGrid={showGrid}
                    />
                  </div>

                  <div className={styles.detailLayout}>
                    <div>
                      <CodeOutput code={code} />
                      {comp.mdxPath && (
                        <div
                          className={styles.previewSection}
                          style={{ marginTop: '1rem' }}
                        >
                          <div className={styles.previewToolbar}>
                            <h3>Docs</h3>
                          </div>
                          <MDXDocPanel componentName={comp.name} />
                        </div>
                      )}
                    </div>
                    <div className={styles.detailSidebar}>
                      {isSelfContained ? (
                        <div
                          className={styles.selfContainedNote}
                          data-testid="self-contained-note"
                        >
                          <p>
                            This component is self-contained and does not accept
                            external props.
                          </p>
                        </div>
                      ) : (
                        <PropEditor
                          props={comp.props}
                          values={props}
                          onPropChange={updateProp}
                          onReset={handleReset}
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
            </QueryState>
          </div>
        </div>
      </div>
    </Frame>
  );
}
