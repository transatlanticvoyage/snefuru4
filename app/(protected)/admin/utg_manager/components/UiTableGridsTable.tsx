'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface UiTableGrid {
  utg_id: string;
  utg_name: string;
  utg_columns_definition_location: string | null;
  utg_description: string | null;
  sheaf_ui_columns_base_foundation: any;
  monolith_of_ui_columns: string | null;
  rel_xpage_id: number | null;
  rel_xpage: string | null;
  main_db_table: string | null;
  sql_view: string | null;
  associated_files: any;
  utg_class: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  sort_order: number;
  horomi_active: boolean;
  vertomi_active: boolean;
  header_rows_definition_fantasy: any;
  filters_notes: string | null;
  pagination_notes: string | null;
  searchbox_notes: string | null;
  utg_columns_definition_file_link: string | null;
}

interface XPage {
  xpage_id: number;
  title1: string | null;
}

export default function UiTableGridsTable() {
  const [data, setData] = useState<UiTableGrid[]>([]);
  const [xpages, setXpages] = useState<XPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(200);
  const [sortField, setSortField] = useState<keyof UiTableGrid | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UiTableGrid | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSecondConfirm, setDeleteSecondConfirm] = useState(false);
  
  // Content viewer modal state
  const [isContentViewerOpen, setIsContentViewerOpen] = useState(false);
  const [contentViewerData, setContentViewerData] = useState<{title: string; content: string; recordId: string} | null>(null);
  const [isContentEditing, setIsContentEditing] = useState(false);
  const [contentEditValue, setContentEditValue] = useState('');
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // UTG ID warning states
  const [utgIdWarningData, setUtgIdWarningData] = useState<{ id: string; field: string; value: string } | null>(null);
  const [showFirstWarning, setShowFirstWarning] = useState(false);
  const [showSecondWarning, setShowSecondWarning] = useState(false);
  
  // JSON Editor states
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);
  const [jsonEditorData, setJsonEditorData] = useState<{ recordId: string; value: string } | null>(null);
  const [jsonEditValue, setJsonEditValue] = useState('');
  
  // Text Editor states (for monolith)
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);
  const [textEditorData, setTextEditorData] = useState<{ recordId: string; value: string; fieldName: string } | null>(null);
  const [textEditValue, setTextEditValue] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    utg_id: '',
    utg_name: '',
    utg_columns_definition_location: '',
    utg_description: '',
    sheaf_ui_columns_base_foundation: '',
    monolith_of_ui_columns: '',
    rel_xpage_id: null as number | null,
    rel_xpage: '',
    main_db_table: '',
    sql_view: '',
    associated_files: '',
    utg_class: '',
    is_active: true,
    sort_order: 0,
    horomi_active: false,
    vertomi_active: false,
    header_rows_definition_fantasy: '',
    filters_notes: '',
    pagination_notes: '',
    searchbox_notes: '',
    utg_columns_definition_file_link: ''
  });
  
  const supabase = createClientComponentClient();
  
  // Fetch data
  useEffect(() => {
    fetchData();
    fetchXpages();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from('utgs')
        .select('*')
        .order('utg_id', { ascending: true });
        
      if (fetchError) throw fetchError;
      setData(tableData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchXpages = async () => {
    try {
      const { data: xpagesData, error: fetchError } = await supabase
        .from('xpages')
        .select('xpage_id, title1')
        .order('xpage_id', { ascending: true });
        
      if (fetchError) throw fetchError;
      setXpages(xpagesData || []);
    } catch (err) {
      console.error('Error fetching xpages:', err);
    }
  };
  
  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => {
      return Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);
  
  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [filteredData, sortField, sortOrder]);
  
  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  
  // Handle sorting
  const handleSort = (field: keyof UiTableGrid) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // Handle create
  const handleCreate = async () => {
    try {
      let associatedFilesData = null;
      if (formData.associated_files && formData.associated_files.trim()) {
        try {
          associatedFilesData = JSON.parse(formData.associated_files);
        } catch (parseError) {
          alert('Invalid JSON in associated_files field. Please check the format.');
          return;
        }
      }

      let headerRowsDefinitionFantasyData = null;
      if (formData.header_rows_definition_fantasy && formData.header_rows_definition_fantasy.trim()) {
        try {
          headerRowsDefinitionFantasyData = JSON.parse(formData.header_rows_definition_fantasy);
        } catch (parseError) {
          alert('Invalid JSON in header_rows_definition_fantasy field. Please check the format.');
          return;
        }
      }

      let sheafUiColumnsBaseFoundationData = null;
      if (formData.sheaf_ui_columns_base_foundation && formData.sheaf_ui_columns_base_foundation.trim()) {
        try {
          sheafUiColumnsBaseFoundationData = JSON.parse(formData.sheaf_ui_columns_base_foundation);
        } catch (parseError) {
          alert('Invalid JSON in sheaf_ui_columns_base_foundation field. Please check the format.');
          return;
        }
      }
      
      const { error: insertError } = await supabase
        .from('utgs')
        .insert([{
          ...formData,
          associated_files: associatedFilesData,
          header_rows_definition_fantasy: headerRowsDefinitionFantasyData,
          sheaf_ui_columns_base_foundation: sheafUiColumnsBaseFoundationData
        }]);
        
      if (insertError) throw insertError;
      
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Handle inline create
  const handleCreateInline = async () => {
    try {
      const { data, error } = await supabase
        .from('utgs')
        .insert({
          utg_id: `new_utg_${Date.now()}`,
          utg_name: 'New UTG'
        })
        .select('*')
        .single();

      if (error) throw error;
      
      // Add the new record to the beginning of the data array
      setData(prev => [data, ...prev]);
      
      // Start editing the utg_name field of the new record
      setTimeout(() => {
        startInlineEdit(data.utg_id, 'utg_name', data.utg_name || '');
      }, 100);
    } catch (err) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Handle edit
  const handleEdit = async () => {
    if (!editingRecord) return;
    
    try {
      let associatedFilesData = null;
      if (formData.associated_files && formData.associated_files.trim()) {
        try {
          associatedFilesData = JSON.parse(formData.associated_files);
        } catch (parseError) {
          alert('Invalid JSON in associated_files field. Please check the format.');
          return;
        }
      }

      let headerRowsDefinitionFantasyData = null;
      if (formData.header_rows_definition_fantasy && formData.header_rows_definition_fantasy.trim()) {
        try {
          headerRowsDefinitionFantasyData = JSON.parse(formData.header_rows_definition_fantasy);
        } catch (parseError) {
          alert('Invalid JSON in header_rows_definition_fantasy field. Please check the format.');
          return;
        }
      }

      let sheafUiColumnsBaseFoundationData = null;
      if (formData.sheaf_ui_columns_base_foundation && formData.sheaf_ui_columns_base_foundation.trim()) {
        try {
          sheafUiColumnsBaseFoundationData = JSON.parse(formData.sheaf_ui_columns_base_foundation);
        } catch (parseError) {
          alert('Invalid JSON in sheaf_ui_columns_base_foundation field. Please check the format.');
          return;
        }
      }
      
      const { error: updateError } = await supabase
        .from('utgs')
        .update({
          ...formData,
          associated_files: associatedFilesData,
          header_rows_definition_fantasy: headerRowsDefinitionFantasyData,
          sheaf_ui_columns_base_foundation: sheafUiColumnsBaseFoundationData
        })
        .eq('utg_id', editingRecord.utg_id);
        
      if (updateError) throw updateError;
      
      setIsEditModalOpen(false);
      setEditingRecord(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error updating record:', err);
      alert(`Failed to update record: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Handle delete
  const handleDelete = async (id: string) => {
    if (!deleteSecondConfirm) {
      setDeleteSecondConfirm(true);
      return;
    }
    
    try {
      const { error: deleteError } = await supabase
        .from('utgs')
        .delete()
        .eq('utg_id', id);
        
      if (deleteError) throw deleteError;
      
      setDeleteConfirmId(null);
      setDeleteSecondConfirm(false);
      fetchData();
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Failed to delete record');
    }
  };
  
  // Start edit
  const startEdit = (record: UiTableGrid) => {
    setEditingRecord(record);
    setFormData({
      utg_id: record.utg_id,
      utg_name: record.utg_name,
      utg_columns_definition_location: record.utg_columns_definition_location || '',
      utg_description: record.utg_description || '',
      sheaf_ui_columns_base_foundation: record.sheaf_ui_columns_base_foundation ? JSON.stringify(record.sheaf_ui_columns_base_foundation) : '',
      monolith_of_ui_columns: record.monolith_of_ui_columns || '',
      rel_xpage_id: record.rel_xpage_id,
      rel_xpage: record.rel_xpage || '',
      main_db_table: record.main_db_table || '',
      sql_view: record.sql_view || '',
      associated_files: record.associated_files ? JSON.stringify(record.associated_files) : '',
      utg_class: record.utg_class || '',
      is_active: record.is_active,
      sort_order: record.sort_order,
      horomi_active: record.horomi_active,
      vertomi_active: record.vertomi_active,
      header_rows_definition_fantasy: record.header_rows_definition_fantasy ? JSON.stringify(record.header_rows_definition_fantasy) : '',
      filters_notes: record.filters_notes || '',
      pagination_notes: record.pagination_notes || '',
      searchbox_notes: record.searchbox_notes || '',
      utg_columns_definition_file_link: record.utg_columns_definition_file_link || ''
    });
    setIsEditModalOpen(true);
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      utg_id: '',
      utg_name: '',
      utg_columns_definition_location: '',
      utg_description: '',
      sheaf_ui_columns_base_foundation: '',
      monolith_of_ui_columns: '',
      rel_xpage_id: null,
      rel_xpage: '',
      main_db_table: '',
      sql_view: '',
      associated_files: '',
      utg_class: '',
      is_active: true,
      sort_order: 0,
      horomi_active: false,
      vertomi_active: false,
      header_rows_definition_fantasy: '',
      filters_notes: '',
      pagination_notes: '',
      searchbox_notes: '',
      utg_columns_definition_file_link: ''
    });
  };

  // Handle inline editing
  const startInlineEdit = (id: string, field: string, currentValue: any) => {
    if (field === 'utg_id') {
      // Show first warning for utg_id editing
      setUtgIdWarningData({ id, field, value: currentValue || '' });
      setShowFirstWarning(true);
    } else {
      setEditingCell({ id, field });
      setEditingValue(currentValue || '');
    }
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    
    try {
      const updates = { [editingCell.field]: editingValue || null };
      const { error } = await supabase
        .from('utgs')
        .update(updates)
        .eq('utg_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.utg_id === editingCell.id 
            ? { ...item, [editingCell.field]: editingValue || null }
            : item
        )
      );
      
      setEditingCell(null);
      setEditingValue('');
    } catch (err) {
      console.error('Error updating field:', err);
      alert('Failed to update field');
    }
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Handle xpage dropdown change
  const handleXpageChange = async (utgId: string, xpageId: string) => {
    try {
      const xpageIdValue = xpageId === '' ? null : parseInt(xpageId);
      
      const { error } = await supabase
        .from('utgs')
        .update({ rel_xpage_id: xpageIdValue })
        .eq('utg_id', utgId);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.utg_id === utgId 
            ? { ...item, rel_xpage_id: xpageIdValue }
            : item
        )
      );
    } catch (err) {
      console.error('Error updating xpage relationship:', err);
      alert('Failed to update xpage relationship');
    }
  };

  // Handle opening content viewer
  const openContentViewer = (title: string, content: string, recordId: string) => {
    setContentViewerData({ title, content, recordId });
    setContentEditValue(content);
    setIsContentViewerOpen(true);
    setIsContentEditing(true); // Start in edit mode by default
  };

  // Handle closing content viewer
  const closeContentViewer = () => {
    setIsContentViewerOpen(false);
    setContentViewerData(null);
    setIsContentEditing(false);
    setContentEditValue('');
  };

  // Handle saving content from viewer
  const saveContentFromViewer = async () => {
    if (!contentViewerData) return;
    
    try {
      const { error } = await supabase
        .from('utgs')
        .update({ utg_columns_definition_location: contentEditValue })
        .eq('utg_id', contentViewerData.recordId);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.utg_id === contentViewerData.recordId 
            ? { ...item, utg_columns_definition_location: contentEditValue }
            : item
        )
      );
      
      // Update the viewer data
      setContentViewerData(prev => prev ? { ...prev, content: contentEditValue } : null);
      setIsContentEditing(false);
      alert('Content saved successfully!');
    } catch (err) {
      console.error('Error saving content:', err);
      alert('Failed to save content');
    }
  };

  // Define column order
  const columnOrder = [
    'utg_id', 'utg_name', 'utg_columns_definition_location', 'utg_description', 'sheaf_ui_columns_base_foundation', 'monolith_of_ui_columns', 'rel_xpage_id', 'rel_xpage',
    'main_db_table', 'sql_view', 'associated_files', 'utg_class', 'created_at', 'updated_at',
    'is_active', 'sort_order', 'horomi_active', 'vertomi_active', 'header_rows_definition_fantasy',
    'filters_notes', 'pagination_notes', 'searchbox_notes', 'utg_columns_definition_file_link'
  ];

  // Define which fields can be inline edited (excluding boolean and timestamp fields)
  const inlineEditableFields = [
    'utg_id', 'utg_name', 'utg_columns_definition_location', 'utg_description', 'rel_xpage', 
    'main_db_table', 'sql_view', 'utg_class', 'filters_notes', 'pagination_notes', 'searchbox_notes',
    'utg_columns_definition_file_link'
  ];
  
  if (loading) {
    return <div className="p-4">Loading...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }
  
  return (
    <div className="p-4">
      {/* Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateInline}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Create New (Inline)
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Entry
          </button>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider border border-gray-200">
                actions
              </th>
              {columnOrder.map((column) => (
                <th
                  key={column}
                  onClick={() => handleSort(column as keyof UiTableGrid)}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100 border border-gray-200"
                >
                  {column}
                  {sortField === column && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row) => (
              <tr key={row.utg_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm border border-gray-200">
                  <button
                    onClick={() => startEdit(row)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  {deleteConfirmId === row.utg_id ? (
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(row.utg_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {deleteSecondConfirm ? 'Really Delete?' : 'Confirm Delete'}
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmId(null);
                          setDeleteSecondConfirm(false);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(row.utg_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
                {columnOrder.map((key) => {
                  const value = row[key as keyof UiTableGrid];
                  const isEditing = editingCell?.id === row.utg_id && editingCell?.field === key;
                  const isEditable = inlineEditableFields.includes(key);
                  
                  return (
                    <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
                      {key === 'utg_columns_definition_location' ? (
                        // Special handling for utg_columns_definition_location
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            {isEditing ? (
                              <textarea
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={saveInlineEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) saveInlineEdit();
                                  if (e.key === 'Escape') cancelInlineEdit();
                                }}
                                className="w-full px-1 py-0.5 border border-blue-500 rounded"
                                rows={3}
                                autoFocus
                              />
                            ) : (
                              <div
                                className="min-w-[30px] min-h-[1.25rem] cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                                onClick={() => startInlineEdit(row.utg_id, key, value)}
                                title="Click to edit (Ctrl+Enter to save)"
                              >
                                {value === null ? '' : String(value).substring(0, 14) + (String(value).length > 14 ? '...' : '')}
                              </div>
                            )}
                          </div>
                          {value && String(value).length > 0 && (
                            <button
                              onClick={() => openContentViewer(`utgs.utg_columns_definition_location FOR utg_id: ${row.utg_id}`, String(value), row.utg_id)}
                              className="w-4 h-4 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center text-xs"
                              title="View full content"
                            >
                              📄
                            </button>
                          )}
                        </div>
                      ) : key === 'sheaf_ui_columns_base_foundation' ? (
                        // Special handling for sheaf_ui_columns_base_foundation - JSON popup editor
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`} 
                                 title={value ? 'Has data' : 'Empty'}></div>
                            <span className="text-xs text-gray-600">
                              {value ? 'JSON Data' : 'Empty'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setJsonEditorData({ recordId: row.utg_id, value: value ? JSON.stringify(value, null, 2) : '' });
                              setJsonEditValue(value ? JSON.stringify(value, null, 2) : '');
                              setIsJsonEditorOpen(true);
                            }}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                          >
                            Popup Editor
                          </button>
                        </div>
                      ) : key === 'monolith_of_ui_columns' ? (
                        // Special handling for monolith_of_ui_columns - Text popup editor
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${value ? 'bg-blue-500' : 'bg-gray-300'}`} 
                                 title={value ? 'Has data' : 'Empty'}></div>
                            <span className="text-xs text-gray-600">
                              {value ? 'Text Data' : 'Empty'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setTextEditorData({ recordId: row.utg_id, value: value || '', fieldName: 'monolith_of_ui_columns' });
                              setTextEditValue(value || '');
                              setIsTextEditorOpen(true);
                            }}
                            className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded"
                          >
                            Popup Editor
                          </button>
                        </div>
                      ) : key === 'rel_xpage_id' ? (
                        // Special dropdown for xpage relationship
                        <select
                          value={value || ''}
                          onChange={(e) => handleXpageChange(row.utg_id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Select XPage --</option>
                          {xpages.map((xpage) => (
                            <option key={xpage.xpage_id} value={xpage.xpage_id}>
                              {xpage.xpage_id} - {xpage.title1 || '(No title)'}
                            </option>
                          ))}
                        </select>
                      ) : isEditable ? (
                        isEditing ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={saveInlineEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit();
                              if (e.key === 'Escape') cancelInlineEdit();
                            }}
                            className="w-full px-1 py-0.5 border border-blue-500 rounded"
                            autoFocus
                          />
                        ) : (
                          <div
                            className="min-w-[30px] min-h-[1.25rem] cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                            onClick={() => startInlineEdit(row.utg_id, key, value)}
                            title="Click to edit"
                          >
                            {value === null ? '' : String(value)}
                          </div>
                        )
                      ) : typeof value === 'boolean' ? (value ? 'true' : 'false') : 
                       typeof value === 'object' ? JSON.stringify(value) : 
                       value === null ? '' : String(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>
      
      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Entry</h2>
            
            {/* Top save button */}
            <div className="mb-6 flex justify-end gap-3 border-b border-gray-200 pb-4">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_name</label>
                <input
                  type="text"
                  value={formData.utg_name}
                  onChange={(e) => setFormData({...formData, utg_name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_columns_definition_location</label>
                <textarea
                  value={formData.utg_columns_definition_location}
                  onChange={(e) => setFormData({...formData, utg_columns_definition_location: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder="Store large text responses from Claude/Cursor for column definitions..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_description</label>
                <textarea
                  value={formData.utg_description}
                  onChange={(e) => setFormData({...formData, utg_description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">sheaf_ui_columns_base_foundation</label>
                <textarea
                  value={formData.sheaf_ui_columns_base_foundation}
                  onChange={(e) => setFormData({...formData, sheaf_ui_columns_base_foundation: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder='{"base_column_order": ["table.column1", "table.column2"], "wolf_exclusion_band": [], "column_groups": {}}'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">monolith_of_ui_columns</label>
                <textarea
                  value={formData.monolith_of_ui_columns}
                  onChange={(e) => setFormData({...formData, monolith_of_ui_columns: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder="addresspren.addresspren_id&#10;addresspren.fk_addressglub_id&#10;addresspren.address_label&#10;..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">rel_xpage</label>
                <input
                  type="text"
                  value={formData.rel_xpage}
                  onChange={(e) => setFormData({...formData, rel_xpage: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">main_db_table</label>
                <input
                  type="text"
                  value={formData.main_db_table}
                  onChange={(e) => setFormData({...formData, main_db_table: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">sql_view</label>
                <input
                  type="text"
                  value={formData.sql_view}
                  onChange={(e) => setFormData({...formData, sql_view: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">associated_files (JSON)</label>
                <textarea
                  value={formData.associated_files}
                  onChange={(e) => setFormData({...formData, associated_files: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter valid JSON, e.g. {&quot;key&quot;: &quot;value&quot;}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">header_rows_definition_fantasy (JSON)</label>
                <textarea
                  value={formData.header_rows_definition_fantasy}
                  onChange={(e) => setFormData({...formData, header_rows_definition_fantasy: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter valid JSON, e.g. {&quot;key&quot;: &quot;value&quot;}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_class</label>
                <input
                  type="text"
                  value={formData.utg_class}
                  onChange={(e) => setFormData({...formData, utg_class: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">is_active</label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">horomi_active</label>
                <input
                  type="checkbox"
                  checked={formData.horomi_active}
                  onChange={(e) => setFormData({...formData, horomi_active: e.target.checked})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">vertomi_active</label>
                <input
                  type="checkbox"
                  checked={formData.vertomi_active}
                  onChange={(e) => setFormData({...formData, vertomi_active: e.target.checked})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">sort_order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({...formData, sort_order: Number(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">filters_notes</label>
                <textarea
                  value={formData.filters_notes}
                  onChange={(e) => setFormData({...formData, filters_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Notes about filters..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">pagination_notes</label>
                <textarea
                  value={formData.pagination_notes}
                  onChange={(e) => setFormData({...formData, pagination_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Notes about pagination..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">searchbox_notes</label>
                <textarea
                  value={formData.searchbox_notes}
                  onChange={(e) => setFormData({...formData, searchbox_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Notes about search functionality..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_columns_definition_file_link</label>
                <input
                  type="text"
                  value={formData.utg_columns_definition_file_link}
                  onChange={(e) => setFormData({...formData, utg_columns_definition_file_link: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="vscode://file/path/to/file"
                />
              </div>
            </div>
            
            {/* Bottom save button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Entry</h2>
            
            {/* Top save button */}
            <div className="mb-6 flex justify-end gap-3 border-b border-gray-200 pb-4">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingRecord(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_name</label>
                <input
                  type="text"
                  value={formData.utg_name}
                  onChange={(e) => setFormData({...formData, utg_name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_columns_definition_location</label>
                <textarea
                  value={formData.utg_columns_definition_location}
                  onChange={(e) => setFormData({...formData, utg_columns_definition_location: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder="Store large text responses from Claude/Cursor for column definitions..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_description</label>
                <textarea
                  value={formData.utg_description}
                  onChange={(e) => setFormData({...formData, utg_description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">sheaf_ui_columns_base_foundation</label>
                <textarea
                  value={formData.sheaf_ui_columns_base_foundation}
                  onChange={(e) => setFormData({...formData, sheaf_ui_columns_base_foundation: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder='{"base_column_order": ["table.column1", "table.column2"], "wolf_exclusion_band": [], "column_groups": {}}'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">monolith_of_ui_columns</label>
                <textarea
                  value={formData.monolith_of_ui_columns}
                  onChange={(e) => setFormData({...formData, monolith_of_ui_columns: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder="addresspren.addresspren_id&#10;addresspren.fk_addressglub_id&#10;addresspren.address_label&#10;..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">rel_xpage</label>
                <input
                  type="text"
                  value={formData.rel_xpage}
                  onChange={(e) => setFormData({...formData, rel_xpage: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">main_db_table</label>
                <input
                  type="text"
                  value={formData.main_db_table}
                  onChange={(e) => setFormData({...formData, main_db_table: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">sql_view</label>
                <input
                  type="text"
                  value={formData.sql_view}
                  onChange={(e) => setFormData({...formData, sql_view: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">associated_files (JSON)</label>
                <textarea
                  value={formData.associated_files}
                  onChange={(e) => setFormData({...formData, associated_files: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter valid JSON, e.g. {&quot;key&quot;: &quot;value&quot;}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">header_rows_definition_fantasy (JSON)</label>
                <textarea
                  value={formData.header_rows_definition_fantasy}
                  onChange={(e) => setFormData({...formData, header_rows_definition_fantasy: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter valid JSON, e.g. {&quot;key&quot;: &quot;value&quot;}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_class</label>
                <input
                  type="text"
                  value={formData.utg_class}
                  onChange={(e) => setFormData({...formData, utg_class: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">is_active</label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">horomi_active</label>
                <input
                  type="checkbox"
                  checked={formData.horomi_active}
                  onChange={(e) => setFormData({...formData, horomi_active: e.target.checked})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">vertomi_active</label>
                <input
                  type="checkbox"
                  checked={formData.vertomi_active}
                  onChange={(e) => setFormData({...formData, vertomi_active: e.target.checked})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">sort_order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({...formData, sort_order: Number(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">filters_notes</label>
                <textarea
                  value={formData.filters_notes}
                  onChange={(e) => setFormData({...formData, filters_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Notes about filters..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">pagination_notes</label>
                <textarea
                  value={formData.pagination_notes}
                  onChange={(e) => setFormData({...formData, pagination_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Notes about pagination..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">searchbox_notes</label>
                <textarea
                  value={formData.searchbox_notes}
                  onChange={(e) => setFormData({...formData, searchbox_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Notes about search functionality..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_columns_definition_file_link</label>
                <input
                  type="text"
                  value={formData.utg_columns_definition_file_link}
                  onChange={(e) => setFormData({...formData, utg_columns_definition_file_link: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="vscode://file/path/to/file"
                />
              </div>
            </div>
            
            {/* Bottom save button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingRecord(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Content Viewer/Editor Modal */}
      {isContentViewerOpen && contentViewerData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">{contentViewerData.title}</h2>
              <div className="flex gap-2">
                {!isContentEditing ? (
                  <button
                    onClick={() => setIsContentEditing(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={saveContentFromViewer}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsContentEditing(false);
                        setContentEditValue(contentViewerData.content);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={closeContentViewer}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[400px]">
              {isContentEditing ? (
                <textarea
                  value={contentEditValue}
                  onChange={(e) => setContentEditValue(e.target.value)}
                  className="w-full h-96 font-mono text-sm text-gray-800 bg-white border border-gray-300 rounded p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your content here... (linebreaks and blank lines will be preserved)"
                  style={{ lineHeight: '1.5' }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 leading-relaxed min-h-[350px]">
                  {contentViewerData.content || 'No content available'}
                </pre>
              )}
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Length: {isContentEditing ? contentEditValue.length : contentViewerData.content.length} characters
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(isContentEditing ? contentEditValue : contentViewerData.content)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Copy to Clipboard
                </button>
                {isContentEditing && (
                  <button
                    onClick={saveContentFromViewer}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JSON Editor Modal */}
      {isJsonEditorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[90vw] h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Sheaf UI Columns Base Foundation Editor
              </h3>
              <button
                onClick={() => {
                  setIsJsonEditorOpen(false);
                  setJsonEditorData(null);
                  setJsonEditValue('');
                }}
                className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center text-lg font-bold"
                title="Close JSON Editor"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="mb-4 flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">JSON Content:</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(jsonEditValue);
                      alert('JSON copied to clipboard!');
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                  >
                    Copy JSON
                  </button>
                  <button
                    onClick={() => {
                      try {
                        const formatted = JSON.stringify(JSON.parse(jsonEditValue), null, 2);
                        setJsonEditValue(formatted);
                      } catch (e) {
                        alert('Invalid JSON format - cannot format');
                      }
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded"
                  >
                    Format JSON
                  </button>
                </div>
                <textarea
                  value={jsonEditValue}
                  onChange={(e) => setJsonEditValue(e.target.value)}
                  className="flex-1 w-full p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter JSON data here..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setIsJsonEditorOpen(false);
                  setJsonEditorData(null);
                  setJsonEditValue('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    let jsonData = null;
                    if (jsonEditValue.trim()) {
                      jsonData = JSON.parse(jsonEditValue);
                    }

                    if (jsonEditorData) {
                      const { error } = await supabase
                        .from('utgs')
                        .update({ sheaf_ui_columns_base_foundation: jsonData })
                        .eq('utg_id', jsonEditorData.recordId);

                      if (error) throw error;

                      // Update local data
                      setData(prevData =>
                        prevData.map(item =>
                          item.utg_id === jsonEditorData.recordId
                            ? { ...item, sheaf_ui_columns_base_foundation: jsonData }
                            : item
                        )
                      );

                      setIsJsonEditorOpen(false);
                      setJsonEditorData(null);
                      setJsonEditValue('');
                      alert('JSON saved successfully!');
                    }
                  } catch (e) {
                    if (e instanceof SyntaxError) {
                      alert('Invalid JSON format. Please check your syntax.');
                    } else {
                      console.error('Error saving JSON:', e);
                      alert('Failed to save JSON data.');
                    }
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Save JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Editor Modal */}
      {isTextEditorOpen && textEditorData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[95vw] h-[95vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                Text Editor: {textEditorData.fieldName} (Record: {textEditorData.recordId})
              </h3>
              <button
                onClick={() => {
                  setIsTextEditorOpen(false);
                  setTextEditorData(null);
                  setTextEditValue('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  {textEditValue.split('\n').length} lines, {textEditValue.length} characters
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(textEditValue);
                      alert('Text copied to clipboard!');
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                  >
                    Copy Text
                  </button>
                  <button
                    onClick={() => {
                      setTextEditValue('');
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <textarea
                value={textEditValue}
                onChange={(e) => setTextEditValue(e.target.value)}
                className="flex-1 w-full p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter text data here..."
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setIsTextEditorOpen(false);
                  setTextEditorData(null);
                  setTextEditValue('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (textEditorData) {
                      const { error } = await supabase
                        .from('utgs')
                        .update({ [textEditorData.fieldName]: textEditValue || null })
                        .eq('utg_id', textEditorData.recordId);

                      if (error) throw error;

                      // Update local data
                      setData(prevData =>
                        prevData.map(item =>
                          item.utg_id === textEditorData.recordId
                            ? { ...item, [textEditorData.fieldName]: textEditValue || null }
                            : item
                        )
                      );

                      setIsTextEditorOpen(false);
                      setTextEditorData(null);
                      setTextEditValue('');
                      alert('Text saved successfully!');
                    }
                  } catch (e) {
                    console.error('Error saving text:', e);
                    alert('Failed to save text data.');
                  }
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Save Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First UTG ID Warning Modal */}
      {showFirstWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-4">⚠️ WARNING: Edit UTG ID</h3>
            <p className="text-gray-700 mb-6">
              You are about to edit a UTG ID. This is a <strong>critical operation</strong> that could break references and relationships in the system.
            </p>
            <p className="text-gray-700 mb-6">
              Are you sure you want to continue?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowFirstWarning(false);
                  setUtgIdWarningData(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowFirstWarning(false);
                  setShowSecondWarning(true);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                I Understand, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second UTG ID Warning Modal */}
      {showSecondWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-4">🚨 FINAL WARNING: Edit UTG ID</h3>
            <p className="text-gray-700 mb-4">
              <strong>This is your final warning!</strong>
            </p>
            <p className="text-gray-700 mb-6">
              Editing the UTG ID could:
              <br />• Break existing references
              <br />• Cause data inconsistencies
              <br />• Affect system functionality
            </p>
            <p className="text-gray-700 mb-6">
              <strong>Are you absolutely certain you want to proceed?</strong>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSecondWarning(false);
                  setUtgIdWarningData(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (utgIdWarningData) {
                    setEditingCell({ id: utgIdWarningData.id, field: utgIdWarningData.field });
                    setEditingValue(utgIdWarningData.value);
                  }
                  setShowSecondWarning(false);
                  setUtgIdWarningData(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                YES, PROCEED WITH EDIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}