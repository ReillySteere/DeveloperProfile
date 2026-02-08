import { useRef, useEffect } from 'react';
import type { EditorView } from '@codemirror/view';

interface UseCodeMirrorOptions {
  code: string;
  container: HTMLElement | null;
}

export function useCodeMirror({ code, container }: UseCodeMirrorOptions) {
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!container) return;

    let view: EditorView | null = null;

    const setup = async () => {
      const { EditorView: EV } = await import('@codemirror/view');
      const { EditorState } = await import('@codemirror/state');
      const { javascript: jsLang } =
        await import('@codemirror/lang-javascript');
      const { oneDark } = await import('@codemirror/theme-one-dark');

      // Clean up previous instance
      if (viewRef.current) {
        viewRef.current.destroy();
      }

      const state = EditorState.create({
        doc: code,
        extensions: [
          jsLang({ jsx: true, typescript: true }),
          oneDark,
          EV.editable.of(false),
          EV.lineWrapping,
        ],
      });

      view = new EV({
        state,
        parent: container,
      });

      viewRef.current = view;
    };

    setup();

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [code, container]);

  return viewRef;
}
