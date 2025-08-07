'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface DfsLocationRecord {
  location_id: number;
  location_code: number | null;
  location_name: string | null;
  location_code_parent: number | null;
  country_iso_code: string | null;
  location_type: string | null;
  available_sources: string | null;
  is_available_google_ads: boolean | null;
  is_available_bing_ads: boolean | null;
  is_available_google_trends: boolean | null;
  is_available_google_search: boolean | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_updated_by: string | null;
}

const columns = [
  { key: 'location_code', label: 'location_code', type: 'number' },
  { key: 'location_name', label: 'location_name', type: 'text' },
  { key: 'location_code_parent', label: 'location_code_parent', type: 'number' },
  { key: 'country_iso_code', label: 'country_iso_code', type: 'text' },
  { key: 'location_type', label: 'location_type', type: 'text' },
  { key: 'available_sources', label: 'available_sources', type: 'text' },
  { key: 'is_available_google_ads', label: 'is_available_google_ads', type: 'boolean' },
  { key: 'is_available_bing_ads', label: 'is_available_bing_ads', type: 'boolean' },
  { key: 'is_available_google_trends', label: 'is_available_google_trends', type: 'boolean' },
  { key: 'is_available_google_search', label: 'is_available_google_search', type: 'boolean' },
  { key: 'created_at', label: 'created_at', type: 'datetime' },
  { key: 'updated_at', label: 'updated_at', type: 'datetime' },
  { key: 'created_by', label: 'created_by', type: 'text' },
  { key: 'last_updated_by', label: 'last_updated_by', type: 'text' }
];

