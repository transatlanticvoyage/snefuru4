'use client';

import { Tebnar2ImagePlan, Tebnar2Image } from '../types/tebnar2-types';
import { TBN2_COLUMNS, TBN2_COLUMN_SETTINGS, TBN2_PAGE_SIZE_OPTIONS } from '../constants/tebnar2-constants';
import Tebnar2Columns from './Tebnar2Columns';
import Tebnar2ImagePreview from './Tebnar2ImagePreview';

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

  // Helper function to format date
  const tbn2_formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to truncate text
  const tbn2_truncateText = (text: string | null, maxLength: number = 30) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="w-full">
      {/* Pagination Controls - Top */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">
            Showing {plans.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, totalPlans)} of {totalPlans} plans
          </span>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {TBN2_PAGE_SIZE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <span className="text-sm text-gray-700">per page</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded text-sm"
          >
            Next
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="w-full overflow-auto border border-gray-200">
        <table className="w-full border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="bg-amber-100 sticky top-0 z-10">
              {/* Regular columns */}
              {TBN2_COLUMNS.map(col => {
                const settings = TBN2_COLUMN_SETTINGS[col] || { width: 'auto', minWidth: 'auto', maxWidth: 'auto' };
                return (
                  <th
                    key={col}
                    style={{
                      width: settings.width,
                      minWidth: settings.minWidth,
                      maxWidth: settings.maxWidth,
                      textAlign: settings.textAlign || 'center',
                    }}
                    className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-900 bg-amber-100"
                  >
                    {col}
                  </th>
                );
              })}
              
              {/* Image preview columns */}
              {[1, 2, 3, 4].map(num => (
                <th
                  key={`image${num}-preview`}
                  style={{
                    width: '120px',
                    minWidth: '100px',
                    maxWidth: '150px',
                  }}
                  className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-900 bg-amber-100 text-center"
                >
                  image{num}-preview
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td 
                  colSpan={TBN2_COLUMNS.length + 4} 
                  className="text-center py-8 text-gray-500"
                >
                  No plans found
                </td>
              </tr>
            ) : (
              plans.map((plan, index) => (
                <tr key={plan.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {/* Regular data columns */}
                  {TBN2_COLUMNS.map(col => {
                    const settings = TBN2_COLUMN_SETTINGS[col] || { width: 'auto', minWidth: 'auto', maxWidth: 'auto' };
                    let cellValue: any = plan[col as keyof Tebnar2ImagePlan];
                    
                    // Format specific columns
                    if (col === 'created_at' && cellValue) {
                      cellValue = tbn2_formatDate(cellValue);
                    } else if (typeof cellValue === 'string' && cellValue.length > 30) {
                      cellValue = tbn2_truncateText(cellValue, 30);
                    }

                    return (
                      <td
                        key={col}
                        style={{
                          width: settings.width,
                          minWidth: settings.minWidth,
                          maxWidth: settings.maxWidth,
                          textAlign: settings.textAlign || 'left',
                        }}
                        className="border border-gray-300 px-2 py-2 text-xs"
                      >
                        {cellValue || ''}
                      </td>
                    );
                  })}
                  
                  {/* Image preview columns */}
                  {[1, 2, 3, 4].map(num => {
                    const imageIdField = `fk_image${num}_id` as keyof Tebnar2ImagePlan;
                    const imageId = plan[imageIdField] as string;
                    const image = imageId ? imagesById[imageId] : null;
                    
                    return (
                      <td
                        key={`image${num}-preview`}
                        style={{
                          width: '120px',
                          minWidth: '100px',
                          maxWidth: '150px',
                        }}
                        className="border border-gray-300 px-1 py-1 text-center"
                      >
                        <Tebnar2ImagePreview
                          image={image}
                          imageId={imageId}
                          plan={plan}
                          imageNumber={num}
                          fetchingImages={fetchingImages}
                          lastClickTime={lastClickTime}
                          onRefreshImages={onRefreshImages}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Bottom */}
      <div className="flex items-center justify-center p-4 bg-gray-50 border-t">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded text-sm"
          >
            First
          </button>
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded text-sm"
          >
            Previous
          </button>
          
          {/* Page numbers */}
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 rounded text-sm ${
                  pageNum === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded text-sm"
          >
            Next
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded text-sm"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}