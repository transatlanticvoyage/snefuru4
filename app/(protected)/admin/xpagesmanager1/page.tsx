'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface XPage {
  xpage_id: string;
  title1: string | null;
  title2: string | null;
  desc1: string | null;
  caption: string | null;
  pagepath_url: string | null;
  pagepath_long: string | null;
  pagepath_short: string | null;
  position_marker: number | null;
  show_in_all_pages_nav_area1: boolean | null;
  broad_parent_container: string | null;
  created_at: string;
  updated_at: string;
}

export default function XPagesManager1Page() {
  const { user } = useAuth();
  const [xpages, setXpages] = useState<XPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [filterParentContainer, setFilterParentContainer] = useState<string>('');
  const [filterShowInNav, setFilterShowInNav] = useState<string>('');
  const [sortField, setSortField] = useState<keyof XPage>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const supabase = createClientComponentClient();

  // Define column order and properties
  const columns = [
    { key: 'xpage_id', type: 'text', width: '300px' },
    { key: 'title1', type: 'text', width: '200px' },
    { key: 'title2', type: 'text', width: '200px' },
    { key: 'desc1', type: 'text', width: '250px' },
    { key: 'caption', type: 'text', width: '200px' },
    { key: 'pagepath_url', type: 'text', width: '300px' },
    { key: 'pagepath_long', type: 'text', width: '200px' },
    { key: 'pagepath_short', type: 'text', width: '150px' },
    { key: 'position_marker', type: 'integer', width: '120px' },
    { key: 'show_in_all_pages_nav_area1', type: 'boolean', width: '80px' },
    { key: 'broad_parent_container', type: 'text', width: '180px' },
    { key: 'created_at', type: 'text', width: '200px' },
    { key: 'updated_at', type: 'text', width: '200px' }
  ] as const;

  useEffect(() => {
    fetchXPages();
  }, []);

  const fetchXPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('xpages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching xpages:', error);
        return;
      }

      setXpages(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = async (id: string, field: keyof XPage, value: any) => {
    try {
      const { error } = await supabase
        .from('xpages')
        .update({ [field]: value })
        .eq('xpage_id', id);

      if (error) {
        console.error('Error updating field:', error);
        return;
      }

      // Update local state
      setXpages(prev => prev.map(item => 
        item.xpage_id === id ? { ...item, [field]: value } : item
      ));
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  const handleCellClick = (id: string, field: string, currentValue: any) => {
    if (field === 'xpage_id' || field === 'created_at' || field === 'updated_at') {
      return; // Don't allow editing these fields
    }
    
    setEditingCell({ id, field });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    let processedValue: any = editValue;

    // Process value based on field type
    const column = columns.find(col => col.key === field);
    if (column?.type === 'integer') {
      processedValue = editValue === '' ? null : parseInt(editValue);
      if (isNaN(processedValue)) {
        processedValue = null;
      }
    } else if (column?.type === 'boolean') {
      processedValue = editValue === 'true';
    } else if (editValue === '') {
      processedValue = null;
    }

    await updateField(id, field as keyof XPage, processedValue);
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleBooleanToggle = async (id: string, field: keyof XPage, currentValue: boolean | null) => {
    const newValue = currentValue === null ? true : !currentValue;
    await updateField(id, field, newValue);
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = xpages.filter(item => {
      const matchesSearch = !searchTerm || 
        Object.values(item).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesParentContainer = !filterParentContainer || 
        item.broad_parent_container === filterParentContainer;
      
      const matchesShowInNav = !filterShowInNav || 
        (filterShowInNav === 'true' ? item.show_in_all_pages_nav_area1 === true :
         filterShowInNav === 'false' ? item.show_in_all_pages_nav_area1 === false :
         filterShowInNav === 'null' ? item.show_in_all_pages_nav_area1 === null : true);

      return matchesSearch && matchesParentContainer && matchesShowInNav;
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
  }, [xpages, searchTerm, filterParentContainer, filterShowInNav, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof XPage) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderCell = (item: XPage, column: typeof columns[0]) => {
    const value = item[column.key];
    const isEditing = editingCell?.id === item.xpage_id && editingCell?.field === column.key;
    const isReadOnly = column.key === 'xpage_id' || column.key === 'created_at' || column.key === 'updated_at';

    if (column.type === 'boolean' && !isReadOnly) {
      return (
        <button
          onClick={() => handleBooleanToggle(item.xpage_id, column.key as keyof XPage, value as boolean | null)}
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
      );
    }

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="px-2 py-1 border rounded text-sm w-full"
            autoFocus
          />
          <button
            onClick={handleCellSave}
            className="text-green-600 hover:text-green-800"
            title="Save"
          >
            ✓
          </button>
          <button
            onClick={handleCellCancel}
            className="text-red-600 hover:text-red-800"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      );
    }

    return (
      <div
        onClick={() => !isReadOnly && handleCellClick(item.xpage_id, column.key, value)}
        className={`truncate ${!isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'} ${
          isReadOnly ? 'text-gray-500' : ''
        }`}
        title={value?.toString() || ''}
      >
        {column.key === 'created_at' || column.key === 'updated_at' 
          ? new Date(value as string).toLocaleString()
          : value?.toString() || ''
        }
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">XPages Manager</h1>
        <p className="text-gray-600">Manage internal application pages</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search all fields..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent Container</label>
          <select
            value={filterParentContainer}
            onChange={(e) => {
              setFilterParentContainer(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All</option>
            <option value="admin">admin</option>
            <option value="navgroup1">navgroup1</option>
            <option value="navgroup91">navgroup91</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Show in Nav</label>
          <select
            value={filterShowInNav}
            onChange={(e) => {
              setFilterShowInNav(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All</option>
            <option value="true">True</option>
            <option value="false">False</option>
            <option value="null">Null</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} items
        {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(paginatedData.map(item => item.xpage_id)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                  />
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                    style={{ width: column.width }}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-xs uppercase">{column.key}</span>
                      {sortField === column.key && (
                        <span className="text-gray-400">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.xpage_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.xpage_id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRows);
                        if (e.target.checked) {
                          newSelected.add(item.xpage_id);
                        } else {
                          newSelected.delete(item.xpage_id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    />
                  </td>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-sm"
                      style={{ width: column.width }}
                    >
                      {renderCell(item, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 border rounded-md ${
                    currentPage === pageNum 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}