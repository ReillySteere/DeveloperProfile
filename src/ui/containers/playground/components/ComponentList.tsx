import React from 'react';
import { Link } from '@tanstack/react-router';
import type { ComponentMetadata, ComponentCategory } from 'shared/types';
import styles from '../playground.module.scss';

interface ComponentListProps {
  components: ComponentMetadata[];
  activeComponent?: string;
}

export const ComponentList: React.FC<ComponentListProps> = ({
  components,
  activeComponent,
}) => {
  const grouped = components.reduce<
    Record<ComponentCategory, ComponentMetadata[]>
  >(
    (acc, comp) => {
      acc[comp.category].push(comp);
      return acc;
    },
    {
      'Data Display': [],
      Inputs: [],
      Layout: [],
      Feedback: [],
      Navigation: [],
    },
  );

  return (
    <nav aria-label="Component list">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className={styles.categorySection}>
          <div className={styles.categoryHeader}>
            <span>{category}</span>
            <span className={styles.categoryCount}>{items.length}</span>
          </div>
          {items.map((comp) => (
            <Link
              key={comp.name}
              to="/playground/$componentId"
              params={{ componentId: comp.name }}
              className={`${styles.componentLink} ${
                activeComponent === comp.name ? styles.componentLinkActive : ''
              }`}
              aria-current={activeComponent === comp.name ? 'page' : undefined}
            >
              {comp.name}
              {comp.renderMode === 'direct' && (
                <span className={styles.featureBadge}>Feature</span>
              )}
              {comp.selfContained && (
                <span className={styles.autoBadge}>Auto</span>
              )}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
};
