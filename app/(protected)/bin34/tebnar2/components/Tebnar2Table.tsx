'use client';

import { Tebnar2ImagePlan, Tebnar2Image } from '../types/tebnar2-types';
import { TBN2_COLUMNS, TBN2_COLUMN_SETTINGS, TBN2_PAGE_SIZE_OPTIONS } from '../constants/tebnar2-constants';
import { tbn2_formatDate, tbn2_truncateText } from '../utils/tbn2-table-functions';
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
    whiteSpace: 'nowrap' as const,
    wordBreak: 'break-word' as const,
    boxSizing: 'border-box' as const,
  },
  
  headerText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
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
  },
  
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
  onRefreshImages
}: Tebnar2TableProps) {

  // For uitablegrid21, build columns with preview columns after each fk_imageX_id - exact clone from tebnar1
  const tableColumns = [
    'int1', 'fk_image1_id', 'image1-preview',
    'int2', 'fk_image2_id', 'image2-preview',
    'int3', 'fk_image3_id', 'image3-preview',
    'int4', 'fk_image4_id', 'image4-preview',
    ...TBN2_COLUMNS.slice(8), // Skip the first 8 columns (int1-4, fk_image1-4) since we've already included them above
  ];

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
      
      {/* Column Templates Button Bar - exact clone from tebnar1 */}
      <div className="mb-4 flex border border-gray-300 rounded overflow-hidden">
        <div className="flex-shrink-0 bg-gray-100 border-r border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 flex items-center h-[34px]">
          COLUMN TEMPLATES
        </div>
        <button className="flex-1 bg-white hover:bg-gray-50 border-r border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-center h-[34px] transition-colors">
          All Columns
        </button>
        <button className="flex-1 bg-white hover:bg-gray-50 border-r border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-center h-[34px] transition-colors">
          ColTemp1
        </button>
        <button className="flex-1 bg-white hover:bg-gray-50 border-r border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-center h-[34px] transition-colors">
          ColTemp2
        </button>
        <button className="flex-1 bg-white hover:bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-center h-[34px] transition-colors">
          ColTemp3
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
              {tableColumns.map((col, index) => {
                // Get width settings - headerCellWidths takes precedence over columnSettings
                const widthSettings = tbn2_headerCustomizationSettings.headerCellWidths[col] || 
                                    tbn2_columnSettings[col] || 
                                    { width: 'auto', minWidth: '100px', maxWidth: 'none' };
                
                // Get text alignment - headerTextAlign takes precedence
                const textAlign = tbn2_headerCustomizationSettings.headerTextAlign[col] || 
                                tbn2_headerCustomizationSettings.headerCell.textAlign;
                
                // Get padding settings - tableCellPaddingSettings takes precedence
                const paddingSettings = tbn2_tableCellPaddingSettings.rowTypePadding.headerRow;
                
                // Get border settings - tableBorderSettings takes precedence
                const borderSettings = tbn2_tableBorderSettings.headerBorders.enabled ? {
                  borderRight: index < tableColumns.length - 1 ? 
                             tbn2_tableBorderSettings.headerBorders.cellBorderRight : 
                             tbn2_tableBorderSettings.headerBorders.lastHeaderCellRight,
                  borderLeft: tbn2_tableBorderSettings.headerBorders.cellBorderLeft,
                  borderTop: tbn2_tableBorderSettings.headerBorders.cellBorderTop,
                  borderBottom: tbn2_tableBorderSettings.headerBorders.cellBorderBottom,
                } : {
                  borderRight: tbn2_headerCustomizationSettings.headerBorders.cellBorderRight,
                  borderLeft: tbn2_headerCustomizationSettings.headerBorders.cellBorderLeft,
                  borderTop: tbn2_headerCustomizationSettings.headerBorders.topBorder,
                  borderBottom: tbn2_headerCustomizationSettings.headerBorders.bottomBorder,
                };
                
                return (
                  <th
                    key={col}
                    style={{
                      // Width and sizing
                      width: widthSettings.width,
                      minWidth: widthSettings.minWidth,
                      maxWidth: widthSettings.maxWidth,
                      height: tbn2_headerCustomizationSettings.headerRow.height,
                      
                      // Cell styling
                      padding: paddingSettings.padding,
                      verticalAlign: tbn2_headerCustomizationSettings.headerCell.verticalAlign,
                      textAlign: textAlign,
                      backgroundColor: tbn2_headerCustomizationSettings.headerCell.backgroundColor,
                      overflow: tbn2_headerCustomizationSettings.headerCell.overflow,
                      textOverflow: tbn2_headerCustomizationSettings.headerCell.textOverflow,
                      whiteSpace: tbn2_headerCustomizationSettings.headerCell.whiteSpace,
                      wordBreak: tbn2_headerCustomizationSettings.headerCell.wordBreak,
                      boxSizing: tbn2_headerCustomizationSettings.headerCell.boxSizing,
                      
                      // Text styling
                      fontSize: tbn2_headerCustomizationSettings.headerText.fontSize,
                      fontWeight: tbn2_headerCustomizationSettings.headerText.fontWeight,
                      color: tbn2_headerCustomizationSettings.headerText.color,
                      textTransform: tbn2_headerCustomizationSettings.headerText.textTransform,
                      letterSpacing: tbn2_headerCustomizationSettings.headerText.letterSpacing,
                      lineHeight: tbn2_headerCustomizationSettings.headerText.lineHeight,
                      fontFamily: tbn2_headerCustomizationSettings.headerText.fontFamily,
                      
                      // Borders
                      borderRight: borderSettings.borderRight,
                      borderLeft: borderSettings.borderLeft,
                      borderTop: borderSettings.borderTop,
                      borderBottom: borderSettings.borderBottom,
                      borderRadius: tbn2_headerCustomizationSettings.headerBorders.borderRadius,
                    }}
                    onMouseEnter={(e) => {
                      if (tbn2_headerCustomizationSettings.headerHover.enabled) {
                        e.currentTarget.style.backgroundColor = tbn2_headerCustomizationSettings.headerHover.backgroundColor;
                        e.currentTarget.style.color = tbn2_headerCustomizationSettings.headerHover.color;
                        e.currentTarget.style.borderColor = tbn2_headerCustomizationSettings.headerHover.borderColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (tbn2_headerCustomizationSettings.headerHover.enabled) {
                        e.currentTarget.style.backgroundColor = tbn2_headerCustomizationSettings.headerCell.backgroundColor;
                        e.currentTarget.style.color = tbn2_headerCustomizationSettings.headerText.color;
                        e.currentTarget.style.borderColor = tbn2_headerCustomizationSettings.headerBorders.cellBorderRight.split(' ')[2] || 'transparent';
                      }
                    }}
                  >
                    {col.startsWith('image') ? 'Preview' : col}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody 
            style={{
              backgroundColor: tbn2_tableStyleSettings.row.backgroundColor,
            }}
          >
            {plans.map((plan, rowIndex) => (
              <tr 
                key={plan.id} 
                style={{
                  ...tbn2_tableStyleSettings.row,
                  borderBottom: tbn2_tableBorderSettings.rowBorders.dataRowBottom,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = tbn2_tableStyleSettings.row.hoverBackgroundColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = tbn2_tableStyleSettings.row.backgroundColor;
                }}
              >
                {tableColumns.map((col, colIndex) => {
                  const settings = tbn2_columnSettings[col] || { width: 'auto', minWidth: '100px', maxWidth: 'none', textAlign: 'left' };
                  
                  // Get padding settings for this column
                  const columnPadding = tbn2_tableCellPaddingSettings.columnPadding[col] || tbn2_tableCellPaddingSettings.globalDefault;
                  
                  // Get border settings for this column
                  const columnBorder = tbn2_tableBorderSettings.columnBorders.enabled ? {
                    right: tbn2_tableBorderSettings.columnBorders.defaultRight,
                    left: tbn2_tableBorderSettings.columnBorders.defaultLeft,
                  } : { right: '0px', left: '0px' };
                  
                  // Handle image preview columns - exact clone from tebnar1
                  if (col === 'image1-preview') {
                    const imgId = plan['fk_image1_id'];
                    const img = imgId ? imagesById[imgId] : null;
                    return (
                      <td
                        key={col}
                        style={{
                          width: settings.width,
                          minWidth: settings.minWidth,
                          maxWidth: settings.maxWidth,
                          textAlign: settings.textAlign || 'center',
                          height: tbn2_tableStyleSettings.row.height,
                          padding: columnPadding.padding,
                          backgroundColor: tbn2_tableStyleSettings.previewCell.backgroundColor,
                          verticalAlign: tbn2_tableStyleSettings.cell.verticalAlign,
                          overflow: tbn2_tableStyleSettings.cell.overflow,
                          borderRight: tbn2_tableBorderSettings.columnBorders.enabled ? columnBorder.right : '0px',
                          borderLeft: tbn2_tableBorderSettings.columnBorders.enabled ? columnBorder.left : '0px',
                          borderBottom: tbn2_tableBorderSettings.rowBorders.enabled ? tbn2_tableBorderSettings.rowBorders.dataRowBottom : '0px',
                        }}
                      >
                        <Tebnar2ImagePreview
                          image={img}
                          imageId={imgId}
                          plan={plan}
                          imageNumber={1}
                          fetchingImages={fetchingImages}
                          lastClickTime={lastClickTime}
                          onRefreshImages={onRefreshImages}
                        />
                      </td>
                    );
                  }
                  if (col === 'image2-preview') {
                    const imgId = plan['fk_image2_id'];
                    const img = imgId ? imagesById[imgId] : null;
                    return (
                      <td
                        key={col}
                        style={{
                          width: settings.width,
                          minWidth: settings.minWidth,
                          maxWidth: settings.maxWidth,
                          textAlign: settings.textAlign || 'center',
                          height: tbn2_tableStyleSettings.row.height,
                          padding: columnPadding.padding,
                          backgroundColor: tbn2_tableStyleSettings.previewCell.backgroundColor,
                          verticalAlign: tbn2_tableStyleSettings.cell.verticalAlign,
                          overflow: tbn2_tableStyleSettings.cell.overflow,
                          borderRight: tbn2_tableBorderSettings.columnBorders.enabled ? columnBorder.right : '0px',
                          borderLeft: tbn2_tableBorderSettings.columnBorders.enabled ? columnBorder.left : '0px',
                          borderBottom: tbn2_tableBorderSettings.rowBorders.enabled ? tbn2_tableBorderSettings.rowBorders.dataRowBottom : '0px',
                        }}
                      >
                        <Tebnar2ImagePreview
                          image={img}
                          imageId={imgId}
                          plan={plan}
                          imageNumber={2}
                          fetchingImages={fetchingImages}
                          lastClickTime={lastClickTime}
                          onRefreshImages={onRefreshImages}
                        />
                      </td>
                    );
                  }
                  if (col === 'image3-preview') {
                    const imgId = plan['fk_image3_id'];
                    const img = imgId ? imagesById[imgId] : null;
                    return (
                      <td
                        key={col}
                        style={{
                          width: settings.width,
                          minWidth: settings.minWidth,
                          maxWidth: settings.maxWidth,
                          textAlign: settings.textAlign || 'center',
                          height: tbn2_tableStyleSettings.row.height,
                          padding: columnPadding.padding,
                          backgroundColor: tbn2_tableStyleSettings.previewCell.backgroundColor,
                          verticalAlign: tbn2_tableStyleSettings.cell.verticalAlign,
                          overflow: tbn2_tableStyleSettings.cell.overflow,
                          borderRight: tbn2_tableBorderSettings.columnBorders.enabled ? columnBorder.right : '0px',
                          borderLeft: tbn2_tableBorderSettings.columnBorders.enabled ? columnBorder.left : '0px',
                          borderBottom: tbn2_tableBorderSettings.rowBorders.enabled ? tbn2_tableBorderSettings.rowBorders.dataRowBottom : '0px',
                        }}
                      >
                        <Tebnar2ImagePreview
                          image={img}
                          imageId={imgId}
                          plan={plan}
                          imageNumber={3}
                          fetchingImages={fetchingImages}
                          lastClickTime={lastClickTime}
                          onRefreshImages={onRefreshImages}
                        />
                      </td>
                    );
                  }
                  if (col === 'image4-preview') {
                    const imgId = plan['fk_image4_id'];
                    const img = imgId ? imagesById[imgId] : null;
                    return (
                      <td
                        key={col}
                        style={{
                          width: settings.width,
                          minWidth: settings.minWidth,
                          maxWidth: settings.maxWidth,
                          textAlign: settings.textAlign || 'center',
                          height: tbn2_tableStyleSettings.row.height,
                          padding: columnPadding.padding,
                          backgroundColor: tbn2_tableStyleSettings.previewCell.backgroundColor,
                          verticalAlign: tbn2_tableStyleSettings.cell.verticalAlign,
                          overflow: tbn2_tableStyleSettings.cell.overflow,
                          borderRight: tbn2_tableBorderSettings.columnBorders.enabled ? columnBorder.right : '0px',
                          borderLeft: tbn2_tableBorderSettings.columnBorders.enabled ? columnBorder.left : '0px',
                          borderBottom: tbn2_tableBorderSettings.rowBorders.enabled ? tbn2_tableBorderSettings.rowBorders.dataRowBottom : '0px',
                        }}
                      >
                        <Tebnar2ImagePreview
                          image={img}
                          imageId={imgId}
                          plan={plan}
                          imageNumber={4}
                          fetchingImages={fetchingImages}
                          lastClickTime={lastClickTime}
                          onRefreshImages={onRefreshImages}
                        />
                      </td>
                    );
                  } else {
                    // Regular data cell - exact clone from tebnar1
                    return (
                      <td
                        key={col}
                        style={{
                          width: settings.width,
                          minWidth: settings.minWidth,
                          maxWidth: settings.maxWidth,
                          textAlign: settings.textAlign || 'left',
                          height: tbn2_tableStyleSettings.row.height,
                          padding: columnPadding.padding,
                          backgroundColor: tbn2_tableStyleSettings.row.backgroundColor,
                          verticalAlign: tbn2_tableStyleSettings.cell.verticalAlign,
                          overflow: tbn2_tableStyleSettings.cell.overflow,
                          textOverflow: tbn2_tableStyleSettings.textCell.textOverflow,
                          whiteSpace: tbn2_tableStyleSettings.textCell.whiteSpace,
                          fontSize: tbn2_tableStyleSettings.textCell.fontSize,
                          lineHeight: tbn2_tableStyleSettings.textCell.lineHeight,
                          color: tbn2_tableStyleSettings.textCell.color,
                          fontWeight: tbn2_tableStyleSettings.textCell.fontWeight,
                          borderRight: tbn2_tableBorderSettings.columnBorders.enabled ? columnBorder.right : '0px',
                          borderLeft: tbn2_tableBorderSettings.columnBorders.enabled ? columnBorder.left : '0px',
                          borderBottom: tbn2_tableBorderSettings.rowBorders.enabled ? tbn2_tableBorderSettings.rowBorders.dataRowBottom : '0px',
                        }}
                      >
                        {String(plan[col as keyof typeof plan] ?? '')}
                      </td>
                    );
                  }
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