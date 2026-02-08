import { useMemo } from 'react';
import type { CompositionTemplate, GeneratedCode } from 'shared/types';

export function useCompositionCodeGeneration(
  template: CompositionTemplate | null,
  slotProps: Record<string, Record<string, unknown>>,
): GeneratedCode | null {
  return useMemo(() => {
    if (!template) return null;

    const imports = new Set<string>();
    const jsxParts: string[] = [];

    for (const slot of template.slots) {
      const importPath = slot.componentName;
      imports.add(
        `import { ${slot.componentName} } from '.../${slot.componentName}';`,
      );

      const mergedProps = { ...slot.props, ...(slotProps[slot.id] || {}) };
      const propsStr = Object.entries(mergedProps)
        .map(([key, value]) => {
          if (typeof value === 'string') return `${key}="${value}"`;
          return `${key}={${JSON.stringify(value)}}`;
        })
        .join(' ');

      jsxParts.push(
        propsStr ? `<${importPath} ${propsStr} />` : `<${importPath} />`,
      );
    }

    const jsx = jsxParts.join('\n      ');
    const fullExample = `${Array.from(imports).join('\n')}\n\nfunction ${template.name.replace(/\s+/g, '')}() {\n  return (\n    <div>\n      ${jsx}\n    </div>\n  );\n}`;

    return { jsx, fullExample };
  }, [template, slotProps]);
}
