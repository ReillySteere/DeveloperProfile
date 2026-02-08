import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import styles from '../accessibility.module.scss';

interface ARIAPattern {
  title: string;
  description: string;
  snippet: string;
}

const PATTERNS: ARIAPattern[] = [
  {
    title: 'NavigationRail: aria-expanded',
    description:
      'The navigation toggle button uses aria-expanded to communicate its open/closed state to assistive technology.',
    snippet: `<button
  aria-expanded={isExpanded}
  aria-label={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
>
  {isExpanded ? <X /> : <Menu />}
</button>`,
  },
  {
    title: 'Frame: Main Landmark',
    description:
      'Each page is wrapped in a <main> element with a skip link target, providing a clear document structure.',
    snippet: `<main id="main-content" data-section={id}>
  {children}
</main>

<!-- Skip link at top of page -->
<a href="#main-content" class="skipLink">
  Skip to main content
</a>`,
  },
  {
    title: 'Skeleton: Loading State',
    description:
      'Skeleton loaders announce their purpose via role="status" and aria-busy, so screen readers know content is loading.',
    snippet: `<div
  role="status"
  aria-busy="true"
  aria-label="Loading content"
>
  <span className="skeleton-pulse" />
</div>`,
  },
  {
    title: 'Card: Semantic Element',
    description:
      'Cards can render as <article> elements for content that is self-contained and independently distributable.',
    snippet: `<Card as="article">
  <CardHeader>
    <CardTitle>Blog Post Title</CardTitle>
  </CardHeader>
  <CardContent>
    Post content here...
  </CardContent>
</Card>`,
  },
];

export const ARIAPatternShowcase: React.FC = () => {
  const [expandedNav, setExpandedNav] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ARIA Pattern Showcase</CardTitle>
      </CardHeader>
      <CardContent>
        {PATTERNS.map((pattern) => (
          <div key={pattern.title} className={styles.patternSection}>
            <h4 className={styles.patternTitle}>{pattern.title}</h4>
            <p className={styles.patternDescription}>{pattern.description}</p>

            {/* Live demo for NavigationRail pattern */}
            {pattern.title === 'NavigationRail: aria-expanded' && (
              <div className={styles.patternDemo}>
                <button
                  aria-expanded={expandedNav}
                  aria-label={expandedNav ? 'Collapse demo' : 'Expand demo'}
                  onClick={() => setExpandedNav((prev) => !prev)}
                  className={styles.demoElement}
                >
                  {expandedNav ? 'Collapse' : 'Expand'}
                </button>
                {expandedNav && (
                  <div className={styles.demoPanel}>
                    Navigation content visible
                  </div>
                )}
              </div>
            )}

            <pre className={styles.codeBlock}>
              <code>{pattern.snippet}</code>
            </pre>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
