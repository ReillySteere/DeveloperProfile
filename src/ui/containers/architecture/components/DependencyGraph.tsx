import React, { useCallback, useRef, useState } from 'react';
import { Mermaid } from 'ui/shared/components';
import type { DependencyGraph as DependencyGraphType } from 'shared/types';
import { toMermaidGraph } from '../utils/toMermaidGraph';
import styles from './DependencyGraph.module.scss';

export interface DependencyGraphProps {
  graph: DependencyGraphType;
  title?: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 10;
const ZOOM_STEP = 0.5;
const DEFAULT_ZOOM = 1;

/**
 * Renders a dependency graph using Mermaid with zoom and pan controls.
 */
export const DependencyGraph = ({ graph, title }: DependencyGraphProps) => {
  const mermaidCode = toMermaidGraph(graph);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((z) => Math.min(Math.max(z + delta, MIN_ZOOM), MAX_ZOOM));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    },
    [position],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className={styles.container}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.controls}>
        <button
          type="button"
          onClick={handleZoomOut}
          className={styles.controlButton}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
        >
          −
        </button>
        <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={handleZoomIn}
          className={styles.controlButton}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={styles.resetButton}
          aria-label="Reset view"
        >
          Reset
        </button>
      </div>
      <div
        ref={containerRef}
        className={styles.graphWrapper}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          className={styles.graphContent}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <Mermaid chart={mermaidCode} />
        </div>
      </div>
      <p className={styles.hint}>Use mouse wheel to zoom, drag to pan</p>
      <details className={styles.codeDetails}>
        <summary>View Mermaid Code</summary>
        <pre className={styles.code}>{mermaidCode}</pre>
      </details>
    </div>
  );
};
