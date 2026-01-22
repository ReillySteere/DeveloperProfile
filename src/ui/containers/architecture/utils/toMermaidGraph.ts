import type { DependencyGraph } from 'shared/types';

/**
 * Sanitizes a string to be a valid Mermaid node ID.
 * Mermaid IDs must be alphanumeric (with underscores).
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Converts a DependencyGraph to a Mermaid flowchart string.
 *
 * @param graph - The dependency graph to convert
 * @returns A Mermaid flowchart definition string
 *
 * @example
 * const mermaidCode = toMermaidGraph(graph);
 * // Returns:
 * // graph TD
 * //   auth[auth]
 * //   blog[blog]
 * //   auth --> blog
 */
export function toMermaidGraph(graph: DependencyGraph): string {
  const lines: string[] = ['graph TD'];

  // Add nodes with sanitized IDs
  for (const node of graph.nodes) {
    const safeId = sanitizeId(node.id);
    const label = node.label || node.id;
    lines.push(`  ${safeId}["${label}"]`);
  }

  // Add edges with sanitized IDs
  for (const edge of graph.edges) {
    const safeSource = sanitizeId(edge.source);
    const safeTarget = sanitizeId(edge.target);
    lines.push(`  ${safeSource} --> ${safeTarget}`);
  }

  return lines.join('\n');
}
