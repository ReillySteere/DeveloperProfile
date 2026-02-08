import React from 'react';
import { Frame } from 'ui/shared/components';
import { AxeAuditPanel } from './components/AxeAuditPanel';
import { ContrastChecker } from './components/ContrastChecker';
import { KeyboardOverlay } from './components/KeyboardOverlay';
import { ScreenReaderSimulator } from './components/ScreenReaderSimulator';
import { FocusManagementDemo } from './components/FocusManagementDemo';
import { LandmarkVisualizer } from './components/LandmarkVisualizer';
import { ARIAPatternShowcase } from './components/ARIAPatternShowcase';
import styles from './accessibility.module.scss';

export default function AccessibilityContainer(): React.ReactNode {
  return (
    <Frame id="accessibility">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Accessibility Showcase</h1>
          <p className={styles.subtitle}>
            WCAG 2.1 AA compliance with interactive demonstrations
          </p>
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.fullWidth}>
            <AxeAuditPanel />
          </div>

          <ContrastChecker />
          <LandmarkVisualizer />

          <div className={styles.fullWidth}>
            <KeyboardOverlay />
          </div>

          <div className={styles.fullWidth}>
            <ScreenReaderSimulator />
          </div>

          <div className={styles.fullWidth}>
            <FocusManagementDemo />
          </div>

          <div className={styles.fullWidth}>
            <ARIAPatternShowcase />
          </div>
        </div>
      </div>
    </Frame>
  );
}
