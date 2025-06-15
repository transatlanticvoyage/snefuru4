'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface SitesprenRecord {
  id: string; // Changed from number to string for UUID
  created_at: string;
  sitespren_base: string | null;
  true_root_domain: string | null;
  full_subdomain: string | null;
  webproperty_type: string | null;
  fk_users_id: string;
  updated_at: string | null;
  wpuser1: string | null;
  wppass1: string | null;
  ruplin_apikey: string | null;
  wp_rest_app_pass: string | null;
  wp_plugin_installed1: boolean | null;
  wp_plugin_connected2: boolean | null;
  fk_domreg_hostaccount: string | null;
  is_wp_site: boolean | null;
}

interface SitesprenTableProps {
  data: SitesprenRecord[];
  userId: string;
  onSelectionChange?: (selectedIds: string[]) => void;
}

type SortField = keyof SitesprenRecord;
type SortOrder = 'asc' | 'desc';

export default function SitesprenTable({ data, onSelectionChange }: SitesprenTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterWpSite, setFilterWpSite] = useState<string>('');
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [syncLoading, setSyncLoading] = useState<Set<string>>(new Set());
  const [syncResults, setSyncResults] = useState<{[key: string]: {type: 'success' | 'error', message: string}}>({});

  // Filter and search logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        item.sitespren_base?.toLowerCase().includes(searchLower) ||
        item.true_root_domain?.toLowerCase().includes(searchLower) ||
        item.full_subdomain?.toLowerCase().includes(searchLower) ||
        item.webproperty_type?.toLowerCase().includes(searchLower) ||
        item.wpuser1?.toLowerCase().includes(searchLower);

      // WordPress site filter
      const matchesWpFilter = filterWpSite === '' || 
        (filterWpSite === 'true' && item.is_wp_site === true) ||
        (filterWpSite === 'false' && item.is_wp_site === false) ||
        (filterWpSite === 'null' && item.is_wp_site === null);

      return matchesSearch && matchesWpFilter;
    });
  }, [data, searchTerm, filterWpSite]);

  // Sort logic
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle null values
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      // Handle date fields
      if (sortField === 'created_at' || sortField === 'updated_at') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
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

  // Handle selection
  const handleSiteSelection = (siteId: string, checked: boolean) => {
    const newSelected = new Set(selectedSites);
    if (checked) {
      newSelected.add(siteId);
    } else {
      newSelected.delete(siteId);
    }
    setSelectedSites(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const handleSelectAll = () => {
    const allPageIds = new Set(paginatedData.map(item => item.id));
    setSelectedSites(allPageIds);
    onSelectionChange?.(Array.from(allPageIds));
  };

  const handleClearAll = () => {
    setSelectedSites(new Set());
    onSelectionChange?.([]);
  };

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(item => selectedSites.has(item.id));

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBoolean = (value: boolean | null) => {
    if (value === null) return '-';
    return value ? '✓' : '✗';
  };

  const truncateText = (text: string | null, maxLength: number = 30) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // WPSv2 Sync handlers
  const handleWpsv2Sync = async (siteId: string, method: 'plugin_api' | 'rest_api') => {
    // Add to loading set
    setSyncLoading(prev => new Set([...prev, siteId]));
    
    // Clear previous result for this site
    setSyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[siteId];
      return newResults;
    });

    try {
      const response = await fetch('/api/wpsv2/sync-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId,
          method: method,
          fallbackEnabled: false
        })
      });

      const data = await response.json();

      if (data.success) {
        setSyncResults(prev => ({
          ...prev,
          [siteId]: {
            type: 'success',
            message: `✅ ${data.message} (${data.count} items)`
          }
        }));
      } else {
        setSyncResults(prev => ({
          ...prev,
          [siteId]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setSyncResults(prev => ({
        ...prev,
        [siteId]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      // Remove from loading set
      setSyncLoading(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(siteId);
        return newLoading;
      });
    }
  };

  const handleWpsv2TestPlugin = async (siteId: string) => {
    // Add to loading set
    setSyncLoading(prev => new Set([...prev, `test_${siteId}`]));
    
    // Clear previous result for this site
    setSyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[`test_${siteId}`];
      return newResults;
    });

    try {
      const response = await fetch('/api/wpsv2/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId
        })
      });

      const data = await response.json();

      if (data.success) {
        const pluginStatus = data.results.plugin_api.success ? '✅' : '❌';
        const restStatus = data.results.rest_api.success ? '✅' : '❌';
        
        setSyncResults(prev => ({
          ...prev,
          [`test_${siteId}`]: {
            type: 'success',
            message: `Plugin: ${pluginStatus} | REST: ${restStatus} | ${data.results.recommendations[0] || 'Test completed'}`
          }
        }));
      } else {
        setSyncResults(prev => ({
          ...prev,
          [`test_${siteId}`]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setSyncResults(prev => ({
        ...prev,
        [`test_${siteId}`]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      // Remove from loading set
      setSyncLoading(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(`test_${siteId}`);
        return newLoading;
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search sites..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filterWpSite}
              onChange={(e) => {
                setFilterWpSite(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Sites</option>
              <option value="true">WordPress Sites</option>
              <option value="false">Non-WordPress Sites</option>
              <option value="null">Unknown Type</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selection controls and results count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Showing {paginatedData.length} of {sortedData.length} results
          </div>
          {selectedSites.size > 0 && (
            <div className="text-sm text-blue-600 font-medium">
              {selectedSites.size} site(s) selected
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Select All on Page
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={isAllSelected ? handleClearAll : handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool Buttons
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sync Actions
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  id {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  created_at {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('sitespren_base')}
                >
                  sitespren_base {sortField === 'sitespren_base' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('true_root_domain')}
                >
                  true_root_domain {sortField === 'true_root_domain' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  full_subdomain
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  webproperty_type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  fk_users_id
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('updated_at')}
                >
                  updated_at {sortField === 'updated_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  wpuser1
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  wppass1
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ruplin_apikey
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  wp_rest_app_pass
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  wp_plugin_installed1
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  wp_plugin_connected2
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  fk_domreg_hostaccount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  is_wp_site
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedSites.has(item.id)}
                      onChange={(e) => handleSiteSelection(item.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Link
                      href={`/sitnivid?site=${encodeURIComponent(item.sitespren_base || '')}`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Individual View
                    </Link>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          onClick={() => handleWpsv2Sync(item.id, 'plugin_api')}
                          disabled={syncLoading.has(item.id)}
                        >
                          {syncLoading.has(item.id) ? 'Syncing...' : 'Plugin API'}
                        </button>
                        <button
                          className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          onClick={() => handleWpsv2Sync(item.id, 'rest_api')}
                          disabled={syncLoading.has(item.id)}
                        >
                          {syncLoading.has(item.id) ? 'Syncing...' : 'Rest API'}
                        </button>
                        <button
                          className="px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                          onClick={() => handleWpsv2TestPlugin(item.id)}
                          disabled={syncLoading.has(`test_${item.id}`)}
                        >
                          {syncLoading.has(`test_${item.id}`) ? 'Testing...' : 'Test Plugin'}
                        </button>
                      </div>
                      {/* Sync result display */}
                      {(syncResults[item.id] || syncResults[`test_${item.id}`]) && (
                        <div className={`text-xs p-2 rounded ${
                          (syncResults[item.id]?.type === 'success' || syncResults[`test_${item.id}`]?.type === 'success') 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {syncResults[item.id]?.message || syncResults[`test_${item.id}`]?.message}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900 text-xs">
                    {truncateText(item.id, 8)}...
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-4 py-2 text-gray-900 font-medium">
                    {item.sitespren_base || '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {item.true_root_domain || '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {item.full_subdomain || '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {item.webproperty_type || '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-xs">
                    {truncateText(item.fk_users_id, 8)}...
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                    {formatDate(item.updated_at)}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {item.wpuser1 || '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {item.wppass1 ? '***' : '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {item.ruplin_apikey ? truncateText(item.ruplin_apikey, 15) : '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {item.wp_rest_app_pass ? truncateText(item.wp_rest_app_pass, 15) : '-'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {formatBoolean(item.wp_plugin_installed1)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {formatBoolean(item.wp_plugin_connected2)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-xs">
                    {item.fk_domreg_hostaccount ? truncateText(item.fk_domreg_hostaccount, 8) + '...' : '-'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {formatBoolean(item.is_wp_site)}
                  </td>
                </tr>
              ))}
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