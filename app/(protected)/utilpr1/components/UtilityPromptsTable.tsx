'use client';

import { useState, useMemo, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface UtilityPrompt {
  prompt_id: string;
  fk_user_id: string;
  is_special_public_prompt: boolean;
  prompt_content: string | null;
  main_model_intended: string | null;
  prompt_name: string | null;
  prompt_desc: string | null;
  created_at: string;
  updated_at: string;
}

interface UtilityPromptsTableProps {
  data: UtilityPrompt[];
  userId: string;
  userInternalId: string | null;
  onUpdate: () => void;
}

type SortField = keyof UtilityPrompt;
type SortOrder = 'asc' | 'desc';

const allColumns: (keyof UtilityPrompt)[] = [
  'prompt_id',
  'fk_user_id', 
  'is_special_public_prompt',
  'prompt_content',
  'main_model_intended',
  'prompt_name',
  'prompt_desc',
  'created_at',
  'updated_at'
];

export default function UtilityPromptsTable({ data, userId, userInternalId, onUpdate }: UtilityPromptsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<{[key: string]: string}>({});
  const [showFilters, setShowFilters] = useState(false);

  const supabase = createClientComponentClient();

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const searchableFields = [
          'prompt_name',
          'prompt_desc', 
          'prompt_content',
          'main_model_intended'
        ];
        
        return searchableFields.some(field => {
          const value = item[field as keyof UtilityPrompt];
          return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }

    // Apply column filters
    Object.entries(filters).forEach(([column, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter((item) => {
          const value = item[column as keyof UtilityPrompt];
          return value && String(value).toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    return filtered;
  }, [data, searchTerm, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return sortOrder === 'asc' ? -1 : 1;
      if (bVal === null) return sortOrder === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return sortOrder === 'asc'
          ? (aVal === bVal ? 0 : aVal ? 1 : -1)
          : (aVal === bVal ? 0 : aVal ? -1 : 1);
      }
      
      return sortOrder === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortField, sortOrder]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle filter change
  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Handle row selection
  const handleRowSelect = (promptId: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(promptId)) {
      newSelection.delete(promptId);
    } else {
      newSelection.add(promptId);
    }
    setSelectedRows(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(item => item.prompt_id)));
    }
  };

  // Format cell value for display
  const formatCellValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return '';
    
    if (column === 'is_special_public_prompt') {
      return value ? 'true' : 'false';
    }
    
    if (column === 'created_at' || column === 'updated_at') {
      return new Date(value).toLocaleString();
    }
    
    if (column === 'prompt_content' && typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    
    return String(value);
  };

  // Check if user owns the prompt
  const isUserPrompt = (prompt: UtilityPrompt): boolean => {
    return prompt.fk_user_id === userInternalId;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          
          {(Object.values(filters).some(v => v) || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Column Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Column Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allColumns.filter(col => col !== 'prompt_id').map((column) => (
              <div key={column}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {column}
                </label>
                <input
                  type="text"
                  placeholder={`Filter ${column}...`}
                  value={filters[column] || ''}
                  onChange={(e) => handleFilterChange(column, e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {paginatedData.length} of {sortedData.length} prompts
          {sortedData.length !== data.length && ` (${data.length} total)`}
        </div>
        
        {selectedRows.size > 0 && (
          <div>
            {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              
              {allColumns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 lowercase">
                      {column}
                    </span>
                    <span className="text-gray-400">
                      {getSortIcon(column)}
                    </span>
                  </div>
                </th>
              ))}
              
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-bold text-gray-900 lowercase">actions</span>
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item) => (
              <tr 
                key={item.prompt_id}
                className={`hover:bg-gray-50 transition-colors ${
                  selectedRows.has(item.prompt_id) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(item.prompt_id)}
                    onChange={() => handleRowSelect(item.prompt_id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                
                {allColumns.map((column) => (
                  <td key={column} className="px-4 py-3 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={formatCellValue(item[column], column)}>
                      {formatCellValue(item[column], column)}
                    </div>
                  </td>
                ))}
                
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    {isUserPrompt(item) && (
                      <>
                        <button
                          className="text-blue-600 hover:text-blue-800 font-medium"
                          onClick={() => {
                            // Edit functionality would go here
                            console.log('Edit prompt:', item.prompt_id);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 font-medium"
                          onClick={() => {
                            // Delete functionality would go here
                            console.log('Delete prompt:', item.prompt_id);
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    
                    {!isUserPrompt(item) && (
                      <span className="text-gray-400 text-xs">Public</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              First
            </button>
            
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-sm">
              {Math.max(1, currentPage - 2)} - {Math.min(totalPages, currentPage + 2)}
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
            
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {paginatedData.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Prompts Found</h3>
          <p className="text-gray-500">
            {searchTerm || Object.values(filters).some(v => v)
              ? 'No prompts match your search criteria.'
              : 'No utility prompts have been created yet.'
            }
          </p>
        </div>
      )}
    </div>
  );
}