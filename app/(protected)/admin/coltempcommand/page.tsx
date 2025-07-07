'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';

interface Coltemp {
  coltemp_id: number;
  rel_utg_id: string;
  coltemp_name: string | null;
  coltemp_category: string | null;
  coltemp_display_name: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  button_text: string | null;
  tooltip_text: string | null;
  default_header_row_color: string | null;
}

export default function ColtempCommandPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [data, setData] = useState<Coltemp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize state from URL parameters
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams?.get('page')) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(Number(searchParams?.get('perPage')) || 50);
  const [sortField, setSortField] = useState<keyof Coltemp | null>(
    (searchParams?.get('sortField') as keyof Coltemp) || null
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams?.get('sortOrder') as 'asc' | 'desc') || 'asc'
  );
  
  // Filter states from URL parameters
  const [filters, setFilters] = useState({
    rel_utg_id: searchParams?.get('filter_rel_utg_id') || 'all',
    coltemp_category: searchParams?.get('filter_coltemp_category') || 'all',
    is_default: searchParams?.get('filter_is_default') || 'all'
  });
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Coltemp | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteSecondConfirm, setDeleteSecondConfirm] = useState(false);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data
  const getEmptyFormData = () => ({
    rel_utg_id: '',
    coltemp_name: '',
    coltemp_category: '',
    coltemp_display_name: '',
    is_default: false,
    button_text: '',
    tooltip_text: '',
    default_header_row_color: ''
  });
  
  const [formData, setFormData] = useState<any>(getEmptyFormData());

  useEffect(() => {
    document.title = "Coltemp Command - Snefuru Admin";
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: coltemps, error } = await supabase
        .from('coltemps')
        .select('*')
        .order('coltemp_id', { ascending: true });

      if (error) throw error;
      setData(coltemps || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load column templates');
    } finally {
      setLoading(false);
    }
  };

  // Update URL parameters
  const updateURLParams = (params: Record<string, any>) => {
    const newParams = new URLSearchParams(searchParams?.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        newParams.set(key, value.toString());
      } else {
        newParams.delete(key);
      }
    });
    router.push(`/admin/coltempcommand?${newParams.toString()}`);
  };

  // Get unique values for filters
  const getUniqueValues = (field: keyof Coltemp) => {
    const values = new Set(data.map(item => item[field]));
    return Array.from(values).filter(Boolean).sort();
  };

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = ['coltemp_name', 'coltemp_category', 'coltemp_display_name', 'button_text', 'tooltip_text'];
        const matches = searchableFields.some(field => {
          const value = (item as any)[field];
          return value && value.toString().toLowerCase().includes(searchLower);
        });
        if (!matches) return false;
      }
      
      // Field filters
      if (filters.rel_utg_id !== 'all' && item.rel_utg_id !== filters.rel_utg_id) return false;
      if (filters.coltemp_category !== 'all' && item.coltemp_category !== filters.coltemp_category) return false;
      if (filters.is_default !== 'all' && item.is_default !== (filters.is_default === 'true')) return false;
      
      return true;
    });
  }, [data, searchTerm, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortOrder]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Handle sort
  const handleSort = (field: keyof Coltemp) => {
    if (sortField === field) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      updateURLParams({ sortOrder: newOrder });
    } else {
      setSortField(field);
      setSortOrder('asc');
      updateURLParams({ sortField: field, sortOrder: 'asc' });
    }
  };

  // Prepare form data for database
  const prepareFormData = () => {
    const prepared: any = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value === '') {
        prepared[key] = null;
      } else {
        prepared[key] = value;
      }
    });
    return prepared;
  };

  // Handle create
  const handleCreate = async () => {
    try {
      const { error: insertError } = await supabase
        .from('coltemps')
        .insert([prepareFormData()]);
        
      if (insertError) throw insertError;
      
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error('Error creating record:', err);
      const errorMessage = err.message || 'Failed to create record';
      const errorDetails = err.details || '';
      const errorHint = err.hint || '';
      
      alert(`Failed to create record:\n${errorMessage}\n${errorDetails}\n${errorHint}`.trim());
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!editingRecord) return;
    
    try {
      const { error: updateError } = await supabase
        .from('coltemps')
        .update(prepareFormData())
        .eq('coltemp_id', editingRecord.coltemp_id);
        
      if (updateError) throw updateError;
      
      setIsEditModalOpen(false);
      setEditingRecord(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error('Error updating record:', err);
      const errorMessage = err.message || 'Failed to update record';
      const errorDetails = err.details || '';
      const errorHint = err.hint || '';
      
      alert(`Failed to update record:\n${errorMessage}\n${errorDetails}\n${errorHint}`.trim());
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!deleteSecondConfirm) {
      setDeleteSecondConfirm(true);
      return;
    }
    
    try {
      const { error: deleteError } = await supabase
        .from('coltemps')
        .delete()
        .eq('coltemp_id', id);
        
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
  const startEdit = (record: Coltemp) => {
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
  const startInlineEdit = (id: number, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditingValue(currentValue || '');
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    
    try {
      const updates = { [editingCell.field]: editingValue || null };
      const { error } = await supabase
        .from('coltemps')
        .update(updates)
        .eq('coltemp_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.coltemp_id === editingCell.id 
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
    'rel_utg_id', 'coltemp_name', 'coltemp_category', 'coltemp_display_name',
    'button_text', 'tooltip_text', 'default_header_row_color'
  ];

  // Render form fields
  const renderFormFields = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">rel_utg_id *</label>
          <input
            type="text"
            value={formData.rel_utg_id}
            onChange={(e) => setFormData({...formData, rel_utg_id: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">coltemp_name</label>
          <input
            type="text"
            value={formData.coltemp_name}
            onChange={(e) => setFormData({...formData, coltemp_name: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">coltemp_category</label>
          <input
            type="text"
            value={formData.coltemp_category}
            onChange={(e) => setFormData({...formData, coltemp_category: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">coltemp_display_name</label>
          <input
            type="text"
            value={formData.coltemp_display_name}
            onChange={(e) => setFormData({...formData, coltemp_display_name: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">is_default</label>
          <input
            type="checkbox"
            checked={formData.is_default}
            onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">button_text</label>
          <input
            type="text"
            value={formData.button_text}
            onChange={(e) => setFormData({...formData, button_text: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">tooltip_text</label>
          <textarea
            value={formData.tooltip_text}
            onChange={(e) => setFormData({...formData, tooltip_text: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">default_header_row_color</label>
          <input
            type="text"
            value={formData.default_header_row_color}
            onChange={(e) => setFormData({...formData, default_header_row_color: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="e.g. #ffffff"
          />
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading column templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="mb-4">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800">
            ← Back to Admin
          </Link>
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Coltemp Command</h1>
          <p className="text-gray-600" style={{ fontSize: '16px' }}>
            <span className="font-bold">main db table:</span> coltemps
          </p>
        </div>

        {/* Search and Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                  updateURLParams({ search: e.target.value, page: 1 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create New
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setItemsPerPage(value);
                  setCurrentPage(1);
                  updateURLParams({ perPage: value, page: 1 });
                }}
                className="px-3 py-1 border border-gray-300 rounded-md"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UTG ID</label>
              <select
                value={filters.rel_utg_id}
                onChange={(e) => {
                  setFilters({...filters, rel_utg_id: e.target.value});
                  setCurrentPage(1);
                  updateURLParams({ filter_rel_utg_id: e.target.value, page: 1 });
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All</option>
                {getUniqueValues('rel_utg_id').map(value => (
                  <option key={value as string} value={value as string}>
                    {value as string}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.coltemp_category}
                onChange={(e) => {
                  setFilters({...filters, coltemp_category: e.target.value});
                  setCurrentPage(1);
                  updateURLParams({ filter_coltemp_category: e.target.value, page: 1 });
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All</option>
                {getUniqueValues('coltemp_category').map(value => (
                  <option key={value as string} value={value as string}>
                    {value as string}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Is Default</label>
              <select
                value={filters.is_default}
                onChange={(e) => {
                  setFilters({...filters, is_default: e.target.value});
                  setCurrentPage(1);
                  updateURLParams({ filter_is_default: e.target.value, page: 1 });
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  {Object.keys(data[0] || {}).map(key => (
                    <th
                      key={key}
                      className="px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort(key as keyof Coltemp)}
                    >
                      <div className="flex items-center gap-1">
                        <span>{key.toLowerCase()}</span>
                        {sortField === key && (
                          <span className="text-blue-600">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((row) => (
                  <tr key={row.coltemp_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(row)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        {deleteConfirmId === row.coltemp_id ? (
                          <>
                            <button
                              onClick={() => handleDelete(row.coltemp_id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              {deleteSecondConfirm ? 'Really?' : 'Confirm'}
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
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(row.coltemp_id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                    {Object.entries(row).map(([key, value]) => {
                      const isEditing = editingCell?.id === row.coltemp_id && editingCell?.field === key;
                      const isEditable = inlineEditableFields.includes(key);
                      
                      return (
                        <td key={key} className="px-3 py-2 text-sm text-gray-900">
                          {isEditable ? (
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
                                onClick={() => startInlineEdit(row.coltemp_id, key, value)}
                                title="Click to edit"
                              >
                                {value === null ? '' : String(value)}
                              </div>
                            )
                          ) : typeof value === 'boolean' ? (value ? 'true' : 'false') : 
                           value === null ? '' : String(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Column Template</h2>
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Column Template</h2>
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
    </div>
  );
}