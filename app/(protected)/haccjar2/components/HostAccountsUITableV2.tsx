'use client';

import { useState, useMemo } from 'react';

interface HostCompany {
  id: string;
  name: string | null;
  portal_url1: string | null;
  fk_user_id: string;
  notes1: string | null;
  notes2: string | null;
  notes3: string | null;
}

interface HostAccountRecord {
  id: string; // UUID
  username: string | null;
  pass: string | null;
  hostacct_apikey1: string | null;
  fk_user_id: string;
  fk_host_company_id: string | null;
  host_company: HostCompany | null;
  domains_glacier: string | null;
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
  const [selectedHostAccounts, setSelectedHostAccounts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter and search logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        item.username?.toLowerCase().includes(searchLower) ||
        item.id?.toLowerCase().includes(searchLower) ||
        item.fk_host_company_id?.toLowerCase().includes(searchLower) ||
        item.host_company?.name?.toLowerCase().includes(searchLower) ||
        item.host_company?.portal_url1?.toLowerCase().includes(searchLower) ||
        item.host_company?.notes1?.toLowerCase().includes(searchLower) ||
        item.host_company?.notes2?.toLowerCase().includes(searchLower) ||
        item.host_company?.notes3?.toLowerCase().includes(searchLower);

      return matchesSearch;
    });
  }, [data, searchTerm]);

  // Sort logic
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle null values
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      // Handle object values (like host_company) by converting to string
      if (typeof aVal === 'object') aVal = '';
      if (typeof bVal === 'object') bVal = '';

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

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = new Set(paginatedData.map(item => item.id));
      setSelectedHostAccounts(allIds);
    } else {
      setSelectedHostAccounts(new Set());
    }
  };

  // Handle individual checkbox
  const handleSelectHostAccount = (hostAccountId: string, checked: boolean) => {
    const newSelected = new Set(selectedHostAccounts);
    if (checked) {
      newSelected.add(hostAccountId);
    } else {
      newSelected.delete(hostAccountId);
      setSelectAll(false);
    }
    setSelectedHostAccounts(newSelected);
    
    // Check if all visible items are selected
    if (newSelected.size === paginatedData.length && paginatedData.every(item => newSelected.has(item.id))) {
      setSelectAll(true);
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

  const handleFetchDomains = async () => {
    const selectedId = Array.from(selectedHostAccounts)[0];
    const selectedAccount = data.find(account => account.id === selectedId);
    
    if (!selectedAccount) {
      setFetchError('Selected account not found');
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      console.log('Fetching domains for account:', selectedAccount);
      
      const response = await fetch('/api/fetch-domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host_account_id: selectedAccount.id
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('Successfully fetched domains:', result);
        // Refresh the data to show updated domains_glacier
        if (onDataChange) {
          onDataChange();
        }
      } else {
        console.error('Error fetching domains:', result.error);
        setFetchError(result.error);
      }
    } catch (error) {
      console.error('Error calling fetch domains API:', error);
      setFetchError('Network error occurred while fetching domains');
    } finally {
      setIsLoading(false);
    }
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
                {/* Host Company columns on the left */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  company.id
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  company.name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  company.portal_url1
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  company.fk_user_id
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  company.notes1
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  company.notes2
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  company.notes3
                </th>
                {/* Separator column */}
                <th className="px-2 bg-gray-200"></th>
                {/* Checkbox column */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">(checkbox)</span>
                  </div>
                </th>
                {/* Host Account columns on the right */}
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  account.id {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('username')}
                >
                  account.username {sortField === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  account.pass
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  account.hostacct_apikey1
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  account.fk_user_id
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('fk_host_company_id')}
                >
                  account.fk_host_company_id {sortField === 'fk_host_company_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {/* Host Company columns */}
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900 text-xs">
                    {item.host_company ? truncateText(item.host_company.id, 8) + '...' : '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-900 font-medium">
                    {item.host_company?.name || '-'}
                  </td>
                  <td className="px-4 py-2 text-blue-600 hover:text-blue-800">
                    {item.host_company?.portal_url1 ? (
                      <a 
                        href={item.host_company.portal_url1} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {truncateText(item.host_company.portal_url1, 30)}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-xs">
                    {item.host_company ? truncateText(item.host_company.fk_user_id, 8) + '...' : '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {truncateText(item.host_company?.notes1 || null, 20)}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {truncateText(item.host_company?.notes2 || null, 20)}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {truncateText(item.host_company?.notes3 || null, 20)}
                  </td>
                  {/* Separator column */}
                  <td className="px-2 bg-gray-200"></td>
                  {/* Checkbox column */}
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedHostAccounts.has(item.id)}
                      onChange={(e) => handleSelectHostAccount(item.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  {/* Host Account columns */}
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
                  <td colSpan={16} className="px-4 py-8 text-center text-gray-500">
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

      {/* Action Button */}
      <div className="mt-4 flex flex-col items-center space-y-2">
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
          onClick={handleFetchDomains}
          disabled={selectedHostAccounts.size !== 1 || isLoading}
        >
          {isLoading ? 'Fetching domains...' : 'fetch domains_glacier'}
        </button>
        
        {fetchError && (
          <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md">
            Error: {fetchError}
          </div>
        )}
      </div>

      {/* Domains Glacier Text Box */}
      <div className="mt-6">
        <div className="mb-2">
          <span className="text-sm font-bold text-gray-700">
            host_account.domains_glacier {selectedHostAccounts.size === 1 && (() => {
              const selectedId = Array.from(selectedHostAccounts)[0];
              const selectedAccount = data.find(account => account.id === selectedId);
              const companyName = selectedAccount?.host_company?.name || 'unknown';
              const username = selectedAccount?.username || 'unknown';
              return `(${companyName} - ${username})`;
            })()}
          </span>
        </div>
        <textarea
          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-md text-sm font-mono resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={selectedHostAccounts.size === 1 ? "Domain data will appear here after fetching..." : "Select exactly one host account to view domains_glacier data"}
          value={(() => {
            if (selectedHostAccounts.size === 1) {
              const selectedId = Array.from(selectedHostAccounts)[0];
              const selectedAccount = data.find(account => account.id === selectedId);
              return selectedAccount?.domains_glacier || '';
            }
            return '';
          })()}
          readOnly
        />
      </div>
    </div>
  );
}