'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface MediumPostsRecord {
  mpost_id: number;
  mpost_url: string | null;
  created_at: string;
  updated_at: string | null;
  author_note: string | null;
  user_id: string | null;
}

export default function MedjarTable() {
  const [data, setData] = useState<MediumPostsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof MediumPostsRecord>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MediumPostsRecord | null>(null);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data for creating/editing
  const [formData, setFormData] = useState({
    mpost_url: '',
    author_note: ''
  });

  const supabase = createClientComponentClient();

  // Get user internal ID and fetch data
  const fetchUserAndData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // First get the internal user ID from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('User lookup error:', userError);
        setError('User not found in users table');
        setLoading(false);
        return;
      }

      const userInternalId = userData.id;
      setUserInternalId(userInternalId);

      // Now get user's medium posts using the internal user ID
      const { data: records, error } = await supabase
        .from('medium_posts')
        .select('*')
        .eq('user_id', userInternalId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setData(records || []);
    } catch (error) {
      console.error('Error fetching medium_posts:', error);
      setError('Failed to fetch medium posts data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndData();
  }, []);

  // Column definitions
  const columns = [
    { key: 'mpost_id', label: 'mpost_id', type: 'integer', readonly: true },
    { key: 'mpost_url', label: 'mpost_url', type: 'text' },
    { key: 'author_note', label: 'author_note', type: 'text' },
    { key: 'created_at', label: 'created_at', type: 'timestamp', readonly: true },
    { key: 'updated_at', label: 'updated_at', type: 'timestamp', readonly: true },
    { key: 'user_id', label: 'user_id', type: 'text', readonly: true }
  ];

  // Filter and paginate data
  const filteredData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = data.filter((item) =>
        Object.values(item).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return sortOrder === 'asc' ? -1 : 1;
      if (bVal === null) return sortOrder === 'asc' ? 1 : -1;
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, searchTerm, sortField, sortOrder]);

  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return filteredData; // Show all
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);

  // Handle row selection
  const toggleRowSelection = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(item => item.mpost_id)));
    }
  };

  // Handle sorting
  const handleSort = (field: keyof MediumPostsRecord) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Inline editing handlers
  const handleCellClick = (id: number, field: string, currentValue: any) => {
    const column = columns.find(col => col.key === field);
    if (column?.readonly) return;
    
    setEditingCell({ id, field });
    setEditingValue(currentValue?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    
    const { id, field } = editingCell;
    const column = columns.find(col => col.key === field);
    
    let processedValue: any = editingValue;
    
    if (column?.type === 'integer') {
      processedValue = editingValue === '' ? null : parseInt(editingValue, 10);
      if (isNaN(processedValue)) {
        alert('Invalid number format');
        return;
      }
    } else if (editingValue === '') {
      processedValue = null;
    }

    await updateField(id, field as keyof MediumPostsRecord, processedValue);
    setEditingCell(null);
    setEditingValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const updateField = async (id: number, field: keyof MediumPostsRecord, value: any) => {
    try {
      const { error } = await supabase
        .from('medium_posts')
        .update({ [field]: value })
        .eq('mpost_id', id);

      if (error) {
        console.error('Error updating field:', error);
        return;
      }

      // Update local state
      setData(prev => prev.map(item => 
        item.mpost_id === id ? { ...item, [field]: value } : item
      ));
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  // Create new record inline
  const createNewRecordInline = async () => {
    if (!userInternalId) {
      console.error('User internal ID not available');
      return;
    }

    try {
      const { data: newRecord, error } = await supabase
        .from('medium_posts')
        .insert({
          mpost_url: null,
          author_note: null,
          user_id: userInternalId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new medium_posts record:', error);
        return;
      }

      // Add to local state at the beginning
      setData(prev => [newRecord, ...prev]);
      
      // Focus on the first editable cell
      setTimeout(() => {
        handleCellClick(newRecord.mpost_id, 'mpost_url', null);
      }, 100);
    } catch (error) {
      console.error('Error creating new record:', error);
    }
  };

  // Modal form handlers
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInternalId) {
      console.error('User internal ID not available');
      return;
    }

    try {
      const { data: newRecord, error } = await supabase
        .from('medium_posts')
        .insert({
          ...formData,
          user_id: userInternalId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating record:', error);
        return;
      }

      setData(prev => [newRecord, ...prev]);
      setIsCreateModalOpen(false);
      setFormData({ mpost_url: '', author_note: '' });
    } catch (error) {
      console.error('Error creating record:', error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRecord) return;

    try {
      const { error } = await supabase
        .from('medium_posts')
        .update(formData)
        .eq('mpost_id', editingRecord.mpost_id);

      if (error) {
        console.error('Error updating record:', error);
        return;
      }

      setData(prev => prev.map(item => 
        item.mpost_id === editingRecord.mpost_id 
          ? { ...item, ...formData }
          : item
      ));
      
      setIsEditModalOpen(false);
      setEditingRecord(null);
      setFormData({ mpost_url: '', author_note: '' });
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  // Delete selected records
  const deleteSelectedRecords = async () => {
    if (selectedRows.size === 0) return;
    
    if (!confirm(`Delete ${selectedRows.size} selected record(s)?`)) return;

    try {
      const { error } = await supabase
        .from('medium_posts')
        .delete()
        .in('mpost_id', Array.from(selectedRows));

      if (error) {
        console.error('Error deleting records:', error);
        return;
      }

      setData(prev => prev.filter(item => !selectedRows.has(item.mpost_id)));
      setSelectedRows(new Set());
    } catch (error) {
      console.error('Error deleting records:', error);
    }
  };

  // Render cell content
  const renderCell = (item: MediumPostsRecord, column: typeof columns[0]) => {
    const value = item[column.key as keyof MediumPostsRecord];
    const isEditing = editingCell?.id === item.mpost_id && editingCell?.field === column.key;
    const isReadOnly = column.readonly;

    if (isEditing) {
      return (
        <div className="flex items-center space-x-1">
          <textarea
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCellSave();
              }
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            autoFocus
            rows={1}
          />
          <button
            onClick={handleCellSave}
            className="text-green-600 hover:text-green-800 text-sm"
            title="Save"
          >
            ✓
          </button>
          <button
            onClick={handleCellCancel}
            className="text-red-600 hover:text-red-800 text-sm"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      );
    }

    // Format display value
    let displayValue = '';
    if (column.type === 'timestamp') {
      displayValue = value ? new Date(value as string).toLocaleString() : '';
    } else {
      displayValue = value?.toString() || '';
    }

    return (
      <div
        onClick={() => !isReadOnly && handleCellClick(item.mpost_id, column.key, value)}
        className={`min-w-[30px] min-h-[1.25rem] px-1 py-0.5 rounded break-words ${
          !isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
        } ${isReadOnly ? 'text-gray-500' : ''}`}
        style={{ maxWidth: '200px', wordWrap: 'break-word', overflowWrap: 'break-word' }}
        title={isReadOnly ? displayValue : `${displayValue} (Click to edit)`}
      >
        {displayValue}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading Medium Posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1 && itemsPerPage !== -1) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <button
            onClick={() => {
              setItemsPerPage(10);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-l -mr-px cursor-pointer ${itemsPerPage === 10 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            10
          </button>
          <button
            onClick={() => {
              setItemsPerPage(20);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 20 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            20
          </button>
          <button
            onClick={() => {
              setItemsPerPage(50);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 50 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            50
          </button>
          <button
            onClick={() => {
              setItemsPerPage(100);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 100 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            100
          </button>
          <button
            onClick={() => {
              setItemsPerPage(200);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 200 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            200
          </button>
          <button
            onClick={() => {
              setItemsPerPage(500);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 500 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            500
          </button>
          <button
            onClick={() => {
              setItemsPerPage(-1);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-r cursor-pointer ${itemsPerPage === -1 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            All
          </button>
        </div>
        
        {itemsPerPage !== -1 && totalPages > 1 && (
          <div className="flex items-center ml-4">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              let pageNum;
              if (totalPages <= 10) {
                pageNum = i + 1;
              } else if (currentPage <= 5) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 4) {
                pageNum = totalPages - 9 + i;
              } else {
                pageNum = currentPage - 4 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-2.5 text-sm border ${
                    i === 0 ? 'rounded-l' : i === Math.min(totalPages, 10) - 1 ? 'rounded-r' : ''
                  } -mr-px cursor-pointer ${
                    currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'
                  }`}
                  style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const SearchControls = () => (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={() => {
          setSearchTerm('');
          setCurrentPage(1);
        }}
        className="px-2 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-bold rounded border border-gray-300"
        title="Clear search"
      >
        CL
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Create buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={createNewRecordInline}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
        >
          create new (inline)
        </button>
        <button
          onClick={() => {
            setFormData({ mpost_url: '', author_note: '' });
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          create new (popup)
        </button>
        {selectedRows.size > 0 && (
          <button
            onClick={deleteSelectedRecords}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
          >
            Delete Selected ({selectedRows.size})
          </button>
        )}
      </div>

      {/* Nubra Tableface Kite */}
      <div className="flex justify-start">
        <NubraTablefaceKite />
      </div>

      {/* Top pagination and search controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <PaginationControls />
        </div>
        <SearchControls />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-bold lowercase border-b">
                <div
                  onClick={toggleSelectAll}
                  className="flex items-center justify-center w-5 h-5 cursor-pointer"
                  style={{ width: '20px', height: '20px' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    readOnly
                    className="w-5 h-5"
                    style={{ width: '20px', height: '20px' }}
                  />
                </div>
              </th>
              {columns.map(column => (
                <th
                  key={column.key}
                  className="px-3 py-2 text-left font-bold lowercase border-b cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column.key as keyof MediumPostsRecord)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {sortField === column.key && (
                      <span className="text-xs">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.mpost_id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border-b">
                  <div
                    onClick={() => toggleRowSelection(item.mpost_id)}
                    className="flex items-center justify-center w-5 h-5 cursor-pointer"
                    style={{ width: '20px', height: '20px' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.mpost_id)}
                      readOnly
                      className="w-5 h-5"
                      style={{ width: '20px', height: '20px' }}
                    />
                  </div>
                </td>
                {columns.map(column => (
                  <td key={column.key} className="px-3 py-2 border-b">
                    {renderCell(item, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom pagination controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <PaginationControls />
        </div>
        <div className="text-sm text-gray-500">
          Showing {paginatedData.length} of {filteredData.length} records
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Create New Medium Post</h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    mpost_url
                  </label>
                  <input
                    type="url"
                    value={formData.mpost_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, mpost_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://medium.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    author_note
                  </label>
                  <textarea
                    value={formData.author_note}
                    onChange={(e) => setFormData(prev => ({ ...prev, author_note: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setFormData({ mpost_url: '', author_note: '' });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Edit Medium Post</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    mpost_url
                  </label>
                  <input
                    type="url"
                    value={formData.mpost_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, mpost_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://medium.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    author_note
                  </label>
                  <textarea
                    value={formData.author_note}
                    onChange={(e) => setFormData(prev => ({ ...prev, author_note: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingRecord(null);
                    setFormData({ mpost_url: '', author_note: '' });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}