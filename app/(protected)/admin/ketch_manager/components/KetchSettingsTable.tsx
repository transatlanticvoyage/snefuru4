'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

interface KetchSettings {
  setting_id: string;
  app_page: string;
  ancestor_element: string | null;
  element_tag: string | null;
  id: string | null;
  class: string | null;
  other_rules_needed: string | null;
  
  // Dimensions
  width: string | null;
  height: string | null;
  min_width: string | null;
  min_height: string | null;
  max_width: string | null;
  max_height: string | null;
  
  // Margin
  margin: string | null;
  margin_top: string | null;
  margin_bottom: string | null;
  margin_left: string | null;
  margin_right: string | null;
  
  // Padding
  padding: string | null;
  padding_top: string | null;
  padding_bottom: string | null;
  padding_left: string | null;
  padding_right: string | null;
  
  // Border
  border: string | null;
  border_width: string | null;
  border_style: string | null;
  border_color: string | null;
  border_top: string | null;
  border_top_width: string | null;
  border_top_style: string | null;
  border_top_color: string | null;
  border_bottom: string | null;
  border_left: string | null;
  border_right: string | null;
  border_radius: string | null;
  
  // Box model
  box_shadow: string | null;
  outline: string | null;
  outline_width: string | null;
  outline_style: string | null;
  outline_color: string | null;
  
  // Background
  background: string | null;
  background_color: string | null;
  background_image: string | null;
  background_position: string | null;
  background_size: string | null;
  background_repeat: string | null;
  background_attachment: string | null;
  
  // Typography
  color: string | null;
  font_size: string | null;
  font_family: string | null;
  font_weight: string | null;
  font_style: string | null;
  text_align: string | null;
  text_transform: string | null;
  text_decoration: string | null;
  letter_spacing: string | null;
  line_height: string | null;
  white_space: string | null;
  word_break: string | null;
  
  // Overflow
  overflow: string | null;
  overflow_x: string | null;
  overflow_y: string | null;
  
  // Layout
  display: string | null;
  visibility: string | null;
  position: string | null;
  top: string | null;
  bottom: string | null;
  left: string | null;
  right: string | null;
  z_index: string | null;
  
  // Flexbox
  flex_direction: string | null;
  justify_content: string | null;
  align_items: string | null;
  align_content: string | null;
  flex_wrap: string | null;
  flex_grow: string | null;
  flex_shrink: string | null;
  order: string | null;
  gap: string | null;
  
  // Grid
  grid_template_columns: string | null;
  grid_template_rows: string | null;
  grid_gap: string | null;
  grid_column: string | null;
  grid_row: string | null;
  
