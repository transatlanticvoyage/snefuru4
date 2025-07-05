'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Jexplanation {
  jexpl_id: string;
  jexpl_content: any;
  jexpl_note: string | null;
  jexpl_description: string | null;
  created_at: string;
  updated_at: string;
}

export default function JexplanationsTable() {
  const [data, setData] = useState<Jexplanation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(200);
  const [sortField, setSortField] = useState<keyof Jexplanation>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Filter states
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Jexplanation | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSecondConfirm, setDeleteSecondConfirm] = useState(false);
  
  // View modal state
  const [viewingRecord, setViewingRecord] = useState<Jexplanation | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    jexpl_content: '',
    jexpl_note: '',
    jexpl_description: ''
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
        .from('jexplanations')
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
  
  // Filter data based on search and date filters
  const filteredData = useMemo(() => {
    let filtered = data;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (row.jexpl_note && row.jexpl_note.toLowerCase().includes(searchLower)) ||
          (row.jexpl_description && row.jexpl_description.toLowerCase().includes(searchLower)) ||
          JSON.stringify(row.jexpl_content).toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Apply date filters
    if (dateFilter.startDate) {
      filtered = filtered.filter(row => 
        new Date(row.created_at) >= new Date(dateFilter.startDate)
      );
    }
    if (dateFilter.endDate) {
      filtered = filtered.filter(row => 
        new Date(row.created_at) <= new Date(dateFilter.endDate + 'T23:59:59')
      );
    }
    
    return filtered;
  }, [data, searchTerm, dateFilter]);
  
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
  const handleSort = (field: keyof Jexplanation) => {
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
      const { error: insertError } = await supabase
        .from('jexplanations')
        .insert([{
          jexpl_content: formData.jexpl_content ? JSON.parse(formData.jexpl_content) : null,
          jexpl_note: formData.jexpl_note || null,
          jexpl_description: formData.jexpl_description || null
        }]);
        
      if (insertError) throw insertError;
      
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error creating record:', err);
      alert('Failed to create record. Make sure JSON content is valid.');
    }
  };
  
  // Handle edit
  const handleEdit = async () => {
    if (!editingRecord) return;
    
    try {
      const { error: updateError } = await supabase
        .from('jexplanations')
        .update({
          jexpl_content: formData.jexpl_content ? JSON.parse(formData.jexpl_content) : null,
          jexpl_note: formData.jexpl_note || null,
          jexpl_description: formData.jexpl_description || null
        })
        .eq('jexpl_id', editingRecord.jexpl_id);
        
      if (updateError) throw updateError;
      
      setIsEditModalOpen(false);
      setEditingRecord(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error updating record:', err);
      alert('Failed to update record. Make sure JSON content is valid.');
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
        .from('jexplanations')
        .delete()
        .eq('jexpl_id', id);
        
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
  const startEdit = (record: Jexplanation) => {
    setEditingRecord(record);
    setFormData({
      jexpl_content: record.jexpl_content ? JSON.stringify(record.jexpl_content, null, 2) : '',
      jexpl_note: record.jexpl_note || '',
      jexpl_description: record.jexpl_description || ''
    });
    setIsEditModalOpen(true);
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      jexpl_content: '',
      jexpl_note: '',
      jexpl_description: ''
    });
  };
  
  // Format JSON for display
  const formatJsonPreview = (json: any) => {
    if (!json) return '-';
    try {
      return JSON.stringify(json, null, 2);
    } catch {
      return String(json);
    }
  };
  
  // Truncate text for display
  const truncateText = (text: string | null, maxLength: number = 100) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  if (loading) {
    return <div className="p-4">Loading...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }
  
  return (
    <div className="p-4">
      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search notes, descriptions, or content..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => {
                setDateFilter({...dateFilter, startDate: e.target.value});
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => {
                setDateFilter({...dateFilter, endDate: e.target.value});
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        {(searchTerm || dateFilter.startDate || dateFilter.endDate) && (
          <div className="mt-3">
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter({ startDate: '', endDate: '' });
                setCurrentPage(1);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={200}>200 per page</option>
            <option value={500}>500 per page</option>
          </select>
          <span className="text-sm text-gray-600">
            Total: {sortedData.length} records
          </span>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New Entry
        </button>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider border border-gray-200">
                actions
              </th>
              <th
                onClick={() => handleSort('jexpl_id')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100 border border-gray-200"
              >
                jexpl_id
                {sortField === 'jexpl_id' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('jexpl_note')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100 border border-gray-200"
              >
                jexpl_note
                {sortField === 'jexpl_note' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('jexpl_description')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100 border border-gray-200"
              >
                jexpl_description
                {sortField === 'jexpl_description' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider border border-gray-200">
                jexpl_content
              </th>
              <th
                onClick={() => handleSort('created_at')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100 border border-gray-200"
              >
                created_at
                {sortField === 'created_at' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('updated_at')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100 border border-gray-200"
              >
                updated_at
                {sortField === 'updated_at' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row) => (
              <tr key={row.jexpl_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm border border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingRecord(row)}
                      className="text-green-600 hover:text-green-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => startEdit(row)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    {deleteConfirmId === row.jexpl_id ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(row.jexpl_id)}
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
                        onClick={() => setDeleteConfirmId(row.jexpl_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
                  <div className="font-mono text-xs">
                    {row.jexpl_id.substring(0, 8)}...
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 border border-gray-200">
                  <div className="max-w-xs">
                    {truncateText(row.jexpl_note, 80)}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 border border-gray-200">
                  <div className="max-w-xs">
                    {truncateText(row.jexpl_description, 80)}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 border border-gray-200">
                  <div className="max-w-xs font-mono text-xs bg-gray-100 p-1 rounded">
                    {truncateText(JSON.stringify(row.jexpl_content), 60)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
                  {new Date(row.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
                  {new Date(row.updated_at).toLocaleString()}
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
      
      {/* View Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">View Jexplanation</h2>
              <button
                onClick={() => setViewingRecord(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <div className="p-2 bg-gray-100 rounded font-mono text-sm">
                  {viewingRecord.jexpl_id}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <div className="p-3 bg-gray-50 rounded">
                  {viewingRecord.jexpl_note || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="p-3 bg-gray-50 rounded">
                  {viewingRecord.jexpl_description || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (JSON)</label>
                <pre className="p-3 bg-gray-900 text-gray-100 rounded overflow-auto max-h-96">
                  {formatJsonPreview(viewingRecord.jexpl_content)}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <div className="p-2 bg-gray-50 rounded">
                    {new Date(viewingRecord.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated</label>
                  <div className="p-2 bg-gray-50 rounded">
                    {new Date(viewingRecord.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingRecord(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Jexplanation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Note</label>
                <input
                  type="text"
                  value={formData.jexpl_note}
                  onChange={(e) => setFormData({...formData, jexpl_note: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Brief note or title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.jexpl_description}
                  onChange={(e) => setFormData({...formData, jexpl_description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Detailed description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Content (JSON)</label>
                <textarea
                  value={formData.jexpl_content}
                  onChange={(e) => setFormData({...formData, jexpl_content: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={10}
                  placeholder='{"type": "doc", "content": []}'
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter valid JSON for rich text content. This will be used with Editor.js.
                </p>
              </div>
            </div>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Jexplanation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Note</label>
                <input
                  type="text"
                  value={formData.jexpl_note}
                  onChange={(e) => setFormData({...formData, jexpl_note: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Brief note or title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.jexpl_description}
                  onChange={(e) => setFormData({...formData, jexpl_description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Detailed description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Content (JSON)</label>
                <textarea
                  value={formData.jexpl_content}
                  onChange={(e) => setFormData({...formData, jexpl_content: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={10}
                  placeholder='{"type": "doc", "content": []}'
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter valid JSON for rich text content. This will be used with Editor.js.
                </p>
              </div>
            </div>
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