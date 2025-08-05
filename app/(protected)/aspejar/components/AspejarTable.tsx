'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface AddressSpecies {
  aspecies_id: number;
  aspecies_name: string | null;
  aspecies_code: string | null;
  address_format: string | null;
  country_code: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string | null;
}

export default function AspejarTable() {
  const [data, setData] = useState<AddressSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof AddressSpecies>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data for creating
  const [formData, setFormData] = useState({
    aspecies_name: '',
    aspecies_code: '',
    address_format: '',
    country_code: '',
    is_active: true
  });

  const supabase = createClientComponentClient();

  // Define columns
  const columns = [
    { key: 'aspecies_id' as keyof AddressSpecies, label: 'aspecies_id', type: 'number', readOnly: true },
    { key: 'aspecies_name' as keyof AddressSpecies, label: 'aspecies_name', type: 'text' },
    { key: 'aspecies_code' as keyof AddressSpecies, label: 'aspecies_code', type: 'text' },
    { key: 'address_format' as keyof AddressSpecies, label: 'address_format', type: 'text' },
    { key: 'country_code' as keyof AddressSpecies, label: 'country_code', type: 'text' },
    { key: 'is_active' as keyof AddressSpecies, label: 'is_active', type: 'boolean' },
    { key: 'created_at' as keyof AddressSpecies, label: 'created_at', type: 'datetime', readOnly: true },
    { key: 'updated_at' as keyof AddressSpecies, label: 'updated_at', type: 'datetime', readOnly: true }
  ];

  // Fetch data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: addressSpeciesData, error } = await supabase
        .from('address_species')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(addressSpeciesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;
    
    if (searchTerm) {
      filtered = data.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === null) return sortOrder === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage));
  const startIndex = (currentPage - 1) * (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage);
  const paginatedData = itemsPerPage === -1 ? filteredAndSortedData : filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof AddressSpecies) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle cell editing
  const handleCellClick = (id: number, field: string, value: any) => {
    const column = columns.find(col => col.key === field);
    if (column?.readOnly || column?.type === 'boolean') return;
    
    setEditingCell({ id, field });
    setEditingValue(value?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      const { error } = await supabase
        .from('address_species')
        .update({ [editingCell.field]: editingValue || null })
        .eq('aspecies_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.aspecies_id === editingCell.id 
          ? { ...item, [editingCell.field]: editingValue || null }
          : item
      ));

      setEditingCell(null);
      setEditingValue('');
    } catch (err) {
      console.error('Error updating cell:', err);
      alert('Failed to update cell');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Handle boolean toggle
  const handleBooleanToggle = async (id: number, field: keyof AddressSpecies, currentValue: boolean | null) => {
    const newValue = currentValue === null ? true : !currentValue;
    
    try {
      const { error } = await supabase
        .from('address_species')
        .update({ [field]: newValue })
        .eq('aspecies_id', id);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.aspecies_id === id ? { ...item, [field]: newValue } : item
      ));
    } catch (err) {
      console.error('Error toggling boolean:', err);
      alert('Failed to update field');
    }
  };

  // Create new record inline
  const createNewRecordInline = async () => {
    try {
      const newRecord = {
        aspecies_name: 'New Species',
        aspecies_code: 'NEW',
        address_format: '',
        country_code: '',
        is_active: true
      };

      const { data: insertedData, error } = await supabase
        .from('address_species')
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;

      // Add to local data at the beginning
      setData([insertedData, ...data]);
      
      // Set first editable cell to editing mode
      setEditingCell({ id: insertedData.aspecies_id, field: 'aspecies_name' });
      setEditingValue('New Species');
    } catch (err) {
      console.error('Error creating record:', err);
      alert('Failed to create record');
    }
  };

  // Handle popup form submission
  const handleCreateSubmit = async () => {
    try {
      const insertData = {
        aspecies_name: formData.aspecies_name?.trim() || null,
        aspecies_code: formData.aspecies_code?.trim() || null,
        address_format: formData.address_format?.trim() || null,
        country_code: formData.country_code?.trim() || null,
        is_active: formData.is_active
      };
      
      const { data: insertedData, error } = await supabase
        .from('address_species')
        .insert([insertData])
        .select()
        .single();
        
      if (error) throw error;
      
      setIsCreateModalOpen(false);
      resetForm();
      setData([insertedData, ...data]);
    } catch (err) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      aspecies_name: '',
      aspecies_code: '',
      address_format: '',
      country_code: '',
      is_active: true
    });
  };

  // Render cell content
  const renderCell = (item: AddressSpecies, column: typeof columns[0]) => {
    const value = item[column.key];
    const isEditing = editingCell?.id === item.aspecies_id && editingCell?.field === column.key;
    const isReadOnly = column.readOnly;

    if (column.type === 'boolean' && !isReadOnly) {
      return (
        <button
          onClick={() => handleBooleanToggle(item.aspecies_id, column.key, value as boolean | null)}
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
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none"
            autoFocus
          />
          <button onClick={handleCellSave} className="text-green-600 hover:text-green-800">
            ✓
          </button>
          <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">
            ✗
          </button>
        </div>
      );
    }

    return (
      <div
        onClick={() => handleCellClick(item.aspecies_id, column.key, value)}
        className={`cursor-pointer hover:bg-gray-100 px-2 py-1 ${!isReadOnly ? 'cursor-text' : 'cursor-default'}`}
      >
        {column.type === 'datetime' && value ? 
          new Date(value).toLocaleString() : 
          value?.toString() || ''
        }
      </div>
    );
  };

  // Pagination Controls Component
  const PaginationControls = () => (
    <div className="flex items-center space-x-4">
      {/* Items per page */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Per page:</span>
        <div className="inline-flex" role="group">
          {[10, 20, 50, 100, 200, 500, -1].map((value, index) => (
            <button
              key={value}
              onClick={() => {
                setItemsPerPage(value === -1 ? filteredAndSortedData.length : value);
                setCurrentPage(1);
              }}
              className={`
                px-3 py-2 text-sm font-medium border border-gray-300
                ${itemsPerPage === (value === -1 ? filteredAndSortedData.length : value) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                ${index === 0 ? 'rounded-l-md' : ''}
                ${index === 6 ? 'rounded-r-md' : ''}
                ${index > 0 ? 'border-l-0' : ''}
                transition-colors duration-150 cursor-pointer
              `}
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              {value === -1 ? 'All' : value}
            </button>
          ))}
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Page:</span>
        <div className="inline-flex" role="group">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-md
              ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`
                  px-3 py-2 text-sm font-medium border border-gray-300 border-l-0
                  ${currentPage === pageNum ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                  transition-colors duration-150 cursor-pointer
                `}
                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 border-l-0 rounded-r-md
              ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading address species...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top Header Area */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 border-t-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <NubraTablefaceKite tableType="address-species-grid" />
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
          <div className="flex items-center space-x-2">
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

      {/* Table */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left border border-gray-200" style={{ width: '50px' }}>
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      if (selectedRows.size === paginatedData.length && paginatedData.length > 0) {
                        setSelectedRows(new Set());
                      } else {
                        setSelectedRows(new Set(paginatedData.map(item => item.aspecies_id)));
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ width: '20px', height: '20px' }}
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={() => {}} // Handled by div onClick
                    />
                  </div>
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="text-left cursor-pointer hover:bg-gray-100 border border-gray-200 px-2 py-1"
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-xs lowercase">{column.label}</span>
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
                <tr key={item.aspecies_id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 border border-gray-200">
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        const newSelected = new Set(selectedRows);
                        if (newSelected.has(item.aspecies_id)) {
                          newSelected.delete(item.aspecies_id);
                        } else {
                          newSelected.add(item.aspecies_id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ width: '20px', height: '20px' }}
                        checked={selectedRows.has(item.aspecies_id)}
                        onChange={() => {}} // Handled by div onClick
                      />
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

      {/* Bottom Pagination */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage), filteredAndSortedData.length)} of {filteredAndSortedData.length} records
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>
            <PaginationControls />
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Address Species</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Species Name</label>
                <input
                  type="text"
                  value={formData.aspecies_name}
                  onChange={(e) => setFormData({ ...formData, aspecies_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="US Standard, UK Postal, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Species Code</label>
                <input
                  type="text"
                  value={formData.aspecies_code}
                  onChange={(e) => setFormData({ ...formData, aspecies_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="US, UK, CA, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Format</label>
                <textarea
                  value={formData.address_format}
                  onChange={(e) => setFormData({ ...formData, address_format: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Street Address&#10;City, State ZIP"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country Code</label>
                <input
                  type="text"
                  value={formData.country_code}
                  onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="USA, GBR, CAN, etc."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}