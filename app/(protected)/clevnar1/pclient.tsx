"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ApiKey {
  api_key_id: string;
  fk_user_id: string;
  fk_provider_id: string | null;
  api_key_datum: string;
  key_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EditingState {
  [key: string]: {
    api_key_datum: string;
    key_name: string;
    is_active: boolean;
    fk_provider_id: string | null;
  };
}

const columns = [
  'actions',
  'api_key_id',
  'fk_user_id',
  'key_name',
  'api_key_datum',
  'fk_provider_id',
  'is_active',
  'created_at',
  'updated_at'
];

export default function Clevnar1Client() {
  const [data, setData] = useState<ApiKey[]>([]);
  const [filteredData, setFilteredData] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [editingData, setEditingData] = useState<EditingState>({});
  const [savingRows, setSavingRows] = useState<Set<string>>(new Set());
  
  const pageSizeOptions = [5, 10, 20, 50, 100];
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchApiKeys();
  }, [user]);

  useEffect(() => {
    // Filter data based on search term
    if (searchTerm) {
      const filtered = data.filter(item => 
        item.key_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.api_key_datum.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.api_key_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, data]);

  const fetchApiKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        setData([]);
        setLoading(false);
        return;
      }
      
      // Get user's DB id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
        
      if (userError || !userData) {
        setError('Could not find user record.');
        setData([]);
        setLoading(false);
        return;
      }
      
      // Fetch api_keys_t2 for this user
      const { data: apiKeys, error: apiKeysError } = await supabase
        .from('api_keys_t2')
        .select('*')
        .eq('fk_user_id', userData.id)
        .order('created_at', { ascending: false });
        
      if (apiKeysError) throw apiKeysError;
      setData(apiKeys || []);
      setFilteredData(apiKeys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys');
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleEdit = (apiKey: ApiKey) => {
    setEditingRows(new Set([...editingRows, apiKey.api_key_id]));
    setEditingData({
      ...editingData,
      [apiKey.api_key_id]: {
        api_key_datum: apiKey.api_key_datum,
        key_name: apiKey.key_name || '',
        is_active: apiKey.is_active,
        fk_provider_id: apiKey.fk_provider_id
      }
    });
  };

  const handleCancel = (apiKeyId: string) => {
    const newEditingRows = new Set(editingRows);
    newEditingRows.delete(apiKeyId);
    setEditingRows(newEditingRows);
    
    const newEditingData = { ...editingData };
    delete newEditingData[apiKeyId];
    setEditingData(newEditingData);
  };

  const handleSave = async (apiKeyId: string) => {
    const editData = editingData[apiKeyId];
    if (!editData) return;

    setSavingRows(new Set([...savingRows, apiKeyId]));
    
    try {
      const { error: updateError } = await supabase
        .from('api_keys_t2')
        .update({
          api_key_datum: editData.api_key_datum,
          key_name: editData.key_name,
          is_active: editData.is_active,
          fk_provider_id: editData.fk_provider_id,
          updated_at: new Date().toISOString()
        })
        .eq('api_key_id', apiKeyId);

      if (updateError) throw updateError;

      // Refresh data
      await fetchApiKeys();
      
      // Clear editing state
      handleCancel(apiKeyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      const newSavingRows = new Set(savingRows);
      newSavingRows.delete(apiKeyId);
      setSavingRows(newSavingRows);
    }
  };

  const handleFieldChange = (apiKeyId: string, field: keyof EditingState[string], value: any) => {
    setEditingData({
      ...editingData,
      [apiKeyId]: {
        ...editingData[apiKeyId],
        [field]: value
      }
    });
  };

  const formatColumnData = (col: string, value: any, apiKey: ApiKey) => {
    if (value === null || value === undefined) return '-';
    
    const isEditing = editingRows.has(apiKey.api_key_id);
    const editData = editingData[apiKey.api_key_id];
    
    switch (col) {
      case 'api_key_id':
        return value.substring(0, 8) + '...';
      case 'fk_user_id':
        return value.substring(0, 8) + '...';
      case 'key_name':
        if (isEditing) {
          return (
            <input
              type="text"
              value={editData?.key_name || ''}
              onChange={(e) => handleFieldChange(apiKey.api_key_id, 'key_name', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter key name"
            />
          );
        }
        return value || '-';
      case 'api_key_datum':
        if (isEditing) {
          return (
            <input
              type="text"
              value={editData?.api_key_datum || ''}
              onChange={(e) => handleFieldChange(apiKey.api_key_id, 'api_key_datum', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-xs"
              placeholder="Enter API key"
            />
          );
        }
        // Show masked key when not editing
        const keyLength = value.length;
        if (keyLength <= 8) return '********';
        return value.substring(0, 4) + '...' + value.substring(keyLength - 4);
      case 'fk_provider_id':
        if (isEditing) {
          return (
            <input
              type="text"
              value={editData?.fk_provider_id || ''}
              onChange={(e) => handleFieldChange(apiKey.api_key_id, 'fk_provider_id', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Provider ID"
            />
          );
        }
        return value ? value.substring(0, 8) + '...' : '-';
      case 'is_active':
        if (isEditing) {
          return (
            <select
              value={editData?.is_active ? 'true' : 'false'}
              onChange={(e) => handleFieldChange(apiKey.api_key_id, 'is_active', e.target.value === 'true')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          );
        }
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? 'Active' : 'Inactive'}
          </span>
        );
      case 'created_at':
      case 'updated_at':
        return new Date(value).toLocaleString();
      default:
        return String(value);
    }
  };

  const getColumnDisplayName = (col: string) => {
    switch (col) {
      case 'actions': return 'actions';
      case 'api_key_id': return 'api_key_id';
      case 'fk_user_id': return 'fk_user_id';
      case 'key_name': return 'key_name';
      case 'api_key_datum': return 'api_key_datum';
      case 'fk_provider_id': return 'fk_provider_id';
      case 'is_active': return 'is_active';
      case 'created_at': return 'created_at';
      case 'updated_at': return 'updated_at';
      default: return col;
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);
      
      if (startPage === 1) {
        endPage = Math.min(totalPages, maxVisiblePages);
      }
      
      if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
          pageNumbers.push('...');
        }
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push('...');
        }
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  if (loading) return <div className="p-6">Loading API keys...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">API Key Management</h1>
      <p className="text-sm text-gray-600 mb-6">db table: api_keys_t2</p>
      
      {/* Search and Filter Section */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search API Keys</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search by key name, ID, or key value..."
              />
            </div>
          </div>
          <button
            onClick={fetchApiKeys}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to{' '}
            <span className="font-medium text-gray-900">{endIndex}</span> of{' '}
            <span className="font-medium text-gray-900">{totalItems}</span> API keys
          </span>
          <div className="flex items-center space-x-2">
            <label htmlFor="pageSize" className="text-sm font-medium text-gray-700">
              Items per page:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th 
                  key={col} 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {getColumnDisplayName(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((apiKey, index) => (
              <tr key={apiKey.api_key_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map(col => (
                  <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {col === 'actions' ? (
                      <div className="flex space-x-2">
                        {editingRows.has(apiKey.api_key_id) ? (
                          <>
                            <button
                              onClick={() => handleSave(apiKey.api_key_id)}
                              disabled={savingRows.has(apiKey.api_key_id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {savingRows.has(apiKey.api_key_id) ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => handleCancel(apiKey.api_key_id)}
                              disabled={savingRows.has(apiKey.api_key_id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(apiKey)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="max-w-xs">
                        {formatColumnData(col, apiKey[col as keyof ApiKey], apiKey)}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center">
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="First Page"
          >
            <span className="sr-only">First</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Page"
          >
            <span className="sr-only">Previous</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {getPageNumbers().map((pageNum, index) => (
            <span key={index}>
              {pageNum === '...' ? (
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  onClick={() => handlePageChange(pageNum as number)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === pageNum
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )}
            </span>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Page"
          >
            <span className="sr-only">Next</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Last Page"
          >
            <span className="sr-only">Last</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0zm-6 0a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No API keys match your search criteria.' : 'You have not added any API keys yet.'}
          </p>
        </div>
      )}
    </div>
  );
}