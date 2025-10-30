import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface LaTeXRendererProps {
  content: string;
  displayMode?: boolean;
  className?: string;
}

export const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({
  content,
  displayMode = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content.trim()) return;

    try {
      katex.render(content, containerRef.current, {
        displayMode,
        throwOnError: false,
        errorColor: '#cc0000',
        strict: 'warn',
        trust: false, // For security
        macros: {
          '\\RR': '\\mathbb{R}',
          '\\NN': '\\mathbb{N}',
          '\\ZZ': '\\mathbb{Z}',
          '\\QQ': '\\mathbb{Q}',
          '\\CC': '\\mathbb{C}',
        },
      });
    } catch {
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="katex-error bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded p-2 text-sm">
            <span class="text-red-700 dark:text-red-300 font-semibold">LaTeX Error:</span>
            <pre class="text-red-600 dark:text-red-400 mt-1 whitespace-pre-wrap">${content}</pre>
          </div>
        `;
      }
    }
  }, [content, displayMode]);

  return (
    <div
      ref={containerRef}
      className={`latex-renderer ${displayMode ? 'latex-block' : 'latex-inline'} ${className}`}
    />
  );
};

export const InlineLaTeX: React.FC<{ content: string; className?: string }> = ({
  content,
  className,
}) => <LaTeXRenderer content={content} displayMode={false} className={className} />;

export const BlockLaTeX: React.FC<{ content: string; className?: string }> = ({
  content,
  className,
}) => <LaTeXRenderer content={content} displayMode={true} className={className} />;