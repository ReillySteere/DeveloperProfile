import React from 'react';
import type { CompositionTemplate } from 'shared/types';
import styles from '../playground.module.scss';

interface CompositionListProps {
  templates: CompositionTemplate[];
  selectedId?: string;
  onSelect: (template: CompositionTemplate) => void;
}

export const CompositionList: React.FC<CompositionListProps> = ({
  templates,
  selectedId,
  onSelect,
}) => {
  return (
    <nav aria-label="Composition templates">
      <div className={styles.categorySection}>
        <div className={styles.categoryHeader}>
          <span>Templates</span>
          <span className={styles.categoryCount}>{templates.length}</span>
        </div>
        {templates.map((template) => (
          <button
            key={template.id}
            className={`${styles.componentLink} ${
              selectedId === template.id ? styles.componentLinkActive : ''
            }`}
            onClick={() => onSelect(template)}
            data-testid={`template-${template.id}`}
            aria-current={selectedId === template.id ? 'true' : undefined}
          >
            {template.name}
          </button>
        ))}
      </div>
    </nav>
  );
};
