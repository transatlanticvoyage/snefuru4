'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface FilegunFolder {
  folder_id: number;
  folder_path: string | null;
  folder_name: string | null;
  folder_parent_path: string | null;
  depth: number | null;
  file_system_created: string | null;
  file_system_modified: string | null;
  last_accessed_at: string | null;
  last_sync_at: string | null;
  is_protected: boolean | null;
  permissions: string | null;
  checksum: string | null;
  sync_status: string | null;
  is_pinned: boolean | null;
}

interface FilegunFoldersTableConfig {
  // Display options
  showHeader?: boolean;
  showPagination?: boolean;
  showSearch?: boolean;
  showCreateButtons?: boolean;
  showNubraKite?: boolean;
  
  // Functional options
  enableInlineEdit?: boolean;
  enableRowSelection?: boolean;
  
  // Data filtering
  filterFolderPaths?: string[];
  
  // Pagination defaults
  defaultItemsPerPage?: number;
  
  // Custom styling
  containerClassName?: string;
  tableClassName?: string;
}

interface FilegunFoldersTableProps {
  config?: FilegunFoldersTableConfig;
}

const DEFAULT_CONFIG: FilegunFoldersTableConfig = {
  showHeader: true,
  showPagination: true,
  showSearch: true,
  showCreateButtons: true,
  showNubraKite: true,
  enableInlineEdit: true,
  enableRowSelection: true,
  defaultItemsPerPage: 100,
  containerClassName: '',
  tableClassName: ''
};

