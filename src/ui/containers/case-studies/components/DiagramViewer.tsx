import React from 'react';
import { Mermaid } from 'ui/shared/components/Mermaid';
import { CaseStudyDiagram } from 'shared/types';
import styles from '../case-studies.module.scss';

interface DiagramViewerProps {
  diagrams: CaseStudyDiagram[];
}

export function DiagramViewer({ diagrams }: DiagramViewerProps) {
  if (diagrams.length === 0) {
    return null;
  }

  return (
    <div className={styles.diagramsContainer}>
      {diagrams.map((diagram, index) => (
        <figure key={index} className={styles.diagramFigure}>
          {diagram.type === 'mermaid' ? (
            <Mermaid chart={diagram.content} />
          ) : (
            <img
              src={diagram.content}
              alt={diagram.caption || `Diagram ${index + 1}`}
              className={styles.diagramImage}
            />
          )}
          {diagram.caption && (
            <figcaption className={styles.diagramCaption}>
              {diagram.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
