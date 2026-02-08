import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import styles from '../accessibility.module.scss';

export const FocusManagementDemo: React.FC = () => {
  // Focus trap state
  const [trapActive, setTrapActive] = useState(false);
  const trapRef = useRef<HTMLDivElement>(null);

  // Focus restoration state
  const [panelOpen, setPanelOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const panelFirstRef = useRef<HTMLButtonElement>(null);

  // Focus trap: cycle Tab within trap
  useEffect(() => {
    if (!trapActive || !trapRef.current) return;

    const trap = trapRef.current;
    const focusable = trap.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    /* istanbul ignore if -- defensive: trap always has buttons */
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    trap.addEventListener('keydown', handleKeyDown);
    return () => trap.removeEventListener('keydown', handleKeyDown);
  }, [trapActive]);

  // Focus restoration: focus panel when opened, restore when closed
  useEffect(() => {
    if (panelOpen && panelFirstRef.current) {
      panelFirstRef.current.focus();
    }
  }, [panelOpen]);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    openButtonRef.current?.focus();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Focus Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Skip Link Demo */}
        <section className={styles.demoSubsection}>
          <h4 className={styles.demoSubtitle}>Skip Link</h4>
          <p className={styles.demoDescription}>
            A skip link becomes visible on focus and jumps to the target.
          </p>
          <a href="#demo-target" className={styles.skipLink}>
            Skip to demo content
          </a>
          <div id="demo-target" tabIndex={-1} className={styles.skipTarget}>
            Skip link target reached.
          </div>
        </section>

        {/* Focus Trap Demo */}
        <section className={styles.demoSubsection}>
          <h4 className={styles.demoSubtitle}>Focus Trap</h4>
          <p className={styles.demoDescription}>
            When active, Tab cycles only between the buttons inside the trap.
          </p>
          <button
            onClick={() => setTrapActive((prev) => !prev)}
            className={styles.auditButton}
          >
            {trapActive ? 'Deactivate Trap' : 'Activate Trap'}
          </button>
          {trapActive && (
            <div
              ref={trapRef}
              className={styles.focusTrap}
              role="dialog"
              aria-label="Focus trap demo"
            >
              <button className={styles.demoElement}>First</button>
              <button className={styles.demoElement}>Second</button>
              <button className={styles.demoElement}>Third</button>
              <button
                onClick={() => setTrapActive(false)}
                className={styles.secondaryButton}
              >
                Close Trap
              </button>
            </div>
          )}
        </section>

        {/* Focus Restoration Demo */}
        <section className={styles.demoSubsection}>
          <h4 className={styles.demoSubtitle}>Focus Restoration</h4>
          <p className={styles.demoDescription}>
            Opening and closing the panel returns focus to the trigger button.
          </p>
          <button
            ref={openButtonRef}
            onClick={() => setPanelOpen(true)}
            className={styles.auditButton}
          >
            Open Panel
          </button>
          {panelOpen && (
            <div
              className={styles.restorationPanel}
              role="dialog"
              aria-label="Focus restoration demo"
            >
              <p>Panel content with focus restoration.</p>
              <button
                ref={panelFirstRef}
                onClick={closePanel}
                className={styles.demoElement}
              >
                Close Panel
              </button>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
};
