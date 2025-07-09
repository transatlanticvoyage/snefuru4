'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Zarno {
  zarno_id: number;
  fk_xpage_id: number | null;
  zarno_type: string | null;
  zarno_name: string | null;
  zarno_path: string | null;
  zarno_status: string | null;
  zarno_config: any;
  execution_order: number | null;
  dependencies: any;
  metadata: any;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface XPage {
  xpage_id: number;
  title1: string | null;
}

export default function ZarnosTable() {
  const [data, setData] = useState<Zarno[]>([]);
  const [xpages, setXpages] = useState<XPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(200);
  const [sortField, setSortField] = useState<keyof Zarno | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Zarno | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteSecondConfirm, setDeleteSecondConfirm] = useState(false);
  
  // Content viewer modal state
  const [isContentViewerOpen, setIsContentViewerOpen] = useState(false);
  const [contentViewerData, setContentViewerData] = useState<{title: string; content: string; recordId: string} | null>(null);
  const [isContentEditing, setIsContentEditing] = useState(false);
  const [contentEditValue, setContentEditValue] = useState('');
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data
  const [formData, setFormData] = useState({
    fk_xpage_id: null as number | null,
    zarno_type: 'default',
    zarno_name: '',
    zarno_path: '',
    zarno_status: 'active',
    zarno_config: '',
    execution_order: 0,
    dependencies: '',
    metadata: '',
    is_enabled: true,
    created_by: ''
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
        .from('zarnos')
        .select('*')
        .order('zarno_id', { ascending: true });
        
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
  const handleSort = (field: keyof Zarno) => {
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
      let zarnoConfigData = null;
      if (formData.zarno_config && formData.zarno_config.trim()) {
        try {
          zarnoConfigData = JSON.parse(formData.zarno_config);
        } catch (parseError) {
          alert('Invalid JSON in zarno_config field. Please check the format.');
          return;
        }
      }

      let dependenciesData = null;
      if (formData.dependencies && formData.dependencies.trim()) {
        try {
          dependenciesData = JSON.parse(formData.dependencies);
        } catch (parseError) {
          alert('Invalid JSON in dependencies field. Please check the format.');
          return;
        }
      }

      let metadataData = null;
      if (formData.metadata && formData.metadata.trim()) {
        try {
          metadataData = JSON.parse(formData.metadata);
        } catch (parseError) {
          alert('Invalid JSON in metadata field. Please check the format.');
          return;
        }
      }
      
      const insertData = {
        fk_xpage_id: formData.fk_xpage_id,
        zarno_type: formData.zarno_type?.trim() || 'default',
        zarno_name: formData.zarno_name?.trim() || null,
        zarno_path: formData.zarno_path?.trim() || null,
        zarno_status: formData.zarno_status?.trim() || 'active',
        zarno_config: zarnoConfigData,
        execution_order: formData.execution_order || null,
        dependencies: dependenciesData,
        metadata: metadataData,
        is_enabled: formData.is_enabled,
        created_by: formData.created_by?.trim() || null
      };
      
      console.log('Inserting data:', insertData);
      
      const { error: insertError } = await supabase
        .from('zarnos')
        .insert([insertData]);
        
      if (insertError) throw insertError;
      
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error creating record:', err);
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err, null, 2);
      } else {
        errorMessage = String(err);
      }
      alert(`Failed to create record: ${errorMessage}`);
    }
  };
  
  // Handle edit
  const handleEdit = async () => {
    if (!editingRecord) return;
    
    try {
      let zarnoConfigData = null;
      if (formData.zarno_config && formData.zarno_config.trim()) {
        try {
          zarnoConfigData = JSON.parse(formData.zarno_config);
        } catch (parseError) {
          alert('Invalid JSON in zarno_config field. Please check the format.');
          return;
        }
      }

      let dependenciesData = null;
      if (formData.dependencies && formData.dependencies.trim()) {
        try {
          dependenciesData = JSON.parse(formData.dependencies);
        } catch (parseError) {
          alert('Invalid JSON in dependencies field. Please check the format.');
          return;
        }
      }

      let metadataData = null;
      if (formData.metadata && formData.metadata.trim()) {
        try {
          metadataData = JSON.parse(formData.metadata);
        } catch (parseError) {
          alert('Invalid JSON in metadata field. Please check the format.');
          return;
        }
      }
      
      const { error: updateError } = await supabase
        .from('zarnos')
        .update({
          ...formData,
          zarno_config: zarnoConfigData,
          dependencies: dependenciesData,
          metadata: metadataData
        })
        .eq('zarno_id', editingRecord.zarno_id);
        
      if (updateError) throw updateError;
      
      setIsEditModalOpen(false);
      setEditingRecord(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error updating record:', err);
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err, null, 2);
      } else {
        errorMessage = String(err);
      }
      alert(`Failed to update record: ${errorMessage}`);
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
        .from('zarnos')
        .delete()
        .eq('zarno_id', id);
        
      if (deleteError) throw deleteError;
      
      setDeleteConfirmId(null);
      setDeleteSecondConfirm(false);
      fetchData();
    } catch (err) {
      console.error('Error deleting record:', err);
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err, null, 2);
      } else {
        errorMessage = String(err);
      }
      alert(`Failed to delete record: ${errorMessage}`);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      fk_xpage_id: null,
      zarno_type: 'default',
      zarno_name: '',
      zarno_path: '',
      zarno_status: 'active',
      zarno_config: '',
      execution_order: 0,
      dependencies: '',
      metadata: '',
      is_enabled: true,
      created_by: ''
    });
  };
  
  // Handle opening edit modal
  const openEditModal = (record: Zarno) => {
    setEditingRecord(record);
    setFormData({
      fk_xpage_id: record.fk_xpage_id,
      zarno_type: record.zarno_type || '',
      zarno_name: record.zarno_name || '',
      zarno_path: record.zarno_path || '',
      zarno_status: record.zarno_status || 'active',
      zarno_config: record.zarno_config ? JSON.stringify(record.zarno_config, null, 2) : '',
      execution_order: record.execution_order || 0,
      dependencies: record.dependencies ? JSON.stringify(record.dependencies, null, 2) : '',
      metadata: record.metadata ? JSON.stringify(record.metadata, null, 2) : '',
      is_enabled: record.is_enabled,
      created_by: record.created_by || ''
    });
    setIsEditModalOpen(true);
  };

  // Column definitions matching zarnos table structure
  const columns = [
    { key: 'zarno_id' as keyof Zarno, label: 'zarno_id', type: 'number' },
    { key: 'fk_xpage_id' as keyof Zarno, label: 'fk_xpage_id', type: 'number' },
    { key: 'zarno_type' as keyof Zarno, label: 'zarno_type', type: 'text' },
    { key: 'zarno_name' as keyof Zarno, label: 'zarno_name', type: 'text' },
    { key: 'zarno_path' as keyof Zarno, label: 'zarno_path', type: 'text' },
    { key: 'zarno_status' as keyof Zarno, label: 'zarno_status', type: 'text' },
    { key: 'zarno_config' as keyof Zarno, label: 'zarno_config', type: 'json' },
    { key: 'execution_order' as keyof Zarno, label: 'execution_order', type: 'number' },
    { key: 'dependencies' as keyof Zarno, label: 'dependencies', type: 'json' },
    { key: 'metadata' as keyof Zarno, label: 'metadata', type: 'json' },
    { key: 'is_enabled' as keyof Zarno, label: 'is_enabled', type: 'boolean' },
    { key: 'created_at' as keyof Zarno, label: 'created_at', type: 'timestamp' },
    { key: 'updated_at' as keyof Zarno, label: 'updated_at', type: 'timestamp' },
    { key: 'created_by' as keyof Zarno, label: 'created_by', type: 'text' }
  ];

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      {/* Search and Controls */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search zarnos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-64"
          />
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={200}>200 per page</option>
          </select>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Create New Zarno
        </button>
      </div>

      {/* Results info */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {paginatedData.length} of {sortedData.length} zarnos
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b">
                Actions
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center">
                    <span style={{ fontWeight: 'bold', textTransform: 'lowercase' }}>
                      {column.label}
                    </span>
                    {sortField === column.key && (
                      <span className="ml-1">
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
              <tr key={row.zarno_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => openEditModal(row)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(row.zarno_id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.type === 'boolean' ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row[column.key] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {row[column.key] ? 'Yes' : 'No'}
                      </span>
                    ) : column.type === 'json' ? (
                      <div className="max-w-xs truncate">
                        {row[column.key] ? JSON.stringify(row[column.key]) : ''}
                      </div>
                    ) : column.type === 'timestamp' ? (
                      new Date(row[column.key] as string).toLocaleString()
                    ) : column.key === 'fk_xpage_id' && row[column.key] ? (
                      <div>
                        {row[column.key]}
                        {xpages.find(x => x.xpage_id === row[column.key])?.title1 && (
                          <div className="text-xs text-gray-500">
                            {xpages.find(x => x.xpage_id === row[column.key])?.title1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="max-w-xs truncate">
                        {row[column.key]?.toString() || ''}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
          </div>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              {!deleteSecondConfirm 
                ? 'Are you sure you want to delete this zarno? This action cannot be undone.'
                : 'This is your final confirmation. The zarno will be permanently deleted.'
              }
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteSecondConfirm(false);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className={`px-4 py-2 text-white rounded ${
                  deleteSecondConfirm 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-yellow-500 hover:bg-yellow-600'
                }`}
              >
                {deleteSecondConfirm ? 'DELETE PERMANENTLY' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Zarno</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">XPage</label>
                  <select
                    value={formData.fk_xpage_id || ''}
                    onChange={(e) => setFormData({...formData, fk_xpage_id: e.target.value ? Number(e.target.value) : null})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select XPage</option>
                    {xpages.map(xpage => (
                      <option key={xpage.xpage_id} value={xpage.xpage_id}>
                        {xpage.xpage_id} - {xpage.title1 || '(No title)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zarno Type</label>
                  <select
                    value={formData.zarno_type}
                    onChange={(e) => setFormData({...formData, zarno_type: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="default">Default</option>
                    <option value="route">Route</option>
                    <option value="component">Component</option>
                    <option value="api">API</option>
                    <option value="hook">Hook</option>
                    <option value="service">Service</option>
                    <option value="utility">Utility</option>
                    <option value="config">Config</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zarno Name</label>
                  <input
                    type="text"
                    value={formData.zarno_name}
                    onChange={(e) => setFormData({...formData, zarno_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter zarno name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zarno Path</label>
                  <input
                    type="text"
                    value={formData.zarno_path}
                    onChange={(e) => setFormData({...formData, zarno_path: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="File path or URL path"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.zarno_status}
                    onChange={(e) => setFormData({...formData, zarno_status: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="active">Active</option>
                    <option value="deprecated">Deprecated</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Execution Order</label>
                  <input
                    type="number"
                    value={formData.execution_order}
                    onChange={(e) => setFormData({...formData, execution_order: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <input
                    type="text"
                    value={formData.created_by}
                    onChange={(e) => setFormData({...formData, created_by: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="User ID or name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <input
                      type="checkbox"
                      checked={formData.is_enabled}
                      onChange={(e) => setFormData({...formData, is_enabled: e.target.checked})}
                      className="mr-2"
                    />
                    Enabled
                  </label>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Zarno Config (JSON)</label>
                <textarea
                  value={formData.zarno_config}
                  onChange={(e) => setFormData({...formData, zarno_config: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder='{"key": "value"}'
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dependencies (JSON)</label>
                <textarea
                  value={formData.dependencies}
                  onChange={(e) => setFormData({...formData, dependencies: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder='["dependency1", "dependency2"]'
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Metadata (JSON)</label>
                <textarea
                  value={formData.metadata}
                  onChange={(e) => setFormData({...formData, metadata: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder='{"description": "Additional metadata"}'
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
                  Create Zarno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Zarno (ID: {editingRecord.zarno_id})</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">XPage</label>
                  <select
                    value={formData.fk_xpage_id || ''}
                    onChange={(e) => setFormData({...formData, fk_xpage_id: e.target.value ? Number(e.target.value) : null})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select XPage</option>
                    {xpages.map(xpage => (
                      <option key={xpage.xpage_id} value={xpage.xpage_id}>
                        {xpage.xpage_id} - {xpage.title1 || '(No title)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zarno Type</label>
                  <select
                    value={formData.zarno_type}
                    onChange={(e) => setFormData({...formData, zarno_type: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="default">Default</option>
                    <option value="route">Route</option>
                    <option value="component">Component</option>
                    <option value="api">API</option>
                    <option value="hook">Hook</option>
                    <option value="service">Service</option>
                    <option value="utility">Utility</option>
                    <option value="config">Config</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zarno Name</label>
                  <input
                    type="text"
                    value={formData.zarno_name}
                    onChange={(e) => setFormData({...formData, zarno_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter zarno name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zarno Path</label>
                  <input
                    type="text"
                    value={formData.zarno_path}
                    onChange={(e) => setFormData({...formData, zarno_path: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="File path or URL path"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.zarno_status}
                    onChange={(e) => setFormData({...formData, zarno_status: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="active">Active</option>
                    <option value="deprecated">Deprecated</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Execution Order</label>
                  <input
                    type="number"
                    value={formData.execution_order}
                    onChange={(e) => setFormData({...formData, execution_order: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <input
                    type="text"
                    value={formData.created_by}
                    onChange={(e) => setFormData({...formData, created_by: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="User ID or name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <input
                      type="checkbox"
                      checked={formData.is_enabled}
                      onChange={(e) => setFormData({...formData, is_enabled: e.target.checked})}
                      className="mr-2"
                    />
                    Enabled
                  </label>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Zarno Config (JSON)</label>
                <textarea
                  value={formData.zarno_config}
                  onChange={(e) => setFormData({...formData, zarno_config: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder='{"key": "value"}'
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dependencies (JSON)</label>
                <textarea
                  value={formData.dependencies}
                  onChange={(e) => setFormData({...formData, dependencies: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder='["dependency1", "dependency2"]'
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Metadata (JSON)</label>
                <textarea
                  value={formData.metadata}
                  onChange={(e) => setFormData({...formData, metadata: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder='{"description": "Additional metadata"}'
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingRecord(null);
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
                  Update Zarno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}