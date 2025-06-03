"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Define the columns based on the domains1 schema
const columns = [
  'id',
  'domain_base',
  'note1',
  'fk_user_id',
  'created_at',
  'updated_at'
];

export default function Domjar1Page() {
  const { user } = useAuth();
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [5, 10, 20, 50, 100];
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchDomains = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user?.id) {
          setDomains([]);
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
          setDomains([]);
          setLoading(false);
          return;
        }
        
        // Fetch domains1 for this user
        const { data, error } = await supabase
          .from('domains1')
          .select('*')
          .eq('fk_user_id', userData.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setDomains(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch domains');
        setDomains([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDomains();
  }, [user, supabase]);

  // Pagination calculations
  const totalItems = domains.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = domains.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Generate page numbers for pagination display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show smart pagination with ellipsis
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);
      
      // Adjust if we're near the beginning
      if (startPage === 1) {
        endPage = Math.min(totalPages, maxVisiblePages);
      }
      
      // Adjust if we're near the end
      if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
          pageNumbers.push('...');
        }
      }
      
      // Add visible pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push('...');
        }
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Format column data for display
  const formatColumnData = (col: string, value: any) => {
    if (value === null || value === undefined) return '';
    
    switch (col) {
      case 'created_at':
      case 'updated_at':
        return new Date(value).toLocaleString();
      case 'id':
      case 'fk_user_id':
        return String(value).substring(0, 8) + '...'; // Show first 8 chars of UUID
      case 'domain_base':
        return String(value).length > 50 ? String(value).substring(0, 50) + '...' : String(value);
      case 'note1':
        return String(value).length > 100 ? String(value).substring(0, 100) + '...' : String(value);
      default:
        return String(value);
    }
  };

  // Get column display name
  const getColumnDisplayName = (col: string) => {
    switch (col) {
      case 'id': return 'ID';
      case 'domain_base': return 'Domain';
      case 'note1': return 'Notes';
      case 'fk_user_id': return 'User ID';
      case 'created_at': return 'Created';
      case 'updated_at': return 'Updated';
      default: return col;
    }
  };

  if (loading) return <div className="p-6">Loading domains...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Domains Management</h1>
      
      {/* Statistics Bar */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to{' '}
            <span className="font-medium text-gray-900">{endIndex}</span> of{' '}
            <span className="font-medium text-gray-900">{totalItems}</span> domains
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
            {currentItems.map((domain, index) => (
              <tr key={domain.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map(col => (
                  <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-xs">
                      {formatColumnData(col, domain[col])}
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
          {/* First Page Button */}
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

          {/* Previous Page Button */}
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

          {/* Page Numbers */}
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

          {/* Next Page Button */}
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

          {/* Last Page Button */}
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
      {domains.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No domains found</h3>
          <p className="mt-1 text-sm text-gray-500">No domains have been added to your account yet.</p>
        </div>
      )}
    </div>
  );
} 