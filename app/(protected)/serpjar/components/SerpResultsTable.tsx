'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface SerpResult {
  result_id: number;
  rel_fetch_id: number;
  result_type: string;
  rank_in_group: string;
  rank_absolute: string;
  is_match_emd_stamp: boolean | null;
  domain: string;
  title: string;
  description: string;
  url: string;
  breadcrumb: string;
  created_at: string;
}

interface SerpResultsTableProps {
  keywordId?: number | null;
  keywordData?: {keyword_id: number, keyword_datum: string} | null;
}

export default function SerpResultsTable({ keywordId, keywordData }: SerpResultsTableProps) {
  const [data, setData] = useState<SerpResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof SerpResult>('rank_in_group');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  const supabase = createClientComponentClient();
  
  // Column definitions matching zhe_serp_results schema
  const columns: Array<{ 
    key: keyof SerpResult; 
    type: string; 
    width: string; 
    label: string;
  }> = [
    { key: 'result_id', type: 'integer', width: '80px', label: 'result_id' },
    { key: 'rel_fetch_id', type: 'integer', width: '100px', label: 'rel_fetch_id' },
    { key: 'result_type', type: 'text', width: '120px', label: 'result_type' },
    { key: 'rank_in_group', type: 'number', width: '100px', label: 'rank_in_group' },
    { key: 'rank_absolute', type: 'number', width: '100px', label: 'rank_absolute' },
    { key: 'is_match_emd_stamp', type: 'boolean', width: '120px', label: 'is_match_emd_stamp' },
    { key: 'domain', type: 'text', width: '200px', label: 'domain' },
    { key: 'title', type: 'text', width: '300px', label: 'title' },
    { key: 'description', type: 'text', width: '400px', label: 'description' },
    { key: 'url', type: 'text', width: '300px', label: 'url' },
    { key: 'breadcrumb', type: 'text', width: '200px', label: 'breadcrumb' },
    { key: 'created_at', type: 'timestamp', width: '180px', label: 'created_at' }
  ];
  
  // Fetch data
  useEffect(() => {
    fetchData();
  }, [keywordId]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build API URL with keyword_id parameter if provided
      const apiUrl = keywordId 
        ? `/api/zhe_serp_results?keyword_id=${keywordId}`
        : '/api/zhe_serp_results';
      
      console.log(`Fetching SERP results from: ${apiUrl}`);
      const response = await fetch(apiUrl);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      
      console.log(`Received ${result.results?.length || 0} SERP results`);
      setData(result.results || []);
    } catch (err) {
      console.error('Error fetching serp results:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      if (!searchTerm) return true;
      return Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === null) return sortOrder === 'asc' ? 1 : -1;
      
      // Handle numerical string values for rank columns
      const numericalFields = ['rank_in_group', 'rank_absolute', 'result_id', 'rel_fetch_id'];
      if (numericalFields.includes(sortField as string)) {
        const aNum = parseInt(aValue?.toString() || '0', 10);
        const bNum = parseInt(bValue?.toString() || '0', 10);
        
        // Handle NaN cases (non-numeric strings)
        if (isNaN(aNum) && isNaN(bNum)) return 0;
        if (isNaN(aNum)) return sortOrder === 'asc' ? -1 : 1;
        if (isNaN(bNum)) return sortOrder === 'asc' ? 1 : -1;
        
        if (aNum < bNum) return sortOrder === 'asc' ? -1 : 1;
        if (aNum > bNum) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
      
      // Handle timestamp fields
      if (sortField === 'created_at') {
        const aTime = new Date(aValue as string).getTime();
        const bTime = new Date(bValue as string).getTime();
        
        if (aTime < bTime) return sortOrder === 'asc' ? -1 : 1;
        if (aTime > bTime) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
      
      // Handle boolean fields
      if (typeof aValue === 'boolean' || typeof bValue === 'boolean') {
        const aBool = aValue === true ? 1 : aValue === false ? 0 : -1;
        const bBool = bValue === true ? 1 : bValue === false ? 0 : -1;
        
        if (aBool < bBool) return sortOrder === 'asc' ? -1 : 1;
        if (aBool > bBool) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
      
      // Default string comparison (case-insensitive)
      const aStr = (aValue?.toString() || '').toLowerCase();
      const bStr = (bValue?.toString() || '').toLowerCase();
      
      if (aStr < bStr) return sortOrder === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sort
  const handleSort = (field: keyof SerpResult) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle row selection
  const handleRowSelect = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(item => item.result_id)));
    }
  };

  // Inline editing functions
  const startEditing = (id: number, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditingValue(currentValue?.toString() || '');
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    
    try {
      let value: any = editingValue;
      
      // Convert value based on field type
      const column = columns.find(col => col.key === editingCell.field);
      if (column?.type === 'integer' || column?.type === 'number') {
        value = editingValue === '' ? null : Number(editingValue);
      } else if (column?.type === 'boolean') {
        value = editingValue === 'true' ? true : editingValue === 'false' ? false : null;
      }

      const response = await fetch('/api/zhe_serp_results', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result_id: editingCell.id,
          [editingCell.field]: value
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update');
      }

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.result_id === editingCell.id 
            ? { ...item, [editingCell.field]: value }
            : item
        )
      );

      setEditingCell(null);
      setEditingValue('');
    } catch (error) {
      console.error('Error updating field:', error);
      alert('Failed to update field');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Handle boolean toggle
  const handleBooleanToggle = async (id: number, field: keyof SerpResult, currentValue: boolean | null) => {
    const newValue = currentValue === null ? true : !currentValue;
    
    try {
      const response = await fetch('/api/zhe_serp_results', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result_id: id,
          [field]: newValue
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update');
      }

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.result_id === id ? { ...item, [field]: newValue } : item
        )
      );
    } catch (error) {
      console.error('Error toggling boolean:', error);
      alert('Failed to update field');
    }
  };

  // Render cell content
  const renderCell = (item: SerpResult, column: typeof columns[0]) => {
    const value = item[column.key as keyof SerpResult];
    const isEditing = editingCell?.id === item.result_id && editingCell?.field === column.key;
    const isReadOnly = column.key === 'result_id' || column.key === 'created_at';

    // Handle boolean column type
    if (column.type === 'boolean' && !isReadOnly) {
      return (
        <div className="px-2 py-1 flex items-center justify-center">
          <button
            onClick={() => handleBooleanToggle(item.result_id, column.key, value as boolean | null)}
            className={`w-12 h-6 rounded-full transition-colors ${
              value === true ? 'bg-green-500' : 
              value === false ? 'bg-gray-300' : 'bg-yellow-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              value === true ? 'translate-x-6' : 
              value === false ? 'translate-x-1' : 'translate-x-3'
            }`} />
          </button>
        </div>
      );
    }

    if (isEditing && !isReadOnly) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type={column.type === 'integer' || column.type === 'number' ? 'number' : 'text'}
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            className="w-full px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={saveEdit}
            className="text-green-600 hover:text-green-800 text-xs"
          >
            ✓
          </button>
          <button
            onClick={cancelEdit}
            className="text-red-600 hover:text-red-800 text-xs"
          >
            ✕
          </button>
        </div>
      );
    }

    const cellClass = "px-2 py-1 cursor-pointer hover:bg-blue-50 text-xs";
    
    if (column.type === 'timestamp' && value) {
      return (
        <div
          className={cellClass}
          onClick={() => !isReadOnly && startEditing(item.result_id, column.key, value)}
        >
          {new Date(value as string).toLocaleString()}
        </div>
      );
    }

    if ((column.type === 'integer' || column.type === 'number') && value !== null) {
      return (
        <div
          className={cellClass}
          onClick={() => !isReadOnly && startEditing(item.result_id, column.key, value)}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      );
    }

    return (
      <div
        className={cellClass}
        onClick={() => !isReadOnly && startEditing(item.result_id, column.key, value)}
      >
        {value?.toString() || ''}
      </div>
    );
  };

  // Pagination Controls Component - Matching /filejar style
  const PaginationControls = () => {
    // Always show pagination controls
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <button
            onClick={() => {
              setItemsPerPage(10);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-l -mr-px cursor-pointer ${itemsPerPage === 10 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            10
          </button>
          <button
            onClick={() => {
              setItemsPerPage(20);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 20 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            20
          </button>
          <button
            onClick={() => {
              setItemsPerPage(50);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 50 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            50
          </button>
          <button
            onClick={() => {
              setItemsPerPage(100);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 100 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            100
          </button>
          <button
            onClick={() => {
              setItemsPerPage(200);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 200 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            200
          </button>
          <button
            onClick={() => {
              setItemsPerPage(500);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 500 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            500
          </button>
          <button
            onClick={() => {
              setItemsPerPage(filteredAndSortedData.length);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-r cursor-pointer ${itemsPerPage === filteredAndSortedData.length ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            All
          </button>
        </div>
        <div className="border-l border-gray-300 pl-2 ml-2">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-2.5 text-sm border rounded-l -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 py-2.5 text-sm border -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            >
              Prev
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
                    currentPage === pageNum 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 py-2.5 text-sm border -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-2.5 text-sm border rounded-r disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading SERP results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (data.length === 0 && keywordId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500 mb-2">No SERP results found for keyword_id: {keywordId}</div>
          <div className="text-sm text-gray-400">
            This keyword may not have been fetched yet. Use the F400 SERP Fetch button to get results.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top Header Area */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 border-t-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
              {keywordId && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                  Filtered by keyword_id: {keywordId}
                </span>
              )}
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>
            <NubraTablefaceKite text="nubra-tableface-kite" />
            <PaginationControls />
            <div className="relative">
              <input
                type="text"
                placeholder="Search all fields..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-80 px-3 py-2 pr-12 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black px-2 py-1 rounded text-xs font-medium"
              >
                CL
              </button>
            </div>
          </div>
          <div></div>
        </div>
        
      </div>

      {/* Table */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200" style={{ minWidth: '2000px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left border border-gray-200" style={{ width: '20px' }}>
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    style={{ width: '20px', height: '20px' }}
                    onClick={handleSelectAll}
                  >
                    <div
                      className={`w-full h-full border-2 flex items-center justify-center ${
                        selectedRows.size === paginatedData.length && paginatedData.length > 0
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300 bg-white'
                      }`}
                      style={{ width: '20px', height: '20px' }}
                    >
                      {selectedRows.size === paginatedData.length && paginatedData.length > 0 && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                  </div>
                </th>
                {columns.map((column) => {
                  const isReadOnly = column.key === 'result_id' || column.key === 'created_at';
                  const isBooleanColumn = column.type === 'boolean';
                  
                  return (
                    <th
                      key={column.key}
                      className={`text-left cursor-pointer hover:bg-gray-100 border border-gray-200 px-2 py-1 ${
                        column.key === 'is_match_emd_stamp' ? 'bg-yellow-100' : ''
                      }`}
                      style={{ 
                        width: column.width,
                        minWidth: column.width,
                        maxWidth: column.width
                      }}
                      onClick={() => handleSort(column.key)}
                    >
                      <div className="flex items-center space-x-1">
                        <span 
                          className={`font-bold text-xs lowercase ${isReadOnly ? 'text-gray-500' : 'text-gray-900'}`}
                          style={{
                            wordBreak: 'break-all',
                            lineHeight: '1.1',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxHeight: '2.2em'
                          }}
                        >
                          {column.label.toLowerCase()}
                        </span>
                        {!isReadOnly && !isBooleanColumn && (
                          <span className="text-blue-500 text-xs" title="Click cells to edit">
                            ✎
                          </span>
                        )}
                        {isBooleanColumn && (
                          <span className="text-green-500 text-xs" title="Click to toggle">
                            ⚡
                          </span>
                        )}
                        {sortField === column.key && (
                          <span className="text-gray-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedData.map((item) => (
                <tr key={item.result_id} className="hover:bg-gray-50">
                  <td className="px-2 py-2 border border-gray-200">
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      style={{ width: '20px', height: '20px' }}
                      onClick={() => handleRowSelect(item.result_id)}
                    >
                      <div
                        className={`w-full h-full border-2 flex items-center justify-center ${
                          selectedRows.has(item.result_id) 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 bg-white'
                        }`}
                        style={{ width: '20px', height: '20px' }}
                      >
                        {selectedRows.has(item.result_id) && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                    </div>
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} className="border border-gray-200">
                      {renderCell(item, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
              {keywordId && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                  Filtered by keyword_id: {keywordId}
                </span>
              )}
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>
            <PaginationControls />
            <div className="relative">
              <input
                type="text"
                placeholder="Search all fields..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-80 px-3 py-2 pr-12 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black px-2 py-1 rounded text-xs font-medium"
              >
                CL
              </button>
            </div>
          </div>
          <div></div>
        </div>
      </div>
    </div>
  );
}