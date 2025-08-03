'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import { NubraTablefaceKite } from '@/app/utils/nubra-tableface-kite';

interface TableShell {
  tableshell_id: number;
  tableshell_name: string | null;
  flagship_xpage_id: number | null;
  tableshell_tenants: string | null;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  d_xpages_pagepath_url: string | null;
  d_xpages_pagepath_long: string | null;
  d_xpages_pagepath_short: string | null;
  d_xpages_main_url: string | null;
}

export default function TshelljarPage() {
  const { user } = useAuth();
  const [tableshells, setTableshells] = useState<TableShell[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{id: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  
  const supabase = createClientComponentClient();

  // Define columns with proper types and order
  const columns: Array<{ key: keyof TableShell; type: string; width: string }> = [
    { key: 'tableshell_id', type: 'integer', width: '80px' },
    { key: 'tableshell_name', type: 'text', width: '200px' },
    { key: 'flagship_xpage_id', type: 'integer', width: '120px' },
    { key: 'tableshell_tenants', type: 'text', width: '200px' },
    { key: 'description', type: 'text', width: '300px' },
    { key: 'is_active', type: 'boolean', width: '100px' },
    { key: 'd_xpages_pagepath_url', type: 'text', width: '200px' },
    { key: 'd_xpages_pagepath_long', type: 'text', width: '200px' },
    { key: 'd_xpages_pagepath_short', type: 'text', width: '200px' },
    { key: 'd_xpages_main_url', type: 'text', width: '200px' },
    { key: 'created_at', type: 'text', width: '180px' },
    { key: 'updated_at', type: 'text', width: '180px' }
  ];

  useEffect(() => {
    document.title = 'Table Shells';
    fetchTableshells();
  }, []);

  const fetchTableshells = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tableshells')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tableshells:', error);
        return;
      }

      setTableshells(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewTableshellInline = async () => {
    try {
      const { data, error } = await supabase
        .from('tableshells')
        .insert({
          tableshell_name: null,
          flagship_xpage_id: null,
          tableshell_tenants: null,
          description: null,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new tableshell:', error);
        return;
      }

      setTableshells(prev => [data, ...prev]);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error creating new tableshell:', error);
    }
  };

  const updateField = async (id: number, field: keyof TableShell, value: any) => {
    try {
      const { error } = await supabase
        .from('tableshells')
        .update({ [field]: value })
        .eq('tableshell_id', id);

      if (error) {
        console.error('Error updating field:', error);
        return;
      }

      setTableshells(prev => prev.map(item => 
        item.tableshell_id === id ? { ...item, [field]: value } : item
      ));
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  const handleCellClick = (id: number, field: string, currentValue: any) => {
    if (field === 'tableshell_id' || field === 'created_at' || field === 'updated_at' || field.startsWith('d_xpages_')) {
      return; // Don't allow editing these fields
    }
    
    const column = columns.find(col => col.key === field);
    if (column?.type === 'boolean') {
      handleBooleanToggle(id, field as keyof TableShell, currentValue as boolean | null);
      return;
    }
    
    setEditingCell({ id, field });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    let processedValue: any = editValue;

    const column = columns.find(col => col.key === field);
    if (column?.type === 'integer') {
      processedValue = editValue === '' ? null : parseInt(editValue);
      if (isNaN(processedValue)) {
        processedValue = null;
      }
    } else if (editValue === '') {
      processedValue = null;
    }

    await updateField(id, field as keyof TableShell, processedValue);
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleBooleanToggle = async (id: number, field: keyof TableShell, currentValue: boolean | null) => {
    const newValue = currentValue === null ? true : !currentValue;
    await updateField(id, field, newValue);
  };

  // Filter and sort data
  const filteredData = useMemo(() => {
    return tableshells.filter(item => {
      if (!searchTerm) return true;
      return Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [tableshells, searchTerm]);

  // Pagination
  const totalPages = itemsPerPage === filteredData.length ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = itemsPerPage === filteredData.length ? filteredData : filteredData.slice(startIndex, startIndex + itemsPerPage);

  const renderPaginationButtonBar = (type: 'pages' | 'perPage') => {
    if (type === 'perPage') {
      const options = [10, 20, 50, 100, 200, 500, filteredData.length];
      const labels = ['10', '20', '50', '100', '200', '500', 'All'];
      
      return (
        <div className="inline-flex" style={{ fontSize: '14px' }}>
          {options.map((option, index) => (
            <button
              key={option}
              onClick={() => {
                setItemsPerPage(option);
                setCurrentPage(1);
              }}
              className={`px-3 transition-colors cursor-pointer ${
                itemsPerPage === option 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              } border border-gray-300 ${
                index === 0 ? 'rounded-l' : index === options.length - 1 ? 'rounded-r' : ''
              } ${index > 0 ? 'border-l-0' : ''}`}
              style={{ 
                paddingTop: '10px', 
                paddingBottom: '10px',
                borderRadius: index === 0 ? '4px 0 0 4px' : index === options.length - 1 ? '0 4px 4px 0' : '0'
              }}
            >
              {labels[index]}
            </button>
          ))}
        </div>
      );
    } else {
      const pageNumbers = [];
      for (let i = 1; i <= Math.min(10, totalPages); i++) {
        pageNumbers.push(i);
      }
      
      return (
        <div className="inline-flex" style={{ fontSize: '14px' }}>
          {pageNumbers.map((pageNum, index) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-3 transition-colors cursor-pointer ${
                currentPage === pageNum 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              } border border-gray-300 ${
                index === 0 ? 'rounded-l' : index === pageNumbers.length - 1 ? 'rounded-r' : ''
              } ${index > 0 ? 'border-l-0' : ''}`}
              style={{ 
                paddingTop: '10px', 
                paddingBottom: '10px',
                borderRadius: index === 0 ? '4px 0 0 4px' : index === pageNumbers.length - 1 ? '0 4px 4px 0' : '0'
              }}
            >
              {pageNum}
            </button>
          ))}
        </div>
      );
    }
  };

  const renderCell = (item: TableShell, column: typeof columns[0]) => {
    const value = item[column.key];
    const isEditing = editingCell?.id === item.tableshell_id && editingCell?.field === column.key;
    const isReadOnly = column.key === 'tableshell_id' || column.key === 'created_at' || column.key === 'updated_at' || column.key.startsWith('d_xpages_');

    if (column.type === 'boolean' && !isReadOnly) {
      return (
        <div className="flex items-center justify-center">
          <button
            onClick={() => handleBooleanToggle(item.tableshell_id, column.key as keyof TableShell, value as boolean | null)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value === true ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value === true ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      );
    }

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      );
    }

    return (
      <div
        onClick={() => !isReadOnly && handleCellClick(item.tableshell_id, column.key, value)}
        className={`min-w-[30px] min-h-[1.25rem] px-2 py-1 rounded break-words ${
          !isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
        } ${isReadOnly ? 'text-gray-500' : ''}`}
        style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
        title={!isReadOnly ? `${value?.toString() || ''} (Click to edit)` : value?.toString() || ''}
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Table Shells</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={createNewTableshellInline}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
            >
              create new (inline)
            </button>
            <button
              onClick={() => setShowCreatePopup(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
            >
              create new (popup)
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4">
        {/* Top Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {renderPaginationButtonBar('perPage')}
            {renderPaginationButtonBar('pages')}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={() => setSearchTerm('')}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-3 py-2 rounded-md transition-colors"
              style={{ width: '40px', height: '40px' }}
            >
              CL
            </button>
          </div>
        </div>

        {/* Nubra Tableface Kite */}
        <NubraTablefaceKite />

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="text-left border border-gray-200 cursor-pointer hover:bg-gray-100"
                    style={{ width: '40px', padding: '12px' }}
                    onClick={() => {
                      if (selectedRows.size === paginatedData.length && paginatedData.length > 0) {
                        setSelectedRows(new Set());
                      } else {
                        setSelectedRows(new Set(paginatedData.map(item => item.tableshell_id)));
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={() => {}}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </th>
                  {columns.map((column) => {
                    const isReadOnly = column.key === 'tableshell_id' || column.key === 'created_at' || column.key === 'updated_at' || column.key.startsWith('d_xpages_');
                    
                    return (
                      <th
                        key={column.key}
                        className="text-left border border-gray-200 px-4 py-3"
                        style={{ width: column.width }}
                      >
                        <span className={`font-bold text-xs lowercase ${isReadOnly ? 'text-gray-500' : 'text-gray-900'}`}>
                          {column.key}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.map((item) => (
                  <tr key={item.tableshell_id} className="hover:bg-gray-50">
                    <td 
                      className="border border-gray-200 cursor-pointer hover:bg-gray-100"
                      style={{ width: '40px', padding: '12px' }}
                      onClick={() => {
                        const newSelected = new Set(selectedRows);
                        if (selectedRows.has(item.tableshell_id)) {
                          newSelected.delete(item.tableshell_id);
                        } else {
                          newSelected.add(item.tableshell_id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRows.has(item.tableshell_id)}
                        onChange={() => {}}
                        style={{ width: '20px', height: '20px' }}
                      />
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="text-sm border border-gray-200"
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

        {/* Bottom Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            {renderPaginationButtonBar('perPage')}
            {renderPaginationButtonBar('pages')}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={() => setSearchTerm('')}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-3 py-2 rounded-md transition-colors"
              style={{ width: '40px', height: '40px' }}
            >
              CL
            </button>
          </div>
        </div>
      </div>

      {/* Create Popup (placeholder) */}
      {showCreatePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Create New Table Shell</h2>
            <p className="text-gray-600 mb-4">Popup editor will be implemented here</p>
            <button
              onClick={() => setShowCreatePopup(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}