export interface FocusableElement {
  tagName: string;
  role: string | null;
  label: string;
  order: number;
  isCurrent: boolean;
}

export interface Landmark {
  role: string;
  label: string;
  element: string;
}

export interface ContrastPair {
  name: string;
  foreground: string;
  background: string;
  usage: string;
}
