import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { CodexCard } from './CodexCard';
import { Codex, CodexProgress } from '../utils/api';

interface CodexCarouselProps {
  codexes: Codex[];
  progressMap: Map<number, CodexProgress>;
  onOpen: (codex: Codex) => void;
  onEdit: (codex: Codex) => void;
  onDelete: (codex: Codex) => void;
  onTogglePin: (codex: Codex) => void;
  maxItemsPerPage?: number;
  minItemsPerPage?: number;
}

export const CodexCarousel: React.FC<CodexCarouselProps> = ({
  codexes,
  progressMap,
  onOpen,
  onEdit,
  onDelete,
  onTogglePin,
  maxItemsPerPage = 5,
  minItemsPerPage = 2
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(maxItemsPerPage);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate items per page based on CSS grid breakpoints to match All section
  const calculateItemsPerPage = useCallback(() => {
    if (!containerRef.current) return maxItemsPerPage;
    
    const containerWidth = containerRef.current.offsetWidth;
    
    // Use same breakpoints as Tailwind grid system
    if (containerWidth >= 1536) return Math.min(5, maxItemsPerPage); // 2xl: 5 columns
    if (containerWidth >= 1280) return Math.min(4, maxItemsPerPage); // xl: 4 columns  
    if (containerWidth >= 1024) return Math.min(3, maxItemsPerPage); // lg: 3 columns
    if (containerWidth >= 768) return Math.min(2, maxItemsPerPage);  // md: 2 columns
    return Math.max(1, minItemsPerPage); // sm: 1 column
  }, [maxItemsPerPage, minItemsPerPage]);

  // Update items per page on resize
  useEffect(() => {
    const updateItemsPerPage = () => {
      const newItemsPerPage = calculateItemsPerPage();
      if (newItemsPerPage !== itemsPerPage) {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(0);
      }
    };

    updateItemsPerPage();

    const resizeObserver = new ResizeObserver(updateItemsPerPage);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [itemsPerPage, maxItemsPerPage, minItemsPerPage, calculateItemsPerPage]);
  
  const totalPages = Math.ceil(codexes.length / itemsPerPage);
  
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = codexes.slice(startIndex, endIndex);
  
  const goToPrevious = () => {
    setCurrentPage(prev => (prev > 0 ? prev - 1 : totalPages - 1));
  };
  
  const goToNext = () => {
    setCurrentPage(prev => (prev < totalPages - 1 ? prev + 1 : 0));
  };
  
  if (codexes.length === 0) {
    return null;
  }
  
  return (
    <div className="relative" ref={containerRef}>
      {/* Carousel Content */}
      <div className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {currentItems.map(codex => (
            <CodexCard
              key={codex.id}
              codex={codex}
              progress={progressMap.get(codex.id)}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
              onTogglePin={onTogglePin}
            />
          ))}
        </div>
      </div>
      
      {/* Navigation Controls - only show if more than one page */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={goToPrevious}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover-bg transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <CaretLeftIcon size={16} weight="bold" />
            <span className="text-sm font-medium">Previous</span>
          </button>
          
          {/* Page Indicators */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentPage
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={goToNext}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover-bg transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <span className="text-sm font-medium">Next</span>
            <CaretRightIcon size={16} weight="bold" />
          </button>
        </div>
      )}
      
      {/* Page counter */}
      {totalPages > 1 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          {startIndex + 1}-{Math.min(endIndex, codexes.length)} of {codexes.length} pinned codexes
        </p>
      )}
    </div>
  );
};