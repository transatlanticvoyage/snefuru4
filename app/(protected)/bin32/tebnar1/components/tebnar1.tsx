"use client";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Table columns based on schema in setup-database/route.ts
const columns = [
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
  const supabase = createClientComponentClient();

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      {/* Black bar content is now in layout, but we need to control the dropdown here */}
      <script dangerouslySetInnerHTML={{__html:`
        document.addEventListener('DOMContentLoaded', function() {
          const bar = document.querySelector('.rel-batch-bar');
          if (bar) {
            const reactRoot = document.createElement('span');
            bar.appendChild(reactRoot);
          }
        });
      `}} />
      <div className="rel-batch-bar flex items-center space-x-4">
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
        <div className="my-4">
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            onClick={handleSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? 'Submitting...' : 'Submit func_create_plans_from_xls_1'}
          </button>
          {submitResult && <div className="mt-2 text-sm text-gray-700">{submitResult}</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map(col => (
                  <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlans.map(plan => (
                <tr key={plan.id}>
                  {columns.map(col => (
                    <td key={col} className="px-4 py-2 whitespace-nowrap">{String(plan[col] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPlans.length === 0 && <div className="mt-4 text-gray-500">No plans found for your user.</div>}
        </div>
      </div>
    </div>
  );
} 