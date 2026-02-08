import { useState, useCallback, useEffect } from 'react';
import type { Landmark } from '../accessibility.types';

const LANDMARK_SELECTORS = [
  'main',
  'nav',
  'header',
  'footer',
  'aside',
  '[role="banner"]',
  '[role="navigation"]',
  '[role="main"]',
  '[role="complementary"]',
  '[role="contentinfo"]',
  '[role="search"]',
  '[role="region"][aria-label]',
];

function getRoleFromElement(el: Element): string {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit;

  const tagRoles: Record<string, string> = {
    MAIN: 'main',
    NAV: 'navigation',
    HEADER: 'banner',
    FOOTER: 'contentinfo',
    ASIDE: 'complementary',
  };
  return (
    tagRoles[el.tagName] || /* istanbul ignore next */ el.tagName.toLowerCase()
  );
}

function scanLandmarks(): Landmark[] {
  const selector = LANDMARK_SELECTORS.join(', ');
  const elements = document.querySelectorAll(selector);
  const seen = new Set<Element>();
  const landmarks: Landmark[] = [];

  elements.forEach((el) => {
    /* istanbul ignore if -- dedup: element matched multiple selectors */
    if (seen.has(el)) return;
    seen.add(el);
    landmarks.push({
      role: getRoleFromElement(el),
      label: el.getAttribute('aria-label') || '',
      element: el.tagName.toLowerCase(),
    });
  });

  return landmarks;
}

export function useLandmarks() {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);

  const refresh = useCallback(() => {
    setLandmarks(scanLandmarks());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { landmarks, refresh };
}
