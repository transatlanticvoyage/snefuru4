'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface KeywordTag {
  tag_id: number;
  fabrication_launch_created_from: number | null; // UI only - no DB field
  tag_name: string;
  tag_order: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const columns = [
  { key: 'tag_id', label: 'tag_id', type: 'number', width: '80px' },
  { 
    key: 'fabrication_launch_created_from', 
    label: 'fabrication_launch_created_from', 
    labelLines: [
      'fabrication_launch_created_from',
      '(reverse lookup)',
      'fabrication_launches.rel_keywordshub_tag_id'
    ],
    type: 'number', 
    width: '180px' 
  },
  { key: 'tag_name', label: 'tag_name', type: 'text', width: '200px' },
  { key: 'tag_order', label: 'tag_order', type: 'number', width: '120px' },
  { key: 'created_at', label: 'created_at', type: 'datetime', width: '180px' },
  { key: 'updated_at', label: 'updated_at', type: 'datetime', width: '180px' },
  { key: 'user_id', label: 'user_id', type: 'text', width: '200px' }
];

export default function KeywordsTagsTable() {
  const { user } = useAuth();
  const [data, setData] = useState<KeywordTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof KeywordTag>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data for creating
  const [formData, setFormData] = useState({
    tag_name: '',
    tag_order: 0
  });

  const supabase = createClientComponentClient();

  // Get user ID
  const [userInternalId, setUserInternalId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      if (user?.id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        
        if (userData) {
          setUserInternalId(userData.id);
        }
      }
    };
    getUserId();
  }, [user, supabase]);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (!userInternalId) return;

      const response = await fetch(`/api/keywordshub_tags?user_internal_id=${userInternalId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      
      setData(result.tags || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userInternalId) {
      fetchData();
    }
  }, [userInternalId]);

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
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / (itemsPerPage === 0 ? filteredAndSortedData.length : itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = itemsPerPage === 0 ? filteredAndSortedData : filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sort
  const handleSort = (field: keyof KeywordTag) => {
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
      setSelectedRows(new Set(paginatedData.map(item => item.tag_id)));
    }
  };

  // Inline editing functions
  const startEditing = (id: number, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditingValue(currentValue?.toString() || '');
  };

  const saveEdit = async () => {
    if (!editingCell || !userInternalId) return;
    
    try {
      let value: any = editingValue;
      
      // Convert value based on field type
      const column = columns.find(col => col.key === editingCell.field);
      if (column?.type === 'number') {
        value = editingValue === '' ? null : Number(editingValue);
      }

      const response = await fetch('/api/keywordshub_tags', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tag_id: editingCell.id,
          user_internal_id: userInternalId,
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
          item.tag_id === editingCell.id 
            ? { ...item, [editingCell.field]: value, updated_at: new Date().toISOString() }
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

  // Create new inline record
  const createNewInline = async () => {
    if (!userInternalId) return;

    try {
      const newRecord = {
        tag_name: 'New Tag',
        tag_order: 0,
        user_internal_id: userInternalId
      };

      const response = await fetch('/api/keywordshub_tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecord),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create');
      }

      // Add to local data at the beginning
      setData(prevData => [result.tag, ...prevData]);
      
      // Start editing the tag_name field immediately
      setTimeout(() => {
        startEditing(result.tag.tag_id, 'tag_name', 'New Tag');
      }, 100);

    } catch (error) {
      console.error('Error creating record:', error);
      alert('Failed to create record');
    }
  };

  // Handle popup form creation
  const handleCreate = async () => {
    if (!userInternalId) return;

    try {
      const response = await fetch('/api/keywordshub_tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          user_internal_id: userInternalId
        }),
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create');
      }
      
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      tag_name: '',
      tag_order: 0
    });
  };

  // Render cell content
  const renderCell = (item: KeywordTag, column: typeof columns[0]) => {
    const value = item[column.key as keyof KeywordTag];
    const isEditing = editingCell?.id === item.tag_id && editingCell?.field === column.key;
    const isReadOnly = column.key === 'tag_id' || column.key === 'fabrication_launch_created_from' || column.key === 'created_at' || column.key === 'updated_at' || column.key === 'user_id';

    if (isEditing && !isReadOnly) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type={column.type === 'number' ? 'number' : 'text'}
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
    
    if (column.type === 'datetime' && value) {
      return (
        <div
          className={cellClass}
          onClick={() => !isReadOnly && startEditing(item.tag_id, column.key, value)}
        >
          {new Date(value as string).toLocaleString()}
        </div>
      );
    }

    if (column.type === 'number' && value !== null) {
      return (
        <div
          className={cellClass}
          onClick={() => !isReadOnly && startEditing(item.tag_id, column.key, value)}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      );
    }

    return (
      <div
        className={cellClass}
        onClick={() => !isReadOnly && startEditing(item.tag_id, column.key, value)}
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
        <div className="text-gray-500">Loading keywords tags...</div>
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

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex-none bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={createNewInline}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors"
              >
                Create New (Inline)
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors"
              >
                Create New (Popup)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="w-full border-collapse border border-gray-200" style={{ minWidth: '1000px' }}>
            <thead className="bg-gray-50 sticky top-0">
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
                {columns.map((column: any) => (
                  <th
                    key={column.key}
                    className="px-2 py-3 text-left border border-gray-200 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(column.key as keyof KeywordTag)}
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center space-x-1">
                      {column.labelLines ? (
                        <div className="flex flex-col">
                          {column.labelLines.map((line: string, index: number) => (
                            <span key={index} className="font-bold text-xs lowercase">
                              {line}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="font-bold text-xs lowercase">{column.label}</span>
                      )}
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
            <tbody className="bg-white">
              {paginatedData.map((item) => (
                <tr key={item.tag_id} className="hover:bg-gray-50">
                  <td className="px-2 py-2 border border-gray-200">
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      style={{ width: '20px', height: '20px' }}
                      onClick={() => handleRowSelect(item.tag_id)}
                    >
                      <div
                        className={`w-full h-full border-2 flex items-center justify-center ${
                          selectedRows.has(item.tag_id) 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 bg-white'
                        }`}
                        style={{ width: '20px', height: '20px' }}
                      >
                        {selectedRows.has(item.tag_id) && (
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
      <div className="flex-none bg-white border-t px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
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

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Keywords Tag</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
                  <input
                    type="text"
                    value={formData.tag_name}
                    onChange={(e) => setFormData({...formData, tag_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter tag name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag Order</label>
                  <input
                    type="number"
                    value={formData.tag_order}
                    onChange={(e) => setFormData({...formData, tag_order: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}