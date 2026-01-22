import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  MarkdownContent,
  type LinkTransformResult,
} from 'ui/shared/components/MarkdownContent/MarkdownContent';

export interface ArchitectureContentProps {
  /** The markdown content to render */
  content: string;
  /** Optional className for the wrapper div */
  className?: string;
}

/**
 * Transforms relative ADR/component markdown links to app routes.
 * Examples:
 *   ./ADR-001-persistent-storage.md -> /architecture/ADR-001-persistent-storage
 *   ../decisions/ADR-002-sqlite.md -> /architecture/ADR-002-sqlite
 *   ./about.md or ../components/about.md -> /architecture/components/about
 */
export function transformArchitectureLink(href: string): LinkTransformResult {
  // Match ADR links (e.g., ./ADR-001-foo.md or ../decisions/ADR-002-bar.md)
  // Use explicit character class to avoid catastrophic backtracking
  // eslint-disable-next-line security/detect-unsafe-regex
  const adrMatch = href.match(/(?:\.\/|\.\.\/[\w-]+\/)?(ADR-\d+-[\w-]+)\.md$/i);
  if (adrMatch) {
    return { type: 'route', to: `/architecture/${adrMatch[1]}` };
  }

  // Match component doc links (e.g., ./about.md in components folder context)
  const componentMatch = href.match(
    /(?:\.\/|\.\.\/components\/)?([\w-]+)\.md$/i,
  );
  if (componentMatch && !href.includes('ADR-')) {
    return {
      type: 'route',
      to: `/architecture/components/${componentMatch[1]}`,
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
  const navigate = useNavigate();

  return (
    <MarkdownContent
      content={content}
      className={className}
      transformLink={transformArchitectureLink}
      onNavigate={(to) => navigate({ to })}
    />
  );
};
