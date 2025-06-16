'use client';

import { useState } from 'react';
import { Tebnar2Batch } from '../types/tebnar2-types';
import { tbn2_isEmpty, tbn2_debounce } from '../utils/tbn2-utils';

interface Tebnar2FiltersProps {
  batches: Tebnar2Batch[];
  selectedBatchId: string;
  onBatchChange: (batchId: string) => void;
  error: string | null;
  onRefresh: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export default function Tebnar2Filters({
  batches,
  selectedBatchId,
  onBatchChange,
  error,
  onRefresh,
  searchTerm = '',
  onSearchChange
}: Tebnar2FiltersProps) {
  
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Debounced search to avoid excessive API calls
  const debouncedSearch = tbn2_debounce((term: string) => {
    if (onSearchChange) {
      onSearchChange(term);
    }
  }, 300);

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    debouncedSearch(value);
  };
  return (
    <>
      {/* Black bar with batch dropdown and search - enhanced from tebnar1 */}
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
        
        {/* Search Input */}
        {onSearchChange && (
          <>
            <span>Search:</span>
            <input
              type="text"
              value={localSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search plans..."
              className="h-7 px-2 rounded text-black bg-white"
              style={{ minWidth: 200 }}
            />
            {!tbn2_isEmpty(localSearchTerm) && (
              <button
                onClick={() => handleSearchChange('')}
                className="h-7 px-2 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </>
        )}
        
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