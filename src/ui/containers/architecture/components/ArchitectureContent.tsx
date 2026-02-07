import React from 'react';
import {
  MarkdownContent,
  type LinkTransformResult,
} from 'ui/shared/components';

export interface ArchitectureContentProps {
  /** The markdown content to render */
  content: string;
  /** Optional className for the wrapper div */
  className?: string;
}

/**
 * Transforms relative ADR/component markdown links to app routes.
 * - ADR links (./ADR-*.md or ../decisions/ADR-*.md) -> /architecture/$slug
 * - Component doc links (./name.md or ../components/name.md) -> /architecture/components/$slug
 * - Other local references (../ or ./) -> unavailable (not web-accessible)
 * - External links (http/https) -> handled by default behavior
 */
export function transformArchitectureLink(href: string): LinkTransformResult {
  // Match ADR links (e.g., ./ADR-001-foo.md or ../decisions/ADR-002-bar.md)
  // Use explicit character class to avoid catastrophic backtracking
  // eslint-disable-next-line security/detect-unsafe-regex
  const adrMatch = href.match(/(?:\.\/|\.\.\/[\w-]+\/)?(ADR-\d+-[\w-]+)\.md$/i);
  if (adrMatch) {
    return {
      type: 'route',
      to: '/architecture/$slug',
      params: { slug: adrMatch[1] },
    };
  }

  // Match component doc links from within decisions folder (../components/name.md)
  const componentFromDecisionsMatch = href.match(
    /\.\.\/components\/([\w-]+)\.md$/i,
  );
  if (componentFromDecisionsMatch) {
    return {
      type: 'route',
      to: '/architecture/components/$slug',
      params: { slug: componentFromDecisionsMatch[1] },
    };
  }

  // Match component doc links from within components folder (./name.md)
  // Only match if we're in the components context (no ../ prefix or just ./)
  const componentLocalMatch = href.match(/^\.\/([\w-]+)\.md$/i);
  if (componentLocalMatch && !href.includes('ADR-')) {
    return {
      type: 'route',
      to: '/architecture/components/$slug',
      params: { slug: componentLocalMatch[1] },
    };
  }

  // Any other local reference (starts with ./ or ../) is not web-accessible
  if (href.startsWith('./') || href.startsWith('../')) {
    // Extract a meaningful name from the path for the tooltip
    const pathParts = href.split('/');
    const fileName = pathParts[pathParts.length - 1].replace(/\.md$/, '');
    return {
      type: 'unavailable',
      tooltip: `${fileName} (not web-accessible)`,
    };
  }

  return null;
}

/**
 * Architecture-specific markdown content wrapper.
 * Adds link transformation for ADR and component doc navigation.
 */
export const ArchitectureContent: React.FC<ArchitectureContentProps> = ({
  content,
  className,
}) => {
  return (
    <MarkdownContent
      content={content}
      className={className}
      transformLink={transformArchitectureLink}
    />
  );
};
