'use client';

import { Tebnar2ImagePlan, Tebnar2Image } from '../types/tebnar2-types';
import { TBN2_PAGE_SIZE_OPTIONS } from '../constants/tebnar2-constants';
import Tebnar2ImagePreview from './Tebnar2ImagePreview';

// Complete column settings - exact clone from tebnar1
const tbn2_columnSettings = {
  // Intent columns  
  int1: { width: '60px', minWidth: '60px', maxWidth: '60px', textAlign: 'center' },
  int2: { width: '60px', minWidth: '60px', maxWidth: '60px', textAlign: 'center' },
  int3: { width: '60px', minWidth: '60px', maxWidth: '60px', textAlign: 'center' },
  int4: { width: '60px', minWidth: '60px', maxWidth: '60px', textAlign: 'center' },
  
  // Image ID columns
  fk_image1_id: { width: '45px', minWidth: '45px', maxWidth: '45px', textAlign: 'center' },
  fk_image2_id: { width: '45px', minWidth: '45px', maxWidth: '45px', textAlign: 'center' },
  fk_image3_id: { width: '45px', minWidth: '45px', maxWidth: '45px', textAlign: 'center' },
  fk_image4_id: { width: '45px', minWidth: '45px', maxWidth: '45px', textAlign: 'center' },
  
  // Preview columns
  'image1-preview': { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  'image2-preview': { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  'image3-preview': { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  'image4-preview': { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  
  // Data columns
  id: { width: '200px', minWidth: '150px', maxWidth: '250px', textAlign: 'left' },
  rel_users_id: { width: '150px', minWidth: '120px', maxWidth: '200px', textAlign: 'center' },
  rel_images_plans_batches_id: { width: '150px', minWidth: '120px', maxWidth: '200px', textAlign: 'center' },
  created_at: { width: '160px', minWidth: '140px', maxWidth: '200px', textAlign: 'center' },
  e_zpf_img_code: { width: '120px', minWidth: '100px', maxWidth: '150px', textAlign: 'left' },
  e_width: { width: '80px', minWidth: '60px', maxWidth: '100px', textAlign: 'center' },
  e_height: { width: '80px', minWidth: '60px', maxWidth: '100px', textAlign: 'center' },
  e_associated_content1: { width: '200px', minWidth: '150px', maxWidth: '300px', textAlign: 'left' },
  e_file_name1: { width: '200px', minWidth: '150px', maxWidth: '300px', textAlign: 'left' },
  e_more_instructions1: { width: '250px', minWidth: '200px', maxWidth: '400px', textAlign: 'left' },
  e_prompt1: { width: '300px', minWidth: '200px', maxWidth: '500px', textAlign: 'left' },
  e_ai_tool1: { width: '120px', minWidth: '100px', maxWidth: '150px', textAlign: 'center' },
} as Record<string, { width: string; minWidth: string; maxWidth: string; textAlign: string }>;

// Header customization settings - exact clone from tebnar1
const tbn2_headerCustomizationSettings = {
  headerRow: {
    height: '60px',
    minHeight: '40px',
    maxHeight: '100px',
    backgroundColor: '#f7ead4',
    borderBottom: '2px solid #e5e7eb',
    position: 'sticky' as const,
    top: '0px',
    zIndex: 10,
  },
  
  headerCellWidths: {
    // Same as columnSettings but specifically for headers
    ...tbn2_columnSettings
  },
  
  headerCell: {
    verticalAlign: 'middle' as const,
    textAlign: 'center' as const,
    backgroundColor: '#f7ead4',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'normal' as const,
    wordBreak: 'break-word' as const,
    wordWrap: 'break-word' as const,
    hyphens: 'auto' as const,
    boxSizing: 'border-box' as const,
  },
  
  headerText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'lowercase' as const,
    letterSpacing: '0.05em',
    lineHeight: '1.2',
    fontFamily: 'inherit',
  },
  
  headerTextAlign: {
    // Column-specific text alignment overrides
    int1: 'center' as const,
    int2: 'center' as const,
    int3: 'center' as const,
    int4: 'center' as const,
    fk_image1_id: 'center' as const,
    fk_image2_id: 'center' as const,
    fk_image3_id: 'center' as const,
    fk_image4_id: 'center' as const,
    'image1-preview': 'center' as const,
    'image2-preview': 'center' as const,
    'image3-preview': 'center' as const,
    'image4-preview': 'center' as const,
    id: 'left' as const,
    rel_users_id: 'center' as const,
    rel_images_plans_batches_id: 'center' as const,
    created_at: 'center' as const,
    e_zpf_img_code: 'left' as const,
    e_width: 'center' as const,
    e_height: 'center' as const,
    e_associated_content1: 'left' as const,
    e_file_name1: 'left' as const,
    e_more_instructions1: 'left' as const,
    e_prompt1: 'left' as const,
    e_ai_tool1: 'center' as const,
  } as Record<string, 'left' | 'center' | 'right'>,
  
  headerBorders: {
    topBorder: '1px solid #c7cbd3',
    bottomBorder: '2px solid #e5e7eb',
    cellBorderRight: '1px solid #c7cbd3',
    cellBorderLeft: '1px solid #c7cbd3',
    borderRadius: '0px',
  },
  
  headerHover: {
    enabled: true,
    backgroundColor: '#f0e6d2',
    color: '#5b5b5b',
    borderColor: '#a0a0a0',
  },
};

// Enhanced table styling settings - exact clone from tebnar1
const tbn2_tableStyleSettings = {
  // Table-level settings for strict layout control
  table: {
    tableLayout: 'fixed' as const,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden' as const,
  },
  
  // Row styling
  row: {
    height: '80px',
    minHeight: '80px',
    maxHeight: '80px',
    verticalAlign: 'middle' as const,
    backgroundColor: '#ffffff',
    hoverBackgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    overflow: 'hidden' as const,
  },
  
  // Cell styling - Enhanced for strict overflow control
  cell: {
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    wordBreak: 'break-word' as const,
    wordWrap: 'break-word' as const,
    verticalAlign: 'top' as const,
    padding: '8px 16px',
    maxWidth: '100%',
    minWidth: '0',
    boxSizing: 'border-box' as const,
  },
  
  // Text cell specific styling (for data columns) - Enhanced overflow control
  textCell: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#374151',
    fontWeight: 'normal' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    maxWidth: '100%',
    wordBreak: 'break-word' as const,
  },
  
  // Preview cell specific styling (for image columns) - Enhanced overflow control
  previewCell: {
    padding: '8px',
    textAlign: 'center' as const,
    backgroundColor: '#fafafa',
    overflow: 'hidden' as const,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    maxWidth: '100%',
    maxHeight: '100%',
  },
  
  // Image styling within preview cells - Strict size control
  previewImage: {
    width: '64px',
    height: '64px',
    maxWidth: '64px',
    maxHeight: '64px',
    objectFit: 'cover' as const,
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  
  // Table header styling
  header: {
    backgroundColor: '#f7ead4',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    maxWidth: '100%',
  },
  
  // Pagination styling
  pagination: {
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    padding: '12px 24px',
    fontSize: '14px',
    color: '#374151',
    overflow: 'hidden' as const,
  }
};

// TABLE CELL PADDING - exact clone from tebnar1
const tbn2_tableCellPaddingSettings = {
  // Global default padding (applies to all cells unless overridden)
  globalDefault: {
    padding: '4px 4px',             // Default padding for all cells
    paddingTop: '4px',               // Default top padding
    paddingRight: '4px',            // Default right padding
    paddingBottom: '4px',            // Default bottom padding
    paddingLeft: '4px',             // Default left padding
  },
  
  // Column-specific padding overrides - ALL SET TO 4px 4px
  columnPadding: {
    // Intent columns - 4px padding
    'int1': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'int2': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'int3': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'int4': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    
    // Image preview columns - 4px padding (ensuring these are set correctly)
    'image1-preview': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'image2-preview': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'image3-preview': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'image4-preview': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    
    // Image ID columns - 4px padding
    'fk_image1_id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'fk_image2_id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'fk_image3_id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'fk_image4_id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    
    // Data columns - 4px padding
    'id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'rel_users_id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'rel_images_plans_batches_id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'created_at': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    
    // Content columns - 4px padding
    'e_zpf_img_code': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_width': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_height': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_associated_content1': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_file_name1': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_more_instructions1': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_prompt1': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_ai_tool1': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
  } as Record<string, { padding: string; paddingTop: string; paddingRight: string; paddingBottom: string; paddingLeft: string }>,
  
  // Row type specific padding - ALL SET TO 4px 4px
  rowTypePadding: {
    headerRow: {
      padding: '4px 4px',          // Header row cell padding
      paddingTop: '4px',
      paddingRight: '4px',
      paddingBottom: '4px',
      paddingLeft: '4px',
    },
    dataRow: {
      padding: '4px 4px',           // Data row cell padding
      paddingTop: '4px',
      paddingRight: '4px',
      paddingBottom: '4px',
      paddingLeft: '4px',
    },
    firstRow: {
      paddingTop: '4px',            // Consistent padding for first data row
    },
    lastRow: {
      paddingBottom: '4px',         // Consistent padding for last data row
    },
  },
};

// TABLE BORDERS - exact clone from tebnar1
const tbn2_tableBorderSettings = {
  // Global border settings
  global: {
    borderCollapse: 'collapse' as const,
    borderSpacing: '0px',
    borderStyle: 'solid',
    borderColor: '#c7cbd3',
    borderWidth: '1px',
  },
  
  // Table outer borders
  tableBorders: {
    enabled: true,                   // Enable table outer borders
    top: '1px solid #c7cbd3',        // Top border of entire table
    right: '1px solid #c7cbd3',      // Right border of entire table
    bottom: '1px solid #c7cbd3',     // Bottom border of entire table
    left: '1px solid #c7cbd3',       // Left border of entire table
    borderRadius: '0px',             // Border radius for table corners
  },
  
  // Row borders (horizontal lines)
  rowBorders: {
    enabled: true,                   // Enable row borders
    headerBottom: '1px solid #c7cbd3', // Border below header row
    dataRowBottom: '1px solid #c7cbd3', // Border below each data row
    lastRowBottom: '1px solid #c7cbd3', // Border below last row
    alternatingRows: {
      enabled: false,                // Enable alternating row border styles
      evenRowBorder: '1px solid #c7cbd3', // Even row border
      oddRowBorder: '1px solid #c7cbd3',  // Odd row border
    },
    hoverBorder: '1px solid #c7cbd3', // Border color on row hover
  },
  
  // Column borders (vertical lines)  
  columnBorders: {
    enabled: true,                   // Enable column borders
    defaultRight: '1px solid #c7cbd3', // Default right border for columns
    defaultLeft: '1px solid #c7cbd3', // Default left border for columns
    firstColumnLeft: '1px solid #c7cbd3', // Left border of first column
    lastColumnRight: '1px solid #c7cbd3', // Right border of last column
  },
  
  // Header-specific borders - exact clone from tebnar1
  headerBorders: {
    enabled: true,                   // Enable header-specific borders
    cellBorderRight: '1px solid #c7cbd3', // Right border for header cells
    cellBorderLeft: '1px solid #c7cbd3', // Left border for header cells
    cellBorderTop: '1px solid #c7cbd3', // Top border for header cells
    cellBorderBottom: '1px solid #c7cbd3', // Bottom border for header cells
    lastHeaderCellRight: '1px solid #c7cbd3', // Right border of last header cell
  },
  
  // Cell border styles
  cellBorders: {
    defaultStyle: 'solid',           // Default border style for cells
    defaultColor: '#c7cbd3',         // Default border color for cells - updated
    defaultWidth: '1px',             // Default border width for cells
    
    // Special cell border styles
    previewCells: {
      style: 'solid',
      color: '#c7cbd3',              // Updated to consistent color
      width: '1px',
    },
    dataCells: {
      style: 'solid',
      color: '#c7cbd3',              // Updated to consistent color
      width: '1px',
    },
    headerCells: {
      style: 'solid',
      color: '#c7cbd3',              // Updated to consistent color
      width: '1px',
    },
  }
};

interface Tebnar2TableProps {
  plans: Tebnar2ImagePlan[];
  imagesById: Record<string, Tebnar2Image>;
  fetchingImages: Set<string>;
  lastClickTime: Record<string, number>;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalPlans: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefreshImages: () => void;
  onFetchSingleImage: (plan: Tebnar2ImagePlan, imageSlot: number) => void;
  stickyColumns: string[];
  visibleColumns: string[];
  calculateStickyLeft: (index: number) => string;
  getColumnWidth: (col: string) => string;
  selectedRows: Set<string>;
  onSelectionChange: (selectedRows: Set<string>) => void;
}

export default function Tebnar2Table({
  plans,
  imagesById,
  fetchingImages,
  lastClickTime,
  currentPage,
  pageSize,
  totalPages,
  totalPlans,
  onPageChange,
  onPageSizeChange,
  onRefreshImages,
  onFetchSingleImage,
  stickyColumns,
  visibleColumns,
  calculateStickyLeft,
  getColumnWidth,
  selectedRows,
  onSelectionChange
}: Tebnar2TableProps) {

  // Get non-sticky visible columns (sticky columns are handled separately)
  const nonStickyColumns = visibleColumns.slice(stickyColumns.length);

  // Checkbox selection handlers
  const handleSelectRow = (planId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(planId)) {
      newSelected.delete(planId);
    } else {
      newSelected.add(planId);
    }
    onSelectionChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === plans.length && plans.length > 0) {
      // Deselect all
      onSelectionChange(new Set());
    } else {
      // Select all current page items
      const allPlanIds = new Set(plans.map(plan => plan.id));
      onSelectionChange(allPlanIds);
    }
  };

  const handleCheckboxCellClick = (planId: string) => {
    handleSelectRow(planId);
  };

  return (
    <div className="w-full px-4">
      {/* uitablegrid21 label - exact clone from tebnar1 */}
      <div className="mb-2 flex items-center gap-2 flex-wrap">
        <span className="font-bold">uitablegrid21</span>
        <span>- uitablegrid chiefly represents rows of</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText('db table images_plans');
          }}
          className="px-2 py-1 border border-solid border-gray-400 rounded text-sm hover:bg-gray-50 transition-colors"
          title="Click to copy"
        >
          db table images_plans
        </button>
        <span>(copy button)</span>
        <button
          onClick={async () => {
            // TODO: Implement refresh
            onRefreshImages();
          }}
          className="ml-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors font-medium"
          title="Force refresh all table data"
        >
          refresh interface cache x153
        </button>
      </div>
      
      
      <div className="overflow-x-auto w-full">
        <table 
          style={{
            ...tbn2_tableStyleSettings.table,
            borderCollapse: tbn2_tableBorderSettings.global.borderCollapse,
            borderSpacing: tbn2_tableBorderSettings.global.borderSpacing,
            border: tbn2_tableBorderSettings.tableBorders.enabled 
              ? `${tbn2_tableBorderSettings.tableBorders.top}` 
              : 'none'
          }}
          className="w-full"
        >
          <thead className="bg-gray-50">
            <tr
              style={{
                height: tbn2_headerCustomizationSettings.headerRow.height,
                minHeight: tbn2_headerCustomizationSettings.headerRow.minHeight,
                maxHeight: tbn2_headerCustomizationSettings.headerRow.maxHeight,
                backgroundColor: tbn2_headerCustomizationSettings.headerRow.backgroundColor,
                borderBottom: tbn2_headerCustomizationSettings.headerRow.borderBottom,
                position: tbn2_headerCustomizationSettings.headerRow.position,
                top: tbn2_headerCustomizationSettings.headerRow.top,
                zIndex: tbn2_headerCustomizationSettings.headerRow.zIndex,
                borderTop: tbn2_headerCustomizationSettings.headerBorders.topBorder,
              }}
            >
              {/* Select Checkbox Header - always first column */}
              <th
                style={{
                  width: '50px',
                  minWidth: '50px',
                  maxWidth: '50px',
                  position: 'sticky',
                  left: '0px',
                  zIndex: 20,
                  backgroundColor: tbn2_headerCustomizationSettings.headerRow.backgroundColor,
                  borderRight: '1px solid #c7cbd3',
                  padding: '6px 10px !important',
                  paddingTop: '6px !important',
                  paddingBottom: '6px !important',
                  paddingLeft: '10px !important',
                  paddingRight: '10px !important',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={handleSelectAll}
              >
                <input
                  type="checkbox"
                  checked={selectedRows.size === plans.length && plans.length > 0}
                  onChange={handleSelectAll}
                  style={{
                    width: '26px',
                    height: '26px',
                    cursor: 'pointer',
                    pointerEvents: 'none'
                  }}
                />
              </th>
              
              {/* Sticky Headers */}
              {stickyColumns.map((col, index) => {
                // Get width settings - use the new getColumnWidth function
                const width = getColumnWidth(col);
                const isLastSticky = index === stickyColumns.length - 1;
                
                return (
                  <th
                    key={col}
                    style={{
                      width: width,
                      minWidth: width,
                      maxWidth: width,
                      position: 'sticky',
                      left: `calc(50px + ${calculateStickyLeft(index)})`,
                      zIndex: 20,
                      backgroundColor: tbn2_headerCustomizationSettings.headerRow.backgroundColor,
                      borderRight: isLastSticky ? '4px solid black' : '1px solid #c7cbd3',
                      fontSize: tbn2_headerCustomizationSettings.headerText.fontSize,
                      fontWeight: tbn2_headerCustomizationSettings.headerText.fontWeight,
                      color: tbn2_headerCustomizationSettings.headerText.color,
                      textTransform: tbn2_headerCustomizationSettings.headerText.textTransform,
                      letterSpacing: tbn2_headerCustomizationSettings.headerText.letterSpacing,
                      lineHeight: tbn2_headerCustomizationSettings.headerText.lineHeight,
                      fontFamily: tbn2_headerCustomizationSettings.headerText.fontFamily,
                      padding: '4px 4px',
                      textAlign: 'center',
                      overflow: tbn2_headerCustomizationSettings.headerCell.overflow,
                      textOverflow: tbn2_headerCustomizationSettings.headerCell.textOverflow,
                      whiteSpace: tbn2_headerCustomizationSettings.headerCell.whiteSpace,
                      wordBreak: tbn2_headerCustomizationSettings.headerCell.wordBreak,
                      wordWrap: tbn2_headerCustomizationSettings.headerCell.wordWrap,
                      hyphens: tbn2_headerCustomizationSettings.headerCell.hyphens,
                      boxSizing: tbn2_headerCustomizationSettings.headerCell.boxSizing
                    }}
                  >
                    {col.startsWith('image') && col.includes('preview') ? 'Preview' : col}
                  </th>
                );
              })}
              
              {/* Non-Sticky Headers */}
              {nonStickyColumns.map((col) => {
                const width = getColumnWidth(col);
                
                return (
                  <th
                    key={col}
                    style={{
                      width: width,
                      minWidth: width,
                      maxWidth: width,
                      backgroundColor: tbn2_headerCustomizationSettings.headerRow.backgroundColor,
                      borderRight: '1px solid #c7cbd3',
                      fontSize: tbn2_headerCustomizationSettings.headerText.fontSize,
                      fontWeight: tbn2_headerCustomizationSettings.headerText.fontWeight,
                      color: tbn2_headerCustomizationSettings.headerText.color,
                      textTransform: tbn2_headerCustomizationSettings.headerText.textTransform,
                      letterSpacing: tbn2_headerCustomizationSettings.headerText.letterSpacing,
                      lineHeight: tbn2_headerCustomizationSettings.headerText.lineHeight,
                      fontFamily: tbn2_headerCustomizationSettings.headerText.fontFamily,
                      padding: '4px 4px',
                      textAlign: 'center',
                      overflow: tbn2_headerCustomizationSettings.headerCell.overflow,
                      textOverflow: tbn2_headerCustomizationSettings.headerCell.textOverflow,
                      whiteSpace: tbn2_headerCustomizationSettings.headerCell.whiteSpace,
                      wordBreak: tbn2_headerCustomizationSettings.headerCell.wordBreak,
                      wordWrap: tbn2_headerCustomizationSettings.headerCell.wordWrap,
                      hyphens: tbn2_headerCustomizationSettings.headerCell.hyphens,
                      boxSizing: tbn2_headerCustomizationSettings.headerCell.boxSizing
                    }}
                  >
                    {col.startsWith('image') && col.includes('preview') ? 'Preview' : col}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                {/* Select Checkbox Cell - always first column */}
                <td
                  style={{
                    width: '50px',
                    minWidth: '50px',
                    maxWidth: '50px',
                    position: 'sticky',
                    left: '0px',
                    zIndex: 10,
                    backgroundColor: '#ffffff',
                    borderRight: '1px solid #c7cbd3',
                    padding: '6px 10px !important',
                    paddingTop: '6px !important',
                    paddingBottom: '6px !important',
                    paddingLeft: '10px !important',
                    paddingRight: '10px !important',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleCheckboxCellClick(plan.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.has(plan.id)}
                    onChange={() => handleSelectRow(plan.id)}
                    style={{
                      width: '26px',
                      height: '26px',
                      cursor: 'pointer',
                      pointerEvents: 'none'
                    }}
                  />
                </td>
                
                {/* Sticky Cells */}
                {stickyColumns.map((col, index) => {
                  const width = getColumnWidth(col);
                  const isLastSticky = index === stickyColumns.length - 1;
                  
                  return (
                    <td
                      key={col}
                      style={{
                        width: width,
                        minWidth: width,
                        maxWidth: width,
                        position: 'sticky',
                        left: `calc(50px + ${calculateStickyLeft(index)})`,
                        zIndex: 10,
                        backgroundColor: '#ffffff',
                        borderRight: isLastSticky ? '4px solid black' : '1px solid #c7cbd3',
                        padding: '4px 4px',
                        verticalAlign: 'top',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {col.includes('preview') ? (
                        <Tebnar2ImagePreview
                          image={col === 'image1-preview' ? (plan['fk_image1_id'] ? imagesById[plan['fk_image1_id']] : null) :
                                 col === 'image2-preview' ? (plan['fk_image2_id'] ? imagesById[plan['fk_image2_id']] : null) :
                                 col === 'image3-preview' ? (plan['fk_image3_id'] ? imagesById[plan['fk_image3_id']] : null) :
                                 col === 'image4-preview' ? (plan['fk_image4_id'] ? imagesById[plan['fk_image4_id']] : null) : null}
                          imageId={col === 'image1-preview' ? plan['fk_image1_id'] :
                                   col === 'image2-preview' ? plan['fk_image2_id'] :
                                   col === 'image3-preview' ? plan['fk_image3_id'] :
                                   col === 'image4-preview' ? plan['fk_image4_id'] : null}
                          plan={plan}
                          imageNumber={col === 'image1-preview' ? 1 :
                                      col === 'image2-preview' ? 2 :
                                      col === 'image3-preview' ? 3 :
                                      col === 'image4-preview' ? 4 : 1}
                          fetchingImages={fetchingImages}
                          lastClickTime={lastClickTime}
                          onRefreshImages={onRefreshImages}
                          onFetchSingleImage={onFetchSingleImage}
                        />
                      ) : (
                        String(plan[col as keyof typeof plan] ?? '')
                      )}
                    </td>
                  );
                })}
                
                {/* Non-Sticky Cells */}
                {nonStickyColumns.map((col) => {
                  const width = getColumnWidth(col);
                  
                  return (
                    <td
                      key={col}
                      style={{
                        width: width,
                        minWidth: width,
                        maxWidth: width,
                        backgroundColor: '#ffffff',
                        borderRight: '1px solid #c7cbd3',
                        padding: '4px 4px',
                        verticalAlign: 'top',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {col.includes('preview') ? (
                        <Tebnar2ImagePreview
                          image={col === 'image1-preview' ? (plan['fk_image1_id'] ? imagesById[plan['fk_image1_id']] : null) :
                                 col === 'image2-preview' ? (plan['fk_image2_id'] ? imagesById[plan['fk_image2_id']] : null) :
                                 col === 'image3-preview' ? (plan['fk_image3_id'] ? imagesById[plan['fk_image3_id']] : null) :
                                 col === 'image4-preview' ? (plan['fk_image4_id'] ? imagesById[plan['fk_image4_id']] : null) : null}
                          imageId={col === 'image1-preview' ? plan['fk_image1_id'] :
                                   col === 'image2-preview' ? plan['fk_image2_id'] :
                                   col === 'image3-preview' ? plan['fk_image3_id'] :
                                   col === 'image4-preview' ? plan['fk_image4_id'] : null}
                          plan={plan}
                          imageNumber={col === 'image1-preview' ? 1 :
                                      col === 'image2-preview' ? 2 :
                                      col === 'image3-preview' ? 3 :
                                      col === 'image4-preview' ? 4 : 1}
                          fetchingImages={fetchingImages}
                          lastClickTime={lastClickTime}
                          onRefreshImages={onRefreshImages}
                          onFetchSingleImage={onFetchSingleImage}
                        />
                      ) : (
                        String(plan[col as keyof typeof plan] ?? '')
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination - exact clone from tebnar1 */}
        <div 
          style={{
            ...tbn2_tableStyleSettings.pagination,
            borderTop: `1px solid ${tbn2_tableBorderSettings.cellBorders.defaultColor}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, totalPlans)}</span> of{' '}
                <span className="font-medium">{totalPlans}</span> results
              </span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="ml-4 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {TBN2_PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </div>
        
        {plans.length === 0 && <div className="mt-4 text-gray-500">No plans found for your user.</div>}
      </div>
    </div>
  );
}