export default function FilegunFoldersTable({ config = {} }: FilegunFoldersTableProps) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [data, setData] = useState<FilegunFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(finalConfig.defaultItemsPerPage!);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof FilegunFolder>('file_system_created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  const supabase = createClientComponentClient();
  
  // Column definitions with proper grouping and widths
  const columns: Array<{ 
    key: keyof FilegunFolder; 
    type: string; 
    width: string; 
    group?: string; 
    separator?: 'right';
    label: string;
  }> = [
    { key: 'folder_id', type: 'integer', width: '80px', label: 'folder_id' },
    { key: 'folder_name', type: 'text', width: '200px', label: 'folder_name' },
    { key: 'folder_path', type: 'text', width: '300px', label: 'folder_path' },
    { key: 'folder_parent_path', type: 'text', width: '250px', label: 'folder_parent_path' },
    { key: 'depth', type: 'integer', width: '80px', label: 'depth', separator: 'right' },
    { key: 'is_protected', type: 'boolean', width: '60px', group: 'booleans', label: 'is_protected' },
    { key: 'is_pinned', type: 'boolean', width: '60px', group: 'booleans', label: 'is_pinned', separator: 'right' },
    { key: 'permissions', type: 'text', width: '100px', label: 'permissions' },
    { key: 'checksum', type: 'text', width: '200px', label: 'checksum' },
    { key: 'sync_status', type: 'text', width: '100px', label: 'sync_status', separator: 'right' },
    { key: 'file_system_created', type: 'timestamp', width: '180px', label: 'file_system_created' },
    { key: 'file_system_modified', type: 'timestamp', width: '180px', label: 'file_system_modified' },
    { key: 'last_accessed_at', type: 'timestamp', width: '180px', label: 'last_accessed_at' },
    { key: 'last_sync_at', type: 'timestamp', width: '180px', label: 'last_sync_at' }
  ];
  
  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('filegun_folders')
        .select('*')
        .order('file_system_created', { ascending: false });
      
      // Apply path filtering if specified
      if (finalConfig.filterFolderPaths && finalConfig.filterFolderPaths.length > 0) {
        query = query.in('folder_path', finalConfig.filterFolderPaths);
      }
        
      const { data: tableData, error: fetchError } = await query;
        
      if (fetchError) throw fetchError;
      setData(tableData || []);
    } catch (err) {
      console.error('Error fetching filegun folders:', err);
      setError('Failed to fetch filegun folders');
    } finally {
      setLoading(false);
    }
  };
  
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
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof FilegunFolder) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle inline editing
  const handleCellClick = (id: number, field: string, currentValue: any) => {
    if (!finalConfig.enableInlineEdit || field === 'folder_id') {
      return; // Don't allow editing these fields
    }
    
    const column = columns.find(col => col.key === field);
    if (column?.type === 'boolean') {
      handleBooleanToggle(id, field as keyof FilegunFolder, currentValue as boolean | null);
      return;
    }
    
    setEditingCell({ id, field });
    setEditingValue(currentValue?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    let processedValue: any = editingValue;

    // Process value based on field type
    const column = columns.find(col => col.key === field);
    if (column?.type === 'integer') {
      processedValue = editingValue === '' ? null : parseInt(editingValue);
      if (isNaN(processedValue)) {
        processedValue = null;
      }
    } else if (column?.type === 'boolean') {
      processedValue = editingValue === 'true';
    } else if (editingValue === '') {
      processedValue = null;
    }

    await updateField(id, field as keyof FilegunFolder, processedValue);
    setEditingCell(null);
    setEditingValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const handleBooleanToggle = async (id: number, field: keyof FilegunFolder, currentValue: boolean | null) => {
    const newValue = currentValue === null ? true : !currentValue;
    await updateField(id, field, newValue);
  };

  const updateField = async (id: number, field: keyof FilegunFolder, value: any) => {
    try {
      const { error } = await supabase
        .from('filegun_folders')
        .update({ [field]: value })
        .eq('folder_id', id);

      if (error) {
        console.error('Error updating field:', error);
        return;
      }

      // Update local state
      setData(prev => prev.map(item => 
        item.folder_id === id ? { ...item, [field]: value } : item
      ));
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  // Create new record inline
  const createNewFolderInline = async () => {
    try {
      const { data: newRecord, error } = await supabase
        .from('filegun_folders')
        .insert({
          folder_path: null,
          folder_name: null,
          folder_parent_path: null,
          depth: null,
          file_system_created: new Date().toISOString(),
          file_system_modified: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
          is_protected: false,
          permissions: null,
          checksum: null,
          sync_status: 'synced',
          is_pinned: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new folder record:', error);
        return;
      }

      // Add the new record to the local state
      setData(prev => [newRecord, ...prev]);
      
      // Reset to first page to show the new record
      setCurrentPage(1);
    } catch (error) {
      console.error('Error creating new folder record:', error);
    }
  };

  // Render cell content
  const renderCell = (item: FilegunFolder, column: typeof columns[0]) => {
    const value = item[column.key];
    const isEditing = editingCell?.id === item.folder_id && editingCell?.field === column.key;
    const isReadOnly = column.key === 'folder_id' || !finalConfig.enableInlineEdit;

    if (column.type === 'boolean' && !isReadOnly) {
      return (
        <button
          onClick={() => handleBooleanToggle(item.folder_id, column.key as keyof FilegunFolder, value as boolean | null)}
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
          <textarea
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCellSave();
              }
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            autoFocus
            rows={1}
          />
          <button
            onClick={handleCellSave}
            className="text-green-600 hover:text-green-800 text-sm"
            title="Save"
          >
            ✓
          </button>
          <button
            onClick={handleCellCancel}
            className="text-red-600 hover:text-red-800 text-sm"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      );
    }

    // Format display value
    let displayValue = '';
    if (column.type === 'timestamp') {
      displayValue = value ? new Date(value as string).toLocaleString() : '';
    } else {
      displayValue = value?.toString() || '';
    }

    return (
      <div
        onClick={() => !isReadOnly && handleCellClick(item.folder_id, column.key, value)}
        className={`min-w-[30px] min-h-[1.25rem] px-1 py-0.5 rounded break-words ${
          !isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
        } ${isReadOnly ? 'text-gray-500' : ''}`}
        style={{ maxWidth: '200px', wordWrap: 'break-word', overflowWrap: 'break-word' }}
        title={isReadOnly ? displayValue : `${displayValue} (Click to edit)`}
      >
        {displayValue}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading FileGun Folders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  // Pagination component
  const PaginationControls = () => {
    if (!finalConfig.showPagination || totalPages <= 1) return null;
    
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

  return (
    <div className={`w-full ${finalConfig.containerClassName}`}>
      {/* Header Section */}
      {finalConfig.showHeader && (
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">📁 FileGun Folders</h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Environment: Development Only</div>
              <div className="text-xs text-gray-400">Project: Tregnar</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Area */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 border-t-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} folders
              {finalConfig.enableRowSelection && selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>
            <PaginationControls />
            {finalConfig.showSearch && (
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
            )}
          </div>
          <div className="flex items-center space-x-4">
            {finalConfig.showCreateButtons && (
              <div className="flex space-x-2">
                <button
                  onClick={createNewFolderInline}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors"
                >
                  Create New (Inline)
                </button>
              </div>
            )}
            {finalConfig.showNubraKite && (
              <NubraTablefaceKite text="nubra-tableface-kite" />
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse border border-gray-200 ${finalConfig.tableClassName}`} style={{ minWidth: '2000px' }}>
            <thead className="bg-gray-50">
              <tr>
                {finalConfig.enableRowSelection && (
                  <th className="px-2 py-3 text-left border border-gray-200" style={{ width: '20px' }}>
                    <input
                      type="checkbox"
                      style={{ width: '20px', height: '20px' }}
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(new Set(paginatedData.map(item => item.folder_id)));
                        } else {
                          setSelectedRows(new Set());
                        }
                      }}
                    />
                  </th>
                )}
                {columns.map((column, index) => {
                  const isReadOnly = column.key === 'folder_id';
                  const isFirstInGroup = column.group === 'booleans' && (index === 0 || columns[index - 1].group !== 'booleans');
                  const isLastInGroup = column.group === 'booleans' && (index === columns.length - 1 || columns[index + 1].group !== 'booleans');
                  const hasRightSeparator = column.separator === 'right';
                  
                  return (
                    <th
                      key={column.key}
                      className={`text-left cursor-pointer hover:bg-gray-100 border border-gray-200 px-2 py-1 ${
                        isFirstInGroup ? 'border-l-4 border-l-black' : ''
                      } ${isLastInGroup ? 'border-r-4 border-r-black' : ''} ${
                        hasRightSeparator ? 'border-r-4 border-r-black' : ''
                      }`}
                      style={{ 
                        width: column.width,
                        minWidth: column.width,
                        maxWidth: column.width
                      }}
                      onClick={() => handleSort(column.key)}
                    >
                      <div className="flex items-center space-x-1">
                        <span 
                          className={`font-bold text-xs lowercase ${isReadOnly ? 'text-gray-500' : 'text-gray-900'}`}
                          style={{
                            wordBreak: 'break-all',
                            lineHeight: '1.1',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxHeight: '2.2em'
                          }}
                        >
                          {column.label.toLowerCase()}
                        </span>
                        {!isReadOnly && column.type !== 'boolean' && finalConfig.enableInlineEdit && (
                          <span className="text-blue-500 text-xs" title="Click cells to edit">
                            ✎
                          </span>
                        )}
                        {sortField === column.key && (
                          <span className="text-gray-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.folder_id} className="hover:bg-gray-50">
                  {finalConfig.enableRowSelection && (
                    <td className="px-2 py-3 border border-gray-200">
                      <input
                        type="checkbox"
                        style={{ width: '20px', height: '20px' }}
                        checked={selectedRows.has(item.folder_id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedRows);
                          if (e.target.checked) {
                            newSelected.add(item.folder_id);
                          } else {
                            newSelected.delete(item.folder_id);
                          }
                          setSelectedRows(newSelected);
                        }}
                      />
                    </td>
                  )}
                  {columns.map((column, index) => {
                    const isFirstInGroup = column.group === 'booleans' && (index === 0 || columns[index - 1].group !== 'booleans');
                    const isLastInGroup = column.group === 'booleans' && (index === columns.length - 1 || columns[index + 1].group !== 'booleans');
                    const hasRightSeparator = column.separator === 'right';
                    
                    return (
                      <td
                        key={column.key}
                        className={`text-sm border border-gray-200 px-2 py-1 ${
                          isFirstInGroup ? 'border-l-4 border-l-black' : ''
                        } ${isLastInGroup ? 'border-r-4 border-r-black' : ''} ${
                          hasRightSeparator ? 'border-r-4 border-r-black' : ''
                        }`}
                        style={{ width: column.width }}
                      >
                        {renderCell(item, column)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} folders
              {finalConfig.enableRowSelection && selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>
            <PaginationControls />
            {finalConfig.showSearch && (
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
            )}
          </div>
          <div></div>
        </div>
      </div>
    </div>
  );
}