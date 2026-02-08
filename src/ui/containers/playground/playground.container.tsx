import React from 'react';
import { Frame, QueryState } from 'ui/shared/components';
import { useComponentMetadata } from './hooks/useComponentMetadata';
import { useCompositionTemplates } from './hooks/useCompositionTemplates';
import { usePlaygroundStore } from './hooks/usePlaygroundStore';
import { useCompositionCodeGeneration } from './hooks/useCompositionCodeGeneration';
import { ComponentList } from './components/ComponentList';
import { CompositionList } from './components/CompositionList';
import { CompositionEditor } from './components/CompositionEditor';
import { CodeOutput } from './components/CodeOutput';
import styles from './playground.module.scss';

/**
 * Playground Container
 * Displays a list of available components with a welcome state,
 * and a compositions tab for template-based layouts.
 */
export default function PlaygroundContainer() {
  const { data, isLoading, isError, error, refetch } = useComponentMetadata();
  const { data: templates } = useCompositionTemplates();

  const activeTab = usePlaygroundStore((s) => s.activeTab);
  const setActiveTab = usePlaygroundStore((s) => s.setActiveTab);
  const selectedTemplate = usePlaygroundStore((s) => s.selectedTemplate);
  const selectTemplate = usePlaygroundStore((s) => s.selectTemplate);
  const slotProps = usePlaygroundStore((s) => s.slotProps);
  const updateSlotProp = usePlaygroundStore((s) => s.updateSlotProp);

  const compositionCode = useCompositionCodeGeneration(
    selectedTemplate,
    slotProps,
  );

  return (
    <Frame id="playground">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Component Playground</h1>
          <p className={styles.subtitle}>
            Browse, customize, and preview shared UI components
          </p>
        </header>

        <div className={styles.tabBar} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'components'}
            className={`${styles.tab} ${activeTab === 'components' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('components')}
          >
            Components
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'compositions'}
            className={`${styles.tab} ${activeTab === 'compositions' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('compositions')}
          >
            Compositions
          </button>
        </div>

        {activeTab === 'components' && (
          <QueryState
            isLoading={isLoading}
            isError={isError}
            error={error}
            data={data}
            refetch={refetch}
          >
            {(components) => (
              <div className={styles.layout}>
                <aside className={styles.sidebar}>
                  <ComponentList components={components} />
                </aside>
                <div className={styles.mainContent}>
                  <div className={styles.welcomeState}>
                    <h2>Select a Component</h2>
                    <p>
                      Choose a component from the sidebar to preview and
                      customize its props.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </QueryState>
        )}

        {activeTab === 'compositions' && (
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <CompositionList
                templates={templates ?? []}
                selectedId={selectedTemplate?.id}
                onSelect={selectTemplate}
              />
            </aside>
            <div className={styles.mainContent}>
              {selectedTemplate ? (
                <>
                  <div className={styles.previewSection}>
                    <div className={styles.previewToolbar}>
                      <h3>{selectedTemplate.name}</h3>
                    </div>
                    <CompositionEditor
                      template={selectedTemplate}
                      slotProps={slotProps}
                      components={data}
                      onSlotPropChange={updateSlotProp}
                    />
                  </div>
                  <CodeOutput code={compositionCode} />
                </>
              ) : (
                <div className={styles.welcomeState}>
                  <h2>Select a Template</h2>
                  <p>
                    Choose a composition template to preview combined component
                    layouts.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Frame>
  );
}
