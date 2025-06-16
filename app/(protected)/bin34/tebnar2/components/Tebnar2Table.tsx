'use client';

import { Tebnar2ImagePlan, Tebnar2Image } from '../types/tebnar2-types';
import { TBN2_COLUMNS, TBN2_COLUMN_SETTINGS, TBN2_PAGE_SIZE_OPTIONS } from '../constants/tebnar2-constants';
import { tbn2_formatDate, tbn2_truncateText } from '../utils/tbn2-table-functions';
import Tebnar2ImagePreview from './Tebnar2ImagePreview';

// Enhanced table styling settings - exact clone from tebnar1
const tbn2_tableStyleSettings = {
  // Table-level settings for strict layout control
  table: {
    tableLayout: 'fixed',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  
  // Row styling
  row: {
    height: '80px',
    minHeight: '80px',
    maxHeight: '80px',
    verticalAlign: 'middle',
    backgroundColor: '#ffffff',
    hoverBackgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  
  // Cell styling - Enhanced for strict overflow control
  cell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    wordBreak: 'break-word',
    wordWrap: 'break-word',
    verticalAlign: 'top',
    padding: '8px 16px',
    maxWidth: '100%',
    minWidth: '0',
    boxSizing: 'border-box',
  },
  
  // Text cell specific styling (for data columns) - Enhanced overflow control
  textCell: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#374151',
    fontWeight: 'normal',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    wordBreak: 'break-word',
  },
  
  // Preview cell specific styling (for image columns) - Enhanced overflow control
  previewCell: {
    padding: '8px',
    textAlign: 'center',
    backgroundColor: '#fafafa',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  
  // Image styling within preview cells - Strict size control
  previewImage: {
    width: '64px',
    height: '64px',
    maxWidth: '64px',
    maxHeight: '64px',
    objectFit: 'cover',
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
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  
  // Pagination styling
  pagination: {
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    padding: '12px 24px',
    fontSize: '14px',
    color: '#374151',
    overflow: 'hidden',
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
};

// TABLE BORDERS - exact clone from tebnar1
const tbn2_tableBorderSettings = {
  // Global border settings
  global: {
    borderCollapse: 'collapse',
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
          <thead 
            style={{
              backgroundColor: tbn2_tableStyleSettings.header.backgroundColor,
            }}
          >
            <tr 
              style={{
                borderBottom: tbn2_tableBorderSettings.rowBorders.headerBottom,
              }}
            >
              {tableColumns.map((col, index) => {
                const settings = TBN2_COLUMN_SETTINGS[col] || { width: 'auto', minWidth: '100px', maxWidth: 'none' };
                const paddingSettings = tbn2_tableCellPaddingSettings.columnPadding[col] || tbn2_tableCellPaddingSettings.globalDefault;
                
                return (
                  <th
                    key={col}
                    style={{
                      ...tbn2_tableStyleSettings.header,
                      width: settings.width,
                      minWidth: settings.minWidth,
                      maxWidth: settings.maxWidth,
                      textAlign: settings.textAlign || 'center',
                      padding: paddingSettings.padding,
                      paddingTop: paddingSettings.paddingTop,
                      paddingRight: paddingSettings.paddingRight,
                      paddingBottom: paddingSettings.paddingBottom,
                      paddingLeft: paddingSettings.paddingLeft,
                      border: `${tbn2_tableBorderSettings.cellBorders.defaultWidth} ${tbn2_tableBorderSettings.cellBorders.defaultStyle} ${tbn2_tableBorderSettings.cellBorders.defaultColor}`,
                      borderRight: tbn2_tableBorderSettings.columnBorders.defaultRight,
                      borderLeft: index === 0 ? tbn2_tableBorderSettings.columnBorders.firstColumnLeft : tbn2_tableBorderSettings.columnBorders.defaultLeft,
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
                  const settings = TBN2_COLUMN_SETTINGS[col] || { width: 'auto', minWidth: '100px', maxWidth: 'none', textAlign: 'left' };
                  const paddingSettings = tbn2_tableCellPaddingSettings.columnPadding[col] || tbn2_tableCellPaddingSettings.globalDefault;
                  
                  // Handle image preview columns - exact clone from tebnar1
                  if (col === 'image1-preview') {
                    const imgId = plan['fk_image1_id'];
                    const img = imgId ? imagesById[imgId] : null;
                    return (
                      <td
                        key={col}
                        style={{
                          ...tbn2_tableStyleSettings.previewCell,
                          width: settings.width,
                          minWidth: settings.minWidth,
                          maxWidth: settings.maxWidth,
                          textAlign: settings.textAlign || 'center',
                          padding: paddingSettings.padding,
                          paddingTop: paddingSettings.paddingTop,
                          paddingRight: paddingSettings.paddingRight,
                          paddingBottom: paddingSettings.paddingBottom,
                          paddingLeft: paddingSettings.paddingLeft,
                          border: `${tbn2_tableBorderSettings.cellBorders.previewCells.width} ${tbn2_tableBorderSettings.cellBorders.previewCells.style} ${tbn2_tableBorderSettings.cellBorders.previewCells.color}`,
                          borderRight: tbn2_tableBorderSettings.columnBorders.defaultRight,
                          borderLeft: colIndex === 0 ? tbn2_tableBorderSettings.columnBorders.firstColumnLeft : tbn2_tableBorderSettings.columnBorders.defaultLeft,
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
                          ...tbn2_tableStyleSettings.previewCell,
                          width: settings.width,
                          minWidth: settings.minWidth,
                          maxWidth: settings.maxWidth,
                          textAlign: settings.textAlign || 'center',
                          padding: paddingSettings.padding,
                          paddingTop: paddingSettings.paddingTop,
                          paddingRight: paddingSettings.paddingRight,
                          paddingBottom: paddingSettings.paddingBottom,
                          paddingLeft: paddingSettings.paddingLeft,
                          border: `${tbn2_tableBorderSettings.cellBorders.previewCells.width} ${tbn2_tableBorderSettings.cellBorders.previewCells.style} ${tbn2_tableBorderSettings.cellBorders.previewCells.color}`,
                          borderRight: tbn2_tableBorderSettings.columnBorders.defaultRight,
                          borderLeft: tbn2_tableBorderSettings.columnBorders.defaultLeft,
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
                          ...tbn2_tableStyleSettings.previewCell,
                          width: settings.width,
                          minWidth: settings.minWidth,
                          maxWidth: settings.maxWidth,
                          textAlign: settings.textAlign || 'center',
                          padding: paddingSettings.padding,
                          paddingTop: paddingSettings.paddingTop,
                          paddingRight: paddingSettings.paddingRight,
                          paddingBottom: paddingSettings.paddingBottom,
                          paddingLeft: paddingSettings.paddingLeft,
                          border: `${tbn2_tableBorderSettings.cellBorders.previewCells.width} ${tbn2_tableBorderSettings.cellBorders.previewCells.style} ${tbn2_tableBorderSettings.cellBorders.previewCells.color}`,
                          borderRight: tbn2_tableBorderSettings.columnBorders.defaultRight,
                          borderLeft: tbn2_tableBorderSettings.columnBorders.defaultLeft,
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
                          ...tbn2_tableStyleSettings.previewCell,
                          width: settings.width,
                          minWidth: settings.minWidth,
                          maxWidth: settings.maxWidth,
                          textAlign: settings.textAlign || 'center',
                          padding: paddingSettings.padding,
                          paddingTop: paddingSettings.paddingTop,
                          paddingRight: paddingSettings.paddingRight,
                          paddingBottom: paddingSettings.paddingBottom,
                          paddingLeft: paddingSettings.paddingLeft,
                          border: `${tbn2_tableBorderSettings.cellBorders.previewCells.width} ${tbn2_tableBorderSettings.cellBorders.previewCells.style} ${tbn2_tableBorderSettings.cellBorders.previewCells.color}`,
                          borderRight: tbn2_tableBorderSettings.columnBorders.defaultRight,
                          borderLeft: tbn2_tableBorderSettings.columnBorders.defaultLeft,
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
                          ...tbn2_tableStyleSettings.cell,
                          ...tbn2_tableStyleSettings.textCell,
                          width: settings.width,
                          minWidth: settings.minWidth,
                          maxWidth: settings.maxWidth,
                          textAlign: settings.textAlign || 'left',
                          padding: paddingSettings.padding,
                          paddingTop: paddingSettings.paddingTop,
                          paddingRight: paddingSettings.paddingRight,
                          paddingBottom: paddingSettings.paddingBottom,
                          paddingLeft: paddingSettings.paddingLeft,
                          border: `${tbn2_tableBorderSettings.cellBorders.dataCells.width} ${tbn2_tableBorderSettings.cellBorders.dataCells.style} ${tbn2_tableBorderSettings.cellBorders.dataCells.color}`,
                          borderRight: tbn2_tableBorderSettings.columnBorders.defaultRight,
                          borderLeft: colIndex === 0 ? tbn2_tableBorderSettings.columnBorders.firstColumnLeft : tbn2_tableBorderSettings.columnBorders.defaultLeft,
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