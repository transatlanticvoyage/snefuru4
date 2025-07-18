export interface FavaPaginationConfig {
  defaultItemsPerPage?: number;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  showNavigationButtons?: boolean;
  maxVisiblePages?: number;
}

export interface FavaPaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FavaPaginationActions {
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  setTotalItems: (totalItems: number) => void;
}

export interface FavaPaginationContext {
  state: FavaPaginationState;
  actions: FavaPaginationActions;
  config: FavaPaginationConfig;
}

export interface FavaPaginationProviderProps {
  children: React.ReactNode;
  data: any[];
  config?: FavaPaginationConfig;
  pageKey?: string; // For localStorage keys
  initialPage?: number; // For URL-based initial page
  onPageChange?: (page: number) => void; // Callback for page changes
  onItemsPerPageChange?: (itemsPerPage: number) => void; // Callback for items per page changes
}

export interface PaginatedData<T = any> {
  items: T[];
  pagination: FavaPaginationState;
}

export const DEFAULT_PAGINATION_CONFIG: FavaPaginationConfig = {
  defaultItemsPerPage: 10,
  pageSizeOptions: [5, 10, 20, 50, 100],
  showPageSizeSelector: true,
  showPageInfo: true,
  showNavigationButtons: true,
  maxVisiblePages: 5
};