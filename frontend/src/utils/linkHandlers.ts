import React, { useCallback } from 'react';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

/**
 * Creates event handlers for markdown content that intercepts link clicks
 * and opens external links in the browser while allowing internal anchor links
 */
export const useOpenExternalLinkHandlers = () => {
  const handleClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a');
    if (link && link.href) {
      event.preventDefault();
      if (link.href.startsWith('http://') || link.href.startsWith('https://')) {
        BrowserOpenURL(link.href);
      } else if (link.href.startsWith('#')) {
        const targetId = link.href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleClick(event as unknown as React.MouseEvent);
    }
  }, [handleClick]);

  return { handleClick, handleKeyDown };
};
