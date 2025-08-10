'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { NubraTablefaceKite } from '@/app/utils/nubra-tableface-kite';

interface YoshidexSession {
  yoshidex_session_id: string;
  user_id: string;
  claude_session_id: string;
  specstory_project_id: string;
  session_title: string;
  session_description: string;
  project_context: string;
  model_used: string;
  session_status: string;
  total_messages: number;
  total_tokens_used: number;
  session_started_at: string;
  session_ended_at: string;
  created_at: string;
  updated_at: string;
  claude_version: string;
  operating_system: string;
  workspace_path: string;
  git_repository_url: string;
  git_branch: string;
  git_commit_hash: string;
  specstory_story_id: string;
  story_status: string;
  story_priority: string;
  estimated_hours: number;
  actual_hours: number;
  session_metadata: any;
  file_attachments: any;
  tags: string[];
  is_archived: boolean;
}

export default function YoshidexSessionsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<YoshidexSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize state from URL parameters
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams?.get('page')) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(Number(searchParams?.get('perPage')) || 50);
  const [sortField, setSortField] = useState<keyof YoshidexSession | null>(
    (searchParams?.get('sortField') as keyof YoshidexSession) || null
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams?.get('sortOrder') as 'asc' | 'desc') || 'desc'
  );
  
  // Filter states from URL parameters
  const [filters, setFilters] = useState({
    session_status: searchParams?.get('filter_session_status') || 'all',
    model_used: searchParams?.get('filter_model_used') || 'all',
    story_status: searchParams?.get('filter_story_status') || 'all'
  });
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Checkbox selection states
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  const supabase = createClientComponentClient();

  // Import SpecStory files
  const importSpecStoryFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/yoshidex/import-specstory-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert(`Import completed!\nProcessed: ${result.results.processed}\nFailed: ${result.results.failed}\n\nImported sessions:\n${result.results.imported.slice(0, 10).join('\n')}`);
        // Refresh the data
        fetchData();
      } else {
        throw new Error(result.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Create new yoshidex session
  const createNewSession = async () => {
    try {
      const { data: newRecord, error } = await supabase
        .from('yoshidex_sessions')
        .insert({
          user_id: null,
          claude_session_id: 'new-session',
          session_title: 'New Claude Code Session',
          session_description: 'Description here',
          model_used: 'claude-3-5-sonnet',
          session_status: 'active',
          total_messages: 0,
          total_tokens_used: 0,
          session_started_at: new Date().toISOString(),
          workspace_path: '/path/to/workspace',
          tags: ['new'],
          is_archived: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new session:', error);
        alert('Failed to create new session');
        return;
      }

      // Update local state - add new record at the beginning
      setData(prev => [newRecord, ...prev]);
      
      // Reset to first page to show the new record
      setCurrentPage(1);
      updateURLParams({ page: 1 });
    } catch (error) {
      console.error('Error creating new session:', error);
      alert('Failed to create new session');
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
  const getUniqueValues = (field: keyof YoshidexSession) => {
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
        .from('yoshidex_sessions')
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
        filtered = filtered.filter(row => String(row[field as keyof YoshidexSession]) === value);
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
  const handleSort = (field: keyof YoshidexSession) => {
    const newOrder = sortField === field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc';
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
  const startInlineEdit = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditingValue(currentValue || '');
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    
    try {
      const updates = { [editingCell.field]: editingValue || null };
      const { error } = await supabase
        .from('yoshidex_sessions')
        .update(updates)
        .eq('yoshidex_session_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.yoshidex_session_id === editingCell.id 
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
  const toggleRowSelection = (rowId: string) => {
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
      setSelectedRows(new Set(paginatedData.map(row => row.yoshidex_session_id)));
    }
  };

  // Define which fields can be inline edited
  const inlineEditableFields = [
    'session_title', 'session_description', 'project_context', 'model_used',
    'session_status', 'workspace_path', 'git_repository_url', 'git_branch',
    'specstory_story_id', 'story_status', 'story_priority'
  ];
  
  // Get column headers in logical order
  const getColumnHeaders = () => {
    return [
      'yoshidex_session_id', 'session_title', 'session_status', 'model_used',
      'total_messages', 'total_tokens_used', 'session_started_at', 'session_ended_at',
      'workspace_path', 'git_branch', 'specstory_story_id', 'story_status',
      'story_priority', 'estimated_hours', 'actual_hours', 'created_at', 
      'is_archived'
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
      {/* Nubra Tableface Kite */}
      <NubraTablefaceKite className="mb-4" />

      {/* Action Buttons */}
      <div className="mb-4 flex gap-3">
        <button
          onClick={importSpecStoryFiles}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
          disabled={loading}
        >
          {loading ? 'Importing...' : 'Import SpecStory Files'}
        </button>
        <button
          onClick={createNewSession}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
        >
          Create New Session
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
              {getUniqueValues(field as keyof YoshidexSession).map(option => (
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
                  onClick={() => handleSort(column as keyof YoshidexSession)}
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
              <tr key={row.yoshidex_session_id} className="hover:bg-gray-50">
                {/* Checkbox cell */}
                <td 
                  className="px-2 py-4 border border-gray-200 cursor-pointer text-center w-12"
                  onClick={() => toggleRowSelection(row.yoshidex_session_id)}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.yoshidex_session_id)}
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
                      editingCell?.id === row.yoshidex_session_id && editingCell?.field === key ? (
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
                          onClick={() => startInlineEdit(row.yoshidex_session_id, key, value)}
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