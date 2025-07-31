'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface FilegunFile {
  file_id: number;
  file_path: string | null;
  file_name: string | null;
  file_parent_path: string | null;
  extension: string | null;
  mime_type: string | null;
  file_size: number | null;
  encoding: string | null;
  created_at: string;
  modified_at: string | null;
  last_accessed_at: string | null;
  file_system_created: string | null;
  file_system_modified: string | null;
  is_protected: boolean | null;
  permissions: string | null;
  owner_user: string | null;
  owner_group: string | null;
  is_hidden: boolean | null;
  is_executable: boolean | null;
  line_count: number | null;
  character_count: number | null;
  word_count: number | null;
  checksum: string | null;
  content_preview: string | null;
  is_code_file: boolean | null;
  programming_language: string | null;
  git_status: string | null;
  last_git_commit: string | null;
  tags: any;
  custom_metadata: any;
  user_notes: string | null;
  color_label: string | null;
  importance_level: number | null;
  sync_status: string | null;
  last_sync_at: string | null;
}

export default function FilejarTable() {
  const [data, setData] = useState<FilegunFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof FilegunFile>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FilegunFile | null>(null);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data for creating/editing
  const [formData, setFormData] = useState({
    file_path: '',
    file_name: '',
    file_parent_path: '',
    extension: '',
    mime_type: '',
    file_size: 0,
    encoding: '',
    modified_at: '',
    last_accessed_at: '',
    file_system_created: '',
    file_system_modified: '',
    is_protected: false,
    permissions: '',
    owner_user: '',
    owner_group: '',
    is_hidden: false,
    is_executable: false,
    line_count: 0,
    character_count: 0,
    word_count: 0,
    checksum: '',
    content_preview: '',
    is_code_file: false,
    programming_language: '',
    git_status: '',
    last_git_commit: '',
    tags: '',
    custom_metadata: '',
    user_notes: '',
    color_label: '',
    importance_level: 1,
    sync_status: '',
    last_sync_at: ''
  });
  
  const supabase = createClientComponentClient();
  
  // Column definitions with proper grouping and widths
  const columns: Array<{ 
    key: keyof FilegunFile; 
    type: string; 
    width: string; 
    group?: string; 
    separator?: 'right';
    label: string;
  }> = [
    { key: 'file_id', type: 'integer', width: '80px', label: 'file_id' },
    { key: 'file_name', type: 'text', width: '200px', label: 'file_name' },
    { key: 'file_path', type: 'text', width: '300px', label: 'file_path' },
    { key: 'file_parent_path', type: 'text', width: '250px', label: 'file_parent_path' },
    { key: 'extension', type: 'text', width: '80px', label: 'extension' },
    { key: 'mime_type', type: 'text', width: '150px', label: 'mime_type' },
    { key: 'file_size', type: 'integer', width: '100px', label: 'file_size', separator: 'right' },
    { key: 'encoding', type: 'text', width: '100px', label: 'encoding' },
    { key: 'is_protected', type: 'boolean', width: '60px', group: 'booleans', label: 'is_protected' },
    { key: 'is_hidden', type: 'boolean', width: '60px', group: 'booleans', label: 'is_hidden' },
    { key: 'is_executable', type: 'boolean', width: '60px', group: 'booleans', label: 'is_executable' },
    { key: 'is_code_file', type: 'boolean', width: '60px', group: 'booleans', label: 'is_code_file', separator: 'right' },
    { key: 'permissions', type: 'text', width: '100px', label: 'permissions' },
    { key: 'owner_user', type: 'text', width: '120px', label: 'owner_user' },
    { key: 'owner_group', type: 'text', width: '120px', label: 'owner_group', separator: 'right' },
    { key: 'line_count', type: 'integer', width: '80px', label: 'line_count' },
    { key: 'character_count', type: 'integer', width: '100px', label: 'character_count' },
    { key: 'word_count', type: 'integer', width: '80px', label: 'word_count' },
    { key: 'programming_language', type: 'text', width: '100px', label: 'programming_language', separator: 'right' },
    { key: 'checksum', type: 'text', width: '200px', label: 'checksum' },
    { key: 'content_preview', type: 'text', width: '250px', label: 'content_preview' },
    { key: 'git_status', type: 'text', width: '100px', label: 'git_status' },
    { key: 'last_git_commit', type: 'text', width: '200px', label: 'last_git_commit', separator: 'right' },
    { key: 'tags', type: 'json', width: '150px', label: 'tags' },
    { key: 'custom_metadata', type: 'json', width: '200px', label: 'custom_metadata' },
    { key: 'user_notes', type: 'text', width: '200px', label: 'user_notes' },
    { key: 'color_label', type: 'text', width: '100px', label: 'color_label' },
    { key: 'importance_level', type: 'integer', width: '80px', label: 'importance_level' },
    { key: 'sync_status', type: 'text', width: '100px', label: 'sync_status' },
    { key: 'last_sync_at', type: 'timestamp', width: '180px', label: 'last_sync_at', separator: 'right' },
    { key: 'created_at', type: 'timestamp', width: '180px', label: 'created_at' },
    { key: 'modified_at', type: 'timestamp', width: '180px', label: 'modified_at' },
    { key: 'last_accessed_at', type: 'timestamp', width: '180px', label: 'last_accessed_at' },
    { key: 'file_system_created', type: 'timestamp', width: '180px', label: 'file_system_created' },
    { key: 'file_system_modified', type: 'timestamp', width: '180px', label: 'file_system_modified' }
  ];
  
  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from('filegun_files')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (fetchError) throw fetchError;
      setData(tableData || []);
    } catch (err) {
      console.error('Error fetching filegun files:', err);
      setError('Failed to fetch filegun files');
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

  const handleSort = (field: keyof FilegunFile) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle inline editing
  const handleCellClick = (id: number, field: string, currentValue: any) => {
    if (field === 'file_id' || field === 'created_at') {
      return; // Don't allow editing these fields
    }
    
    const column = columns.find(col => col.key === field);
    if (column?.type === 'boolean') {
      handleBooleanToggle(id, field as keyof FilegunFile, currentValue as boolean | null);
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
    } else if (column?.type === 'json') {
      if (editingValue.trim()) {
        try {
          processedValue = JSON.parse(editingValue);
        } catch {
          alert('Invalid JSON format');
          return;
        }
      } else {
        processedValue = null;
      }
    } else if (editingValue === '') {
      processedValue = null;
    }

    await updateField(id, field as keyof FilegunFile, processedValue);
    setEditingCell(null);
    setEditingValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const handleBooleanToggle = async (id: number, field: keyof FilegunFile, currentValue: boolean | null) => {
    const newValue = currentValue === null ? true : !currentValue;
    await updateField(id, field, newValue);
  };

  const updateField = async (id: number, field: keyof FilegunFile, value: any) => {
    try {
      const { error } = await supabase
        .from('filegun_files')
        .update({ [field]: value })
        .eq('file_id', id);

      if (error) {
        console.error('Error updating field:', error);
        return;
      }

      // Update local state
      setData(prev => prev.map(item => 
        item.file_id === id ? { ...item, [field]: value } : item
      ));
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  // Create new record inline
  const createNewFileInline = async () => {
    try {
      const { data: newRecord, error } = await supabase
        .from('filegun_files')
        .insert({
          file_path: null,
          file_name: null,
          file_parent_path: null,
          extension: null,
          mime_type: null,
          file_size: null,
          encoding: null,
          modified_at: null,
          last_accessed_at: null,
          file_system_created: null,
          file_system_modified: null,
          is_protected: false,
          permissions: null,
          owner_user: null,
          owner_group: null,
          is_hidden: false,
          is_executable: false,
          line_count: null,
          character_count: null,
          word_count: null,
          checksum: null,
          content_preview: null,
          is_code_file: false,
          programming_language: null,
          git_status: null,
          last_git_commit: null,
          tags: null,
          custom_metadata: null,
          user_notes: null,
          color_label: null,
          importance_level: 1,
          sync_status: null,
          last_sync_at: null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new file record:', error);
        return;
      }

      // Add the new record to the local state
      setData(prev => [newRecord, ...prev]);
      
      // Reset to first page to show the new record
      setCurrentPage(1);
    } catch (error) {
      console.error('Error creating new file record:', error);
    }
  };

  // Handle create from modal
  const handleCreate = async () => {
    try {
      let tagsData = null;
      if (formData.tags && formData.tags.trim()) {
        try {
          tagsData = JSON.parse(formData.tags);
        } catch (parseError) {
          alert('Invalid JSON in tags field. Please check the format.');
          return;
        }
      }

      let metadataData = null;
      if (formData.custom_metadata && formData.custom_metadata.trim()) {
        try {
          metadataData = JSON.parse(formData.custom_metadata);
        } catch (parseError) {
          alert('Invalid JSON in custom_metadata field. Please check the format.');
          return;
        }
      }
      
      const insertData = {
        file_path: formData.file_path?.trim() || null,
        file_name: formData.file_name?.trim() || null,
        file_parent_path: formData.file_parent_path?.trim() || null,
        extension: formData.extension?.trim() || null,
        mime_type: formData.mime_type?.trim() || null,
        file_size: formData.file_size || null,
        encoding: formData.encoding?.trim() || null,
        modified_at: formData.modified_at?.trim() || null,
        last_accessed_at: formData.last_accessed_at?.trim() || null,
        file_system_created: formData.file_system_created?.trim() || null,
        file_system_modified: formData.file_system_modified?.trim() || null,
        is_protected: formData.is_protected,
        permissions: formData.permissions?.trim() || null,
        owner_user: formData.owner_user?.trim() || null,
        owner_group: formData.owner_group?.trim() || null,
        is_hidden: formData.is_hidden,
        is_executable: formData.is_executable,
        line_count: formData.line_count || null,
        character_count: formData.character_count || null,
        word_count: formData.word_count || null,
        checksum: formData.checksum?.trim() || null,
        content_preview: formData.content_preview?.trim() || null,
        is_code_file: formData.is_code_file,
        programming_language: formData.programming_language?.trim() || null,
        git_status: formData.git_status?.trim() || null,
        last_git_commit: formData.last_git_commit?.trim() || null,
        tags: tagsData,
        custom_metadata: metadataData,
        user_notes: formData.user_notes?.trim() || null,
        color_label: formData.color_label?.trim() || null,
        importance_level: formData.importance_level || 1,
        sync_status: formData.sync_status?.trim() || null,
        last_sync_at: formData.last_sync_at?.trim() || null
      };
      
      const { error: insertError } = await supabase
        .from('filegun_files')
        .insert([insertData]);
        
      if (insertError) throw insertError;
      
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
      file_path: '',
      file_name: '',
      file_parent_path: '',
      extension: '',
      mime_type: '',
      file_size: 0,
      encoding: '',
      modified_at: '',
      last_accessed_at: '',
      file_system_created: '',
      file_system_modified: '',
      is_protected: false,
      permissions: '',
      owner_user: '',
      owner_group: '',
      is_hidden: false,
      is_executable: false,
      line_count: 0,
      character_count: 0,
      word_count: 0,
      checksum: '',
      content_preview: '',
      is_code_file: false,
      programming_language: '',
      git_status: '',
      last_git_commit: '',
      tags: '',
      custom_metadata: '',
      user_notes: '',
      color_label: '',
      importance_level: 1,
      sync_status: '',
      last_sync_at: ''
    });
  };

  // Render cell content
  const renderCell = (item: FilegunFile, column: typeof columns[0]) => {
    const value = item[column.key];
    const isEditing = editingCell?.id === item.file_id && editingCell?.field === column.key;
    const isReadOnly = column.key === 'file_id' || column.key === 'created_at';

    if (column.type === 'boolean' && !isReadOnly) {
      return (
        <button
          onClick={() => handleBooleanToggle(item.file_id, column.key as keyof FilegunFile, value as boolean | null)}
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
            rows={column.type === 'json' ? 3 : 1}
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
    if (column.type === 'json') {
      displayValue = value ? JSON.stringify(value) : '';
    } else if (column.type === 'timestamp') {
      displayValue = value ? new Date(value as string).toLocaleString() : '';
    } else if (column.type === 'integer' && column.key === 'file_size') {
      // Format file size
      const size = value as number;
      if (size === null || size === undefined) {
        displayValue = '';
      } else if (size < 1024) {
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

    return (
      <div
        onClick={() => !isReadOnly && handleCellClick(item.file_id, column.key, value)}
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
        <div className="text-xl">Loading FileGun Files...</div>
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
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} files
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
                onClick={createNewFileInline}
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
            <NubraTablefaceKite text="nubra-tableface-kite" />
          </div>
        </div>
        
      </div>

      {/* Table */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200" style={{ minWidth: '3000px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left border border-gray-200" style={{ width: '20px' }}>
                  <input
                    type="checkbox"
                    style={{ width: '20px', height: '20px' }}
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(paginatedData.map(item => item.file_id)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                  />
                </th>
                {columns.map((column, index) => {
                  const isReadOnly = column.key === 'file_id' || column.key === 'created_at';
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
              {paginatedData.map((item) => (
                <tr key={item.file_id} className="hover:bg-gray-50">
                  <td className="px-2 py-3 border border-gray-200">
                    <input
                      type="checkbox"
                      style={{ width: '20px', height: '20px' }}
                      checked={selectedRows.has(item.file_id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRows);
                        if (e.target.checked) {
                          newSelected.add(item.file_id);
                        } else {
                          newSelected.delete(item.file_id);
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
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} files
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

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New FileGun File Record</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Basic File Info */}
                <div className="md:col-span-3">
                  <h4 className="font-medium text-gray-700 mb-2">Basic File Information</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                  <input
                    type="text"
                    value={formData.file_name}
                    onChange={(e) => setFormData({...formData, file_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="example.txt"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Path</label>
                  <input
                    type="text"
                    value={formData.file_path}
                    onChange={(e) => setFormData({...formData, file_path: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="/path/to/file.txt"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Path</label>
                  <input
                    type="text"
                    value={formData.file_parent_path}
                    onChange={(e) => setFormData({...formData, file_parent_path: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="/path/to"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extension</label>
                  <input
                    type="text"
                    value={formData.extension}
                    onChange={(e) => setFormData({...formData, extension: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="txt"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MIME Type</label>
                  <input
                    type="text"
                    value={formData.mime_type}
                    onChange={(e) => setFormData({...formData, mime_type: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="text/plain"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Size (bytes)</label>
                  <input
                    type="number"
                    value={formData.file_size}
                    onChange={(e) => setFormData({...formData, file_size: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* Boolean Flags */}
                <div className="md:col-span-3 mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">File Properties</h4>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_protected}
                      onChange={(e) => setFormData({...formData, is_protected: e.target.checked})}
                      className="mr-2"
                    />
                    Protected
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_hidden}
                      onChange={(e) => setFormData({...formData, is_hidden: e.target.checked})}
                      className="mr-2"
                    />
                    Hidden
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_executable}
                      onChange={(e) => setFormData({...formData, is_executable: e.target.checked})}
                      className="mr-2"
                    />
                    Executable
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_code_file}
                      onChange={(e) => setFormData({...formData, is_code_file: e.target.checked})}
                      className="mr-2"
                    />
                    Code File
                  </label>
                </div>

                {/* Additional fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Programming Language</label>
                  <input
                    type="text"
                    value={formData.programming_language}
                    onChange={(e) => setFormData({...formData, programming_language: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="javascript"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner User</label>
                  <input
                    type="text"
                    value={formData.owner_user}
                    onChange={(e) => setFormData({...formData, owner_user: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Group</label>
                  <input
                    type="text"
                    value={formData.owner_group}
                    onChange={(e) => setFormData({...formData, owner_group: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="groupname"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Importance Level (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.importance_level}
                    onChange={(e) => setFormData({...formData, importance_level: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color Label</label>
                  <input
                    type="text"
                    value={formData.color_label}
                    onChange={(e) => setFormData({...formData, color_label: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="red, blue, green, etc."
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">User Notes</label>
                <textarea
                  value={formData.user_notes}
                  onChange={(e) => setFormData({...formData, user_notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder="Additional notes about this file..."
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (JSON)</label>
                <textarea
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder='["tag1", "tag2", "category:important"]'
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Metadata (JSON)</label>
                <textarea
                  value={formData.custom_metadata}
                  onChange={(e) => setFormData({...formData, custom_metadata: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder='{"author": "John Doe", "project": "MyApp"}'
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create File Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}