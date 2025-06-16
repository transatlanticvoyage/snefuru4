'use client';

import { Tebnar2ImagePlan, Tebnar2Image } from '../types/tebnar2-types';
import { TBN2_COLUMNS, TBN2_COLUMN_SETTINGS, TBN2_PAGE_SIZE_OPTIONS } from '../constants/tebnar2-constants';
import { tbn2_formatDate, tbn2_truncateText } from '../utils/tbn2-table-functions';
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
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {tableColumns.map((col, index) => {
                const settings = TBN2_COLUMN_SETTINGS[col] || { width: 'auto', minWidth: '100px', maxWidth: 'none' };
                return (
                  <th
                    key={col}
                    style={{
                      width: settings.width,
                      minWidth: settings.minWidth,
                      maxWidth: settings.maxWidth,
                      textAlign: settings.textAlign || 'center',
                    }}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col.startsWith('image') ? 'Preview' : col}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.map(plan => (
              <tr key={plan.id} className="hover:bg-gray-50">
                {tableColumns.map(col => {
                  const settings = TBN2_COLUMN_SETTINGS[col] || { width: 'auto', minWidth: '100px', maxWidth: 'none', textAlign: 'left' };
                  
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
                        }}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
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
                        }}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
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
                        }}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
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
                        }}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
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
                        }}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
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
        <div className="px-6 py-3 border-t border-gray-200 bg-white">
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