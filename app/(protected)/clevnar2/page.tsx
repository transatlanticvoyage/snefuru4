"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ApiKeyT3 {
  api_key_id: string;
  fk_user_id: string;
  fk_slot_id: string | null;
  created_at: string;
  updated_at: string;
  m1datum: string | null;
  m1ueplatlabel: string | null;
  m2datum: string | null;
  m2ueplatlabel: string | null;
  m3datum: string | null;
  m3ueplatlabel: string | null;
  d_m1platcodehandle: string | null;
  d_m2platcodehandle: string | null;
  d_m3platcodehandle: string | null;
  d_slot_name: string | null;
  d_user_email: string | null;
}

const columns = [
  'api_key_id',
  'fk_user_id',
  'fk_slot_id',
  'created_at',
  'updated_at',
  'm1datum',
  'm1ueplatlabel',
  'm2datum',
  'm2ueplatlabel',
  'm3datum',
  'm3ueplatlabel',
  'd_m1platcodehandle',
  'd_m2platcodehandle',
  'd_m3platcodehandle',
  'd_slot_name',
  'd_user_email'
];

export default function Clevnar2Page() {
  const [data, setData] = useState<ApiKeyT3[]>([]);
  const [filteredData, setFilteredData] = useState<ApiKeyT3[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFields, setEditingFields] = useState<{[key: string]: string}>({});
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());
  
  const pageSizeOptions = [5, 10, 20, 50, 100];
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'clevnar2 - Snefuru';
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [user]);

  useEffect(() => {
    // Filter data based on search term
    if (searchTerm) {
      const filtered = data.filter(item => 
        item.m1datum?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m1ueplatlabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m2datum?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m2ueplatlabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m3datum?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m3ueplatlabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_m1platcodehandle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_m2platcodehandle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_m3platcodehandle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_slot_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.api_key_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fk_user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fk_slot_id?.toLowerCase().includes(searchTerm.toLowerCase())
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
      
      // Fetch api_keys_t3 for this user
      const { data: apiKeys, error: apiKeysError } = await supabase
        .from('api_keys_t3')
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

  const getColumnSeparators = (col: string) => {
    // In clevnar2, we don't have m*inuse columns, but we might have m*datum fields
    // Right separator for m3datum
    const hasRightSeparator = col === 'm3datum';
    // No left separators needed in clevnar2 since we don't have the inuse columns
    const hasLeftSeparator = false;
    
    return { hasLeftSeparator, hasRightSeparator };
  };

  const handleSaveField = async (apiKeyId: string, fieldName: string, fieldValue: string) => {
    if (!user?.id) return;
    
    const fieldKey = `${apiKeyId}_${fieldName}`;
    setSavingFields(new Set([...savingFields, fieldKey]));
    
    try {
      const updateData = {
        [fieldName]: fieldValue.trim() || null,
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('api_keys_t3')
        .update(updateData)
        .eq('api_key_id', apiKeyId);
        
      if (updateError) throw updateError;
      
      // Clear the editing field and refresh data
      const newEditingFields = { ...editingFields };
      delete newEditingFields[fieldKey];
      setEditingFields(newEditingFields);
      
      await fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save field');
    } finally {
      const newSavingFields = new Set(savingFields);
      newSavingFields.delete(fieldKey);
      setSavingFields(newSavingFields);
    }
  };

  const formatColumnData = (col: string, value: any, item?: ApiKeyT3) => {
    switch (col) {
      case 'api_key_id':
      case 'fk_user_id':
      case 'fk_slot_id':
        if (value === null || value === undefined) return '-';
        return value.substring(0, 8) + '...';
      case 'created_at':
      case 'updated_at':
        if (value === null || value === undefined) return '-';
        return new Date(value).toLocaleString();
      case 'm1datum':
      case 'm2datum':
      case 'm3datum':
        if (!item || !user?.id) {
          if (value === null || value === undefined) return '-';
          // Mask API key
          const keyLength = value.length;
          if (keyLength <= 8) return '********';
          return value.substring(0, 4) + '...' + value.substring(keyLength - 4);
        }
        
        const fieldKey = `${item.api_key_id}_${col}`;
        const isEditing = editingFields.hasOwnProperty(fieldKey);
        const isSaving = savingFields.has(fieldKey);
        
        if (isEditing) {
          return (
            <div className="flex space-x-2 min-w-0">
              <input
                type="text"
                value={editingFields[fieldKey] || ''}
                onChange={(e) => setEditingFields({...editingFields, [fieldKey]: e.target.value})}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder={`Enter ${col} value`}
                disabled={isSaving}
              />
              <button
                onClick={() => handleSaveField(item.api_key_id, col, editingFields[fieldKey] || '')}
                disabled={isSaving}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  const newEditingFields = { ...editingFields };
                  delete newEditingFields[fieldKey];
                  setEditingFields(newEditingFields);
                }}
                disabled={isSaving}
                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>
          );
        }
        
        if (value === null || value === undefined) {
          return (
            <button
              onClick={() => setEditingFields({...editingFields, [fieldKey]: ''})}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              + Add
            </button>
          );
        } else {
          return (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {value.length <= 8 ? '••••••••' : value.substring(0, 4) + '••••' + value.substring(value.length - 4)}
              </span>
              <button
                onClick={() => setEditingFields({...editingFields, [fieldKey]: value || ''})}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit
              </button>
            </div>
          );
        }
        
      case 'm1ueplatlabel':
      case 'm2ueplatlabel':
      case 'm3ueplatlabel':
        if (!item || !user?.id) {
          if (value === null || value === undefined) return '-';
          return String(value);
        }
        
        const labelFieldKey = `${item.api_key_id}_${col}`;
        const isLabelEditing = editingFields.hasOwnProperty(labelFieldKey);
        const isLabelSaving = savingFields.has(labelFieldKey);
        
        if (isLabelEditing) {
          return (
            <div className="flex space-x-2 min-w-0">
              <input
                type="text"
                value={editingFields[labelFieldKey] || ''}
                onChange={(e) => setEditingFields({...editingFields, [labelFieldKey]: e.target.value})}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder={`Enter ${col} label`}
                disabled={isLabelSaving}
              />
              <button
                onClick={() => handleSaveField(item.api_key_id, col, editingFields[labelFieldKey] || '')}
                disabled={isLabelSaving}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLabelSaving ? '...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  const newEditingFields = { ...editingFields };
                  delete newEditingFields[labelFieldKey];
                  setEditingFields(newEditingFields);
                }}
                disabled={isLabelSaving}
                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>
          );
        }
        
        if (value === null || value === undefined || value === '') {
          return (
            <button
              onClick={() => setEditingFields({...editingFields, [labelFieldKey]: ''})}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              + Add Label
            </button>
          );
        } else {
          return (
            <div className="flex items-center space-x-2">
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                {value}
              </span>
              <button
                onClick={() => setEditingFields({...editingFields, [labelFieldKey]: value || ''})}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit
              </button>
            </div>
          );
        }
        
      default:
        if (value === null || value === undefined) return '-';
        return String(value);
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
      <h1 className="text-2xl font-bold text-gray-800 mb-2">/clevnar2 - api key management</h1>
      <p className="text-sm text-gray-600 mb-6">primary db table: api_keys_t3</p>
      
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
                placeholder="Search by names, IDs, or email..."
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
              {columns.map(col => {
                const { hasLeftSeparator, hasRightSeparator } = getColumnSeparators(col);
                
                return (
                  <th 
                    key={col} 
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 lowercase tracking-wider relative"
                  >
                    {hasLeftSeparator && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-black"></div>
                    )}
                    {col}
                    {hasRightSeparator && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-black"></div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((apiKey, index) => (
              <tr key={apiKey.api_key_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map(col => {
                  const { hasLeftSeparator, hasRightSeparator } = getColumnSeparators(col);
                  
                  return (
                    <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 relative">
                      {hasLeftSeparator && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-black"></div>
                      )}
                      <div className="max-w-xs">
                        {formatColumnData(col, apiKey[col as keyof ApiKeyT3], apiKey)}
                      </div>
                      {hasRightSeparator && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-black"></div>
                      )}
                    </td>
                  );
                })}
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