export default function DfsLocationsTable() {
  const { user } = useAuth();
  const [data, setData] = useState<DfsLocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof DfsLocationRecord>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data for creating
  const [formData, setFormData] = useState({
    location_code: 0,
    location_name: '',
    location_code_parent: 0,
    country_iso_code: '',
    location_type: '',
    available_sources: '',
    is_available_google_ads: false,
    is_available_bing_ads: false,
    is_available_google_trends: false,
    is_available_google_search: false
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
      const { data: locations, error } = await supabase
        .from('dfs_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setData(locations || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
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
  const handleSort = (field: keyof DfsLocationRecord) => {
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
      setSelectedRows(new Set(paginatedData.map(item => item.location_id)));
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

      const { error } = await supabase
        .from('dfs_locations')
        .update({ 
          [editingCell.field]: value,
          last_updated_by: userInternalId
        })
        .eq('location_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.location_id === editingCell.id 
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

  // Handle boolean toggle
  const handleBooleanToggle = async (id: number, field: keyof DfsLocationRecord, currentValue: boolean | null) => {
    if (!userInternalId) return;
    
    const newValue = currentValue === null ? true : !currentValue;
    
    try {
      const { error } = await supabase
        .from('dfs_locations')
        .update({ 
          [field]: newValue,
          last_updated_by: userInternalId
        })
        .eq('location_id', id);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.location_id === id 
            ? { ...item, [field]: newValue, updated_at: new Date().toISOString() }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating boolean field:', error);
      alert('Failed to update field');
    }
  };

  // Create new inline record
  const createNewInline = async () => {
    if (!userInternalId) return;

    try {
      const newRecord = {
        location_code: null,
        location_name: 'New Location',
        location_code_parent: null,
        country_iso_code: null,
        location_type: null,
        available_sources: null,
        is_available_google_ads: false,
        is_available_bing_ads: false,
        is_available_google_trends: false,
        is_available_google_search: false,
        created_by: userInternalId,
        last_updated_by: userInternalId
      };

      const { data: inserted, error } = await supabase
        .from('dfs_locations')
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;

      // Add to local data at the beginning
      setData(prevData => [inserted, ...prevData]);
      
      // Start editing the location_name field immediately
      setTimeout(() => {
        startEditing(inserted.location_id, 'location_name', 'New Location');
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
      const insertData = {
        ...formData,
        location_code: formData.location_code || null,
        location_code_parent: formData.location_code_parent || null,
        created_by: userInternalId,
        last_updated_by: userInternalId
      };
      
      const { error } = await supabase
        .from('dfs_locations')
        .insert([insertData]);
        
      if (error) throw error;
      
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
      location_code: 0,
      location_name: '',
      location_code_parent: 0,
      country_iso_code: '',
      location_type: '',
      available_sources: '',
      is_available_google_ads: false,
      is_available_bing_ads: false,
      is_available_google_trends: false,
      is_available_google_search: false
    });
  };

  // Render cell content
  const renderCell = (item: DfsLocationRecord, column: typeof columns[0]) => {
    const value = item[column.key as keyof DfsLocationRecord];
    const isEditing = editingCell?.id === item.location_id && editingCell?.field === column.key;
    const isReadOnly = column.key === 'location_id' || column.key === 'created_at' || column.key === 'updated_at';

    if (column.type === 'boolean' && !isReadOnly) {
      return (
        <div className="w-full h-full flex items-center justify-center cursor-pointer"
             onClick={() => handleBooleanToggle(item.location_id, column.key as keyof DfsLocationRecord, value as boolean | null)}>
          <button
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
          onClick={() => !isReadOnly && startEditing(item.location_id, column.key, value)}
        >
          {new Date(value as string).toLocaleString()}
        </div>
      );
    }

    if (column.type === 'number' && value !== null) {
      return (
        <div
          className={cellClass}
          onClick={() => !isReadOnly && startEditing(item.location_id, column.key, value)}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      );
    }

    return (
      <div
        className={cellClass}
        onClick={() => !isReadOnly && startEditing(item.location_id, column.key, value)}
      >
        {value?.toString() || ''}
      </div>
    );
  };

  // Pagination Controls Component
  const PaginationControls = () => {
    if (totalPages <= 1 && itemsPerPage !== 0) return null;
    
    return (
      <div className="flex items-center">
        {/* Items per page controls */}
        <div className="flex items-center">
          {[10, 20, 50, 100, 200, 500].map((size, index) => (
            <button
              key={size}
              onClick={() => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
              className={`px-2 py-2.5 text-sm border cursor-pointer ${ 
                index === 0 ? 'rounded-l' : ''
              } ${
                index === 5 ? '' : '-mr-px'
              } ${
                itemsPerPage === size 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white hover:bg-gray-200'
              }`}
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              {size}
            </button>
          ))}
          <button
            onClick={() => {
              setItemsPerPage(0);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-r cursor-pointer ${
              itemsPerPage === 0 
                ? 'bg-blue-500 text-white' 
                : 'bg-white hover:bg-gray-200'
            }`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            All
          </button>
        </div>

        {/* Page navigation controls */}
        {itemsPerPage !== 0 && totalPages > 1 && (
          <div className="flex items-center ml-4">
            {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(currentPage - 5 + i, totalPages - 9 + i));
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-2.5 text-sm border cursor-pointer ${
                    i === 0 ? 'rounded-l' : ''
                  } ${
                    i === Math.min(9, totalPages - 1) ? 'rounded-r' : '-mr-px'
                  } ${
                    currentPage === pageNum 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white hover:bg-gray-200'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading locations...</div>
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
          <table className="w-full border-collapse border border-gray-200" style={{ minWidth: '2000px' }}>
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
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-2 py-3 text-left border border-gray-200 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(column.key as keyof DfsLocationRecord)}
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
                <tr key={item.location_id} className="hover:bg-gray-50">
                  <td className="px-2 py-2 border border-gray-200">
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      style={{ width: '20px', height: '20px' }}
                      onClick={() => handleRowSelect(item.location_id)}
                    >
                      <div
                        className={`w-full h-full border-2 flex items-center justify-center ${
                          selectedRows.has(item.location_id) 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 bg-white'
                        }`}
                        style={{ width: '20px', height: '20px' }}
                      >
                        {selectedRows.has(item.location_id) && (
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
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Location Record</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Code</label>
                  <input
                    type="number"
                    value={formData.location_code}
                    onChange={(e) => setFormData({...formData, location_code: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="2840"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                  <input
                    type="text"
                    value={formData.location_name}
                    onChange={(e) => setFormData({...formData, location_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="United States"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Code Parent</label>
                  <input
                    type="number"
                    value={formData.location_code_parent}
                    onChange={(e) => setFormData({...formData, location_code_parent: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country ISO Code</label>
                  <input
                    type="text"
                    value={formData.country_iso_code}
                    onChange={(e) => setFormData({...formData, country_iso_code: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="US"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
                  <input
                    type="text"
                    value={formData.location_type}
                    onChange={(e) => setFormData({...formData, location_type: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Sources</label>
                  <input
                    type="text"
                    value={formData.available_sources}
                    onChange={(e) => setFormData({...formData, available_sources: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="google_ads,bing_ads"
                  />
                </div>
                
                {/* Boolean Fields */}
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-700 mb-2">Availability Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_available_google_ads}
                          onChange={(e) => setFormData({...formData, is_available_google_ads: e.target.checked})}
                          className="mr-2"
                        />
                        Available for Google Ads
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_available_bing_ads}
                          onChange={(e) => setFormData({...formData, is_available_bing_ads: e.target.checked})}
                          className="mr-2"
                        />
                        Available for Bing Ads
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_available_google_trends}
                          onChange={(e) => setFormData({...formData, is_available_google_trends: e.target.checked})}
                          className="mr-2"
                        />
                        Available for Google Trends
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_available_google_search}
                          onChange={(e) => setFormData({...formData, is_available_google_search: e.target.checked})}
                          className="mr-2"
                        />
                        Available for Google Search
                      </label>
                    </div>
                  </div>
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
                  Create Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}