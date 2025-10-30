import React, { useEffect, useRef } from 'react';

interface MarkdownViewerProps {
  htmlContent: string;
  className?: string;
}

interface MermaidComponentPortalProps {
  content: string;
  containerId: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  htmlContent,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = htmlContent;
    const mermaidContainers = containerRef.current.querySelectorAll('.mermaid-container');

    mermaidContainers.forEach((container) => {
      const mermaidContent = container.getAttribute('data-mermaid-content');
      const mermaidId = container.getAttribute('data-mermaid-id');

      if (mermaidContent && mermaidId) {
        const reactContainer = document.createElement('div');
        reactContainer.id = `mermaid-react-${mermaidId}`;
        container.parentNode?.replaceChild(reactContainer, container);
        reactContainer.setAttribute('data-mermaid-content', mermaidContent);
        reactContainer.setAttribute('data-mermaid-id', mermaidId);
        reactContainer.className = 'mermaid-react-container';
      }
    });
  }, [htmlContent]);

  const renderMermaidComponents = () => {
    if (!containerRef.current) return null;

    const mermaidContainers = containerRef.current.querySelectorAll('.mermaid-react-container');

    return Array.from(mermaidContainers).map((container) => {
      const content = container.getAttribute('data-mermaid-content');
      const id = container.getAttribute('data-mermaid-id');

      if (content && id) {
        return (
          <MermaidComponentPortal
            key={id}
            content={content}
            containerId={`mermaid-react-${id}`}
          />
        );
      }
      return null;
    }).filter(Boolean);
  };

  return (
    <div className={`markdown-viewer ${className}`}>
      <div ref={containerRef} />
      {renderMermaidComponents()}
    </div>
  );
};

const MermaidComponentPortal: React.FC<MermaidComponentPortalProps> = ({
  content,
  containerId,
}) => {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    containerRef.current = document.getElementById(containerId);
  }, [containerId]);

  useEffect(() => {
    if (containerRef.current) {
      const renderComponent = () => {
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          const mermaidDiv = document.createElement('div');
          mermaidDiv.setAttribute('data-mermaid-content', content);
          containerRef.current.appendChild(mermaidDiv);
        }
      };

      renderComponent();
    }
  }, [content]);

  // For now, return null as we're directly manipulating DOM
  // In a more complex setup, we'd use React portals
  return null;
};