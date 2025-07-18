'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  FavaPaginationContext,
  FavaPaginationProviderProps,
  FavaPaginationState,
  FavaPaginationActions,
  FavaPaginationConfig,
  DEFAULT_PAGINATION_CONFIG
} from './favaPaginationTypes';
import {
  createPaginationState,
  paginateData,
  validatePageNumber,
  savePaginationPreference,
  loadPaginationPreference
} from './favaPaginationUtils';

const PaginationContext = createContext<FavaPaginationContext | null>(null);

export function FavaPaginationProvider({
  children,
  data,
  config = {},
  pageKey = 'default'
}: FavaPaginationProviderProps) {
  const mergedConfig: FavaPaginationConfig = { ...DEFAULT_PAGINATION_CONFIG, ...config };
  
  // Load saved preferences from localStorage
  const savedItemsPerPage = loadPaginationPreference(
    pageKey,
    'itemsPerPage',
    mergedConfig.defaultItemsPerPage!
  );
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState(savedItemsPerPage);
  
  // Calculate pagination state
  const state: FavaPaginationState = useMemo(() => {
    return createPaginationState(currentPage, itemsPerPage, data.length);
  }, [currentPage, itemsPerPage, data.length]);

  // Reset to first page when data changes significantly
  useEffect(() => {
    if (currentPage > state.totalPages && state.totalPages > 0) {
      setCurrentPage(1);
    }
  }, [state.totalPages, currentPage]);

  // Actions
  const actions: FavaPaginationActions = {
    goToPage: (page: number) => {
      const validPage = validatePageNumber(page, state.totalPages);
      setCurrentPage(validPage);
    },

    goToNextPage: () => {
      if (state.hasNextPage) {
        setCurrentPage(currentPage + 1);
      }
    },

    goToPreviousPage: () => {
      if (state.hasPreviousPage) {
        setCurrentPage(currentPage - 1);
      }
    },

    goToFirstPage: () => {
      setCurrentPage(1);
    },

    goToLastPage: () => {
      setCurrentPage(state.totalPages);
    },

    setItemsPerPage: (newItemsPerPage: number) => {
      setItemsPerPageState(newItemsPerPage);
      setCurrentPage(1); // Reset to first page when changing page size
      
      // Save preference to localStorage
      savePaginationPreference(pageKey, 'itemsPerPage', newItemsPerPage);
    },

    setTotalItems: (totalItems: number) => {
      // This is handled automatically through data.length changes
      // Included for interface completeness
    }
  };

  const contextValue: FavaPaginationContext = {
    state,
    actions,
    config: mergedConfig
  };

  return (
    <PaginationContext.Provider value={contextValue}>
      {children}
    </PaginationContext.Provider>
  );
}

// Custom hook to use pagination context
export function useFavaPagination(): FavaPaginationContext {
  const context = useContext(PaginationContext);
  if (!context) {
    throw new Error('useFavaPagination must be used within a FavaPaginationProvider');
  }
  return context;
}

// Hook to get paginated data
export function usePaginatedData<T = any>(data: T[]): T[] {
  const { state } = useFavaPagination();
  
  return useMemo(() => {
    return paginateData(data, state.currentPage, state.itemsPerPage);
  }, [data, state.currentPage, state.itemsPerPage]);
}