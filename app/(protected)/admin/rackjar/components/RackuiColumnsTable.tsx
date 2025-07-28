'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

interface RackuiColumns {
  column_id: number;
  rel_utg_id: string;
  column_name: string;
  display_name: string;
  data_type: string;
  is_available: boolean;
  default_position: number | null;
  created_at: string;
  updated_at: string;
  rackuicol_width: string | null;
  user_id: string;
}

export default function RackuiColumnsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<RackuiColumns[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize state from URL parameters
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams?.get('page')) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(Number(searchParams?.get('perPage')) || 200);
  const [sortField, setSortField] = useState<keyof RackuiColumns | null>(
    (searchParams?.get('sortField') as keyof RackuiColumns) || null
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams?.get('sortOrder') as 'asc' | 'desc') || 'asc'
  );
  
  // Filter states from URL parameters
  const [filters, setFilters] = useState({
    data_type: searchParams?.get('filter_data_type') || 'all',
    is_available: searchParams?.get('filter_is_available') || 'all',
    rel_utg_id: searchParams?.get('filter_rel_utg_id') || 'all'
  });
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Checkbox selection states
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  
  const supabase = createClientComponentClient();

  // Create new rackui column
  const createNewRackuiColumn = async () => {
    try {
      const { data: newRecord, error } = await supabase
        .from('rackui_columns')
        .insert({
          rel_utg_id: null,
          column_name: null,
          display_name: null,
          data_type: 'text',
          is_available: true,
          default_position: null,
          rackuicol_width: null,
          user_id: null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new rackui column:', error);
        alert('Failed to create new record');
        return;
      }

      // Update local state - add new record at the beginning
      setData(prev => [newRecord, ...prev]);
      
      // Reset to first page to show the new record
      setCurrentPage(1);
      updateURLParams({ page: 1 });
    } catch (error) {
      console.error('Error creating new rackui column:', error);
      alert('Failed to create new record');
    }
  };
  
  // Update URL parameters when state changes
  const updateURLParams = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams || '');
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    
    router.push(`?${params.toString()}`, { scroll: false });
  };
  
  // Get unique values for filters
  const getUniqueValues = (field: keyof RackuiColumns) => {
    const values = data.map(item => item[field]).filter(val => val !== null && val !== undefined);
    return ['all', ...Array.from(new Set(values.map(v => String(v)))).sort()];
  };
  
  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from('rackui_columns')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (fetchError) throw fetchError;
      setData(tableData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = data;
    
    // Apply dropdown filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== 'all') {
        if (field === 'is_available') {
          filtered = filtered.filter(row => String(row[field as keyof RackuiColumns]) === value);
        } else {
          filtered = filtered.filter(row => row[field as keyof RackuiColumns] === value);
        }
      }
    });
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row => {
        return Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    return filtered;
  }, [data, searchTerm, filters]);
  
  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [filteredData, sortField, sortOrder]);
  
  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  
  // Handle sorting
  const handleSort = (field: keyof RackuiColumns) => {
    const newOrder = sortField === field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    updateURLParams({
      sortField: field,
      sortOrder: newOrder,
      page: 1 // Reset to first page when sorting
    });
    setCurrentPage(1);
  };

  // Handle inline editing
  const startInlineEdit = (id: number, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditingValue(currentValue || '');
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    
    try {
      const updates = { [editingCell.field]: editingValue || null };
      const { error } = await supabase
        .from('rackui_columns')
        .update(updates)
        .eq('column_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.column_id === editingCell.id 
            ? { ...item, [editingCell.field]: editingValue || null }
            : item
        )
      );
      
      setEditingCell(null);
      setEditingValue('');
    } catch (err) {
      console.error('Error updating field:', err);
      alert('Failed to update field');
    }
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Handle checkbox selection
  const toggleRowSelection = (rowId: number) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(rowId)) {
        newSelection.delete(rowId);
      } else {
        newSelection.add(rowId);
      }
      return newSelection;
    });
  };

  const toggleAllRowsSelection = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(row => row.column_id)));
    }
  };

  // Define which fields can be inline edited (varchar/text fields)
  const inlineEditableFields = [
    'rel_utg_id', 'column_name', 'display_name', 'data_type', 'rackuicol_width'
  ];
  
  // Get column headers in the order they appear in the interface
  const getColumnHeaders = () => {
    return [
      'column_id', 'rel_utg_id', 'column_name', 'display_name', 'data_type',
      'is_available', 'default_position', 'created_at', 'updated_at', 
      'rackuicol_width', 'user_id'
    ];
  };
  
  if (loading) {
    return <div className="p-4">Loading...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }
  
  return (
    <div className="p-4">
      {/* Create New Button */}
      <div className="mb-4">
        <button
          onClick={createNewRackuiColumn}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
        >
          Create New Column
        </button>
      </div>
      
      {/* Filter Dropdowns */}
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        {Object.entries(filters).map(([field, value]) => (
          <div key={field} className="flex items-center gap-2">
            <label className="font-bold text-sm lowercase">{field}</label>
            <select
              value={value}
              onChange={(e) => {
                const newFilters = {...filters, [field]: e.target.value};
                setFilters(newFilters);
                setCurrentPage(1);
                updateURLParams({
                  [`filter_${field}`]: e.target.value,
                  page: 1
                });
              }}
              className={`px-3 py-2 border border-gray-300 rounded-md ${
                value !== 'all' ? 'bg-blue-900 text-white' : ''
              }`}
            >
              {getUniqueValues(field as keyof RackuiColumns).map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All' : option}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      
      {/* Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
              updateURLParams({
                search: e.target.value,
                page: 1
              });
            }}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <select
            value={itemsPerPage}
            onChange={(e) => {
              const newPerPage = Number(e.target.value);
              setItemsPerPage(newPerPage);
              setCurrentPage(1);
              updateURLParams({
                perPage: newPerPage,
                page: 1
              });
            }}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={200}>200 per page</option>
          </select>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Checkbox header column */}
              <th className="px-2 py-3 text-center border border-gray-200 w-12">
                <div 
                  className="w-full h-full flex items-center justify-center cursor-pointer"
                  onClick={toggleAllRowsSelection}
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={() => {}} // Handled by parent div onClick
                    className="w-4 h-4 cursor-pointer"
                    style={{ pointerEvents: 'none' }}
                  />
                </div>
              </th>
              {getColumnHeaders().map((column) => (
                <th
                  key={column}
                  onClick={() => handleSort(column as keyof RackuiColumns)}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap border border-gray-200"
                >
                  {column}
                  {sortField === column && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row) => (
              <tr key={row.column_id} className="hover:bg-gray-50">
                {/* Checkbox cell */}
                <td 
                  className="px-2 py-4 border border-gray-200 cursor-pointer text-center w-12"
                  onClick={() => toggleRowSelection(row.column_id)}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.column_id)}
                      onChange={() => {}} // Handled by parent td onClick
                      className="w-4 h-4 cursor-pointer"
                      style={{ pointerEvents: 'none' }}
                    />
                  </div>
                </td>
                {getColumnHeaders().map((key) => {
                  const value = (row as any)[key];
                  return (
                  <td 
                    key={key} 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200"
                  >
                    {inlineEditableFields.includes(key) ? (
                      editingCell?.id === row.column_id && editingCell?.field === key ? (
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={saveInlineEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveInlineEdit();
                            } else if (e.key === 'Escape') {
                              cancelInlineEdit();
                            }
                          }}
                          className="w-full min-w-[30px] h-full bg-yellow-50 border border-yellow-300 rounded px-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="min-w-[30px] min-h-[1.25rem] cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                          onClick={() => startInlineEdit(row.column_id, key, value)}
                          title="Click to edit"
                        >
                          {value === null ? '' : String(value)}
                        </div>
                      )
                    ) : typeof value === 'boolean' ? (value ? 'true' : 'false') : 
                     typeof value === 'object' ? JSON.stringify(value) : 
                     value === null ? '' : String(value)}
                  </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentPage(1);
              updateURLParams({ page: 1 });
            }}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={() => {
              const newPage = currentPage - 1;
              setCurrentPage(newPage);
              updateURLParams({ page: newPage });
            }}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => {
              const newPage = currentPage + 1;
              setCurrentPage(newPage);
              updateURLParams({ page: newPage });
            }}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={() => {
              setCurrentPage(totalPages);
              updateURLParams({ page: totalPages });
            }}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}