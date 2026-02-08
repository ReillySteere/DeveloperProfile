import { useMemo } from 'react';
import type { ComponentMetadata, GeneratedCode } from 'shared/types';

function formatPropValue(value: unknown): string {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return `{${value}}`;
  if (typeof value === 'number') return `{${value}}`;
  return `{${JSON.stringify(value)}}`;
}

function buildPropsString(
  props: Record<string, unknown>,
  component: ComponentMetadata,
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;

    // Skip default values
    const propDef = component.props.find((p) => p.name === key);
    if (propDef?.defaultValue !== undefined) {
      const defaultVal = propDef.defaultValue;
      if (String(value) === String(defaultVal)) continue;
    }

    if (value === '') continue;

    if (typeof value === 'boolean') {
      if (value) parts.push(key);
      continue;
    } else {
      parts.push(`${key}=${formatPropValue(value)}`);
    }
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

export function useCodeGeneration(
  component: ComponentMetadata | null,
  props: Record<string, unknown>,
): GeneratedCode | null {
  return useMemo(() => {
    if (!component) return null;

    const propsStr = buildPropsString(props, component);
    const children = props.children as string | undefined;
    const hasChildren = children && children.length > 0;

    const jsx = hasChildren
      ? `<${component.name}${propsStr}>${children}</${component.name}>`
      : `<${component.name}${propsStr} />`;

    const fullExample = `import { ${component.name} } from '${component.importPath}';\n\nfunction Example() {\n  return (\n    ${jsx}\n  );\n}`;

    return { jsx, fullExample };
  }, [component, props]);
}
