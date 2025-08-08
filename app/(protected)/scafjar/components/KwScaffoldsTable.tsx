'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface KwScaffoldRecord {
  scaffold_global_id: number;
  scaffold_datum: string | null;
  rel_industry_id: number | null;
  scaffold_packet_id: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_updated_by: string | null;
}

interface Industry {
  industry_id: number;
  industry_name: string;
  industry_description: string | null;
  created_at: string;
  updated_at: string;
}

const columns = [
  { key: 'scaffold_global_id', label: 'scaffold_global_id', type: 'number', readonly: true },
  { key: 'scaffold_datum', label: 'scaffold_datum', type: 'text' },
  { key: 'rel_industry_id', label: 'rel_industry_id', type: 'industry_dropdown' },
  { key: 'scaffold_packet_id', label: 'scaffold_packet_id', type: 'number', readonly: true },
  { key: 'created_at', label: 'created_at', type: 'datetime', readonly: true },
  { key: 'updated_at', label: 'updated_at', type: 'datetime', readonly: true },
  { key: 'created_by', label: 'created_by', type: 'text', readonly: true },
  { key: 'last_updated_by', label: 'last_updated_by', type: 'text', readonly: true }
];

export default function KwScaffoldsTable() {
  const { user } = useAuth();
  const [data, setData] = useState<KwScaffoldRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof KwScaffoldRecord>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Industry dropdown states
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState<{ field: string; recordId: number } | null>(null);
  
  // Form data for creating
  const [formData, setFormData] = useState({
    scaffold_datum: '',
    rel_industry_id: 0
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
      const { data: scaffolds, error } = await supabase
        .from('kw_scaffolds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setData(scaffolds || []);
    } catch (err) {
      console.error('Error fetching scaffolds:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch industries data
  const fetchIndustries = async () => {
    try {
      const { data: industriesData, error } = await supabase
        .from('industries')
        .select('*')
        .order('industry_name', { ascending: true });

      if (error) throw error;
      
      setIndustries(industriesData || []);
    } catch (err) {
      console.error('Error fetching industries:', err);
    }
  };

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (industryDropdownOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
          setIndustryDropdownOpen(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [industryDropdownOpen]);

  useEffect(() => {
    fetchData();
    fetchIndustries();
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
  const handleSort = (field: keyof KwScaffoldRecord) => {
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
      setSelectedRows(new Set(paginatedData.map(item => item.scaffold_global_id)));
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

      const updateData: any = { 
        [editingCell.field]: value,
        last_updated_by: userInternalId
      };

      const { error } = await supabase
        .from('kw_scaffolds')
        .update(updateData)
        .eq('scaffold_global_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.scaffold_global_id === editingCell.id 
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
        scaffold_datum: 'New Scaffold Template',
        rel_industry_id: null,
        created_by: userInternalId,
        last_updated_by: userInternalId
      };

      const { data: inserted, error } = await supabase
        .from('kw_scaffolds')
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;

      // Add to local data at the beginning
      setData(prevData => [inserted, ...prevData]);
      
      // Start editing the scaffold_datum field immediately
      setTimeout(() => {
        startEditing(inserted.scaffold_global_id, 'scaffold_datum', 'New Scaffold Template');
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
        scaffold_datum: formData.scaffold_datum || null,
        rel_industry_id: formData.rel_industry_id || null,
        created_by: userInternalId,
        last_updated_by: userInternalId
      };
      
      const { error } = await supabase
        .from('kw_scaffolds')
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
      scaffold_datum: '',
      rel_industry_id: 0
    });
  };

  // Industry dropdown handlers
  const handleIndustryDropdownClick = (field: string, recordId: number) => {
    if (industryDropdownOpen?.field === field && industryDropdownOpen?.recordId === recordId) {
      setIndustryDropdownOpen(null);
    } else {
      setIndustryDropdownOpen({ field, recordId });
    }
  };

  const handleIndustrySelect = async (industryId: number | null, field: string, recordId: number) => {
    try {
      console.log('Updating industry:', { industryId, field, recordId });
      
      if (!userInternalId) {
        console.error('User internal ID not available');
        return;
      }

      const updateData: any = { 
        [field]: industryId,
        last_updated_by: userInternalId
      };

      const { error } = await supabase
        .from('kw_scaffolds')
        .update(updateData)
        .eq('scaffold_global_id', recordId);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.scaffold_global_id === recordId 
            ? { ...item, [field]: industryId, updated_at: new Date().toISOString() }
            : item
        )
      );

      setIndustryDropdownOpen(null);
    } catch (err: any) {
      console.error('Error updating industry:', err);
      alert(`Failed to update industry: ${err.message}`);
    }
  };

  // Render cell content
  const renderCell = (item: KwScaffoldRecord, column: typeof columns[0]) => {
    const value = item[column.key as keyof KwScaffoldRecord];
    const isEditing = editingCell?.id === item.scaffold_global_id && editingCell?.field === column.key;
    const isReadOnly = column.readonly;

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
          onClick={() => !isReadOnly && startEditing(item.scaffold_global_id, column.key, value)}
        >
          {new Date(value as string).toLocaleString()}
        </div>
      );
    }

    if (column.type === 'industry_dropdown') {
      const isIndustryDropdownOpen = industryDropdownOpen?.field === column.key && industryDropdownOpen?.recordId === item.scaffold_global_id;
      const selectedIndustry = value ? industries.find(ind => ind.industry_id === value) : null;
      
      return (
        <div className="relative">
          <div
            className="px-2 py-1 cursor-pointer hover:bg-blue-50 text-xs border border-gray-300 rounded bg-white min-h-[28px] flex items-center"
            onClick={() => handleIndustryDropdownClick(column.key, item.scaffold_global_id)}
          >
            <span className={`flex-1 ${!selectedIndustry ? 'text-gray-400' : 'text-gray-900'}`}>
              {selectedIndustry ? selectedIndustry.industry_name : 'Select Industry'}
            </span>
            <span className="ml-2 text-gray-400">▼</span>
          </div>

          {/* Industry Dropdown Menu */}
          {isIndustryDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-3">
                <div className="text-sm font-medium text-gray-700 mb-2">Select Industry</div>
                
                {/* None Option */}
                <button
                  onClick={() => handleIndustrySelect(null, column.key, item.scaffold_global_id)}
                  className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded mb-1"
                >
                  <div className="font-medium text-gray-600">None</div>
                  <div className="text-xs text-gray-500">No industry assigned</div>
                </button>

                {/* Industries Table */}
                {industries.length > 0 ? (
                  <div className="border border-gray-200 rounded">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-2 py-1 text-left font-medium text-gray-700">ID</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-700">Name</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-700">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {industries.map((industry) => (
                            <tr
                              key={industry.industry_id}
                              onClick={() => handleIndustrySelect(industry.industry_id, column.key, item.scaffold_global_id)}
                              className="hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <td className="px-2 py-2">
                                <div className="font-medium text-gray-900">
                                  {industry.industry_id}
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <div className="truncate max-w-32" title={industry.industry_name}>
                                  {industry.industry_name}
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <div className="truncate max-w-48" title={industry.industry_description || ''}>
                                  {industry.industry_description || 'No description'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <div>No industries found</div>
                    <div className="text-xs mt-1">Add industries to the database</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (column.type === 'number' && value !== null) {
      return (
        <div
          className={cellClass}
          onClick={() => !isReadOnly && startEditing(item.scaffold_global_id, column.key, value)}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      );
    }

    return (
      <div
        className={cellClass}
        onClick={() => !isReadOnly && startEditing(item.scaffold_global_id, column.key, value)}
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
        <div className="text-gray-500">Loading scaffolds...</div>
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
          <table className="w-full border-collapse border border-gray-200" style={{ minWidth: '1500px' }}>
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
                    onClick={() => handleSort(column.key as keyof KwScaffoldRecord)}
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
                <tr key={item.scaffold_global_id} className="hover:bg-gray-50">
                  <td className="px-2 py-2 border border-gray-200">
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      style={{ width: '20px', height: '20px' }}
                      onClick={() => handleRowSelect(item.scaffold_global_id)}
                    >
                      <div
                        className={`w-full h-full border-2 flex items-center justify-center ${
                          selectedRows.has(item.scaffold_global_id) 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 bg-white'
                        }`}
                        style={{ width: '20px', height: '20px' }}
                      >
                        {selectedRows.has(item.scaffold_global_id) && (
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
            <h3 className="text-lg font-semibold mb-4">Create New Keyword Scaffold</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scaffold Template</label>
                  <textarea
                    value={formData.scaffold_datum}
                    onChange={(e) => setFormData({...formData, scaffold_datum: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                    placeholder="Enter scaffold template like: best (service) in (city)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use placeholders like (city), (state), (service) that will be replaced with actual values
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select
                    value={formData.rel_industry_id || ''}
                    onChange={(e) => setFormData({...formData, rel_industry_id: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select an industry</option>
                    {industries.map((industry) => (
                      <option key={industry.industry_id} value={industry.industry_id}>
                        {industry.industry_name} (ID: {industry.industry_id})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Reference to the industries table (packet IDs are scoped per industry)
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Scaffold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}