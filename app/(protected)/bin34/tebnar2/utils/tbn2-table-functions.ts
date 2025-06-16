// Tebnar2 Table Processing Functions - Independent clones from tebnar1

import { Tebnar2ImagePlan, Tebnar2ColumnSettings } from '../types/tebnar2-types';
import { TBN2_COLUMNS, TBN2_COLUMN_SETTINGS, TBN2_HEADER_CELL_WIDTHS } from '../constants/tebnar2-constants';

// Column processing and configuration functions
export const tbn2_processTableColumns = () => {
  return {
    regularColumns: TBN2_COLUMNS,
    imagePreviewColumns: ['image1-preview', 'image2-preview', 'image3-preview', 'image4-preview'],
    allColumns: [...TBN2_COLUMNS, 'image1-preview', 'image2-preview', 'image3-preview', 'image4-preview']
  };
};

// Get column settings with fallbacks
export const tbn2_getColumnSettings = (columnKey: string): Tebnar2ColumnSettings => {
  return TBN2_COLUMN_SETTINGS[columnKey] || {
    width: 'auto',
    minWidth: 'auto', 
    maxWidth: 'auto',
    textAlign: 'left'
  };
};

// Get header cell width settings
export const tbn2_getHeaderCellWidths = (columnKey: string) => {
  return TBN2_HEADER_CELL_WIDTHS[columnKey] || {
    width: 'auto',
    minWidth: 'auto',
    maxWidth: 'auto'
  };
};

// Format cell values for display
export const tbn2_formatCellValue = (value: any, columnKey: string): string => {
  if (value === null || value === undefined) return '';
  
  switch (columnKey) {
    case 'created_at':
      return tbn2_formatDate(value);
    case 'e_width':
    case 'e_height':
      return value ? value.toString() : '';
    case 'int1':
    case 'int2':
    case 'int3':
    case 'int4':
      return value ? value.toString() : '';
    default:
      if (typeof value === 'string' && value.length > 50) {
        return tbn2_truncateText(value, 50);
      }
      return value.toString();
  }
};

// Date formatting utility
export const tbn2_formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return dateString;
  }
};

// Text truncation utility
export const tbn2_truncateText = (text: string, maxLength: number = 30): string => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Column type detection utilities
export const tbn2_isImageIdColumn = (columnKey: string): boolean => {
  return columnKey.includes('fk_image') && columnKey.includes('_id');
};

export const tbn2_isPreviewColumn = (columnKey: string): boolean => {
  return columnKey.includes('-preview');
};

export const tbn2_isIntColumn = (columnKey: string): boolean => {
  return /^int[1-4]$/.test(columnKey);
};

export const tbn2_isDimensionColumn = (columnKey: string): boolean => {
  return columnKey === 'e_width' || columnKey === 'e_height';
};

export const tbn2_isContentColumn = (columnKey: string): boolean => {
  return columnKey.startsWith('e_') && !tbn2_isDimensionColumn(columnKey);
};

// Get image field name for a given image slot
export const tbn2_getImageFieldName = (imageSlot: number): keyof Tebnar2ImagePlan => {
  return `fk_image${imageSlot}_id` as keyof Tebnar2ImagePlan;
};

// Get all image field names
export const tbn2_getAllImageFieldNames = (): (keyof Tebnar2ImagePlan)[] => {
  return [1, 2, 3, 4].map(num => tbn2_getImageFieldName(num));
};

// Header text alignment configuration
export const tbn2_getHeaderTextAlign = (columnKey: string): 'left' | 'center' | 'right' => {
  // Intent columns - center aligned
  if (tbn2_isIntColumn(columnKey)) return 'center';
  
  // Preview columns - center aligned
  if (tbn2_isPreviewColumn(columnKey)) return 'center';
  
  // Image ID columns - center aligned
  if (tbn2_isImageIdColumn(columnKey)) return 'center';
  
  // Dimension columns - center aligned
  if (tbn2_isDimensionColumn(columnKey)) return 'center';
  
  // ID and relationship columns - varies
  if (columnKey === 'id') return 'left';
  if (columnKey.includes('rel_') || columnKey.includes('_id')) return 'center';
  
  // Date columns - center aligned
  if (columnKey === 'created_at') return 'center';
  
  // Content columns - left aligned
  return 'left';
};

// Cell text alignment configuration
export const tbn2_getCellTextAlign = (columnKey: string): 'left' | 'center' | 'right' => {
  // Most columns use same alignment as headers
  const headerAlign = tbn2_getHeaderTextAlign(columnKey);
  
  // Exception: ID column is left-aligned in cells
  if (columnKey === 'id') return 'left';
  
  return headerAlign;
};

// Sorting functions
export const tbn2_sortPlans = (
  plans: Tebnar2ImagePlan[], 
  sortColumn: keyof Tebnar2ImagePlan, 
  sortDirection: 'asc' | 'desc'
): Tebnar2ImagePlan[] => {
  return [...plans].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    // Handle null/undefined values
    if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
    if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;
    
    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      const comparison = aValue - bValue;
      return sortDirection === 'asc' ? comparison : -comparison;
    }
    
    // Fallback to string comparison
    const aStr = String(aValue);
    const bStr = String(bValue);
    const comparison = aStr.localeCompare(bStr);
    return sortDirection === 'asc' ? comparison : -comparison;
  });
};

// Search/filter functions
export const tbn2_filterPlans = (
  plans: Tebnar2ImagePlan[], 
  searchTerm: string,
  searchColumns?: (keyof Tebnar2ImagePlan)[]
): Tebnar2ImagePlan[] => {
  if (!searchTerm.trim()) return plans;
  
  const lowercaseSearch = searchTerm.toLowerCase();
  const columnsToSearch = searchColumns || [
    'id', 'e_zpf_img_code', 'e_associated_content1', 
    'e_file_name1', 'e_more_instructions1', 'e_prompt1', 'e_ai_tool1'
  ];
  
  return plans.filter(plan => {
    return columnsToSearch.some(column => {
      const value = plan[column];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowercaseSearch);
    });
  });
};

// Row styling functions
export const tbn2_getRowClassName = (index: number, isSelected?: boolean): string => {
  const baseClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
  if (isSelected) {
    return `${baseClass} bg-blue-100 border-blue-300`;
  }
  return baseClass;
};

// Table state management helpers
export const tbn2_calculateTableState = (
  plans: Tebnar2ImagePlan[],
  currentPage: number,
  pageSize: number,
  searchTerm: string,
  selectedBatchId: string
) => {
  // Apply batch filter first
  let filteredPlans = selectedBatchId 
    ? plans.filter(plan => plan.rel_images_plans_batches_id === selectedBatchId)
    : plans;
  
  // Apply search filter
  if (searchTerm) {
    filteredPlans = tbn2_filterPlans(filteredPlans, searchTerm);
  }
  
  // Calculate pagination
  const totalItems = filteredPlans.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPlans = filteredPlans.slice(startIndex, endIndex);
  
  return {
    filteredPlans,
    paginatedPlans,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};