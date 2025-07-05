'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface AdminRandomStorage {
  rstor_id: string;
  rstor_body: any;
  rstor_substance: string | null;
  fk_app_page: string | null;
  created_at: string;
  updated_at: string;
}

export default function RstorManagerPage() {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  // Data state
  const [data, setData] = useState<AdminRandomStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [pageFilter, setPageFilter] = useState('all');
  const [uniquePages, setUniquePages] = useState<string[]>([]);
  
  // Sort state
  const [sortField, setSortField] = useState<keyof AdminRandomStorage>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('admin_random_storage')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`rstor_substance.ilike.%${searchTerm}%,fk_app_page.ilike.%${searchTerm}%,rstor_body::text.ilike.%${searchTerm}%`);
      }

      // Apply page filter
      if (pageFilter !== 'all') {
        query = query.eq('fk_app_page', pageFilter);
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data: fetchedData, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setData(fetchedData || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unique pages for filter dropdown
  const fetchUniquePages = async () => {
    try {
      const { data: pages, error } = await supabase
        .from('admin_random_storage')
        .select('fk_app_page')
        .not('fk_app_page', 'is', null);

      if (error) throw error;

      const unique = Array.from(new Set(pages?.map(p => p.fk_app_page).filter(Boolean))) as string[];
      setUniquePages(unique.sort());
    } catch (err) {
      console.error('Error fetching unique pages:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    document.title = "RSTOR Manager";
    fetchData();
    fetchUniquePages();
  }, [currentPage, itemsPerPage, searchTerm, pageFilter, sortField, sortOrder]);

  // Handle sorting
  const handleSort = (field: keyof AdminRandomStorage) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle page filter
  const handlePageFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageFilter(e.target.value);
    setCurrentPage(1);
  };

  // Format JSON display
  const formatJsonDisplay = (json: any) => {
    if (!json) return '-';
    try {
      return JSON.stringify(json, null, 2);
    } catch {
      return String(json);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Random Storage Manager</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage admin random storage entries
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600">Error: {error}</div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search substance, page, or JSON content..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ minWidth: '300px' }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="font-bold text-sm whitespace-nowrap">Page Filter:</label>
            <select
              value={pageFilter}
              onChange={handlePageFilter}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Pages</option>
              {uniquePages.map((page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Showing {data.length} of {totalCount} records
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('rstor_id')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  <span>rstor_id</span>
                  {sortField === 'rstor_id' && (
                    <span className="text-blue-600">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('fk_app_page')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  <span>fk_app_page</span>
                  {sortField === 'fk_app_page' && (
                    <span className="text-blue-600">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('rstor_substance')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  <span>rstor_substance</span>
                  {sortField === 'rstor_substance' && (
                    <span className="text-blue-600">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider"
              >
                rstor_body
              </th>
              <th
                onClick={() => handleSort('created_at')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  <span>created_at</span>
                  {sortField === 'created_at' && (
                    <span className="text-blue-600">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('updated_at')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  <span>updated_at</span>
                  {sortField === 'updated_at' && (
                    <span className="text-blue-600">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => (
              <tr key={row.rstor_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="font-mono text-xs">
                    {row.rstor_id.substring(0, 8)}...
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.fk_app_page || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs truncate">
                    {row.rstor_substance || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-md">
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {formatJsonDisplay(row.rstor_body)}
                    </pre>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(row.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(row.updated_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
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

      {/* No Data Message */}
      {!loading && data.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {searchTerm || pageFilter !== 'all' 
              ? 'No records found matching your filters.' 
              : 'No random storage entries found.'}
          </div>
        </div>
      )}
    </div>
  );
}