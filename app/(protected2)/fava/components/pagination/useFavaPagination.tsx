'use client';

import { useFavaPagination, usePaginatedData } from './favaPaginationProvider';
import { getVisiblePageNumbers } from './favaPaginationUtils';

/**
 * Functional pagination hook with additional utilities
 */
export function useFunctionalPagination<T = any>(data: T[]) {
  const pagination = useFavaPagination();
  const paginatedData = usePaginatedData(data);
  
  const visiblePageNumbers = getVisiblePageNumbers(
    pagination.state.currentPage,
    pagination.state.totalPages,
    pagination.config.maxVisiblePages
  );

  return {
    ...pagination,
    paginatedData,
    visiblePageNumbers,
    
    // Convenience methods
    isFirstPage: pagination.state.currentPage === 1,
    isLastPage: pagination.state.currentPage === pagination.state.totalPages,
    
    // Page info text
    getPageInfoText: () => {
      const { startIndex, endIndex, totalItems } = pagination.state;
      const actualEndIndex = Math.min(endIndex, totalItems);
      
      if (totalItems === 0) {
        return 'No items found';
      }
      
      return `Showing ${startIndex + 1} to ${actualEndIndex} of ${totalItems} items`;
    },
    
    // Page range for display
    getPageRange: () => {
      const { currentPage, totalPages } = pagination.state;
      return `Page ${currentPage} of ${totalPages}`;
    }
  };
}

// Re-export the main hooks for convenience
export { useFavaPagination, usePaginatedData } from './favaPaginationProvider';