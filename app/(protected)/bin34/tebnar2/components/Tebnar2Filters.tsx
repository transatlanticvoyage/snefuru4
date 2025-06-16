'use client';

import { Tebnar2Batch } from '../types/tebnar2-types';

interface Tebnar2FiltersProps {
  batches: Tebnar2Batch[];
  selectedBatchId: string;
  onBatchChange: (batchId: string) => void;
  error: string | null;
  onRefresh: () => void;
}

export default function Tebnar2Filters({
  batches,
  selectedBatchId,
  onBatchChange,
  error,
  onRefresh
}: Tebnar2FiltersProps) {
  return (
    <>
      {/* Black bar with batch dropdown - cloned from tebnar1 */}
      <div className="sticky top-0 w-full h-10 bg-black z-30 flex items-center px-4 text-white space-x-4">
        <span>rel_images_plans_batches_id</span>
        <select
          value={selectedBatchId}
          onChange={e => onBatchChange(e.target.value)}
          className={`h-7 px-2 rounded text-black ${selectedBatchId ? 'bg-teal-200' : 'bg-white'}`}
          style={{ minWidth: 120 }}
        >
          <option value="">All Batches ({batches.length})</option>
          {batches.map(batch => (
            <option key={batch.id} value={batch.id}>{batch.id}</option>
          ))}
        </select>
        <button
          onClick={onRefresh}
          className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          Refresh
        </button>
      </div>
      
      {/* Error/Success Message Banner - cloned from tebnar1 */}
      {error && (
        <div className={`w-full px-4 py-3 text-sm font-medium ${
          error.includes('✅') || error.includes('success') 
            ? 'bg-green-100 text-green-800 border-green-300' 
            : 'bg-red-100 text-red-800 border-red-300'
        } border`}>
          {error}
        </div>
      )}
    </>
  );
}