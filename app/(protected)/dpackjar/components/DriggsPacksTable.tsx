'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface DriggsPacksRecord {
  dpack_id: number;
  dpack_datum: string | null;
  dpack_note: string | null;
  created_at: string;
  updated_at: string | null;
}

export default function DriggsPacksTable() {
  const [data, setData] = useState<DriggsPacksRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof DriggsPacksRecord>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DriggsPacksRecord | null>(null);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data for creating/editing
  const [formData, setFormData] = useState({
    dpack_datum: '',
    dpack_note: ''
  });

  const supabase = createClientComponentClient();

  // Fetch data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: fetchedData, error } = await supabase
        .from('driggs_packs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setData(fetchedData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      if (!searchTerm.trim()) return true;
      return Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Sort data
    filtered = filtered.sort((a, b) => {
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
  const totalPages = Math.ceil(filteredAndSortedData.length / (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage));
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === -1 ? filteredAndSortedData.length : startIndex + itemsPerPage;
  const currentData = filteredAndSortedData.slice(startIndex, endIndex);

  // Handle sorting
  const handleSort = (field: keyof DriggsPacksRecord) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle row selection
  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === currentData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(currentData.map(item => item.dpack_id)));
    }
  };

  // Pagination controls component
  const PaginationControls = () => {
    const pageOptions = [10, 20, 50, 100, 200, 500];
    
    return (
      <div className="flex items-center space-x-4">
        {/* Items per page */}
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">Show:</span>
          <div className="flex border border-gray-300">
            {pageOptions.map((option, index) => (
              <button
                key={option}
                onClick={() => {
                  setItemsPerPage(option);
                  setCurrentPage(1);
                }}
                className={`px-2 py-2 text-sm transition-colors ${
                  itemsPerPage === option
                    ? 'bg-blue-500 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                } ${
                  index === 0 ? 'rounded-l' : 
                  index === pageOptions.length - 1 ? 'rounded-r' : ''
                } border-r border-gray-300 last:border-r-0`}
                style={{ 
                  fontSize: '14px',
                  paddingTop: '10px',
                  paddingBottom: '10px'
                }}
              >
                {option}
              </button>
            ))}
            <button
              onClick={() => {
                setItemsPerPage(-1);
                setCurrentPage(1);
              }}
              className={`px-2 py-2 text-sm transition-colors rounded-r ${
                itemsPerPage === -1
                  ? 'bg-blue-500 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-700'
              }`}
              style={{ 
                fontSize: '14px',
                paddingTop: '10px',
                paddingBottom: '10px'
              }}
            >
              All
            </button>
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">Page:</span>
          <div className="flex border border-gray-300">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-2 text-sm transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'bg-white hover:bg-gray-100 text-gray-700'
                  } ${
                    i === 0 ? 'rounded-l' : 
                    i === Math.min(totalPages, 10) - 1 ? 'rounded-r' : ''
                  } border-r border-gray-300 last:border-r-0`}
                  style={{ 
                    fontSize: '14px',
                    paddingTop: '10px',
                    paddingBottom: '10px'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 10 && (
              <button
                onClick={() => setCurrentPage(totalPages)}
                className={`px-2 py-2 text-sm transition-colors rounded-r ${
                  currentPage === totalPages
                    ? 'bg-blue-500 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
                style={{ 
                  fontSize: '14px',
                  paddingTop: '10px',
                  paddingBottom: '10px'
                }}
              >
                {totalPages}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Create new record inline
  const createNewRecordInline = async () => {
    try {
      const { data: newRecord, error } = await supabase
        .from('driggs_packs')
        .insert([{
          dpack_datum: 'New Record',
          dpack_note: 'Enter note...'
        }])
        .select('*')
        .single();

      if (error) throw error;

      // Add to local data at the beginning
      setData(prevData => [newRecord, ...prevData]);
      
      // Start editing the first field
      setEditingCell({ id: newRecord.dpack_id, field: 'dpack_datum' });
      setEditingValue('New Record');
    } catch (err: any) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err.message}`);
    }
  };

  // Handle inline editing
  const handleCellClick = (id: number, field: string, value: any) => {
    if (field === 'dpack_id' || field === 'created_at' || field === 'updated_at') return;
    
    setEditingCell({ id, field });
    setEditingValue(value || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      const updateData = {
        [editingCell.field]: editingValue.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('driggs_packs')
        .update(updateData)
        .eq('dpack_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(prevData =>
        prevData.map(item =>
          item.dpack_id === editingCell.id
            ? { ...item, ...updateData }
            : item
        )
      );

      setEditingCell(null);
      setEditingValue('');
    } catch (err: any) {
      console.error('Error updating record:', err);
      alert(`Failed to update record: ${err.message}`);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Handle form submission for popup modal
  const handleCreateSubmit = async () => {
    try {
      const insertData = {
        dpack_datum: formData.dpack_datum.trim() || null,
        dpack_note: formData.dpack_note.trim() || null
      };
      
      const { error: insertError } = await supabase
        .from('driggs_packs')
        .insert([insertData]);
        
      if (insertError) throw insertError;
      
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err.message}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      dpack_datum: '',
      dpack_note: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading driggs_packs data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Error loading data: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Nubra Tableface Kite */}
      <div className="px-4 py-2">
        <NubraTablefaceKite text="driggs_packs tableface" />
      </div>

      {/* Top Header Area */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 border-t-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage), filteredAndSortedData.length)} of {filteredAndSortedData.length} records
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
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={createNewRecordInline}
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
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              {/* Checkbox column */}
              <th 
                className="w-8 px-3 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={handleSelectAll}
                style={{ width: '20px', height: '20px' }}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === currentData.length && currentData.length > 0}
                    onChange={() => {}} // Handled by onClick above
                    className="w-5 h-5 rounded border-gray-300"
                    style={{ width: '20px', height: '20px' }}
                  />
                </div>
              </th>
              
              {/* Data columns */}
              {['dpack_id', 'dpack_datum', 'dpack_note', 'created_at', 'updated_at'].map(field => (
                <th
                  key={field}
                  onClick={() => handleSort(field as keyof DriggsPacksRecord)}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-b border-gray-200"
                >
                  <div className="flex items-center space-x-1">
                    <span>{field}</span>
                    {sortField === field && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((record) => (
              <tr key={record.dpack_id} className="hover:bg-gray-50">
                {/* Checkbox */}
                <td 
                  className="w-8 px-3 py-4 cursor-pointer"
                  onClick={() => handleSelectRow(record.dpack_id)}
                  style={{ width: '20px' }}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(record.dpack_id)}
                      onChange={() => {}} // Handled by onClick above
                      className="w-5 h-5 rounded border-gray-300"
                      style={{ width: '20px', height: '20px' }}
                    />
                  </div>
                </td>

                {/* Data fields */}
                {Object.entries(record).map(([field, value]) => {
                  const isEditing = editingCell?.id === record.dpack_id && editingCell?.field === field;
                  const isReadonly = field === 'dpack_id' || field === 'created_at' || field === 'updated_at';
                  
                  return (
                    <td
                      key={field}
                      className={`px-6 py-4 text-sm ${isReadonly ? 'text-gray-500' : 'text-gray-900 cursor-pointer hover:bg-gray-50'}`}
                      onClick={() => !isReadonly && handleCellClick(record.dpack_id, field, value)}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave();
                            if (e.key === 'Escape') handleCellCancel();
                          }}
                          className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div className={`${!isReadonly ? 'hover:bg-yellow-50' : ''} p-1 rounded`}>
                          {field === 'created_at' || field === 'updated_at' 
                            ? value ? new Date(value).toLocaleString() : 'N/A'
                            : value || (isReadonly ? 'N/A' : 'Click to edit')
                          }
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage), filteredAndSortedData.length)} of {filteredAndSortedData.length} records
            </div>
            <PaginationControls />
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Create New Driggs Pack</h2>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum
                </label>
                <input
                  type="text"
                  value={formData.dpack_datum}
                  onChange={(e) => setFormData(prev => ({ ...prev, dpack_datum: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={formData.dpack_note}
                  onChange={(e) => setFormData(prev => ({ ...prev, dpack_note: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}