  // Interaction
  cursor: string | null;
  pointer_events: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export default function KetchSettingsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<KetchSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize state from URL parameters
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams?.get('page')) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(Number(searchParams?.get('perPage')) || 10);
  const [sortField, setSortField] = useState<keyof KetchSettings | null>(
    (searchParams?.get('sortField') as keyof KetchSettings) || null
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams?.get('sortOrder') as 'asc' | 'desc') || 'asc'
  );
  
  // Filter states from URL parameters
  const [filters, setFilters] = useState({
    app_page: searchParams?.get('filter_app_page') || 'all',
    ancestor_element: searchParams?.get('filter_ancestor_element') || 'all',
    element_tag: searchParams?.get('filter_element_tag') || 'all',
    id: searchParams?.get('filter_id') || 'all',
    class: searchParams?.get('filter_class') || 'all'
  });
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<KetchSettings | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSecondConfirm, setDeleteSecondConfirm] = useState(false);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data - initialize all fields
  const getEmptyFormData = () => ({
    app_page: '',
    ancestor_element: '',
    element_tag: '',
    id: '',
    class: '',
    other_rules_needed: '',
    width: '',
    height: '',
    min_width: '',
    min_height: '',
    max_width: '',
    max_height: '',
    margin: '',
    margin_top: '',
    margin_bottom: '',
    margin_left: '',
    margin_right: '',
    padding: '',
    padding_top: '',
    padding_bottom: '',
    padding_left: '',
    padding_right: '',
    border: '',
    border_width: '',
    border_style: '',
    border_color: '',
    border_top: '',
    border_top_width: '',
    border_top_style: '',
    border_top_color: '',
    border_bottom: '',
    border_left: '',
    border_right: '',
    border_radius: '',
    box_shadow: '',
    outline: '',
    outline_width: '',
    outline_style: '',
    outline_color: '',
    background: '',
    background_color: '',
    background_image: '',
    background_position: '',
    background_size: '',
    background_repeat: '',
    background_attachment: '',
    color: '',
    font_size: '',
    font_family: '',
    font_weight: '',
    font_style: '',
    text_align: '',
    text_transform: '',
    text_decoration: '',
    letter_spacing: '',
    line_height: '',
    white_space: '',
    word_break: '',
    overflow: '',
    overflow_x: '',
    overflow_y: '',
    display: '',
    visibility: '',
    position: '',
    top: '',
    bottom: '',
    left: '',
    right: '',
    z_index: '',
    flex_direction: '',
    justify_content: '',
    align_items: '',
    align_content: '',
    flex_wrap: '',
    flex_grow: '',
    flex_shrink: '',
    order: '',
    gap: '',
    grid_template_columns: '',
    grid_template_rows: '',
    grid_gap: '',
    grid_column: '',
    grid_row: '',
    cursor: '',
    pointer_events: '',
    is_active: true
  });
  
  const [formData, setFormData] = useState(getEmptyFormData());
  
  const supabase = createClientComponentClient();
  
  // Update URL parameters when state changes
  const updateURLParams = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams || '');
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    
    router.push(`?${params.toString()}`, { scroll: false });
  };
  
  // Get unique values for filters
  const getUniqueValues = (field: keyof KetchSettings) => {
    const values = data.map(item => item[field]).filter(val => val !== null && val !== undefined);
    return ['all', ...Array.from(new Set(values.map(v => String(v)))).sort()];
  };
  
  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from('ketch_settings')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (fetchError) throw fetchError;
      setData(tableData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = data;
    
    // Apply dropdown filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== 'all') {
        filtered = filtered.filter(row => row[field as keyof KetchSettings] === value);
      }
    });
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row => {
        return Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    return filtered;
  }, [data, searchTerm, filters]);
  
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
  const handleSort = (field: keyof KetchSettings) => {
    const newOrder = sortField === field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    updateURLParams({
      sortField: field,
      sortOrder: newOrder,
      page: 1 // Reset to first page when sorting
    });
    setCurrentPage(1);
  };
  
  // Prepare form data for submission
  const prepareFormData = () => {
    const preparedData: any = {};
    Object.entries(formData).forEach(([key, value]) => {
      preparedData[key] = value === '' ? null : value;
    });
    return preparedData;
  };
  
  // Handle create
  const handleCreate = async () => {
    try {
      const { error: insertError } = await supabase
        .from('ketch_settings')
        .insert([prepareFormData()]);
        
      if (insertError) throw insertError;
      
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error creating record:', err);
      alert('Failed to create record');
    }
  };

  // Handle duplicate
  const handleDuplicate = (record: KetchSettings) => {
    const duplicateData: any = {};
    Object.keys(getEmptyFormData()).forEach(key => {
      if (key === 'setting_id') return; // Skip the ID field
      const value = (record as any)[key];
      duplicateData[key] = value === null ? '' : value;
    });
    setFormData(duplicateData);
    setIsCreateModalOpen(true);
  };
  
  // Handle edit
  const handleEdit = async () => {
    if (!editingRecord) return;
    
    try {
      const { error: updateError } = await supabase
        .from('ketch_settings')
        .update(prepareFormData())
        .eq('setting_id', editingRecord.setting_id);
        
      if (updateError) throw updateError;
      
      setIsEditModalOpen(false);
      setEditingRecord(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error updating record:', err);
      alert('Failed to update record');
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
        .from('ketch_settings')
        .delete()
        .eq('setting_id', id);
        
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
  const startEdit = (record: KetchSettings) => {
    setEditingRecord(record);
    const editData: any = {};
    Object.keys(getEmptyFormData()).forEach(key => {
      const value = (record as any)[key];
      editData[key] = value === null ? '' : value;
    });
    setFormData(editData);
    setIsEditModalOpen(true);
  };
  
  // Reset form
  const resetForm = () => {
    setFormData(getEmptyFormData());
  };

  // Handle inline editing
  const startInlineEdit = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditingValue(currentValue || '');
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    
    try {
      const updates = { [editingCell.field]: editingValue || null };
      const { error } = await supabase
        .from('ketch_settings')
        .update(updates)
        .eq('setting_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.setting_id === editingCell.id 
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

  // Define which fields can be inline edited
  const inlineEditableFields = [
    'app_page', 'ancestor_element', 'element_tag', 'id', 'class', 
    'other_rules_needed', 'width', 'height', 'min_width', 'min_height', 
    'max_width', 'max_height'
  ];
  
  // Get column display names
  const getColumnHeaders = () => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };
  
  // Render form fields
  const renderFormFields = () => {
    const fields = Object.keys(getEmptyFormData());
    const groups = {
      'Basic Info': ['app_page', 'ancestor_element', 'element_tag', 'id', 'class', 'other_rules_needed'],
      'Dimensions': ['width', 'height', 'min_width', 'min_height', 'max_width', 'max_height'],
      'Margin': ['margin', 'margin_top', 'margin_bottom', 'margin_left', 'margin_right'],
      'Padding': ['padding', 'padding_top', 'padding_bottom', 'padding_left', 'padding_right'],
      'Border': ['border', 'border_width', 'border_style', 'border_color', 'border_top', 'border_top_width', 'border_top_style', 'border_top_color', 'border_bottom', 'border_left', 'border_right', 'border_radius'],
      'Box Model': ['box_shadow', 'outline', 'outline_width', 'outline_style', 'outline_color'],
      'Background': ['background', 'background_color', 'background_image', 'background_position', 'background_size', 'background_repeat', 'background_attachment'],
      'Typography': ['color', 'font_size', 'font_family', 'font_weight', 'font_style', 'text_align', 'text_transform', 'text_decoration', 'letter_spacing', 'line_height', 'white_space', 'word_break'],
      'Overflow': ['overflow', 'overflow_x', 'overflow_y'],
      'Layout': ['display', 'visibility', 'position', 'top', 'bottom', 'left', 'right', 'z_index'],
      'Flexbox': ['flex_direction', 'justify_content', 'align_items', 'align_content', 'flex_wrap', 'flex_grow', 'flex_shrink', 'order', 'gap'],
      'Grid': ['grid_template_columns', 'grid_template_rows', 'grid_gap', 'grid_column', 'grid_row'],
      'Interaction': ['cursor', 'pointer_events'],
      'Settings': ['is_active']
    };
    
    return Object.entries(groups).map(([groupName, groupFields]) => (
      <div key={groupName} className="mb-6">
        <h3 className="text-lg font-semibold mb-3">{groupName}</h3>
        <div className="grid grid-cols-2 gap-4">
          {groupFields.map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700">{field}</label>
              {field === 'is_active' ? (
                <input
                  type="checkbox"
                  checked={(formData as any)[field]}
                  onChange={(e) => setFormData({...formData, [field]: e.target.checked})}
                  className="mt-1"
                />
              ) : field === 'other_rules_needed' ? (
                <textarea
                  value={(formData as any)[field]}
                  onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              ) : (
                <input
                  type="text"
                  value={(formData as any)[field]}
                  onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    ));
  };
  
  if (loading) {
    return <div className="p-4">Loading...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }
  
  return (
    <div className="p-4">
      {/* Filter Dropdowns */}
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        {Object.entries(filters).map(([field, value]) => (
          <div key={field} className="flex items-center gap-2">
            <label className="font-bold text-sm lowercase">{field}</label>
            <select
              value={value}
              onChange={(e) => {
                const newFilters = {...filters, [field]: e.target.value};
                setFilters(newFilters);
                setCurrentPage(1);
                updateURLParams({
                  [`filter_${field}`]: e.target.value,
                  page: 1
                });
              }}
              className={`px-3 py-2 border border-gray-300 rounded-md ${
                value !== 'all' ? 'bg-blue-900 text-white' : ''
              }`}
            >
              {getUniqueValues(field as keyof KetchSettings).map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All' : option}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      
      {/* Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
              updateURLParams({
                search: e.target.value,
                page: 1
              });
            }}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <select
            value={itemsPerPage}
            onChange={(e) => {
              const newPerPage = Number(e.target.value);
              setItemsPerPage(newPerPage);
              setCurrentPage(1);
              updateURLParams({
                perPage: newPerPage,
                page: 1
              });
            }}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New Entry
        </button>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider border border-gray-200">
                actions
              </th>
              {getColumnHeaders().map((column) => (
                <th
                  key={column}
                  onClick={() => handleSort(column as keyof KetchSettings)}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap border border-gray-200"
                  style={{
                    backgroundColor: column === 'element_tag' ? '#cef7f1' : undefined
                  }}
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
              <tr key={row.setting_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm border border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(row)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDuplicate(row)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Duplicate
                    </button>
                    {deleteConfirmId === row.setting_id ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(row.setting_id)}
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
                        onClick={() => setDeleteConfirmId(row.setting_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
                {Object.entries(row).map(([key, value]) => (
                  <td 
                    key={key} 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200"
                    style={{
                      backgroundColor: key === 'element_tag' ? '#cef7f1' : undefined
                    }}
                  >
                    {key === 'setting_id' && value ? (
                      <div 
                        className="cursor-pointer hover:bg-blue-50"
                        title={String(value)}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(String(value));
                        }}
                      >
                        {String(value).substring(0, 3)}..
                      </div>
                    ) : inlineEditableFields.includes(key) ? (
                      editingCell?.id === row.setting_id && editingCell?.field === key ? (
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={saveInlineEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveInlineEdit();
                            } else if (e.key === 'Escape') {
                              cancelInlineEdit();
                            }
                          }}
                          className="w-full min-w-[30px] h-full bg-yellow-50 border border-yellow-300 rounded px-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="min-w-[30px] min-h-[1.25rem] cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                          onClick={() => startInlineEdit(row.setting_id, key, value)}
                          title="Click to edit"
                        >
                          {value === null ? '' : String(value)}
                        </div>
                      )
                    ) : typeof value === 'boolean' ? (value ? 'true' : 'false') : 
                     typeof value === 'object' ? JSON.stringify(value) : 
                     value === null ? '' : String(value)}
                  </td>
                ))}
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
            onClick={() => {
              setCurrentPage(1);
              updateURLParams({ page: 1 });
            }}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={() => {
              const newPage = currentPage - 1;
              setCurrentPage(newPage);
              updateURLParams({ page: newPage });
            }}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => {
              const newPage = currentPage + 1;
              setCurrentPage(newPage);
              updateURLParams({ page: newPage });
            }}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={() => {
              setCurrentPage(totalPages);
              updateURLParams({ page: totalPages });
            }}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white pb-4 border-b mb-4">
              <h2 className="text-xl font-bold mb-4">Create New Entry</h2>
              <div className="flex justify-end gap-3">
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
            {renderFormFields()}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white pb-4 border-b mb-4">
              <h2 className="text-xl font-bold mb-4">Edit Entry</h2>
              <div className="flex justify-end gap-3">
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
            {renderFormFields()}
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
    </div>
  );
}