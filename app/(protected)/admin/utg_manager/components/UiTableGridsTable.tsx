'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface UiTableGrid {
  utg_id: number;
  utg_name: string;
  utg_description: string | null;
  page: string;
  sql_view: string | null;
  main_db_table1: string | null;
  associated_files: any;
  utg_class: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  sort_order: number;
}

export default function UiTableGridsTable() {
  const [data, setData] = useState<UiTableGrid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof UiTableGrid | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UiTableGrid | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteSecondConfirm, setDeleteSecondConfirm] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    utg_name: '',
    utg_description: '',
    page: '',
    main_db_table1: '',
    sql_view: '',
    associated_files: '',
    utg_class: '',
    is_active: true,
    sort_order: 0
  });
  
  const supabase = createClientComponentClient();
  
  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from('ui_table_grids')
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
      
      const { error: insertError } = await supabase
        .from('ui_table_grids')
        .insert([{
          ...formData,
          associated_files: associatedFilesData
        }]);
        
      if (insertError) throw insertError;
      
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err.message || err}`);
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
      
      const { error: updateError } = await supabase
        .from('ui_table_grids')
        .update({
          ...formData,
          associated_files: associatedFilesData
        })
        .eq('utg_id', editingRecord.utg_id);
        
      if (updateError) throw updateError;
      
      setIsEditModalOpen(false);
      setEditingRecord(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error updating record:', err);
      alert(`Failed to update record: ${err.message || err}`);
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
        .from('ui_table_grids')
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
      utg_name: record.utg_name,
      utg_description: record.utg_description || '',
      page: record.page,
      main_db_table1: record.main_db_table1 || '',
      sql_view: record.sql_view || '',
      associated_files: record.associated_files ? JSON.stringify(record.associated_files) : '',
      utg_class: record.utg_class || '',
      is_active: record.is_active,
      sort_order: record.sort_order
    });
    setIsEditModalOpen(true);
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      utg_name: '',
      utg_description: '',
      page: '',
      main_db_table1: '',
      sql_view: '',
      associated_files: '',
      utg_class: '',
      is_active: true,
      sort_order: 0
    });
  };
  
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
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New Entry
        </button>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Object.keys(data[0] || {}).map((column) => (
                <th
                  key={column}
                  onClick={() => handleSort(column as keyof UiTableGrid)}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  {column}
                  {sortField === column && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider">
                actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row) => (
              <tr key={row.utg_id} className="hover:bg-gray-50">
                {Object.entries(row).map(([key, value]) => (
                  <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                <label className="block text-sm font-medium text-gray-700">utg_description</label>
                <textarea
                  value={formData.utg_description}
                  onChange={(e) => setFormData({...formData, utg_description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">page</label>
                <input
                  type="text"
                  value={formData.page}
                  onChange={(e) => setFormData({...formData, page: e.target.value})}
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
                <label className="block text-sm font-medium text-gray-700">main_db_table1</label>
                <input
                  type="text"
                  value={formData.main_db_table1}
                  onChange={(e) => setFormData({...formData, main_db_table1: e.target.value})}
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
                <label className="block text-sm font-medium text-gray-700">sort_order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({...formData, sort_order: Number(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700">utg_description</label>
                <textarea
                  value={formData.utg_description}
                  onChange={(e) => setFormData({...formData, utg_description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">page</label>
                <input
                  type="text"
                  value={formData.page}
                  onChange={(e) => setFormData({...formData, page: e.target.value})}
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
                <label className="block text-sm font-medium text-gray-700">main_db_table1</label>
                <input
                  type="text"
                  value={formData.main_db_table1}
                  onChange={(e) => setFormData({...formData, main_db_table1: e.target.value})}
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
                <label className="block text-sm font-medium text-gray-700">sort_order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({...formData, sort_order: Number(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
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
    </div>
  );
}