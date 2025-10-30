import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../contexts/ThemeContext';

interface MermaidRendererProps {
  content: string;
  className?: string;
}

interface MermaidCache {
  svg: string;
  id: string;
}

const mermaidCache = new Map<string, MermaidCache>();

export const clearMermaidCache = () => {
  mermaidCache.clear();
};

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  content,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [svgContent, setSvgContent] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { theme } = useTheme();

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3)); // Max 300%
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5)); // Min 50%
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'neutral',
      securityLevel: 'strict', // Disable scripts and dangerous HTML
      htmlLabels: false, // Disable HTML in labels for security
      deterministicIds: true,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      flowchart: {
        useMaxWidth: false,
        htmlLabels: false,
      },
      sequence: {
        useMaxWidth: false,
        wrap: true,
      },
      gantt: {
        useMaxWidth: false,
      },
      journey: {
        useMaxWidth: false,
      },
      gitgraph: {
        useMaxWidth: false,
      },
    });
  }, [theme]);

  const lastContentRef = useRef<string>('');

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) {
        setTimeout(() => {
          if (containerRef.current && content.trim()) {
            renderDiagram();
          }
        }, 10);
        return;
      }

      if (!content.trim()) {
        setIsLoading(false);
        return;
      }

      const sanitizedContent = content
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers

      if (lastContentRef.current === sanitizedContent) {
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const trimmed = sanitizedContent.trim();
        const validStarters = [
          'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
          'stateDiagram', 'gantt', 'pie', 'journey', 'gitgraph',
          'erDiagram', 'mindmap', 'timeline', 'quadrantChart',
          'requirementDiagram', 'sankey-beta'
        ];

        const hasValidStart = validStarters.some(starter =>
          trimmed.toLowerCase().startsWith(starter.toLowerCase())
        );

        if (!hasValidStart) {
          throw new Error('Invalid Mermaid diagram syntax. Must start with a valid diagram type.');
        }

        const cached = mermaidCache.get(sanitizedContent);

        if (cached) {
          setSvgContent(cached.svg);
          lastContentRef.current = sanitizedContent;
        } else {
          const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(diagramId, sanitizedContent);
          mermaidCache.set(sanitizedContent, { svg, id: diagramId });
          setSvgContent(svg);
          lastContentRef.current = sanitizedContent;
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        setError(error instanceof Error ? error.message : 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [content]);

  return (
    <div className={`mermaid-diagram-container relative my-4 ${className}`}>
      {/* Zoom Controls */}
      {!isLoading && svgContent && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 rounded-md shadow-sm p-1" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--color-text)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Zm120,0a8,8,0,0,1-8,8H120v24a8,8,0,0,1-16,0V120H80a8,8,0,0,1,0-16h24V80a8,8,0,0,1,16,0v24h32A8,8,0,0,1,160,112Z"></path>
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--color-text)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Zm112,0a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h64A8,8,0,0,1,152,112Z"></path>
            </svg>
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--color-text)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Reset zoom"
            aria-label="Reset zoom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
              <path d="M240,56v48a8,8,0,0,1-8,8H184a8,8,0,0,1,0-16H211.4L184.81,71.64l-.25-.24a80,80,0,1,0-1.67,114.78,8,8,0,0,1,11,11.63A95.44,95.44,0,0,1,128,224h-1.32A96,96,0,1,1,195.75,60L224,85.8V56a8,8,0,1,1,16,0Z"></path>
            </svg>
          </button>
          <div className="px-2 py-1.5 text-xs ml-1" style={{ color: 'var(--color-text-muted)', borderLeft: '1px solid var(--color-border)' }}>
            {Math.round(zoom * 100)}%
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="p-4 overflow-hidden"
        style={{
          minHeight: '200px',
          maxHeight: '600px',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        role="application"
        aria-label="Interactive Mermaid diagram - drag to pan, use zoom controls"
        onMouseDown={(e) => {
          setIsDragging(true);
          const startX = e.clientX;
          const startY = e.clientY;
          const startPanX = panX;
          const startPanY = panY;

          const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            setPanX(startPanX + deltaX);
            setPanY(startPanY + deltaY);
          };

          const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      >
        {isLoading && !svgContent && (
          <div className="mermaid-loading p-4 text-center">
            <div className="inline-flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Rendering diagram...</span>
            </div>
          </div>
        )}
        {!isLoading && svgContent && (
          <div
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={{
              transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              minWidth: '100%',
            }}
          />
        )}
      {error && (
        <div className="mermaid-error bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Mermaid Diagram Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-3">
                <details className="text-xs">
                  <summary className="cursor-pointer text-red-600 dark:text-red-400 hover:text-red-500">
                    Show diagram source
                  </summary>
                  <pre className="mt-2 p-2 bg-red-100 dark:bg-red-800 rounded text-red-700 dark:text-red-300 overflow-x-auto">
                    {content}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};