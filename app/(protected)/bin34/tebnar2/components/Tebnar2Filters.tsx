'use client';

import { Tebnar2Batch } from '../types/tebnar2-types';

interface Tebnar2FiltersProps {
  batches: Tebnar2Batch[];
  selectedBatchId: string;
  onBatchChange: (batchId: string) => void;
  error: string | null;
  onRefresh: () => void;
  onErrorDismiss?: () => void;
}

export default function Tebnar2Filters({
  batches,
  selectedBatchId,
  onBatchChange,
  error,
  onRefresh,
  onErrorDismiss
}: Tebnar2FiltersProps) {
  return (
    <>
      {/* Black bar with batch dropdown, only on tebnar2 - exact clone from tebnar1 */}
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
      </div>
      
      {/* Error/Success Message Banner - exact clone from tebnar1 */}
      {error && (
        <div className={`w-full px-4 py-3 text-sm font-medium ${
          error.includes('✅') 
            ? 'bg-green-100 text-green-700 border-b border-green-200' 
            : 'bg-red-100 text-red-700 border-b border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => onErrorDismiss?.()}
              className="ml-4 text-lg font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}