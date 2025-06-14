'use client';

import { useState, useMemo } from 'react';

interface HostAccountRecord {
  id: string; // UUID
  username: string | null;
  pass: string | null;
  hostacct_apikey1: string | null;
  fk_user_id: string;
  fk_host_company_id: string | null;
}

interface HostAccountsUITableV2Props {
  data: HostAccountRecord[];
  userId: string;
  onDataChange?: () => void;
}

type SortField = keyof HostAccountRecord;
type SortOrder = 'asc' | 'desc';

export default function HostAccountsUITableV2({ data, onDataChange }: HostAccountsUITableV2Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter and search logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        item.username?.toLowerCase().includes(searchLower) ||
        item.id?.toLowerCase().includes(searchLower) ||
        item.fk_host_company_id?.toLowerCase().includes(searchLower);

      return matchesSearch;
    });
  }, [data, searchTerm]);

  // Sort logic
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aVal: string | number = a[sortField] ?? '';
      let bVal: string | number = b[sortField] ?? '';

      // Handle null values
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      // Convert to lowercase for string comparison
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return sorted;
  }, [filteredData, sortField, sortOrder]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const truncateText = (text: string | null, maxLength: number = 30) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const maskPassword = (password: string | null) => {
    if (!password) return '-';
    return '••••••••';
  };

  const maskApiKey = (apiKey: string | null) => {
    if (!apiKey) return '-';
    if (apiKey.length <= 8) return '••••••••';
    return apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search host accounts..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {paginatedData.length} of {sortedData.length} results
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  id {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('username')}
                >
                  username {sortField === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  pass
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  hostacct_apikey1
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  fk_user_id
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('fk_host_company_id')}
                >
                  fk_host_company_id {sortField === 'fk_host_company_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900 text-xs">
                    {truncateText(item.id, 8)}...
                  </td>
                  <td className="px-4 py-2 text-gray-900 font-medium">
                    {item.username || '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {maskPassword(item.pass)}
                  </td>
                  <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                    {maskApiKey(item.hostacct_apikey1)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-xs">
                    {truncateText(item.fk_user_id, 8)}...
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-xs">
                    {item.fk_host_company_id ? truncateText(item.fk_host_company_id, 8) + '...' : '-'}
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No host accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Items per page:</span>
          <select
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </button>
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </button>
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}