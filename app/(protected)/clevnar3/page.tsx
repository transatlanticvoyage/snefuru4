"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ApiKeySlotJoined {
  // api_key_slots columns (left side - primary entity)
  slot_id: string;
  slot_name: string | null;
  m1name: string | null;
  m1inuse: boolean;
  m2name: string | null;
  m2inuse: boolean;
  m3name: string | null;
  m3inuse: boolean;
  slot_created_at: string;
  slot_updated_at: string;
  fk_iservices_provider_id: string | null;
  slot_publicly_shown: boolean;
  fk_ai_model_id: string | null;
  count_active_modules_on_slot: number;
  is_ai_model: boolean;
  
  // api_keys_t3 columns (right side - joined user data)
  api_key_id: string | null;
  fk_user_id: string | null;
  fk_slot_id: string | null;
  key_created_at: string | null;
  key_updated_at: string | null;
  d_m1name: string | null;
  d_m2name: string | null;
  d_m3name: string | null;
  d_slot_name: string | null;
  d_user_email: string | null;
}

const columns = [
  // api_key_slots columns
  'slot_id',
  'slot_name',
  'm1name',
  'm1inuse',
  'm2name', 
  'm2inuse',
  'm3name',
  'm3inuse',
  'slot_created_at',
  'slot_updated_at',
  'fk_iservices_provider_id',
  'slot_publicly_shown',
  'fk_ai_model_id',
  'count_active_modules_on_slot',
  'is_ai_model',
  
  // api_keys_t3 columns
  'api_key_id',
  'fk_user_id',
  'fk_slot_id',
  'key_created_at',
  'key_updated_at',
  'd_m1name',
  'd_m2name',
  'd_m3name',
  'd_slot_name',
  'd_user_email'
];

