import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import styles from '../accessibility.module.scss';

function getAnnouncement(el: Element): string {
  const role = el.getAttribute('role') || el.tagName.toLowerCase();
  const label =
    el.getAttribute('aria-label') ||
    el.textContent?.trim() ||
    /* istanbul ignore next -- defensive: all demo elements have labels */
    '';
  const states: string[] = [];

  if (el.getAttribute('aria-checked') === 'true') states.push('checked');
  if (el.getAttribute('aria-checked') === 'false') states.push('not checked');
  if (el.getAttribute('aria-expanded') === 'true') states.push('expanded');
  if (el.getAttribute('aria-expanded') === 'false') states.push('collapsed');
  if ((el as HTMLElement).hasAttribute('disabled')) states.push('dimmed');

  const stateStr = states.length > 0 ? `, ${states.join(', ')}` : '';
  return `${role}: ${label}${stateStr}`;
}

export const ScreenReaderSimulator: React.FC = () => {
  const [announcement, setAnnouncement] = useState('');
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [menuExpanded, setMenuExpanded] = useState(false);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    setAnnouncement(getAnnouncement(e.target));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Screen Reader Simulator</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={styles.demoDescription}>
          Focus each element below to see how a screen reader would announce it.
        </p>

        <div
          className={styles.demoSection}
          onFocus={handleFocus}
          aria-label="Screen reader demo area"
        >
          <button className={styles.demoElement} aria-label="Submit form">
            Submit
          </button>

          <a className={styles.demoElement} aria-label="View documentation">
            Documentation
          </a>

          <button
            role="checkbox"
            aria-checked={checkboxChecked}
            onClick={() => setCheckboxChecked((prev) => !prev)}
            className={styles.demoElement}
          >
            Accept terms
          </button>

          <button
            aria-expanded={menuExpanded}
            aria-label="Toggle menu"
            onClick={() => setMenuExpanded((prev) => !prev)}
            className={styles.demoElement}
          >
            Menu
          </button>

          <button className={styles.demoElement}>Save Draft</button>

          <button
            className={styles.demoElement}
            disabled
            aria-label="Delete account"
          >
            Delete (disabled)
          </button>
        </div>

        <div
          className={styles.announcementArea}
          aria-live="polite"
          role="status"
        >
          {announcement || 'Focus an element above to hear its announcement'}
        </div>
      </CardContent>
    </Card>
  );
};
