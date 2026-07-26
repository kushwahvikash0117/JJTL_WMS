/**
 * @file ScrollToTop.jsx
 * @description Utility component that automatically scrolls the primary layout container to the top on route changes.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * 
 * @returns {null} Renders nothing visually
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Targets the specific scrollable container in the layout
    const mainContainer = document.querySelector('.overflow-y-auto');
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}