export default function Clevnar3Page() {
  const [data, setData] = useState<ApiKeySlotJoined[]>([]);
  const [filteredData, setFilteredData] = useState<ApiKeySlotJoined[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  const pageSizeOptions = [5, 10, 20, 50, 100];
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'clevnar3 - Snefuru';
  }, []);

  useEffect(() => {
    fetchJoinedData();
  }, [user]);

  useEffect(() => {
    // Filter data based on search term
    if (searchTerm) {
      const filtered = data.filter(item => 
        item.slot_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m1name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m2name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m3name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_m1name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_m2name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_m3name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_slot_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.slot_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.api_key_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, data]);

  const fetchJoinedData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        // Even without user, we can show public slots
        const { data: publicSlots, error: slotsError } = await supabase
          .from('api_key_slots')
          .select('*')
          .eq('slot_publicly_shown', true)
          .order('created_at', { ascending: false });
          
        if (slotsError) throw slotsError;
        
        // Transform to match expected structure
        const transformedSlots = (publicSlots || []).map(slot => ({
          // api_key_slots columns
          slot_id: slot.slot_id,
          slot_name: slot.slot_name,
          m1name: slot.m1name,
          m1inuse: slot.m1inuse,
          m2name: slot.m2name,
          m2inuse: slot.m2inuse,
          m3name: slot.m3name,
          m3inuse: slot.m3inuse,
          slot_created_at: slot.created_at,
          slot_updated_at: slot.updated_at,
          fk_iservices_provider_id: slot.fk_iservices_provider_id,
          slot_publicly_shown: slot.slot_publicly_shown,
          fk_ai_model_id: slot.fk_ai_model_id,
          count_active_modules_on_slot: slot.count_active_modules_on_slot,
          is_ai_model: slot.is_ai_model,
          
          // api_keys_t3 columns (all null for no user)
          api_key_id: null,
          fk_user_id: null,
          fk_slot_id: null,
          key_created_at: null,
          key_updated_at: null,
          d_m1name: null,
          d_m2name: null,
          d_m3name: null,
          d_slot_name: null,
          d_user_email: null
        }));
        
        setData(transformedSlots);
        setFilteredData(transformedSlots);
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
      
      // Fetch public slots first
      const { data: slotsData, error: slotsError } = await supabase
        .from('api_key_slots')
        .select('*')
        .eq('slot_publicly_shown', true)
        .order('created_at', { ascending: false });
        
      if (slotsError) throw slotsError;
      
      // Fetch user's api keys
      const { data: keysData, error: keysError } = await supabase
        .from('api_keys_t3')
        .select('*')
        .eq('fk_user_id', userData.id);
        
      if (keysError) throw keysError;
      
      // Manually join the data
      const joinedData = (slotsData || []).map(slot => {
        const userKey = (keysData || []).find(key => key.fk_slot_id === slot.slot_id);
        
        return {
          // api_key_slots columns (rename to match view structure)
          slot_id: slot.slot_id,
          slot_name: slot.slot_name,
          m1name: slot.m1name,
          m1inuse: slot.m1inuse,
          m2name: slot.m2name,
          m2inuse: slot.m2inuse,
          m3name: slot.m3name,
          m3inuse: slot.m3inuse,
          slot_created_at: slot.created_at,
          slot_updated_at: slot.updated_at,
          fk_iservices_provider_id: slot.fk_iservices_provider_id,
          slot_publicly_shown: slot.slot_publicly_shown,
          fk_ai_model_id: slot.fk_ai_model_id,
          count_active_modules_on_slot: slot.count_active_modules_on_slot,
          is_ai_model: slot.is_ai_model,
          
          // api_keys_t3 columns (can be null)
          api_key_id: userKey?.api_key_id || null,
          fk_user_id: userKey?.fk_user_id || null,
          fk_slot_id: userKey?.fk_slot_id || null,
          key_created_at: userKey?.created_at || null,
          key_updated_at: userKey?.updated_at || null,
          d_m1name: userKey?.d_m1name || null,
          d_m2name: userKey?.d_m2name || null,
          d_m3name: userKey?.d_m3name || null,
          d_slot_name: userKey?.d_slot_name || null,
          d_user_email: userKey?.d_user_email || null
        };
      });
      
      setData(joinedData);
      setFilteredData(joinedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch joined data');
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

  const formatColumnData = (col: string, value: any) => {
    if (value === null || value === undefined) return '-';
    
    switch (col) {
      case 'slot_id':
      case 'api_key_id':
      case 'fk_user_id':
      case 'fk_slot_id':
      case 'fk_iservices_provider_id':
      case 'fk_ai_model_id':
        return value.substring(0, 8) + '...';
      case 'slot_created_at':
      case 'slot_updated_at':
      case 'key_created_at':
      case 'key_updated_at':
        return new Date(value).toLocaleString();
      case 'm1inuse':
      case 'm2inuse':
      case 'm3inuse':
      case 'slot_publicly_shown':
      case 'is_ai_model':
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {value ? 'Yes' : 'No'}
          </span>
        );
      case 'count_active_modules_on_slot':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            {value}
          </span>
        );
      default:
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

  if (loading) return <div className="p-6">Loading API key slots...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">API Key Slots Management</h1>
      <p className="text-sm text-gray-600 mb-6">SQL View: sqlview_apikeysjoined1 (api_key_slots LEFT JOIN api_keys_t3)</p>
      
      {/* Search and Filter Section */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search API Key Slots</label>
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
                placeholder="Search by slot names, module names, IDs, or email..."
              />
            </div>
          </div>
          <button
            onClick={fetchJoinedData}
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
            <span className="font-medium text-gray-900">{totalItems}</span> API key slots
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
              <th colSpan={15} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-blue-50">
                API Key Slots (Primary Entity)
              </th>
              <th colSpan={10} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-green-50">
                User API Keys (Joined Data)
              </th>
            </tr>
            <tr>
              {columns.map(col => (
                <th 
                  key={col} 
                  className={`px-6 py-3 text-left text-xs font-bold text-gray-500 lowercase tracking-wider ${
                    col.startsWith('slot_') || col.startsWith('m') || col.startsWith('fk_') || col.startsWith('is_') || col.startsWith('count_') 
                      ? 'bg-blue-50' 
                      : 'bg-green-50'
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((item, index) => (
              <tr key={item.slot_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map(col => (
                  <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-xs">
                      {formatColumnData(col, item[col as keyof ApiKeySlotJoined])}
                    </div>
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No API key slots found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No slots match your search criteria.' : 'No publicly available API key slots found.'}
          </p>
        </div>
      )}
    </div>
  );
}