import React, { useState, useRef, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from 'ui/shared/components';
import type { GeneratedCode } from 'shared/types';
import { useCodeMirror } from '../hooks/useCodeMirror';
import styles from '../playground.module.scss';

interface CodeOutputProps {
  code: GeneratedCode | null;
}

type CodeTab = 'jsx' | 'full';

export const CodeOutput: React.FC<CodeOutputProps> = ({ code }) => {
  const [activeTab, setActiveTab] = useState<CodeTab>('jsx');
  const [copied, setCopied] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const currentCode =
    activeTab === 'jsx' ? (code?.jsx ?? '') : (code?.fullExample ?? '');

  useCodeMirror({
    code: currentCode,
    container: editorContainerRef.current,
  });

  const handleCopy = useCallback(async () => {
    if (!currentCode) return;
    await navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentCode]);

  return (
    <div className={styles.codeOutput} data-testid="code-output">
      <div className={styles.codeHeader}>
        <div className={styles.codeTabs} role="tablist" aria-label="Code view">
          <button
            className={`${styles.codeTab} ${activeTab === 'jsx' ? styles.codeTabActive : ''}`}
            onClick={() => setActiveTab('jsx')}
            role="tab"
            aria-selected={activeTab === 'jsx'}
          >
            JSX
          </button>
          <button
            className={`${styles.codeTab} ${activeTab === 'full' ? styles.codeTabActive : ''}`}
            onClick={() => setActiveTab('full')}
            role="tab"
            aria-selected={activeTab === 'full'}
          >
            Full Example
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <div
        className={styles.codeContent}
        role="tabpanel"
        aria-label={activeTab === 'jsx' ? 'JSX code' : 'Full example code'}
      >
        <div ref={editorContainerRef} />
        {!editorContainerRef.current && (
          <pre className={styles.codeBlock}>{currentCode}</pre>
        )}
      </div>
      <div aria-live="polite" className="sr-only">
        {copied ? 'Code copied to clipboard' : ''}
      </div>
    </div>
  );
};
