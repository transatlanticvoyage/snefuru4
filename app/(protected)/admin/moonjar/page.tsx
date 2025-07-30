'use client';

// @moon-metadata
// URL: /admin/moonjar
// Title: Moonjar - Moon Row Modules Management System
// Last Sync: 2024-07-30T16:00:00Z

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import { NubraTablefaceKite } from '@/app/utils/nubra-tableface-kite';

interface Moon {
  mrm_id: number;
  mrm_name: string | null;
  mrm_description: string | null;
  mrm_note1: string | null;
  created_at: string;
  updated_at: string;
}

export default function MoonjarPage() {
  const { user } = useAuth();
  const [moons, setMoons] = useState<Moon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100); // Default to 100 as requested
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{id: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [sortField, setSortField] = useState<keyof Moon>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [newMoon, setNewMoon] = useState<Partial<Moon>>({});
  
  const supabase = createClientComponentClient();

  // Define column order and properties - actual moons table schema
  const columns: Array<{ key: keyof Moon; type: string; width: string; separator?: 'right' }> = [
    { key: 'mrm_id', type: 'integer', width: '80px' },
    { key: 'mrm_name', type: 'text', width: '200px' },
    { key: 'mrm_description', type: 'text', width: '300px' },
    { key: 'mrm_note1', type: 'text', width: '250px' },
    { key: 'created_at', type: 'text', width: '180px' },
    { key: 'updated_at', type: 'text', width: '180px' }
  ];

  useEffect(() => {
    document.title = 'Moonjar - Moon Row Modules Management System';
    fetchMoons();
  }, []);

  const fetchMoons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('moons')
        .select('*')
        .order(sortField, { ascending: sortOrder === 'asc' });

      if (error) throw error;
      setMoons(data || []);
    } catch (error) {
      console.error('Error fetching moons:', error);
      // For development, create some mock data if table doesn't exist
      const mockMoons: Moon[] = [
        {
          mrm_id: 1,
          mrm_name: 'Sample Moon Row Module',
          mrm_description: 'This is a sample moon row module for testing purposes',
          mrm_note1: 'Additional notes about this module',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setMoons(mockMoons);
    } finally {
      setLoading(false);
    }
  };

  // Pagination options as requested
  const paginationOptions = [10, 20, 50, 100, 200, 500, 'All'];

  // Filter and search logic
  const filteredMoons = useMemo(() => {
    let filtered = moons;
    
    if (searchTerm) {
      filtered = filtered.filter(moon =>
        Object.values(moon).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return sortOrder === 'asc' ? 1 : -1;
      if (bVal === null) return sortOrder === 'asc' ? -1 : 1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });

    return filtered;
  }, [moons, searchTerm, sortField, sortOrder]);

  // Pagination logic
  const totalPages = itemsPerPage === 'All' ? 1 : Math.ceil(filteredMoons.length / (itemsPerPage as number));
  const startIndex = itemsPerPage === 'All' ? 0 : (currentPage - 1) * (itemsPerPage as number);
  const endIndex = itemsPerPage === 'All' ? filteredMoons.length : startIndex + (itemsPerPage as number);
  const paginatedMoons = filteredMoons.slice(startIndex, endIndex);

  // Inline editing handlers
  const handleCellClick = (moonId: number, field: keyof Moon, value: any) => {
    const column = columns.find(col => col.key === field);
    if (column?.type === 'text' || column?.type === 'number') {
      setEditingCell({ id: moonId, field });
      setEditValue(value?.toString() || '');
    }
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      const column = columns.find(col => col.key === editingCell.field);
      let processedValue: any = editValue;

      if (column?.type === 'number') {
        processedValue = editValue === '' ? null : parseFloat(editValue);
        if (isNaN(processedValue)) processedValue = null;
      }

      const { error } = await supabase
        .from('moons')
        .update({ [editingCell.field]: processedValue })
        .eq('mrm_id', editingCell.id);

      if (error) throw error;

      // Update local state
      setMoons(prev => prev.map(moon =>
        moon.mrm_id === editingCell.id
          ? { ...moon, [editingCell.field]: processedValue }
          : moon
      ));

      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Error saving cell:', error);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };


  // Create new moon inline
  const handleCreateInline = async () => {
    try {
      // Create a new moon with default values
      const newMoonData: Partial<Moon> = {
        mrm_name: 'New Moon Row Module',
        mrm_description: '',
        mrm_note1: ''
      };

      const { data, error } = await supabase
        .from('moons')
        .insert([newMoonData])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setMoons(prev => [data, ...prev]);
      
      // Start editing the name field
      setEditingCell({ id: data.mrm_id, field: 'mrm_name' });
      setEditValue('New Moon Row Module');
    } catch (error) {
      console.error('Error creating moon:', error);
      // For development, add mock data
      const mockId = Math.max(...moons.map(m => m.mrm_id), 0) + 1;
      const mockMoon: Moon = {
        mrm_id: mockId,
        mrm_name: 'New Moon Row Module',
        mrm_description: '',
        mrm_note1: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setMoons(prev => [mockMoon, ...prev]);
      setEditingCell({ id: mockId, field: 'mrm_name' });
      setEditValue('New Moon Row Module');
    }
  };

  // Checkbox selection handlers
  const handleRowSelect = (moonId: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(moonId)) {
      newSelection.delete(moonId);
    } else {
      newSelection.add(moonId);
    }
    setSelectedRows(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedMoons.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedMoons.map(moon => moon.mrm_id)));
    }
  };


  // Cell rendering logic
  const renderCell = (item: Moon, column: typeof columns[0]) => {
    const value = item[column.key];
    const isEditing = editingCell?.id === item.mrm_id && editingCell?.field === column.key;
    const isReadOnly = column.key === 'mrm_id' || column.key === 'created_at' || column.key === 'updated_at';

    // Handle editing state
    if (isEditing) {
      return (
        <input
          type={column.type === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleCellSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCellSave();
            if (e.key === 'Escape') handleCellCancel();
          }}
          className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      );
    }

    // Handle regular display
    if (isReadOnly) {
      return <span className="text-gray-600">{value?.toString() || ''}</span>;
    }

    return (
      <div
        className="cursor-pointer hover:bg-gray-50 p-1 rounded"
        onClick={() => handleCellClick(item.mrm_id, column.key, value)}
      >
        {value?.toString() || ''}
      </div>
    );
  };

  // Pagination controls component
  const PaginationControls = () => (
    <div className="flex items-center space-x-4">
      {/* Items per page */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Per page:</span>
        <div className="flex space-x-1">
          {paginationOptions.map((option) => (
            <button
              key={option}
              onClick={() => {
                setItemsPerPage(option);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-sm border rounded ${
                itemsPerPage === option
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Page navigation */}
      {itemsPerPage !== 'All' && (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Page:</span>
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 text-sm border rounded ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 10 && (
              <>
                <span className="px-2 text-gray-500">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`px-3 py-1 text-sm border rounded ${
                    currentPage === totalPages
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search box and clear button */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search moons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setSearchTerm('')}
          className="px-2 py-1 bg-yellow-400 text-black border border-black rounded font-bold text-xs hover:bg-yellow-500"
        >
          CL
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading moons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Moonjar</h1>
        <p className="text-gray-600 text-base">
          <span className="font-bold">Moon Row Modules Management System</span>
        </p>
      </div>

      {/* Action buttons */}
      <div className="mb-4 flex space-x-4">
        <button
          onClick={handleCreateInline}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
        >
          Create New (Inline)
        </button>
        <button
          onClick={() => setShowCreatePopup(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          Create New (Popup)
        </button>
      </div>

      {/* Nubra Tableface Kite */}
      <div className="mb-4">
        <NubraTablefaceKite text="nubra-tableface-kite" />
      </div>

      {/* Upper pagination controls */}
      <div className="mb-4 flex justify-end">
        <PaginationControls />
      </div>

      {/* Main table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto" style={{ minWidth: '100%' }}>
          <table className="border-collapse border border-gray-200" style={{ minWidth: '1200px' }}>
            <thead className="bg-gray-50">
              <tr>
                {/* Checkbox column */}
                <th className="text-left cursor-pointer hover:bg-gray-100 border border-gray-200 px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedMoons.length && paginatedMoons.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                
                {columns.map((column) => {
                  let separatorClass = '';
                  
                  if (column.separator === 'right') {
                    separatorClass = ' border-r-4 border-r-gray-400';
                  }

                  return (
                    <th 
                      key={column.key}
                      className={`text-left cursor-pointer hover:bg-gray-100 border border-gray-200 px-4 py-3${separatorClass}`}
                      style={{ width: column.width, minWidth: column.width }}
                      onClick={() => {
                        if (sortField === column.key) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField(column.key);
                          setSortOrder('asc');
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900 text-xs lowercase">
                          {column.key}
                        </span>
                        {sortField === column.key && (
                          <span className="text-gray-500">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedMoons.map((moon) => (
                <tr key={moon.mrm_id} className="hover:bg-gray-50">
                  {/* Checkbox column */}
                  <td className="border border-gray-200 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(moon.mrm_id)}
                      onChange={() => handleRowSelect(moon.mrm_id)}
                      className="rounded"
                    />
                  </td>
                  
                  {columns.map((column) => {
                    let separatorClass = '';
                    
                    if (column.separator === 'right') {
                      separatorClass = ' border-r-4 border-r-gray-400';
                    }

                    return (
                      <td 
                        key={column.key}
                        className={`text-sm border border-gray-200 px-4 py-3${separatorClass}`}
                        style={{ width: column.width, minWidth: column.width }}
                      >
                        {renderCell(moon, column)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lower pagination controls */}
      <div className="mt-4 flex justify-end">
        <PaginationControls />
      </div>

      {/* Create popup modal */}
      {showCreatePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Create New Moon</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newMoon.mrm_name || ''}
                  onChange={(e) => setNewMoon(prev => ({ ...prev, mrm_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newMoon.mrm_description || ''}
                  onChange={(e) => setNewMoon(prev => ({ ...prev, mrm_description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note</label>
                <textarea
                  value={newMoon.mrm_note1 || ''}
                  onChange={(e) => setNewMoon(prev => ({ ...prev, mrm_note1: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={async () => {
                  try {
                    const { data, error } = await supabase
                      .from('moons')
                      .insert([newMoon])
                      .select()
                      .single();

                    if (error) throw error;
                    setMoons(prev => [data, ...prev]);
                    setShowCreatePopup(false);
                    setNewMoon({});
                  } catch (error) {
                    console.error('Error creating moon:', error);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreatePopup(false);
                  setNewMoon({});
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}