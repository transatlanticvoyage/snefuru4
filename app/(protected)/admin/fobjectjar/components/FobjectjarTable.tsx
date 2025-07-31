'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface UnifiedFobject {
  // Universal fields
  type: 'file' | 'folder';
  id: number; // file_id or folder_id
  name: string; // file_name or folder_name
  path: string; // file_path or folder_path
  parent_path: string | null;
  
  // Conditional fields (null when not applicable)
  size: number | null; // file_size or null for folders
  extension: string | null; // extension or null for folders
  mime_type: string | null; // mime_type or null for folders
  depth: number | null; // depth or null for files
  is_pinned: boolean | null; // is_pinned or null for files
  
  // Common fields
  file_system_created: string;
  file_system_modified: string;
  last_accessed_at: string | null;
  last_sync_at: string | null;
  sync_status: string;
  is_protected: boolean | null;
  permissions: string | null;
  checksum: string | null;
}

export default function FobjectjarTable() {
  const [data, setData] = useState<UnifiedFobject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof UnifiedFobject>('file_system_modified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [typeFilter, setTypeFilter] = useState<'all' | 'file' | 'folder'>('all');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data for creating
  const [formData, setFormData] = useState({
    type: 'file' as 'file' | 'folder',
    name: '',
    path: '',
    parent_path: '',
    size: 0,
    extension: '',
    mime_type: '',
    depth: 0,
    file_system_created: '',
    file_system_modified: '',
    last_accessed_at: '',
    last_sync_at: '',
    is_protected: false,
    permissions: '',
    checksum: '',
    sync_status: 'synced',
    is_pinned: false
  });
  
  const supabase = createClientComponentClient();
  
  // Column definitions with proper grouping and widths
  const columns: Array<{ 
    key: keyof UnifiedFobject; 
    type: string; 
    width: string; 
    group?: string; 
    separator?: 'right';
    label: string;
  }> = [
    { key: 'type', type: 'text', width: '80px', label: 'type' },
    { key: 'name', type: 'text', width: '200px', label: 'name' },
    { key: 'path', type: 'text', width: '300px', label: 'path' },
    { key: 'parent_path', type: 'text', width: '250px', label: 'parent_path' },
    { key: 'size', type: 'integer', width: '100px', label: 'size' },
    { key: 'extension', type: 'text', width: '80px', label: 'extension' },
    { key: 'mime_type', type: 'text', width: '150px', label: 'mime_type' },
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
  
  // Fetch unified data from both tables
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch files and folders in parallel
      const [filesResponse, foldersResponse] = await Promise.all([
        supabase
          .from('filegun_files')
          .select('file_id, file_name, file_path, file_parent_path, file_size, extension, mime_type, file_system_created, file_system_modified, last_accessed_at, last_sync_at, is_protected, permissions, checksum, sync_status')
          .neq('sync_status', 'deleted'),
        supabase
          .from('filegun_folders')
          .select('folder_id, folder_name, folder_path, folder_parent_path, depth, file_system_created, file_system_modified, last_accessed_at, last_sync_at, is_protected, permissions, checksum, sync_status, is_pinned')
          .neq('sync_status', 'deleted')
      ]);
      
      if (filesResponse.error) throw filesResponse.error;
      if (foldersResponse.error) throw foldersResponse.error;
      
      // Transform and combine data
      const files: UnifiedFobject[] = (filesResponse.data || []).map(file => ({
        type: 'file' as const,
        id: file.file_id,
        name: file.file_name || '',
        path: file.file_path || '',
        parent_path: file.file_parent_path,
        size: file.file_size,
        extension: file.extension,
        mime_type: file.mime_type,
        depth: null,
        is_pinned: null,
        file_system_created: file.file_system_created || '',
        file_system_modified: file.file_system_modified || '',
        last_accessed_at: file.last_accessed_at,
        last_sync_at: file.last_sync_at,
        sync_status: file.sync_status || 'synced',
        is_protected: file.is_protected,
        permissions: file.permissions,
        checksum: file.checksum
      }));
      
      const folders: UnifiedFobject[] = (foldersResponse.data || []).map(folder => ({
        type: 'folder' as const,
        id: folder.folder_id,
        name: folder.folder_name || '',
        path: folder.folder_path || '',
        parent_path: folder.folder_parent_path,
        size: null,
        extension: null,
        mime_type: null,
        depth: folder.depth,
        is_pinned: folder.is_pinned,
        file_system_created: folder.file_system_created || '',
        file_system_modified: folder.file_system_modified || '',
        last_accessed_at: folder.last_accessed_at,
        last_sync_at: folder.last_sync_at,
        sync_status: folder.sync_status || 'synced',
        is_protected: folder.is_protected,
        permissions: folder.permissions,
        checksum: folder.checksum
      }));
      
      // Combine and set data
      setData([...files, ...folders]);
      
    } catch (err) {
      console.error('Error fetching fobjects:', err);
      setError('Failed to fetch files and folders');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }
      
      // Search filter
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
  }, [data, searchTerm, sortField, sortOrder, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof UnifiedFobject) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle inline editing
  const handleCellClick = (id: string, field: string, currentValue: any) => {
    if (field === 'id' || field === 'type') {
      return; // Don't allow editing these fields
    }
    
    const column = columns.find(col => col.key === field);
    if (column?.type === 'boolean') {
      handleBooleanToggle(id, field as keyof UnifiedFobject, currentValue as boolean | null);
      return;
    }
    
    setEditingCell({ id, field });
    setEditingValue(currentValue?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    let processedValue: any = editingValue;
    const item = data.find(item => `${item.type}-${item.id}` === id);
    if (!item) return;

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

    await updateField(item, field as keyof UnifiedFobject, processedValue);
    setEditingCell(null);
    setEditingValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const handleBooleanToggle = async (id: string, field: keyof UnifiedFobject, currentValue: boolean | null) => {
    const item = data.find(item => `${item.type}-${item.id}` === id);
    if (!item) return;
    
    const newValue = currentValue === null ? true : !currentValue;
    await updateField(item, field, newValue);
  };

  const updateField = async (item: UnifiedFobject, field: keyof UnifiedFobject, value: any) => {
    try {
      const tableName = item.type === 'file' ? 'filegun_files' : 'filegun_folders';
      const idField = item.type === 'file' ? 'file_id' : 'folder_id';
      const fieldMap = item.type === 'file' ? {
        'name': 'file_name',
        'path': 'file_path',
        'parent_path': 'file_parent_path',
        'size': 'file_size'
      } : {
        'name': 'folder_name',
        'path': 'folder_path',
        'parent_path': 'folder_parent_path'
      };
      
      const dbField = fieldMap[field as keyof typeof fieldMap] || field;

      const { error } = await supabase
        .from(tableName)
        .update({ [dbField]: value })
        .eq(idField, item.id);

      if (error) {
        console.error('Error updating field:', error);
        return;
      }

      // Update local state
      setData(prev => prev.map(prevItem => 
        `${prevItem.type}-${prevItem.id}` === `${item.type}-${item.id}` ? { ...prevItem, [field]: value } : prevItem
      ));
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  // Create new record inline
  const createNewFobjectInline = async (type: 'file' | 'folder') => {
    try {
      if (type === 'file') {
        const { data: newRecord, error } = await supabase
          .from('filegun_files')
          .insert({
            file_path: null,
            file_name: null,
            file_parent_path: null,
            extension: null,
            mime_type: null,
            file_size: null,
            file_system_created: new Date().toISOString(),
            file_system_modified: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
            last_sync_at: new Date().toISOString(),
            is_protected: false,
            permissions: null,
            checksum: null,
            sync_status: 'synced'
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating new file record:', error);
          return;
        }

        // Add to local state
        const newFobject: UnifiedFobject = {
          type: 'file',
          id: newRecord.file_id,
          name: newRecord.file_name || '',
          path: newRecord.file_path || '',
          parent_path: newRecord.file_parent_path,
          size: newRecord.file_size,
          extension: newRecord.extension,
          mime_type: newRecord.mime_type,
          depth: null,
          is_pinned: null,
          file_system_created: newRecord.file_system_created || '',
          file_system_modified: newRecord.file_system_modified || '',
          last_accessed_at: newRecord.last_accessed_at,
          last_sync_at: newRecord.last_sync_at,
          sync_status: newRecord.sync_status || 'synced',
          is_protected: newRecord.is_protected,
          permissions: newRecord.permissions,
          checksum: newRecord.checksum
        };
        
        setData(prev => [newFobject, ...prev]);
      } else {
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

        // Add to local state
        const newFobject: UnifiedFobject = {
          type: 'folder',
          id: newRecord.folder_id,
          name: newRecord.folder_name || '',
          path: newRecord.folder_path || '',
          parent_path: newRecord.folder_parent_path,
          size: null,
          extension: null,
          mime_type: null,
          depth: newRecord.depth,
          is_pinned: newRecord.is_pinned,
          file_system_created: newRecord.file_system_created || '',
          file_system_modified: newRecord.file_system_modified || '',
          last_accessed_at: newRecord.last_accessed_at,
          last_sync_at: newRecord.last_sync_at,
          sync_status: newRecord.sync_status || 'synced',
          is_protected: newRecord.is_protected,
          permissions: newRecord.permissions,
          checksum: newRecord.checksum
        };
        
        setData(prev => [newFobject, ...prev]);
      }
      
      // Reset to first page to show the new record
      setCurrentPage(1);
    } catch (error) {
      console.error('Error creating new record:', error);
    }
  };

  // Render cell content
  const renderCell = (item: UnifiedFobject, column: typeof columns[0]) => {
    const value = item[column.key];
    const itemId = `${item.type}-${item.id}`;
    const isEditing = editingCell?.id === itemId && editingCell?.field === column.key;
    const isReadOnly = column.key === 'id' || column.key === 'type';

    // Handle conditional null values based on type
    const isApplicableField = (field: string, type: 'file' | 'folder') => {
      if (type === 'file') {
        return !['depth', 'is_pinned'].includes(field);
      } else {
        return !['size', 'extension', 'mime_type'].includes(field);
      }
    };

    if (column.type === 'boolean' && !isReadOnly && value !== null) {
      return (
        <button
          onClick={() => handleBooleanToggle(itemId, column.key as keyof UnifiedFobject, value as boolean | null)}
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
    
    if (column.key === 'type') {
      displayValue = value === 'file' ? '📄 file' : '📁 folder';
    } else if (!isApplicableField(column.key, item.type)) {
      displayValue = '—';
    } else if (column.type === 'timestamp') {
      displayValue = value ? new Date(value as string).toLocaleString() : '';
    } else if (column.key === 'size' && value !== null) {
      // Format file size
      const size = value as number;
      if (size < 1024) {
        displayValue = `${size} B`;
      } else if (size < 1024 * 1024) {
        displayValue = `${(size / 1024).toFixed(1)} KB`;
      } else if (size < 1024 * 1024 * 1024) {
        displayValue = `${(size / (1024 * 1024)).toFixed(1)} MB`;
      } else {
        displayValue = `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      }
    } else {
      displayValue = value?.toString() || '';
    }

    const canEdit = !isReadOnly && isApplicableField(column.key, item.type) && column.type !== 'boolean';

    return (
      <div
        onClick={() => canEdit && handleCellClick(itemId, column.key, value)}
        className={`min-w-[30px] min-h-[1.25rem] px-1 py-0.5 rounded break-words ${
          canEdit ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
        } ${isReadOnly ? 'text-gray-500' : ''} ${!isApplicableField(column.key, item.type) ? 'text-gray-400' : ''}`}
        style={{ maxWidth: '200px', wordWrap: 'break-word', overflowWrap: 'break-word' }}
        title={isReadOnly ? displayValue : canEdit ? `${displayValue} (Click to edit)` : displayValue}
      >
        {displayValue}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading FileGun Fobjects...</div>
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
    if (totalPages <= 1) return null;
    
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
    <div className="w-full">
      {/* Top Header Area */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 border-t-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} fobjects
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
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Filter:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'file' | 'folder')}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All</option>
                <option value="file">Files</option>
                <option value="folder">Folders</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => createNewFobjectInline('file')}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors"
              >
                Create New File (Inline)
              </button>
              <button
                onClick={() => createNewFobjectInline('folder')}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors"
              >
                Create New Folder (Inline)
              </button>
            </div>
            <NubraTablefaceKite text="nubra-tableface-kite" />
          </div>
        </div>
        
      </div>

      {/* Table */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200" style={{ minWidth: '2500px' }}>
            <thead className="bg-gray-50">
              {/* Folder DB Column Meta Info Row */}
              <tr className="bg-blue-50">
                <th className="px-2 py-1 text-left border border-gray-200 text-xs font-medium text-gray-600" style={{ width: '20px' }}>
                  📁
                </th>
                {columns.map((column) => {
                  const folderDbColumn = (() => {
                    switch (column.key) {
                      case 'type': return 'derived';
                      case 'name': return 'folder_name';
                      case 'path': return 'folder_path';
                      case 'parent_path': return 'folder_parent_path';
                      case 'size': return '—';
                      case 'extension': return '—';
                      case 'mime_type': return '—';
                      case 'depth': return 'depth';
                      case 'is_protected': return 'is_protected';
                      case 'is_pinned': return 'is_pinned';
                      case 'permissions': return 'permissions';
                      case 'checksum': return 'checksum';
                      case 'sync_status': return 'sync_status';
                      case 'file_system_created': return 'file_system_created';
                      case 'file_system_modified': return 'file_system_modified';
                      case 'last_accessed_at': return 'last_accessed_at';
                      case 'last_sync_at': return 'last_sync_at';
                      default: return column.key;
                    }
                  })();
                  
                  return (
                    <th
                      key={`folder-${column.key}`}
                      className="px-2 py-1 text-left border border-gray-200 text-xs font-medium text-gray-600"
                      style={{ 
                        width: column.width,
                        minWidth: column.width,
                        maxWidth: column.width
                      }}
                    >
                      <span className="text-xs">{folderDbColumn}</span>
                    </th>
                  );
                })}
              </tr>
              
              {/* File DB Column Meta Info Row */}
              <tr className="bg-green-50">
                <th className="px-2 py-1 text-left border border-gray-200 text-xs font-medium text-gray-600" style={{ width: '20px' }}>
                  📄
                </th>
                {columns.map((column) => {
                  const fileDbColumn = (() => {
                    switch (column.key) {
                      case 'type': return 'derived';
                      case 'name': return 'file_name';
                      case 'path': return 'file_path';
                      case 'parent_path': return 'file_parent_path';
                      case 'size': return 'file_size';
                      case 'extension': return 'extension';
                      case 'mime_type': return 'mime_type';
                      case 'depth': return '—';
                      case 'is_protected': return 'is_protected';
                      case 'is_pinned': return '—';
                      case 'permissions': return 'permissions';
                      case 'checksum': return 'checksum';
                      case 'sync_status': return 'sync_status';
                      case 'file_system_created': return 'file_system_created';
                      case 'file_system_modified': return 'file_system_modified';
                      case 'last_accessed_at': return 'last_accessed_at';
                      case 'last_sync_at': return 'last_sync_at';
                      default: return column.key;
                    }
                  })();
                  
                  return (
                    <th
                      key={`file-${column.key}`}
                      className="px-2 py-1 text-left border border-gray-200 text-xs font-medium text-gray-600"
                      style={{ 
                        width: column.width,
                        minWidth: column.width,
                        maxWidth: column.width
                      }}
                    >
                      <span className="text-xs">{fileDbColumn}</span>
                    </th>
                  );
                })}
              </tr>
              
              {/* Main Header Row (existing) */}
              <tr>
                <th className="px-2 py-3 text-left border border-gray-200" style={{ width: '20px' }}>
                  <input
                    type="checkbox"
                    style={{ width: '20px', height: '20px' }}
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(paginatedData.map(item => `${item.type}-${item.id}`)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                  />
                </th>
                {columns.map((column, index) => {
                  const isReadOnly = column.key === 'id' || column.key === 'type';
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
                        {!isReadOnly && column.type !== 'boolean' && (
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
              {paginatedData.map((item) => {
                const itemId = `${item.type}-${item.id}`;
                return (
                  <tr key={itemId} className="hover:bg-gray-50">
                    <td className="px-2 py-3 border border-gray-200">
                      <input
                        type="checkbox"
                        style={{ width: '20px', height: '20px' }}
                        checked={selectedRows.has(itemId)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedRows);
                          if (e.target.checked) {
                            newSelected.add(itemId);
                          } else {
                            newSelected.delete(itemId);
                          }
                          setSelectedRows(newSelected);
                        }}
                      />
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} fobjects
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
          <div></div>
        </div>
      </div>
    </div>
  );
}