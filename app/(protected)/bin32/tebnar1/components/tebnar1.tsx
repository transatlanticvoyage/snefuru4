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

// Column width and styling settings
const columnSettings: Record<string, { width: string; minWidth: string; maxWidth: string; textAlign?: 'left' | 'center' | 'right' }> = {
  // Image ID columns (compact)
  fk_image1_id: { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  fk_image2_id: { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  fk_image3_id: { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  fk_image4_id: { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  
  // Preview columns (fixed size for images)
  'image1-preview': { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  'image2-preview': { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  'image3-preview': { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  'image4-preview': { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  
  // ID and relationship columns
  id: { width: '200px', minWidth: '150px', maxWidth: '250px', textAlign: 'left' },
  rel_users_id: { width: '150px', minWidth: '120px', maxWidth: '200px', textAlign: 'center' },
  rel_images_plans_batches_id: { width: '150px', minWidth: '120px', maxWidth: '200px', textAlign: 'center' },
  
  // Date column
  created_at: { width: '160px', minWidth: '140px', maxWidth: '200px', textAlign: 'center' },
  
  // Content columns (wider for text)
  e_zpf_img_code: { width: '120px', minWidth: '100px', maxWidth: '150px', textAlign: 'left' },
  e_width: { width: '80px', minWidth: '60px', maxWidth: '100px', textAlign: 'center' },
  e_height: { width: '80px', minWidth: '60px', maxWidth: '100px', textAlign: 'center' },
  e_associated_content1: { width: '200px', minWidth: '150px', maxWidth: '300px', textAlign: 'left' },
  e_file_name1: { width: '200px', minWidth: '150px', maxWidth: '300px', textAlign: 'left' },
  e_more_instructions1: { width: '250px', minWidth: '200px', maxWidth: '400px', textAlign: 'left' },
  e_prompt1: { width: '300px', minWidth: '200px', maxWidth: '500px', textAlign: 'left' },
  e_ai_tool1: { width: '120px', minWidth: '100px', maxWidth: '150px', textAlign: 'center' },
};

// Row settings
const rowSettings = {
  height: '80px',
  minHeight: '80px',
  maxHeight: '80px',
};

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
    <div className="mb-8 w-full">
      <div className="font-bold mb-2">kzelement6</div>
      <div className="w-full">
        <table
          ref={gridRef}
          className="border border-gray-300 w-full"
          tabIndex={0}
          onPaste={handlePaste}
        >
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 w-12 text-center">Row</th>
              {colHeaders.map((col, idx) => (
                <th key={col} className="border border-gray-300 bg-gray-100 min-w-[120px] text-center">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: gridRows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                <th className="border border-gray-300 bg-gray-100 text-center w-12">{rowIdx + 1}</th>
                {Array.from({ length: gridCols }).map((_, colIdx) => (
                  <td
                    key={colIdx}
                    className={`border border-gray-300 min-w-[120px] h-10 cursor-pointer ${selected.row === rowIdx && selected.col === colIdx ? 'bg-blue-100' : ''}`}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                  >
                    <input
                      type="text"
                      value={grid[rowIdx][colIdx]}
                      onChange={e => handleCellChange(rowIdx, colIdx, e.target.value)}
                      className="w-full h-full px-2 bg-transparent outline-none border-none"
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
  const [throttle1, setThrottle1] = useState({
    enabled: false,
    delayBetweenImages: 3000, // milliseconds, default 3 seconds
    delayBetweenPlans: 1000,  // milliseconds, default 1 second
  });
  const [fetchingImages, setFetchingImages] = useState<Set<string>>(new Set()); // Track which images are being fetched

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
      const result = await func_create_plans_from_xls_1(records, gridData);
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

  // Helper function to determine if "fetch now" button should be shown
  const shouldShowFetchButton = (plan: any, imageSlot: number): boolean => {
    if (!plan) return false;
    
    // Check if this specific image slot already has an image
    const imageFieldName = `fk_image${imageSlot}_id`;
    const hasImage = plan[imageFieldName];
    
    if (hasImage) return false; // Already has image
    
    // Always allow fetching image 1 if it's missing
    if (imageSlot === 1) return true;
    
    // For slots 2-4, only show if all previous slots have images
    // This ensures we fill images in order: 1, then 2, then 3, then 4
    for (let i = 1; i < imageSlot; i++) {
      const prevImageField = `fk_image${i}_id`;
      if (!plan[prevImageField]) {
        return false; // Previous slot is empty, don't show this slot
      }
    }
    
    return true; // All previous slots have images, this slot can be fetched
  };

  // Function to fetch a single image for a specific plan and slot
  const fetchSingleImage = async (plan: any, imageSlot: number) => {
    console.log('🚀 FETCH SINGLE IMAGE FUNCTION CALLED!', { plan_id: plan.id, imageSlot });
    
    const fetchKey = `${plan.id}-${imageSlot}`;
    
    try {
      setFetchingImages(prev => new Set([...prev, fetchKey]));
      setError(null); // Clear any previous errors
      
      console.log('Fetching single image:', { plan_id: plan.id, imageSlot, aiModel });
      
      // Create a single record for this image generation
      const imageData = {
        plan_id: plan.id,
        image_slot: imageSlot,
        prompt: plan.e_prompt1 || plan.e_more_instructions1 || plan.e_file_name1 || 'AI Image',
        aiModel: aiModel
      };
      
      console.log('Sending request with data:', imageData);
      
      const response = await fetch('/api/sfunc_fetch_single_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Response result:', result);
      
      if (result.success) {
        // Refresh images data to show the new image
        if (user?.id) {
          console.log('Refreshing images data...');
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();
            
          if (userData) {
            // Refresh images
            const { data: imagesData } = await supabase
              .from('images')
              .select('*')
              .eq('rel_users_id', userData.id);
            
            const imageMap: Record<string, any> = {};
            (imagesData || []).forEach(img => { if (img.id) imageMap[img.id] = img; });
            setImagesById(imageMap);
            console.log('Images refreshed, new count:', Object.keys(imageMap).length);
            
            // Also refresh plans to get updated fk_image fields
            const { data: plansData } = await supabase
              .from('images_plans')
              .select('*')
              .eq('rel_users_id', userData.id)
              .order('created_at', { ascending: false });
              
            if (plansData) {
              setPlans(plansData);
              console.log('Plans refreshed, count:', plansData.length);
            }
          }
        }
        
        setError(`✅ Image ${imageSlot} generated successfully for plan ${plan.id}`);
      } else {
        setError(`❌ Failed to generate image ${imageSlot}: ${result.message || 'Unknown error'}`);
      }
      
    } catch (err) {
      console.error('Fetch single image error:', err);
      setError(`❌ Error fetching image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFetchingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(fetchKey);
        return newSet;
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="w-full mx-auto">
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
      
      {/* Error/Success Message Banner */}
      {error && (
        <div className={`w-full px-4 py-3 text-sm font-medium ${
          error.includes('✅') 
            ? 'bg-green-100 text-green-700 border-b border-green-200' 
            : 'bg-red-100 text-red-700 border-b border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-lg font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="w-full px-4">
        <ExcelPasteGrid onGridDataChange={setGridData} />
        <hr className="my-6 border-t-2 border-gray-300" />
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
        <hr className="my-6 border-t-2 border-gray-300" />
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
          
          {/* Throttle1 Controls */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center mb-3">
              <input
                id="throttle1-enabled"
                type="checkbox"
                checked={throttle1.enabled}
                onChange={e => setThrottle1(prev => ({ ...prev, enabled: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="throttle1-enabled" className="text-sm font-medium text-blue-700">
                🐌 Enable Throttle1 (Slow down API requests to prevent timeouts)
              </label>
            </div>
            
            {throttle1.enabled && (
              <div className="ml-6 space-y-3 bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 min-w-[140px]">
                    Delay between images:
                  </label>
                  <input
                    type="number"
                    value={throttle1.delayBetweenImages}
                    onChange={e => setThrottle1(prev => ({ ...prev, delayBetweenImages: Number(e.target.value) }))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="1000"
                    max="30000"
                    step="500"
                  />
                  <span className="text-sm text-gray-500">ms ({(throttle1.delayBetweenImages / 1000).toFixed(1)}s)</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 min-w-[140px]">
                    Delay between plans:
                  </label>
                  <input
                    type="number"
                    value={throttle1.delayBetweenPlans}
                    onChange={e => setThrottle1(prev => ({ ...prev, delayBetweenPlans: Number(e.target.value) }))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="500"
                    max="10000"
                    step="250"
                  />
                  <span className="text-sm text-gray-500">ms ({(throttle1.delayBetweenPlans / 1000).toFixed(1)}s)</span>
                </div>
                
                <div className="text-xs text-gray-600 mt-2">
                  💡 Recommended: 3-5 seconds between images, 1-2 seconds between plans. Higher values reduce API timeouts but take longer.
                </div>
              </div>
            )}
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
                
                // Show progress message
                setMakeImagesResult('🚀 Starting image generation... Check the statusbox1 logs for detailed progress!');
                
                const { func_create_plans_make_images_1 } = await import('../utils/cfunc_create_plans_make_images_1');
                const result = await func_create_plans_make_images_1({ records, qty: qtyPerPlan, aiModel, generateZip, wipeMeta, throttle1, gridData });
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
            {makeImagesLoading ? 'Generating Images...' : 'Submit func_create_plans_make_images_1'}
          </button>
          {makeImagesResult && (
            <div className="mt-2 text-sm">
              <div className={makeImagesResult.includes('🚀') ? 'text-blue-700' : 'text-gray-700'}>
                {makeImagesResult}
              </div>
              {makeImagesLoading && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm text-blue-800">
                    <strong>💡 Debug Tips:</strong>
                    <ul className="mt-1 ml-4 list-disc text-xs">
                      <li>Go to <strong>bin35/statusbox1</strong> to see real-time logs</li>
                      <li>Filter by "image_generation" or "throttle_system" category</li>
                      <li>Watch for timeout errors or OpenAI API failures</li>
                      <li>Each image generation step is logged with details</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <hr className="my-6 border-t-2 border-gray-300" />
        {/* uitablegrid21 label */}
        <div className="font-bold mb-2">uitablegrid21</div>
        <div className="overflow-x-auto w-full">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {tableColumns.map(col => {
                  const settings = columnSettings[col] || { width: 'auto', minWidth: '100px', maxWidth: 'none', textAlign: 'left' };
                  return (
                    <th
                      key={col}
                      className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{
                        width: settings.width,
                        minWidth: settings.minWidth,
                        maxWidth: settings.maxWidth,
                        textAlign: settings.textAlign || 'left',
                      }}
                    >
                      {col.startsWith('image') ? 'Preview' : col}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map(plan => (
                <tr key={plan.id} style={{ height: rowSettings.height, minHeight: rowSettings.minHeight, maxHeight: rowSettings.maxHeight }}>
                  {tableColumns.map(col => {
                    const settings = columnSettings[col] || { width: 'auto', minWidth: '100px', maxWidth: 'none', textAlign: 'left' };
                    
                    if (col === 'image1-preview') {
                      const imgId = plan['fk_image1_id'];
                      const img = imgId ? imagesById[imgId] : null;
                      const fetchKey = `${plan.id}-1`;
                      const isFetching = fetchingImages.has(fetchKey);
                      const showFetchButton = shouldShowFetchButton(plan, 1);
                      
                      return (
                        <td 
                          key={col} 
                          className="px-2 py-2 align-middle"
                          style={{
                            width: settings.width,
                            minWidth: settings.minWidth,
                            maxWidth: settings.maxWidth,
                            textAlign: settings.textAlign || 'center',
                            height: rowSettings.height,
                          }}
                        >
                          {img && img.img_file_url1 ? (
                            <img src={img.img_file_url1} alt="Preview" className="h-16 w-16 object-cover mx-auto" />
                          ) : isFetching ? (
                            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center mx-auto">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                          ) : showFetchButton ? (
                            <button
                              onClick={() => fetchSingleImage(plan, 1)}
                              className="h-16 w-16 bg-blue-100 hover:bg-blue-200 border-2 border-blue-300 rounded flex items-center justify-center text-xs font-medium text-blue-700 mx-auto transition-colors"
                            >
                              Fetch Now
                            </button>
                          ) : (
                            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center text-gray-400 mx-auto text-xs">No Image</div>
                          )}
                        </td>
                      );
                    }
                    if (col === 'image2-preview') {
                      const imgId = plan['fk_image2_id'];
                      const img = imgId ? imagesById[imgId] : null;
                      const fetchKey = `${plan.id}-2`;
                      const isFetching = fetchingImages.has(fetchKey);
                      const showFetchButton = shouldShowFetchButton(plan, 2);
                      
                      return (
                        <td 
                          key={col} 
                          className="px-2 py-2 align-middle"
                          style={{
                            width: settings.width,
                            minWidth: settings.minWidth,
                            maxWidth: settings.maxWidth,
                            textAlign: settings.textAlign || 'center',
                            height: rowSettings.height,
                          }}
                        >
                          {img && img.img_file_url1 ? (
                            <img src={img.img_file_url1} alt="Preview" className="h-16 w-16 object-cover mx-auto" />
                          ) : isFetching ? (
                            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center mx-auto">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                          ) : showFetchButton ? (
                            <button
                              onClick={() => fetchSingleImage(plan, 2)}
                              className="h-16 w-16 bg-blue-100 hover:bg-blue-200 border-2 border-blue-300 rounded flex items-center justify-center text-xs font-medium text-blue-700 mx-auto transition-colors"
                            >
                              Fetch Now
                            </button>
                          ) : (
                            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center text-gray-400 mx-auto text-xs">No Image</div>
                          )}
                        </td>
                      );
                    }
                    if (col === 'image3-preview') {
                      const imgId = plan['fk_image3_id'];
                      const img = imgId ? imagesById[imgId] : null;
                      const fetchKey = `${plan.id}-3`;
                      const isFetching = fetchingImages.has(fetchKey);
                      const showFetchButton = shouldShowFetchButton(plan, 3);
                      
                      return (
                        <td 
                          key={col} 
                          className="px-2 py-2 align-middle"
                          style={{
                            width: settings.width,
                            minWidth: settings.minWidth,
                            maxWidth: settings.maxWidth,
                            textAlign: settings.textAlign || 'center',
                            height: rowSettings.height,
                          }}
                        >
                          {img && img.img_file_url1 ? (
                            <img src={img.img_file_url1} alt="Preview" className="h-16 w-16 object-cover mx-auto" />
                          ) : isFetching ? (
                            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center mx-auto">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                          ) : showFetchButton ? (
                            <button
                              onClick={() => fetchSingleImage(plan, 3)}
                              className="h-16 w-16 bg-blue-100 hover:bg-blue-200 border-2 border-blue-300 rounded flex items-center justify-center text-xs font-medium text-blue-700 mx-auto transition-colors"
                            >
                              Fetch Now
                            </button>
                          ) : (
                            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center text-gray-400 mx-auto text-xs">No Image</div>
                          )}
                        </td>
                      );
                    }
                    if (col === 'image4-preview') {
                      const imgId = plan['fk_image4_id'];
                      const img = imgId ? imagesById[imgId] : null;
                      const fetchKey = `${plan.id}-4`;
                      const isFetching = fetchingImages.has(fetchKey);
                      const showFetchButton = shouldShowFetchButton(plan, 4);
                      
                      return (
                        <td 
                          key={col} 
                          className="px-2 py-2 align-middle"
                          style={{
                            width: settings.width,
                            minWidth: settings.minWidth,
                            maxWidth: settings.maxWidth,
                            textAlign: settings.textAlign || 'center',
                            height: rowSettings.height,
                          }}
                        >
                          {img && img.img_file_url1 ? (
                            <img src={img.img_file_url1} alt="Preview" className="h-16 w-16 object-cover mx-auto" />
                          ) : isFetching ? (
                            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center mx-auto">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                          ) : showFetchButton ? (
                            <button
                              onClick={() => fetchSingleImage(plan, 4)}
                              className="h-16 w-16 bg-blue-100 hover:bg-blue-200 border-2 border-blue-300 rounded flex items-center justify-center text-xs font-medium text-blue-700 mx-auto transition-colors"
                            >
                              Fetch Now
                            </button>
                          ) : (
                            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center text-gray-400 mx-auto text-xs">No Image</div>
                          )}
                        </td>
                      );
                    }
                    // Default: show value for non-preview columns
                    return (
                      <td
                        key={col}
                        className="px-4 py-2 overflow-hidden align-middle"
                        style={{
                          width: settings.width,
                          minWidth: settings.minWidth,
                          maxWidth: settings.maxWidth,
                          textAlign: settings.textAlign || 'left',
                          height: rowSettings.height,
                          whiteSpace: settings.textAlign === 'left' ? 'nowrap' : 'normal',
                        }}
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