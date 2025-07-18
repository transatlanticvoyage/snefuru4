import { FavaPaginationState } from './favaPaginationTypes';

/**
 * Calculate total pages based on total items and items per page
 */
export function calculateTotalPages(totalItems: number, itemsPerPage: number): number {
  return Math.ceil(totalItems / itemsPerPage);
}

/**
 * Calculate start and end indices for current page
 */
export function calculatePageIndices(currentPage: number, itemsPerPage: number): {
  startIndex: number;
  endIndex: number;
} {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return { startIndex, endIndex };
}

/**
 * Get visible page numbers for pagination controls
 */
export function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisiblePages: number = 5
): number[] {
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfVisible = Math.floor(maxVisiblePages / 2);
  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Adjust if we're near the end
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
}

/**
 * Paginate an array of data
 */
export function paginateData<T>(
  data: T[],
  currentPage: number,
  itemsPerPage: number
): T[] {
  const { startIndex, endIndex } = calculatePageIndices(currentPage, itemsPerPage);
  return data.slice(startIndex, endIndex);
}

/**
 * Validate page number
 */
export function validatePageNumber(page: number, totalPages: number): number {
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

/**
 * Create pagination state object
 */
export function createPaginationState(
  currentPage: number,
  itemsPerPage: number,
  totalItems: number
): FavaPaginationState {
  const totalPages = calculateTotalPages(totalItems, itemsPerPage);
  const validatedPage = validatePageNumber(currentPage, totalPages);
  const { startIndex, endIndex } = calculatePageIndices(validatedPage, itemsPerPage);

  return {
    currentPage: validatedPage,
    itemsPerPage,
    totalItems,
    totalPages,
    startIndex,
    endIndex: Math.min(endIndex, totalItems),
    hasNextPage: validatedPage < totalPages,
    hasPreviousPage: validatedPage > 1
  };
}

/**
 * Generate storage key for pagination preferences
 */
export function getPaginationStorageKey(pageKey: string, setting: string): string {
  return `fava_pagination_${pageKey}_${setting}`;
}

/**
 * Save pagination preference to localStorage
 */
export function savePaginationPreference(
  pageKey: string,
  setting: string,
  value: any
): void {
  try {
    const key = getPaginationStorageKey(pageKey, setting);
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving pagination preference:', error);
  }
}

/**
 * Load pagination preference from localStorage
 */
export function loadPaginationPreference<T>(
  pageKey: string,
  setting: string,
  defaultValue: T
): T {
  try {
    const key = getPaginationStorageKey(pageKey, setting);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Error loading pagination preference:', error);
    return defaultValue;
  }
}