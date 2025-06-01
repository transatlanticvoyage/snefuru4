"use client";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Table columns based on schema in setup-database/route.ts
const columns = [
  'fk_image1_id',
  'fk_image2_id',
  'fk_image3_id',
  'fk_image4_id',
  'id',
  'rel_users_id',
  'rel_images_plans_batches_id',
  'created_at',
  'e_zpf_img_code',
  'e_width',
  'e_height',
  'e_associated_content1',
  'e_file_name1',
  'e_more_instructions1',
  'e_prompt1',
  'e_ai_tool1',
];

const gridCols = 9; // A-I
const gridRows = 11;
const colHeaders = Array.from({ length: gridCols }, (_, i) => String.fromCharCode(65 + i)); // ['A',...,'I']

function ExcelPasteGrid({ onGridDataChange }: { onGridDataChange?: (grid: string[][]) => void }) {
  const [grid, setGrid] = useState<string[][]>(Array.from({ length: gridRows }, () => Array(gridCols).fill('')));
  const [selected, setSelected] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const gridRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (onGridDataChange) onGridDataChange(grid);
  }, [grid, onGridDataChange]);

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    setSelected({ row, col });
  };

  // Handle cell change
  const handleCellChange = (row: number, col: number, value: string) => {
    setGrid(prev => {
      const newGrid = prev.map(rowArr => [...rowArr]);
      newGrid[row][col] = value;
      return newGrid;
    });
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const rows = text.split(/\r?\n/).filter(Boolean);
    const newGrid = grid.map(row => [...row]);
    rows.forEach((rowStr, i) => {
      const cells = rowStr.split(/\t/);
      cells.forEach((cell, j) => {
        const r = selected.row + i;
        const c = selected.col + j;
        if (r < gridRows && c < gridCols) {
          newGrid[r][c] = cell;
        }
      });
    });
    setGrid(newGrid);
  };

  return (
    <div className="mb-8">
      <div className="font-bold mb-2">kzelement6</div>
      <div className="overflow-x-auto">
        <table
          ref={gridRef}
          className="border border-gray-300"
          tabIndex={0}
          onPaste={handlePaste}
        >
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 w-8"></th>
              {colHeaders.map((col, idx) => (
                <th key={col} className="border border-gray-300 bg-gray-100 w-16 text-center">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: gridRows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                <th className="border border-gray-300 bg-gray-100 text-center">{rowIdx + 1}</th>
                {Array.from({ length: gridCols }).map((_, colIdx) => (
                  <td
                    key={colIdx}
                    className={`border border-gray-300 w-16 h-8 text-center cursor-pointer ${selected.row === rowIdx && selected.col === colIdx ? 'bg-blue-100' : ''}`}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                  >
                    <input
                      type="text"
                      value={grid[rowIdx][colIdx]}
                      onChange={e => handleCellChange(rowIdx, colIdx, e.target.value)}
                      className="w-full h-full text-center bg-transparent outline-none"
                      style={{ minWidth: 0 }}
                      onFocus={() => handleCellClick(rowIdx, colIdx)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs text-gray-500 mt-2">Click a cell to edit, or paste (Ctrl+V or Cmd+V) from Excel or Google Sheets. Data will fill from the selected cell.</div>
      </div>
    </div>
  );
}

export default function Tebnar1() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gridData, setGridData] = useState<string[][]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [qtyPerPlan, setQtyPerPlan] = useState<number>(1);
  const [aiModel, setAiModel] = useState<string>('openai');
  const [makeImagesLoading, setMakeImagesLoading] = useState(false);
  const [makeImagesResult, setMakeImagesResult] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [5, 10, 20, 50, 100];
  // New: images lookup
  const [imagesById, setImagesById] = useState<Record<string, any>>({});
  const [generateZip, setGenerateZip] = useState(false);
  const [wipeMeta, setWipeMeta] = useState(false);

  // Fetch all images for the user and map by id
  useEffect(() => {
    const fetchImages = async () => {
      if (!user?.id) {
        setImagesById({});
        return;
      }
      // Get user's DB id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      if (userError || !userData) {
        setImagesById({});
        return;
      }
      // Fetch all images for this user
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('rel_users_id', userData.id);
      if (error) {
        setImagesById({});
        return;
      }
      const map: Record<string, any> = {};
      (data || []).forEach(img => { if (img.id) map[img.id] = img; });
      setImagesById(map);
    };
    fetchImages();
  }, [user, supabase]);

  // Fetch batches for dropdown
  useEffect(() => {
    const fetchBatches = async () => {
      if (!user?.id) {
        setBatches([]);
        return;
      }
      // Get user's DB id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      if (userError || !userData) {
        setBatches([]);
        return;
      }
      // Fetch images_plans_batches for this user
      const { data, error } = await supabase
        .from('images_plans_batches')
        .select('*')
        .eq('rel_users_id', userData.id)
        .order('created_at', { ascending: false });
      if (error) {
        setBatches([]);
        return;
      }
      setBatches(data || []);
    };
    fetchBatches();
  }, [user, supabase]);

  // Helper to refresh batches and select a batch by id
  const refreshBatchesAndSelect = async (batchId: string) => {
    if (!user?.id) return;
    // Get user's DB id from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();
    if (userError || !userData) return;
    // Fetch images_plans_batches for this user
    const { data, error } = await supabase
      .from('images_plans_batches')
      .select('*')
      .eq('rel_users_id', userData.id)
      .order('created_at', { ascending: false });
    if (error) return;
    setBatches(data || []);
    // Only set selectedBatchId if the batch is present
    if (data && data.some((b: any) => b.id === batchId)) {
      setSelectedBatchId(batchId);
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user?.id) {
          setPlans([]);
          setLoading(false);
          return;
        }
        // Get user's DB id from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        if (userError || !userData) {
          setError('Could not find user record.');
          setPlans([]);
          setLoading(false);
          return;
        }
        // Fetch images_plans for this user
        const { data, error } = await supabase
          .from('images_plans')
          .select('*')
          .eq('rel_users_id', userData.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setPlans(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch plans');
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [user, supabase]);

  // Filter plans by selected batch
  const filteredPlans = selectedBatchId
    ? plans.filter(plan => plan.rel_images_plans_batches_id === selectedBatchId)
    : plans;

  // Pagination calculations
  const totalItems = filteredPlans.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = filteredPlans.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setSubmitResult(null);
    try {
      if (!user?.id) throw new Error('User not authenticated');
      if (!gridData || gridData.length < 2) throw new Error('No data to submit');
      const fieldNames = gridData[0].map(f => f.trim()).filter(Boolean);
      const rows = gridData.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
      if (fieldNames.length === 0 || rows.length === 0) throw new Error('Grid is empty or missing headers');
      // Map each row to an object
      const records = rows.map(row => {
        const obj: Record<string, string> = {};
        fieldNames.forEach((field, idx) => {
          if (field) obj[field] = row[idx] ?? '';
        });
        return obj;
      });
      // Import client function
      const { func_create_plans_from_xls_1 } = await import('../utils/cfunc_create_plans_from_xls_1');
      const result = await func_create_plans_from_xls_1(records);
      setSubmitResult(result?.message || (result?.success ? 'Success' : 'Failed'));
    } catch (err) {
      setSubmitResult(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  // For uitablegrid21, build columns with preview columns after each fk_imageX_id
  const tableColumns = [
    'fk_image1_id', 'image1-preview',
    'fk_image2_id', 'image2-preview',
    'fk_image3_id', 'image3-preview',
    'fk_image4_id', 'image4-preview',
    ...columns.slice(4),
  ];

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="w-full max-w-[95vw] mx-auto">
      {/* Black bar with batch dropdown, only on tebnar1 */}
      <div className="sticky top-0 w-full h-10 bg-black z-30 flex items-center px-4 text-white space-x-4">
        <span>rel_images_plans_batches_id</span>
        <select
          value={selectedBatchId}
          onChange={e => setSelectedBatchId(e.target.value)}
          className={`h-7 px-2 rounded text-black ${selectedBatchId ? 'bg-teal-200' : 'bg-white'}`}
          style={{ minWidth: 120 }}
        >
          <option value="">All Batches ({batches.length})</option>
          {batches.map(batch => (
            <option key={batch.id} value={batch.id}>{batch.id}</option>
          ))}
        </select>
      </div>
      <div>
        <ExcelPasteGrid onGridDataChange={setGridData} />
        {/* OPTION 1: Submit func_create_plans_from_xls_1 button */}
        <div className="my-4">
          <div className="font-bold mb-1">Option 1</div>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            onClick={handleSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? 'Submitting...' : 'Submit func_create_plans_from_xls_1'}
          </button>
          {submitResult && <div className="mt-2 text-sm text-gray-700">{submitResult}</div>}
        </div>
        {/* OPTION 2: QTY selector and Submit func_create_plans_make_images_1 button */}
        <div className="mb-4">
          <div className="font-bold mb-2">Option 2</div>
          <div className="font-bold mb-2">QTY Of Images Per Plan To Generate</div>
          <div className="flex space-x-2 mb-2">
            {[1, 2, 3, 4].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setQtyPerPlan(opt)}
                className={`px-4 py-2 rounded-full border font-bold transition-colors duration-150 ${qtyPerPlan === opt ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-indigo-100'}`}
              >
                {opt}
              </button>
            ))}
          </div>
          {/* AI Model Selector */}
          <div className="font-bold mb-2">Select AI Model To Use</div>
          <div className="flex space-x-2 mb-2">
            {['openai', 'grok', 'gemini'].map(model => (
              <button
                key={model}
                type="button"
                onClick={() => setAiModel(model)}
                className={`px-4 py-2 rounded-full border font-bold transition-colors duration-150 capitalize ${aiModel === model ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-teal-100'}`}
              >
                {model}
              </button>
            ))}
          </div>
          {/* Generate Zip Checkbox */}
          <div className="flex items-center mb-2">
            <input
              id="generate-zip"
              type="checkbox"
              checked={generateZip}
              onChange={e => setGenerateZip(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="generate-zip" className="text-sm font-medium">Generate .zip file inside the main folder</label>
          </div>
          {/* Wipe Meta Checkbox */}
          <div className="flex items-center mb-2">
            <input
              id="wipe-meta"
              type="checkbox"
              checked={wipeMeta}
              onChange={e => setWipeMeta(e.target.checked)}
              className="mr-2"
              disabled={!generateZip}
            />
            <label htmlFor="wipe-meta" className="text-sm font-medium">Wipe all meta data from images</label>
          </div>
          <button
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
            onClick={async () => {
              setMakeImagesLoading(true);
              setMakeImagesResult(null);
              try {
                if (!user?.id) throw new Error('User not authenticated');
                if (!gridData || gridData.length < 2) throw new Error('No data to submit');
                const fieldNames = gridData[0].map(f => f.trim()).filter(Boolean);
                const rows = gridData.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
                if (fieldNames.length === 0 || rows.length === 0) throw new Error('Grid is empty or missing headers');
                const records = rows.map(row => {
                  const obj: Record<string, string> = {};
                  fieldNames.forEach((field, idx) => {
                    if (field) obj[field] = row[idx] ?? '';
                  });
                  return obj;
                });
                const { func_create_plans_make_images_1 } = await import('../utils/cfunc_create_plans_make_images_1');
                const result = await func_create_plans_make_images_1({ records, qty: qtyPerPlan, aiModel, generateZip, wipeMeta });
                setMakeImagesResult(result?.message || (result?.success ? 'Success' : 'Failed'));
                if (result?.batch_id) {
                  await refreshBatchesAndSelect(result.batch_id);
                }
              } catch (err) {
                setMakeImagesResult(err instanceof Error ? err.message : String(err));
              } finally {
                setMakeImagesLoading(false);
              }
            }}
            disabled={makeImagesLoading}
          >
            {makeImagesLoading ? 'Submitting...' : 'Submit func_create_plans_make_images_1'}
          </button>
          {makeImagesResult && <div className="mt-2 text-sm text-gray-700">{makeImagesResult}</div>}
        </div>
        {/* uitablegrid21 label */}
        <div className="font-bold mb-2">uitablegrid21</div>
        <div className="overflow-x-auto w-full">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {tableColumns.map(col => (
                  <th
                    key={col}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col.startsWith('image') ? 'Preview' : col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map(plan => (
                <tr key={plan.id}>
                  {tableColumns.map(col => {
                    if (col === 'image1-preview') {
                      const imgId = plan['fk_image1_id'];
                      const img = imgId ? imagesById[imgId] : null;
                      return (
                        <td key={col} className="px-2 py-2 h-[80px] max-h-[80px] align-middle text-center">
                          {img && img.img_file_url1 ? (
                            <img src={img.img_file_url1} alt="Preview" className="h-16 w-16 object-cover mx-auto" />
                          ) : (
                            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">No Image</div>
                          )}
                        </td>
                      );
                    }
                    if (col === 'image2-preview') {
                      const imgId = plan['fk_image2_id'];
                      const img = imgId ? imagesById[imgId] : null;
                      return (
                        <td key={col} className="px-2 py-2 h-[80px] max-h-[80px] align-middle text-center">
                          {img && img.img_file_url1 ? (
                            <img src={img.img_file_url1} alt="Preview" className="h-16 w-16 object-cover mx-auto" />
                          ) : (
                            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">No Image</div>
                          )}
                        </td>
                      );
                    }
                    if (col === 'image3-preview') {
                      const imgId = plan['fk_image3_id'];
                      const img = imgId ? imagesById[imgId] : null;
                      return (
                        <td key={col} className="px-2 py-2 h-[80px] max-h-[80px] align-middle text-center">
                          {img && img.img_file_url1 ? (
                            <img src={img.img_file_url1} alt="Preview" className="h-16 w-16 object-cover mx-auto" />
                          ) : (
                            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">No Image</div>
                          )}
                        </td>
                      );
                    }
                    if (col === 'image4-preview') {
                      const imgId = plan['fk_image4_id'];
                      const img = imgId ? imagesById[imgId] : null;
                      return (
                        <td key={col} className="px-2 py-2 h-[80px] max-h-[80px] align-middle text-center">
                          {img && img.img_file_url1 ? (
                            <img src={img.img_file_url1} alt="Preview" className="h-16 w-16 object-cover mx-auto" />
                          ) : (
                            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">No Image</div>
                          )}
                        </td>
                      );
                    }
                    // Default: show value for non-preview columns
                    return (
                      <td
                        key={col}
                        className="px-4 py-2 h-[80px] max-h-[80px] overflow-hidden align-middle whitespace-nowrap"
                      >
                        {String(plan[col] ?? '')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{endIndex}</span> of{' '}
                <span className="font-medium">{totalItems}</span> results
              </span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="ml-4 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
          
          {filteredPlans.length === 0 && <div className="mt-4 text-gray-500">No plans found for your user.</div>}
        </div>
      </div>
    </div>
  );
} 