import { useRef, useEffect, useCallback } from 'react';
import type { ComponentMetadata } from 'shared/types';

interface UseIframeRendererOptions {
  component: ComponentMetadata | null;
  props: Record<string, unknown>;
  theme: 'light' | 'dark';
}

export function useIframeRenderer({
  component,
  props,
  theme,
}: UseIframeRendererOptions) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const renderContent = useCallback(() => {
    const iframe = iframeRef.current;
    /* istanbul ignore next */
    if (!iframe || !component) return;

    const doc = iframe.contentDocument;
    /* istanbul ignore next */
    if (!doc) return;

    /* istanbul ignore next */
    const propsEntries = Object.entries(props)
      .filter(([key]) => key !== 'children')
      .map(([key, val]) => {
        if (typeof val === 'boolean') return val ? key : '';
        if (typeof val === 'string') return `${key}="${val}"`;
        return `${key}="${val}"`;
      })
      .filter(Boolean)
      .join(' ');

    const children = (props.children as string) || '';
    const propsStr = propsEntries ? ' ' + propsEntries : '';

    doc.open();
    doc.write(`<!DOCTYPE html>
<html data-theme="${theme}">
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: ${theme === 'dark' ? '#1a1a2e' : '#ffffff'};
      color: ${theme === 'dark' ? '#e0e0e0' : '#1a1a2e'};
    }
    .preview-content {
      text-align: center;
    }
    .component-name {
      font-size: 0.75rem;
      color: ${theme === 'dark' ? '#888' : '#666'};
      margin-bottom: 1rem;
      font-family: monospace;
    }
    .rendered {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    /* Basic component styles */
    .btn { padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
    .btn-primary { background: #4f46e5; color: white; border-color: #4f46e5; }
    .btn-secondary { background: transparent; color: #4f46e5; border-color: #4f46e5; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .badge { display: inline-flex; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background: #eef2ff; color: #4f46e5; }
    .card { background: ${theme === 'dark' ? '#2a2a3e' : '#fff'}; border: 1px solid ${theme === 'dark' ? '#3a3a4e' : '#e2e8f0'}; border-radius: 8px; padding: 1.5rem; min-width: 200px; text-align: left; }
    .skeleton { background: ${theme === 'dark' ? '#3a3a4e' : '#e2e8f0'}; border-radius: 4px; animation: pulse 2s ease-in-out infinite; }
    .link-btn { display: inline-flex; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; font-size: 0.875rem; font-weight: 500; }
    .link-btn-primary { background: #4f46e5; color: white; }
    .link-btn-secondary { background: transparent; color: #4f46e5; border: 1px solid #4f46e5; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  </style>
</head>
<body>
  <div class="preview-content">
    <div class="component-name">&lt;${component.name}${propsStr}&gt;</div>
    <div class="rendered" id="root">${renderComponent(component.name, props, children)}</div>
  </div>
</body>
</html>`);
    doc.close();
  }, [component, props, theme]);

  useEffect(() => {
    renderContent();
  }, [renderContent]);

  return { iframeRef };
}

/* istanbul ignore next */
function renderComponent(
  name: string,
  props: Record<string, unknown>,
  children: string,
): string {
  const disabled = props.disabled ? 'disabled' : '';
  const variant = (props.variant as string) || 'primary';

  switch (name) {
    case 'Button':
      return `<button class="btn btn-${variant}" ${disabled}>${children || 'Button'}</button>`;
    case 'Badge':
      return `<span class="badge">${children || 'Badge'}</span>`;
    case 'Card':
    case 'CardHeader':
    case 'CardTitle':
    case 'CardContent':
    case 'CardFooter':
      return `<div class="card">${children || 'Card content'}</div>`;
    case 'Skeleton': {
      const height = props.height || 100;
      return `<div class="skeleton" style="width:200px;height:${height}px"></div>`;
    }
    case 'LinkButton':
      return `<a href="${props.href || '#'}" class="link-btn link-btn-${variant}" ${disabled ? 'aria-disabled="true"' : ''}>${children || 'LinkButton'}</a>`;
    default:
      return `<div>${children || name}</div>`;
  }
}
