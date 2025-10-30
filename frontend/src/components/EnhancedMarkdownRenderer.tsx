import React, { useMemo } from 'react';
import { MermaidRenderer } from './MermaidRenderer';
import md from '../utils/markdown';

interface EnhancedMarkdownRendererProps {
  content: string;
  className?: string;
}

export const EnhancedMarkdownRenderer: React.FC<EnhancedMarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  const processedContent = useMemo(() => {
    if (!content) return { html: '', mermaidDiagrams: [] };
    const html = md.render(content);

    const mermaidDiagrams: Array<{ id: string; content: string }> = [];
    const mermaidContainerRegex = /<div class="mermaid-container" data-mermaid-content="([^"]*)" data-mermaid-id="([^"]+)">/g;
    let match;

    while ((match = mermaidContainerRegex.exec(html)) !== null) {
      const escapedContent = match[1];
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = escapedContent;
      const diagramContent = tempDiv.textContent || tempDiv.innerText || '';

      const id = match[2];

      mermaidDiagrams.push({
        id,
        content: diagramContent,
      });
    }

    return { html, mermaidDiagrams };
  }, [content]);

  const renderedElements = useMemo(() => {
    const { html, mermaidDiagrams } = processedContent;
    const parts = html.split(/(<div class="mermaid-container"[^>]*>[\s\S]*?<\/div>\s*<\/div>)/);
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // HTML content
        if (parts[i].trim()) {
          elements.push(
            <div
              key={`html-${i}`}
              dangerouslySetInnerHTML={{ __html: parts[i] }}
            />
          );
        }
      } else {
        // Mermaid container - extract the ID and render the component
        const containerMatch = parts[i].match(/data-mermaid-id="([^"]+)"/);
        if (containerMatch) {
          const diagramId = containerMatch[1];
          const diagram = mermaidDiagrams.find(d => d.id === diagramId);

          if (diagram) {
            // Use content hash as key to prevent remounting when content is the same
            const contentKey = `mermaid-${diagram.content.length}-${diagram.content.substring(0, 50)}`;
            elements.push(
              <MermaidRenderer
                key={contentKey}
                content={diagram.content}
                className="my-4"
              />
            );
          } else {
            console.error('Diagram not found in array for ID:', diagramId);
          }
        } else {
          console.error('Could not extract mermaid ID from part:', parts[i]);
        }
      }
    }

    return elements;
  }, [processedContent]);

  return (
    <div className={`enhanced-markdown-renderer ${className}`}>
      {renderedElements}
    </div>
  );
};