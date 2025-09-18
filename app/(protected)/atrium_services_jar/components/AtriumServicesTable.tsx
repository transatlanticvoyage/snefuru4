'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import { useAuth } from '@/app/context/AuthContext';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface AtriumService {
  atrservice_id: number;
  atrservice_name: string | null;
  suggested_url_slug: string | null;
  fk_industry_id: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

interface Industry {
  industry_id: number;
  industry_name: string | null;
}

export default function AtriumServicesTable() {
  const [data, setData] = useState<AtriumService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof AtriumService>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Industry filter states
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(null);
  
  // Bulk creation state
  const [bulkData, setBulkData] = useState<string>('');
  const [gridData, setGridData] = useState<Array<{atrservice_name: string, suggested_url_slug: string}>>(() => 
    Array(15).fill(null).map(() => ({ atrservice_name: '', suggested_url_slug: '' }))
  );
  
  // Form data for creating
  const [formData, setFormData] = useState({
    atrservice_name: '',
    suggested_url_slug: '',
    fk_industry_id: ''
  });

  const supabase = createClientComponentClient();
  const { user } = useAuth();

  // Fetch industries data from Supabase
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

  // Fetch data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: servicesData, error } = await supabase
        .from('atrium_services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(servicesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchIndustries();
  }, []);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;
    
    // Filter by selected industry
    if (selectedIndustryId !== null) {
      filtered = filtered.filter(item => item.fk_industry_id === selectedIndustryId);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
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
  }, [data, searchTerm, sortField, sortOrder, selectedIndustryId]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage));
  const startIndex = (currentPage - 1) * (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage);
  const paginatedData = itemsPerPage === -1 ? filteredAndSortedData : filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof AtriumService) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle cell editing
  const handleCellClick = (id: number, field: string, value: any) => {
    if (field === 'atrservice_id' || field === 'created_at' || field === 'created_by') return; // Read-only fields
    
    setEditingCell({ id, field });
    setEditingValue(value?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      const processedValue = editingValue === '' ? null : editingValue;

      const { error } = await supabase
        .from('atrium_services')
        .update({ 
          [editingCell.field]: processedValue,
          updated_at: new Date().toISOString()
        })
        .eq('atrservice_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.atrservice_id === editingCell.id 
          ? { ...item, [editingCell.field]: processedValue, updated_at: new Date().toISOString() }
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

  // Create new record inline
  const createNewRecordInline = async () => {
    try {
      const newRecord = {
        atrservice_name: 'New Service',
        created_by: user?.id || null
      };

      const { data: insertedData, error } = await supabase
        .from('atrium_services')
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;

      // Add to local data at the beginning
      setData([insertedData, ...data]);
      
      // Set first editable cell to editing mode
      setEditingCell({ id: insertedData.atrservice_id, field: 'atrservice_name' });
      setEditingValue('New Service');
    } catch (err) {
      console.error('Error creating record:', err);
      alert('Failed to create record');
    }
  };

  // Handle popup form submission
  const handleCreateSubmit = async () => {
    try {
      const insertData = {
        atrservice_name: formData.atrservice_name?.trim() || null,
        suggested_url_slug: formData.suggested_url_slug?.trim() || null,
        fk_industry_id: formData.fk_industry_id?.trim() ? parseInt(formData.fk_industry_id) : null,
        created_by: user?.id || null
      };
      
      const { data: insertedData, error } = await supabase
        .from('atrium_services')
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
      atrservice_name: '',
      suggested_url_slug: '',
      fk_industry_id: ''
    });
  };

  // Handle bulk creation
  const handleBulkCreate = async () => {
    if (!selectedIndustryId) return;
    
    // Filter out empty rows
    const validRows = gridData.filter(row => 
      row.atrservice_name.trim() !== '' || row.suggested_url_slug.trim() !== ''
    );
    
    if (validRows.length === 0) return;
    
    try {
      const recordsToInsert = validRows.map(row => ({
        atrservice_name: row.atrservice_name.trim() || null,
        suggested_url_slug: row.suggested_url_slug.trim() || null,
        fk_industry_id: selectedIndustryId,
        created_by: user?.id || null
      }));

      const { data: insertedData, error } = await supabase
        .from('atrium_services')
        .insert(recordsToInsert)
        .select();

      if (error) throw error;

      // Add to local data
      setData([...insertedData, ...data]);
      setIsBulkCreateModalOpen(false);
      
      // Reset grid
      setGridData(Array(15).fill(null).map(() => ({ atrservice_name: '', suggested_url_slug: '' })));
    } catch (err) {
      console.error('Error bulk creating records:', err);
      alert('Failed to bulk create records');
    }
  };

  // Handle grid cell updates
  const updateGridCell = (rowIndex: number, column: 'atrservice_name' | 'suggested_url_slug', value: string) => {
    setGridData(prev => prev.map((row, index) => 
      index === rowIndex ? { ...row, [column]: value } : row
    ));
  };

  // Handle paste event for grid
  const handleGridPaste = (e: React.ClipboardEvent, startRow: number, startCol: 'atrservice_name' | 'suggested_url_slug') => {
    e.preventDefault();
    
    const pasteData = e.clipboardData.getData('text');
    const rows = pasteData.split('\n').filter(row => row.trim() !== '');
    
    setGridData(prev => {
      const newData = [...prev];
      
      rows.forEach((row, rowOffset) => {
        const cells = row.split('\t');
        const targetRowIndex = startRow + rowOffset;
        
        if (targetRowIndex < newData.length) {
          if (startCol === 'atrservice_name' && cells[0] !== undefined) {
            newData[targetRowIndex].atrservice_name = cells[0].trim();
          }
          if (cells[1] !== undefined && targetRowIndex < newData.length) {
            newData[targetRowIndex].suggested_url_slug = cells[1].trim();
          } else if (startCol === 'suggested_url_slug' && cells[0] !== undefined) {
            newData[targetRowIndex].suggested_url_slug = cells[0].trim();
          }
        }
      });
      
      return newData;
    });
  };

  // Render cell content
  const renderCell = (item: AtriumService, field: keyof AtriumService) => {
    const value = item[field];
    const isEditing = editingCell?.id === item.atrservice_id && editingCell?.field === field;
    const isReadOnly = field === 'atrservice_id' || field === 'created_at' || field === 'created_by';

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
        onClick={() => handleCellClick(item.atrservice_id, field, value)}
        className={`cursor-pointer hover:bg-gray-100 px-2 py-1 ${!isReadOnly ? 'cursor-text' : 'cursor-default'}`}
      >
        {field === 'created_at' || field === 'updated_at' ? 
          (value ? new Date(value).toLocaleString() : '') : 
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
        <div className="text-gray-500">Loading atrium services...</div>
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
      {/* Heading Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Atrium Services</h1>
        
        {/* Industry Filter Section */}
        <div className="flex items-center space-x-4">
          <div>
            <div className="font-bold text-base mb-2">Select Industry:</div>
            <select
              value={selectedIndustryId || ''}
              onChange={(e) => {
                setSelectedIndustryId(e.target.value ? parseInt(e.target.value) : null);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Industries</option>
              {industries.map(industry => (
                <option key={industry.industry_id} value={industry.industry_id}>
                  ({industry.industry_id}) - {industry.industry_name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsBulkCreateModalOpen(true)}
            disabled={selectedIndustryId === null}
            className={`px-4 py-2 font-medium rounded-md text-sm transition-colors ${
              selectedIndustryId === null 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            Create New
          </button>
        </div>
      </div>

      {/* Top Controls Area */}
      <div className="bg-white border border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <NubraTablefaceKite tableType="atrium-services-grid" />
            <PaginationControls />
            {/* Search Box */}
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
                onClick={() => setSearchTerm('')}
                className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
                style={{ minWidth: '40px' }}
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
      <div className="bg-white border border-gray-200 border-t-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left border-r border-gray-200" style={{ width: '50px' }}>
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      if (selectedRows.size === paginatedData.length && paginatedData.length > 0) {
                        setSelectedRows(new Set());
                      } else {
                        setSelectedRows(new Set(paginatedData.map(item => item.atrservice_id)));
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
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                  onClick={() => handleSort('atrservice_id')}
                >
                  <span className="font-bold text-xs lowercase">atrservice_id</span>
                  {sortField === 'atrservice_id' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                  onClick={() => handleSort('atrservice_name')}
                >
                  <span className="font-bold text-xs lowercase">atrservice_name</span>
                  {sortField === 'atrservice_name' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                  onClick={() => handleSort('suggested_url_slug')}
                >
                  <span className="font-bold text-xs lowercase">suggested_url_slug</span>
                  {sortField === 'suggested_url_slug' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                  onClick={() => handleSort('fk_industry_id')}
                >
                  <span className="font-bold text-xs lowercase">fk_industry_id</span>
                  {sortField === 'fk_industry_id' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                  onClick={() => handleSort('created_by')}
                >
                  <span className="font-bold text-xs lowercase">created_by</span>
                  {sortField === 'created_by' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                  onClick={() => handleSort('created_at')}
                >
                  <span className="font-bold text-xs lowercase">created_at</span>
                  {sortField === 'created_at' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('updated_at')}
                >
                  <span className="font-bold text-xs lowercase">updated_at</span>
                  {sortField === 'updated_at' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedData.map((item) => (
                <tr key={item.atrservice_id} className="hover:bg-gray-50 border-t border-gray-200">
                  <td className="px-2 py-1 border-r border-gray-200" style={{ width: '50px' }}>
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        const newSelected = new Set(selectedRows);
                        if (newSelected.has(item.atrservice_id)) {
                          newSelected.delete(item.atrservice_id);
                        } else {
                          newSelected.add(item.atrservice_id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ width: '20px', height: '20px' }}
                        checked={selectedRows.has(item.atrservice_id)}
                        onChange={() => {}} // Handled by div onClick
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 border-r border-gray-200">
                    {renderCell(item, 'atrservice_id')}
                  </td>
                  <td className="px-4 py-2 border-r border-gray-200">
                    {renderCell(item, 'atrservice_name')}
                  </td>
                  <td className="px-4 py-2 border-r border-gray-200">
                    {renderCell(item, 'suggested_url_slug')}
                  </td>
                  <td className="px-4 py-2 border-r border-gray-200">
                    {renderCell(item, 'fk_industry_id')}
                  </td>
                  <td className="px-4 py-2 border-r border-gray-200">
                    {renderCell(item, 'created_by')}
                  </td>
                  <td className="px-4 py-2 border-r border-gray-200">
                    {renderCell(item, 'created_at')}
                  </td>
                  <td className="px-4 py-2">
                    {renderCell(item, 'updated_at')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-white border border-gray-200 border-t-0 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <PaginationControls />
            {/* Search Box */}
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
                onClick={() => setSearchTerm('')}
                className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
                style={{ minWidth: '40px' }}
              >
                CL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Service</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                <input
                  type="text"
                  value={formData.atrservice_name}
                  onChange={(e) => setFormData({ ...formData, atrservice_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter service name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suggested URL Slug</label>
                <input
                  type="text"
                  value={formData.suggested_url_slug}
                  onChange={(e) => setFormData({ ...formData, suggested_url_slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter suggested URL slug"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry ID</label>
                <input
                  type="number"
                  value={formData.fk_industry_id}
                  onChange={(e) => setFormData({ ...formData, fk_industry_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter industry ID"
                />
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
                Create Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {isBulkCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
            <h2 className="text-xl font-bold mb-4">Bulk Create Services</h2>
            <p className="text-sm text-gray-600 mb-4">
              Selected Industry: {industries.find(i => i.industry_id === selectedIndustryId)?.industry_name} ({selectedIndustryId})
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spreadsheet Grid - Copy and paste directly from Excel:
              </label>
              <div className="border border-gray-300 rounded-md overflow-hidden">
                {/* Header row */}
                <div className="bg-gray-50 border-b border-gray-300 grid grid-cols-2">
                  <div className="px-3 py-2 border-r border-gray-300 font-medium text-sm">Column A: atrservice_name</div>
                  <div className="px-3 py-2 font-medium text-sm">Column B: suggested_url_slug</div>
                </div>
                
                {/* Data rows */}
                <div className="max-h-96 overflow-y-auto">
                  {gridData.map((row, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-2 border-b border-gray-200 hover:bg-gray-50">
                      <input
                        type="text"
                        value={row.atrservice_name}
                        onChange={(e) => updateGridCell(rowIndex, 'atrservice_name', e.target.value)}
                        onPaste={(e) => handleGridPaste(e, rowIndex, 'atrservice_name')}
                        className="px-3 py-2 border-r border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50"
                        placeholder={rowIndex === 0 ? "Paste here or type..." : ""}
                      />
                      <input
                        type="text"
                        value={row.suggested_url_slug}
                        onChange={(e) => updateGridCell(rowIndex, 'suggested_url_slug', e.target.value)}
                        onPaste={(e) => handleGridPaste(e, rowIndex, 'suggested_url_slug')}
                        className="px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50"
                        placeholder={rowIndex === 0 ? "Paste here or type..." : ""}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Select data in Excel (2 columns), copy (Ctrl+C), then click in the first cell and paste (Ctrl+V). The data will automatically fill the grid.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsBulkCreateModalOpen(false);
                  setGridData(Array(15).fill(null).map(() => ({ atrservice_name: '', suggested_url_slug: '' })));
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCreate}
                disabled={!gridData.some(row => row.atrservice_name.trim() !== '' || row.suggested_url_slug.trim() !== '')}
                className={`px-4 py-2 rounded transition-colors ${
                  !gridData.some(row => row.atrservice_name.trim() !== '' || row.suggested_url_slug.trim() !== '')
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}