'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface NwpiContent {
  internal_post_id: string;
  fk_users_id: string;
  fk_sitespren_id: string;
  fk_sitespren_base: string;
  post_id: number;
  post_author: number | null;
  post_date: string | null;
  post_date_gmt: string | null;
  post_modified: string | null;
  post_content: string | null;
  post_content_filtered: string | null;
  post_title: string | null;
  post_excerpt: string | null;
  post_status: string | null;
  post_type: string | null;
  post_name: string | null;
  post_password: string | null;
  comment_status: string | null;
  ping_status: string | null;
  to_ping: string | null;
  pinged: string | null;
  guid: string | null;
  post_parent: number | null;
  menu_order: number | null;
  post_mime_type: string | null;
  comment_count: number | null;
  i_raw_metadata: any;
  i_sync_method: string | null;
  i_sync_version: number | null;
  i_sync_status: string | null;
  i_sync_started_at: string | null;
  i_sync_completed_at: string | null;
  i_sync_attempt_count: number | null;
  i_sync_error_message: string | null;
  a_elementor_substance: any;
  created_at: string;
  updated_at: string;
}

interface NwpiContentTableProps {
  data: NwpiContent[];
  userId: string;
}

type SortField = 'post_title' | 'fk_sitespren_base' | 'post_type' | 'post_status' | 'i_sync_completed_at' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function NwpiContentTable({ data }: NwpiContentTableProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('i_sync_completed_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterSite, setFilterSite] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSyncMethod, setFilterSyncMethod] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Get unique values for filter dropdowns
  const uniqueSites = useMemo(() => {
    const sites = data
      .map(item => item.fk_sitespren_base)
      .filter(Boolean) as string[];
    return [...new Set(sites)].sort();
  }, [data]);

  const uniqueTypes = useMemo(() => {
    const types = data
      .map(item => item.post_type)
      .filter(Boolean) as string[];
    return [...new Set(types)].sort();
  }, [data]);

  const uniqueStatuses = useMemo(() => {
    const statuses = data
      .map(item => item.post_status)
      .filter(Boolean) as string[];
    return [...new Set(statuses)].sort();
  }, [data]);

  const uniqueSyncMethods = useMemo(() => {
    const methods = data
      .map(item => item.i_sync_method)
      .filter(Boolean) as string[];
    return [...new Set(methods)].sort();
  }, [data]);

  // Filter and search logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        item.post_title?.toLowerCase().includes(searchLower) ||
        item.post_content?.toLowerCase().includes(searchLower) ||
        item.post_excerpt?.toLowerCase().includes(searchLower) ||
        item.fk_sitespren_base?.toLowerCase().includes(searchLower);

      // Site filter
      const matchesSite = !filterSite || item.fk_sitespren_base === filterSite;

      // Type filter
      const matchesType = !filterType || item.post_type === filterType;

      // Status filter
      const matchesStatus = !filterStatus || item.post_status === filterStatus;

      // Sync method filter
      const matchesSyncMethod = !filterSyncMethod || item.i_sync_method === filterSyncMethod;

      return matchesSearch && matchesSite && matchesType && matchesStatus && matchesSyncMethod;
    });
  }, [data, searchTerm, filterSite, filterType, filterStatus, filterSyncMethod]);

  // Sort logic
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle null values
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      // Handle date fields
      if (sortField === 'i_sync_completed_at' || sortField === 'created_at') {
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

  const truncateText = (text: string | null, maxLength: number = 50) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getStatusBadge = (status: string | null, syncStatus: string | null) => {
    if (syncStatus === 'failed') {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Failed</span>;
    }
    
    switch (status) {
      case 'publish':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Published</span>;
      case 'draft':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Draft</span>;
      case 'private':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Private</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status || 'Unknown'}</span>;
    }
  };

  const getSyncMethodBadge = (method: string | null) => {
    switch (method) {
      case 'plugin_api':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Plugin API</span>;
      case 'rest_api':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">REST API</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{method || 'Unknown'}</span>;
    }
  };

  // Selection handlers
  const handleRowSelect = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      // Deselect all
      setSelectedRows(new Set());
    } else {
      // Select all visible rows
      const allRowIds = new Set(paginatedData.map(item => item.internal_post_id));
      setSelectedRows(allRowIds);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search titles and content..."
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
              value={filterSite}
              onChange={(e) => {
                setFilterSite(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Sites</option>
              {uniqueSites.map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filterSyncMethod}
              onChange={(e) => {
                setFilterSyncMethod(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Sync Methods</option>
              {uniqueSyncMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
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
                <th className="px-[6px] py-[6px] text-left text-xs font-bold text-gray-700 lowercase tracking-wider bg-blue-50">
                  <div 
                    className="cursor-pointer flex items-center justify-center w-full h-full"
                    onClick={handleSelectAll}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={() => {}} // Handled by div click
                      className="w-[18px] h-[18px] cursor-pointer"
                      style={{ width: '18px', height: '18px' }}
                    />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase tracking-wider bg-blue-50">
                  actions
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase tracking-wider cursor-pointer hover:bg-green-100 bg-green-50"
                  onClick={() => handleSort('post_title')}
                >
                  post_title {sortField === 'post_title' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase tracking-wider cursor-pointer hover:bg-blue-100 bg-blue-50"
                  onClick={() => handleSort('fk_sitespren_base')}
                >
                  fk_sitespren_base {sortField === 'fk_sitespren_base' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase tracking-wider cursor-pointer hover:bg-green-100 bg-green-50"
                  onClick={() => handleSort('post_type')}
                >
                  post_type {sortField === 'post_type' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase tracking-wider cursor-pointer hover:bg-green-100 bg-green-50"
                  onClick={() => handleSort('post_status')}
                >
                  post_status {sortField === 'post_status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase tracking-wider bg-yellow-50">
                  i_sync_method
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase tracking-wider cursor-pointer hover:bg-yellow-100 bg-yellow-50"
                  onClick={() => handleSort('i_sync_completed_at')}
                >
                  i_sync_completed_at {sortField === 'i_sync_completed_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase tracking-wider bg-purple-50">
                  a_elementor_substance
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase tracking-wider bg-green-50">
                  post_id
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.internal_post_id} className="hover:bg-gray-50">
                  <td className="px-[6px] py-[6px] whitespace-nowrap">
                    <div 
                      className="cursor-pointer flex items-center justify-center w-full h-full"
                      onClick={() => handleRowSelect(item.internal_post_id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRows.has(item.internal_post_id)}
                        onChange={() => {}} // Handled by div click
                        className="w-[18px] h-[18px] cursor-pointer"
                        style={{ width: '18px', height: '18px' }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/nwivid?contentid=${encodeURIComponent(item.internal_post_id)}`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Individual View
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    <div className="max-w-xs">
                      <div className="font-medium">{truncateText(item.post_title, 60)}</div>
                      {item.post_excerpt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {truncateText(item.post_excerpt, 80)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-medium">
                    {item.fk_sitespren_base || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {item.post_type || 'unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(item.post_status, item.i_sync_status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getSyncMethodBadge(item.i_sync_method)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                    {formatDate(item.i_sync_completed_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {item.a_elementor_substance ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        ✓ Elementor
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                        No Data
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                    {item.post_id}
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