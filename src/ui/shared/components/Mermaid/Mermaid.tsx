import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

/**
 * Renders a Mermaid diagram from chart definition string.
 * Used by MarkdownContent to render ```mermaid code blocks.
 */
export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    if (chart) {
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      mermaid.render(id, chart).then(({ svg }) => {
        setSvg(svg);
      });
    }
  }, [chart]);

  return <div className="mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
};
