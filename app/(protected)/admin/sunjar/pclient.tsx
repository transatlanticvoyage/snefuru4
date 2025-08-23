'use client';

// @sun-metadata
// URL: /admin/sunjar
// Title: Sunjar - Sun Row System Management
// Last Sync: 2024-07-30T16:00:00Z

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import { NubraTablefaceKite } from '@/app/utils/nubra-tableface-kite';

interface Sun {
  srs_global_id: number;
  srs_packet_id: number;
  rel_utg_id: string | null;
  rel_mrm_id: number | null;
  created_at: string;
  updated_at: string;
}

interface Moon {
  mrm_id: number;
  mrm_name: string | null;
  mrm_description: string | null;
  mrm_note1: string | null;
  created_at: string;
  updated_at: string;
}

interface SunWithMoon extends Sun {
  moon?: Moon;
}

export default function SunjarClient() {
  const { user } = useAuth();
  const [suns, setSuns] = useState<SunWithMoon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100); // Default to 100 as requested
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{id: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [newSun, setNewSun] = useState<Partial<Sun>>({});
  const [filterMrmId, setFilterMrmId] = useState<string>('');
  const [filterUtgId, setFilterUtgId] = useState<string>('');
  
  const supabase = createClientComponentClient();

  // Define column order and properties - suns table + joined moons data
  const columns: Array<{ key: string; type: string; width: string; separator?: 'right'; moonField?: boolean }> = [
    { key: 'srs_global_id', type: 'integer', width: '80px' },
    { key: 'srs_packet_id', type: 'integer', width: '100px' },
    { key: 'rel_utg_id', type: 'text', width: '150px' },
    { key: 'rel_mrm_id', type: 'integer', width: '100px' },
    { key: 'created_at', type: 'text', width: '180px' },
    { key: 'updated_at', type: 'text', width: '180px', separator: 'right' }, // Black separator after this column
    // Moon columns (joined data)
    { key: 'mrm_id', type: 'integer', width: '80px', moonField: true },
    { key: 'mrm_name', type: 'text', width: '200px', moonField: true },
    { key: 'mrm_description', type: 'text', width: '300px', moonField: true },
    { key: 'mrm_note1', type: 'text', width: '250px', moonField: true },
    { key: 'moon_created_at', type: 'text', width: '180px', moonField: true },
    { key: 'moon_updated_at', type: 'text', width: '180px', moonField: true }
  ];

  useEffect(() => {
    fetchSuns();
  }, []);

  const fetchSuns = async () => {
    try {
      setLoading(true);
      // Fetch suns with joined moons data
      const { data: sunsData, error: sunsError } = await supabase
        .from('suns')
        .select('*')
        .order(sortField as keyof Sun, { ascending: sortOrder === 'asc' });

      if (sunsError) throw sunsError;

      // Fetch all moons for joining
      const { data: moonsData, error: moonsError } = await supabase
        .from('moons')
        .select('*');

      if (moonsError) throw moonsError;

      // Create a map for fast moon lookup
      const moonsMap = new Map<number, Moon>();
      (moonsData || []).forEach(moon => {
        moonsMap.set(moon.mrm_id, moon);
      });

      // Join suns with moons data
      const sunsWithMoons: SunWithMoon[] = (sunsData || []).map(sun => ({
        ...sun,
        moon: sun.rel_mrm_id ? moonsMap.get(sun.rel_mrm_id) : undefined
      }));

      setSuns(sunsWithMoons);
    } catch (error) {
      console.error('Error fetching suns:', error);
      // For development, create some mock data if table doesn't exist
      const mockSuns: SunWithMoon[] = [
        {
          srs_global_id: 1,
          srs_packet_id: 1,
          rel_utg_id: 'group1',
          rel_mrm_id: 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setSuns(mockSuns);
    } finally {
      setLoading(false);
    }
  };

  // Pagination options as requested
  const paginationOptions = [10, 20, 50, 100, 200, 500, 'All'];

  // Get unique rel_mrm_id values for filter dropdown
  const uniqueMrmIds = useMemo(() => {
    const ids = [...new Set(suns.map(sun => sun.rel_mrm_id).filter(id => id !== null))];
    return ids.sort((a, b) => (a || 0) - (b || 0));
  }, [suns]);

  // Get unique rel_utg_id values for filter dropdown
  const uniqueUtgIds = useMemo(() => {
    const ids = [...new Set(suns.map(sun => sun.rel_utg_id).filter(id => id !== null))];
    return ids.sort();
  }, [suns]);

  // Filter and search logic
  const filteredSuns = useMemo(() => {
    let filtered = suns;
    
    if (searchTerm) {
      filtered = filtered.filter(sun => {
        // Search in sun fields
        const sunMatch = Object.values(sun).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
        // Search in moon fields if moon exists
        const moonMatch = sun.moon ? Object.values(sun.moon).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        ) : false;
        return sunMatch || moonMatch;
      });
    }

    // Apply rel_mrm_id filter
    if (filterMrmId && filterMrmId !== 'all') {
      if (filterMrmId === 'null') {
        filtered = filtered.filter(sun => sun.rel_mrm_id === null);
      } else {
        filtered = filtered.filter(sun => sun.rel_mrm_id === parseInt(filterMrmId));
      }
    }

    // Apply rel_utg_id filter
    if (filterUtgId && filterUtgId !== 'all') {
      if (filterUtgId === 'null') {
        filtered = filtered.filter(sun => sun.rel_utg_id === null);
      } else {
        filtered = filtered.filter(sun => sun.rel_utg_id === filterUtgId);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      // Handle moon fields
      if (sortField.startsWith('moon_') || ['mrm_id', 'mrm_name', 'mrm_description', 'mrm_note1'].includes(sortField)) {
        if (sortField === 'moon_created_at') {
          aVal = a.moon?.created_at;
          bVal = b.moon?.created_at;
        } else if (sortField === 'moon_updated_at') {
          aVal = a.moon?.updated_at;
          bVal = b.moon?.updated_at;
        } else {
          aVal = a.moon?.[sortField as keyof Moon];
          bVal = b.moon?.[sortField as keyof Moon];
        }
      } else {
        // Handle sun fields
        aVal = a[sortField as keyof Sun];
        bVal = b[sortField as keyof Sun];
      }
      
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
  }, [suns, searchTerm, filterMrmId, filterUtgId, sortField, sortOrder]);

  // Pagination logic
  const totalPages = itemsPerPage === 'All' ? 1 : Math.ceil(filteredSuns.length / (itemsPerPage as number));
  const startIndex = itemsPerPage === 'All' ? 0 : (currentPage - 1) * (itemsPerPage as number);
  const endIndex = itemsPerPage === 'All' ? filteredSuns.length : startIndex + (itemsPerPage as number);
  const paginatedSuns = filteredSuns.slice(startIndex, endIndex);

  // Inline editing handlers
  const handleCellClick = (sunId: number, field: string, value: any) => {
    const column = columns.find(col => col.key === field);
    if (column?.type === 'text' || column?.type === 'integer') {
      // Only allow editing of sun fields, not moon fields (they're read-only joined data)
      if (!column.moonField) {
        setEditingCell({ id: sunId, field });
        setEditValue(value?.toString() || '');
      }
    }
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      const column = columns.find(col => col.key === editingCell.field);
      let processedValue: any = editValue;

      if (column?.type === 'integer') {
        processedValue = editValue === '' ? null : parseInt(editValue);
        if (isNaN(processedValue)) processedValue = null;
      }

      const { error } = await supabase
        .from('suns')
        .update({ [editingCell.field]: processedValue })
        .eq('srs_global_id', editingCell.id);

      if (error) throw error;

      // Update local state
      // Refetch data to ensure consistency with joined moon data
      fetchSuns();

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

  // Create new sun inline
  const handleCreateInline = async () => {
    try {
      // Create a new sun with default values
      const newSunData: Partial<Sun> = {
        rel_utg_id: 'new_group',
        rel_mrm_id: null
        // srs_packet_id will be auto-assigned by trigger
      };

      const { data, error } = await supabase
        .from('suns')
        .insert([newSunData])
        .select()
        .single();

      if (error) throw error;

      // Refetch to get the data with proper join
      fetchSuns();
      
      // Start editing the rel_utg_id field
      setEditingCell({ id: data.srs_global_id, field: 'rel_utg_id' });
      setEditValue('new_group');
    } catch (error) {
      console.error('Error creating sun:', error);
      // For development, add mock data
      const mockId = Math.max(...suns.map(s => s.srs_global_id), 0) + 1;
      const mockSun: SunWithMoon = {
        srs_global_id: mockId,
        srs_packet_id: 1,
        rel_utg_id: 'new_group',
        rel_mrm_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setSuns(prev => [mockSun, ...prev]);
      setEditingCell({ id: mockId, field: 'rel_utg_id' });
      setEditValue('new_group');
    }
  };

  // Checkbox selection handlers
  const handleRowSelect = (sunId: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(sunId)) {
      newSelection.delete(sunId);
    } else {
      newSelection.add(sunId);
    }
    setSelectedRows(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedSuns.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedSuns.map(sun => sun.srs_global_id)));
    }
  };

  // Cell rendering logic
  const renderCell = (item: SunWithMoon, column: typeof columns[0]) => {
    let value: any;
    
    // Get value from appropriate source (sun or moon)
    if (column.moonField) {
      if (column.key === 'moon_created_at') {
        value = item.moon?.created_at;
      } else if (column.key === 'moon_updated_at') {
        value = item.moon?.updated_at;
      } else {
        value = item.moon?.[column.key as keyof Moon];
      }
    } else {
      value = item[column.key as keyof Sun];
    }
    
    const isEditing = editingCell?.id === item.srs_global_id && editingCell?.field === column.key;
    const isReadOnly = column.key === 'srs_global_id' || column.key === 'created_at' || column.key === 'updated_at' || column.moonField;

    // Handle editing state
    if (isEditing) {
      return (
        <input
          type={column.type === 'integer' ? 'number' : 'text'}
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
      // Style moon fields differently to show they're read-only joined data
      const moonFieldClass = column.moonField ? 'text-blue-600 italic' : 'text-gray-600';
      return <span className={moonFieldClass}>{value?.toString() || ''}</span>;
    }

    return (
      <div
        className="cursor-pointer hover:bg-gray-50 p-1 rounded"
        onClick={() => handleCellClick(item.srs_global_id, column.key, value)}
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
          placeholder="Search suns..."
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
          <p className="text-gray-600">Loading suns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <svg 
            className="w-8 h-8 mr-3 text-yellow-500" 
            fill="currentColor" 
            viewBox="0 0 24 24"
            style={{ width: '30px', height: '30px' }}
          >
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
          </svg>
          Sunjar
        </h1>
        <p className="text-gray-600 text-base">
          <span className="font-bold">Sun Row System Management</span>
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

      {/* Nubra Tableface Kite and Filters */}
      <div className="mb-4 flex items-center space-x-6">
        <NubraTablefaceKite text="nubra-tableface-kite" />
        
        {/* rel_utg_id Filter */}
        <div className="flex items-center space-x-2">
          <span className="font-bold text-gray-900">rel_utg_id</span>
          <select
            value={filterUtgId}
            onChange={(e) => {
              setFilterUtgId(e.target.value);
              setCurrentPage(1); // Reset to first page when filtering
            }}
            className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="null">NULL</option>
            {uniqueUtgIds.map((id) => (
              <option key={id} value={id || ''}>
                {id}
              </option>
            ))}
          </select>
        </div>
        
        {/* rel_mrm_id Filter */}
        <div className="flex items-center space-x-2">
          <span className="font-bold text-gray-900">rel_mrm_id</span>
          <select
            value={filterMrmId}
            onChange={(e) => {
              setFilterMrmId(e.target.value);
              setCurrentPage(1); // Reset to first page when filtering
            }}
            className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="null">NULL</option>
            {uniqueMrmIds.map((id) => (
              <option key={id} value={id?.toString() || ''}>
                {id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upper pagination controls */}
      <div className="mb-4 flex justify-start">
        <PaginationControls />
      </div>

      {/* Main table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto" style={{ minWidth: '100%' }}>
          <table className="border-collapse border border-gray-200" style={{ minWidth: '1200px' }}>
            <thead className="bg-gray-50">
              <tr>
                {/* Checkbox column */}
                <th 
                  className="text-left cursor-pointer hover:bg-gray-100 border border-gray-200 px-4 py-3 w-12"
                  onClick={handleSelectAll}
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedSuns.length && paginatedSuns.length > 0}
                      onChange={() => {}} // Handled by th onClick
                      className="w-5 h-5 rounded pointer-events-none"
                      style={{ width: '20px', height: '20px' }}
                    />
                  </div>
                </th>
                
                {columns.map((column) => {
                  let separatorClass = '';
                  
                  if (column.separator === 'right') {
                    separatorClass = ' border-r-4 border-r-black';
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
              {paginatedSuns.map((sun) => (
                <tr key={sun.srs_global_id} className="hover:bg-gray-50">
                  {/* Checkbox column */}
                  <td 
                    className="border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleRowSelect(sun.srs_global_id)}
                  >
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(sun.srs_global_id)}
                        onChange={() => {}} // Handled by td onClick
                        className="w-5 h-5 rounded pointer-events-none"
                        style={{ width: '20px', height: '20px' }}
                      />
                    </div>
                  </td>
                  
                  {columns.map((column) => {
                    let separatorClass = '';
                    
                    if (column.separator === 'right') {
                      separatorClass = ' border-r-4 border-r-black';
                    }

                    return (
                      <td 
                        key={column.key}
                        className={`text-sm border border-gray-200 px-4 py-3${separatorClass}`}
                        style={{ width: column.width, minWidth: column.width }}
                      >
                        {renderCell(sun, column)}
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
      <div className="mt-4 flex justify-start">
        <PaginationControls />
      </div>

      {/* Create popup modal */}
      {showCreatePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Create New Sun</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">UTG ID</label>
                <input
                  type="text"
                  value={newSun.rel_utg_id || ''}
                  onChange={(e) => setNewSun(prev => ({ ...prev, rel_utg_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">MRM ID</label>
                <input
                  type="number"
                  value={newSun.rel_mrm_id || ''}
                  onChange={(e) => setNewSun(prev => ({ ...prev, rel_mrm_id: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={async () => {
                  try {
                    const { data, error } = await supabase
                      .from('suns')
                      .insert([newSun])
                      .select()
                      .single();

                    if (error) throw error;
                    fetchSuns(); // Refetch to get proper joined data
                    setShowCreatePopup(false);
                    setNewSun({});
                  } catch (error) {
                    console.error('Error creating sun:', error);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreatePopup(false);
                  setNewSun({});
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