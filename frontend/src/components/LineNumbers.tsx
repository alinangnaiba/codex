import React, { useEffect, useRef, useState, useCallback } from 'react';

interface LineNumbersProps {
  content: string;
  wordWrapEnabled: boolean;
  editorRef: React.RefObject<HTMLTextAreaElement>;
}

// Bidirectional scroll sync - scrolling either element scrolls both
const useDirectScrollSync = (
  containerRef: React.RefObject<HTMLPreElement>,
  editorRef: React.RefObject<HTMLTextAreaElement>
) => {
  useEffect(() => {
    const editor = editorRef.current;
    const lineNumbers = containerRef.current;
    
    if (!editor || !lineNumbers) return;

    let isScrolling = false;

    // Sync from editor to line numbers
    const handleEditorScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      lineNumbers.scrollTop = editor.scrollTop;
      requestAnimationFrame(() => {
        isScrolling = false;
      });
    };

    // Handle wheel events on line numbers container to scroll both
    const handleLineNumberWheel = (e: WheelEvent) => {
      // Don't prevent default, let it scroll naturally
      // Just sync the editor
      editor.scrollTop = lineNumbers.scrollTop + e.deltaY;
    };

    // Initial sync
    lineNumbers.scrollTop = editor.scrollTop;

    // Listen to scroll events
    editor.addEventListener('scroll', handleEditorScroll, { passive: true });
    lineNumbers.addEventListener('wheel', handleLineNumberWheel, { passive: true });
    
    // Also handle wheel on the parent container
    const container = lineNumbers.parentElement;
    if (container) {
      container.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        editor.scrollTop += e.deltaY;
      }, { passive: false });
    }
    
    return () => {
      editor.removeEventListener('scroll', handleEditorScroll);
      lineNumbers.removeEventListener('wheel', handleLineNumberWheel);
      if (container) {
        container.removeEventListener('wheel', handleLineNumberWheel);
      }
    };
  }, [containerRef, editorRef]);
};

export const LineNumbers: React.FC<LineNumbersProps> = ({ 
  content, 
  wordWrapEnabled, 
  editorRef
}) => {
  const [lineNumberText, setLineNumberText] = useState<string>('');
  const containerRef = useRef<HTMLPreElement>(null);
  const [editorWidth, setEditorWidth] = useState(0);
  
  // Add dynamic height adjustment to match textarea exactly
  const adjustHeightToMatchTextarea = useCallback(() => {
    if (!containerRef.current || !editorRef.current) return;
    
    const editor = editorRef.current;
    const lineNumbers = containerRef.current;
    
    // Wait for DOM to be fully rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Get the actual scrollable heights
        const editorScrollHeight = editor.scrollHeight;
        const lineNumbersScrollHeight = lineNumbers.scrollHeight;
        
        // Calculate the difference
        const heightDiff = editorScrollHeight - lineNumbersScrollHeight;
        
        // Get current padding
        const currentStyles = window.getComputedStyle(lineNumbers);
        const currentPaddingBottom = parseFloat(currentStyles.paddingBottom);
        
        // Adjust padding to make scrollable areas exactly match
        if (Math.abs(heightDiff) > 1) { // Only adjust if there's a meaningful difference
          const newPadding = currentPaddingBottom + heightDiff;
          lineNumbers.style.paddingBottom = `${Math.max(0, newPadding)}px`;
        }
      });
    });
  }, [editorRef]);

  const calculateWrappedLines = useCallback(() => {
    if (!wordWrapEnabled || editorWidth === 0) {
      // Simple line numbers when word wrap is disabled or editor not ready
      const lines = content.split('\n');
      const lineNumbers = lines.map((_, index) => String(index + 1).padStart(4, ' ')).join('\n');
      // Match the exact ending of the content
      setLineNumberText(lineNumbers);
      return;
    }

    // Create a hidden clone to measure wrapped lines - must match textarea exactly
    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.width = `${editorWidth}px`;
    measurer.style.fontFamily = 'Consolas, Monaco, "Courier New", monospace';
    measurer.style.fontSize = '0.875rem'; // 14px - matches text-sm
    measurer.style.lineHeight = '1.5rem'; // 24px - matches textarea
    measurer.style.whiteSpace = 'pre-wrap';
    measurer.style.wordBreak = 'break-word';
    measurer.style.overflowWrap = 'break-word';
    measurer.style.padding = '24px 24px 24px 16px'; // pt-6 pb-6 pl-4 pr-6
    measurer.style.boxSizing = 'border-box';
    measurer.style.margin = '0';
    measurer.style.border = '0';
    
    document.body.appendChild(measurer);

    const lines = content.split('\n');
    const lineNumbersArray: string[] = [];
    
    lines.forEach((line, index) => {
      // Measure the height of this line when wrapped
      measurer.textContent = line || '\u00A0'; // Non-breaking space for empty lines
      const measuredHeight = measurer.offsetHeight;
      const baseLineHeight = 24; // 1.5rem in pixels
      const wrappedLineCount = Math.max(1, Math.round(measuredHeight / baseLineHeight));

      // Add line number for the first line
      lineNumbersArray.push(String(index + 1).padStart(4, ' '));
      
      // Add empty lines for wrapped portions
      for (let i = 1; i < wrappedLineCount; i++) {
        lineNumbersArray.push('    '); // Empty spaces matching the padding
      }
    });

    document.body.removeChild(measurer);
    const finalText = lineNumbersArray.join('\n');
    setLineNumberText(finalText);
  }, [content, wordWrapEnabled, editorWidth]);

  // Observe editor width changes
  useEffect(() => {
    if (!editorRef.current) return;

    const updateWidth = () => {
      if (editorRef.current) {
        setEditorWidth(editorRef.current.clientWidth);
      }
    };

    updateWidth();

    // Watch for resize
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(editorRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [editorRef]);

  useEffect(() => {
    calculateWrappedLines();
  }, [calculateWrappedLines]);

  // Adjust height after line numbers are calculated or wrap changes
  useEffect(() => {
    adjustHeightToMatchTextarea();
    // Also adjust after a short delay to ensure DOM is settled
    const timer = setTimeout(() => {
      adjustHeightToMatchTextarea();
    }, 100);
    return () => clearTimeout(timer);
  }, [lineNumberText, wordWrapEnabled, adjustHeightToMatchTextarea]);

  // Use direct scroll event listener for instant synchronization
  useDirectScrollSync(containerRef, editorRef);

  return (
    <div className="line-numbers-container" style={{ overflow: 'hidden', height: '100%' }}>
      <pre 
        ref={containerRef}
        className="line-numbers select-none text-right pr-4 pl-4 pt-6 font-mono text-sm"
        style={{ 
          backgroundColor: 'var(--color-bg)', 
          color: 'var(--color-text-subtle)',
          minWidth: '3.5rem',
          borderRight: '1px solid var(--color-border)',
          fontSize: '0.875rem', // Match textarea font size
          lineHeight: '1.5rem', // Match textarea line height
          fontFamily: 'Consolas, Monaco, "Courier New", monospace', // Match textarea font family
          margin: '0',
          whiteSpace: 'pre',
          overflowX: 'hidden',
          overflowY: 'auto',
          height: '100%',
          boxSizing: 'border-box',
          paddingBottom: '50vh' // Initial padding, will be adjusted dynamically
        }}
      >
        {lineNumberText}
      </pre>
    </div>
  );
};
