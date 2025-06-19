'use client';

import { useState, useMemo, useEffect } from 'react';
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

// Define all columns in order (including action columns)
const allColumns = [
  'checkbox',           // 1
  'tool_buttons',       // 2  
  'sync_actions',       // 3
  'id',                // 4
  'created_at',        // 5
  'sitespren_base',    // 6
  'true_root_domain',  // 7
  'full_subdomain',    // 8
  'webproperty_type',  // 9
  'fk_users_id',       // 10
  'updated_at',        // 11
  'wpuser1',           // 12
  'wppass1',           // 13
  'ruplin_apikey',     // 14
  'wp_rest_app_pass',  // 15
  'wp_plugin_installed1', // 16
  'wp_plugin_connected2', // 17
  'fk_domreg_hostaccount', // 18
  'is_wp_site'         // 19
];

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
  
  // Column template and sticky state
  const [selectedColumnTemplate, setSelectedColumnTemplate] = useState('option1');
  const [selectedStickyColumns, setSelectedStickyColumns] = useState('option1');

  // Load state from URL parameters and localStorage on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const colTempParam = urlParams.get('coltemp') || localStorage.getItem('sitejar4_coltemp') || 'option1';
    const stickyColParam = urlParams.get('stickycol') || localStorage.getItem('sitejar4_stickycol') || 'option1';
    
    setSelectedColumnTemplate(colTempParam);
    setSelectedStickyColumns(stickyColParam);
  }, []);

  // Utility functions
  const getStickyColumnCount = () => {
    switch (selectedStickyColumns) {
      case 'option1': return 1;
      case 'option2': return 2;
      case 'option3': return 3;
      case 'option4': return 4;
      case 'option5': return 5;
      default: return 1;
    }
  };

  const getVisibleColumns = () => {
    const stickyColumnCount = getStickyColumnCount();
    const stickyColumns = allColumns.slice(0, stickyColumnCount);
    
    switch (selectedColumnTemplate) {
      case 'option1': 
        return allColumns; // All columns (1-19)
      case 'option2': {
        const templateColumns = allColumns.slice(0, 7); // Columns 1-7
        const combinedColumns = [...stickyColumns];
        templateColumns.forEach(col => {
          if (!stickyColumns.includes(col)) {
            combinedColumns.push(col);
          }
        });
        return combinedColumns;
      }
      case 'option3': {
        const templateColumns = allColumns.slice(7, 14); // Columns 8-14
        const combinedColumns = [...stickyColumns];
        templateColumns.forEach(col => {
          if (!stickyColumns.includes(col)) {
            combinedColumns.push(col);
          }
        });
        return combinedColumns;
      }
      case 'option4': {
        const templateColumns = allColumns.slice(14, 19); // Columns 15-19
        const combinedColumns = [...stickyColumns];
        templateColumns.forEach(col => {
          if (!stickyColumns.includes(col)) {
            combinedColumns.push(col);
          }
        });
        return combinedColumns;
      }
      case 'option5': {
        // Empty option for future expansion
        return stickyColumns;
      }
      default: 
        return allColumns;
    }
  };

  const getColumnSeparators = (col: string) => {
    // No specific left separators needed for sitespren table
    const hasLeftSeparator = false;
    // No specific right separators needed for sitespren table  
    const hasRightSeparator = false;
    
    return { hasLeftSeparator, hasRightSeparator };
  };

  const updateUrlAndStorage = (colTemp: string, stickyCol: string) => {
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('coltemp', colTemp);
    url.searchParams.set('stickycol', stickyCol);
    window.history.replaceState({}, '', url.toString());
    
    // Update localStorage
    localStorage.setItem('sitejar4_coltemp', colTemp);
    localStorage.setItem('sitejar4_stickycol', stickyCol);
  };

  const handleColumnTemplateChange = (option: string) => {
    setSelectedColumnTemplate(option);
    updateUrlAndStorage(option, selectedStickyColumns);
  };

  const handleStickyColumnsChange = (option: string) => {
    setSelectedStickyColumns(option);
    updateUrlAndStorage(selectedColumnTemplate, option);
  };

  const visibleColumns = getVisibleColumns();
  const stickyColumnCount = getStickyColumnCount();

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
      {/* Column Template and View Control System */}
      <div className="flex items-start space-x-4">
        {/* SQL View Info */}
        <div className="bg-gray-100 p-3 rounded-lg border" style={{width: '130px', maxHeight: '75px'}}>
          <div className="text-xs font-semibold text-gray-700 mb-1">SQL View Info</div>
          <div className="text-xs text-gray-600">
            <div>view name: sitespren</div>
            <div># columns: {allColumns.length}</div>
          </div>
        </div>

        {/* Column Template Button Bar */}
        <div className="bg-white p-3 rounded-lg border shadow-sm" style={{width: '600px', maxHeight: '75px'}}>
          <div className="text-xs font-semibold text-gray-700 mb-2">Column Templates</div>
          <div className="flex space-x-1">
            {[
              { id: 'option1', label: 'OPTION 1', subtitle: 'col temp all', range: 'columns 1-19' },
              { id: 'option2', label: 'OPTION 2', subtitle: 'col temp a', range: 'columns 1-7' },
              { id: 'option3', label: 'OPTION 3', subtitle: 'col temp b', range: 'columns 8-14' },
              { id: 'option4', label: 'OPTION 4', subtitle: 'col temp c', range: 'columns 15-19' },
              { id: 'option5', label: 'OPTION 5', subtitle: 'col temp d', range: 'empty' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => handleColumnTemplateChange(option.id)}
                className={`text-xs leading-tight p-1 rounded border text-center ${
                  selectedColumnTemplate === option.id
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                style={{width: '120px'}}
              >
                <div className="font-semibold">{option.label}</div>
                <div>{option.subtitle}</div>
                <div>{option.range}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sticky Columns Section */}
        <div className="bg-white p-3 rounded-lg border shadow-sm" style={{maxHeight: '75px'}}>
          <div className="text-xs font-semibold text-gray-700 mb-2">Sticky Columns</div>
          <div className="flex space-x-1">
            {[
              { id: 'option1', label: 'OPTION 1', subtitle: '1 left-most', range: 'column' },
              { id: 'option2', label: 'OPTION 2', subtitle: '2 left-most', range: 'columns' },
              { id: 'option3', label: 'OPTION 3', subtitle: '3 left-most', range: 'columns' },
              { id: 'option4', label: 'OPTION 4', subtitle: '4 left-most', range: 'columns' },
              { id: 'option5', label: 'OPTION 5', subtitle: '5 left-most', range: 'columns' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => handleStickyColumnsChange(option.id)}
                className={`text-xs leading-tight p-1 rounded border text-center ${
                  selectedStickyColumns === option.id
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                style={{width: '80px'}}
              >
                <div className="font-semibold">{option.label}</div>
                <div>{option.subtitle}</div>
                <div>{option.range}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
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
                {visibleColumns.map((col, index) => {
                  const { hasLeftSeparator, hasRightSeparator } = getColumnSeparators(col);
                  const isSticky = index < stickyColumnCount;
                  const stickyClass = isSticky ? 'sticky left-0 z-10 bg-gray-50' : '';
                  const leftPosition = isSticky ? `${index * 150}px` : 'auto';
                  const isLastSticky = index === stickyColumnCount - 1;

                  return (
                    <th
                      key={col}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative ${stickyClass} ${
                        ['id', 'created_at', 'sitespren_base', 'true_root_domain', 'updated_at'].includes(col) 
                          ? 'cursor-pointer hover:bg-gray-100' 
                          : ''
                      }`}
                      style={isSticky ? { left: leftPosition } : {}}
                      onClick={['id', 'created_at', 'sitespren_base', 'true_root_domain', 'updated_at'].includes(col) ? () => handleSort(col as SortField) : undefined}
                    >
                      {hasLeftSeparator && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-black"></div>
                      )}
                      {col === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={isAllSelected ? handleClearAll : handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      ) : col === 'tool_buttons' ? (
                        'Tool Buttons'
                      ) : col === 'sync_actions' ? (
                        'Sync Actions'
                      ) : (
                        <>
                          {col} {['id', 'created_at', 'sitespren_base', 'true_root_domain', 'updated_at'].includes(col) && sortField === col && (sortOrder === 'asc' ? '↑' : '↓')}
                        </>
                      )}
                      {hasRightSeparator && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-black"></div>
                      )}
                      {isLastSticky && (
                        <div className="absolute right-0 top-0 bottom-0 bg-black" style={{width: '4px'}}></div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {visibleColumns.map((col, colIndex) => {
                    const { hasLeftSeparator, hasRightSeparator } = getColumnSeparators(col);
                    const isSticky = colIndex < stickyColumnCount;
                    const stickyClass = isSticky ? 'sticky left-0 z-10' : '';
                    const leftPosition = isSticky ? `${colIndex * 150}px` : 'auto';
                    const bgClass = 'bg-inherit';
                    const isLastSticky = colIndex === stickyColumnCount - 1;

                    return (
                      <td
                        key={col}
                        className={`px-4 py-2 text-sm text-gray-900 relative ${stickyClass} ${bgClass} ${
                          col === 'checkbox' || col === 'tool_buttons' || col === 'sync_actions' ? 'whitespace-nowrap' : ''
                        }`}
                        style={isSticky ? { left: leftPosition } : {}}
                      >
                        {hasLeftSeparator && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-black"></div>
                        )}
                        {col === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={selectedSites.has(item.id)}
                            onChange={(e) => handleSiteSelection(item.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        ) : col === 'tool_buttons' ? (
                          <Link
                            href={`/sitnivid?site=${encodeURIComponent(item.sitespren_base || '')}`}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Individual View
                          </Link>
                        ) : col === 'sync_actions' ? (
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
                        ) : col === 'id' ? (
                          <span className="text-xs">{truncateText(item.id, 8)}...</span>
                        ) : col === 'created_at' || col === 'updated_at' ? (
                          formatDate(item[col as keyof SitesprenRecord] as string)
                        ) : col === 'fk_users_id' || col === 'fk_domreg_hostaccount' ? (
                          <span className="text-xs">{item[col as keyof SitesprenRecord] ? truncateText(item[col as keyof SitesprenRecord] as string, 8) + '...' : '-'}</span>
                        ) : col === 'wppass1' ? (
                          item.wppass1 ? '***' : '-'
                        ) : col === 'ruplin_apikey' || col === 'wp_rest_app_pass' ? (
                          item[col as keyof SitesprenRecord] ? truncateText(item[col as keyof SitesprenRecord] as string, 15) : '-'
                        ) : col === 'wp_plugin_installed1' || col === 'wp_plugin_connected2' || col === 'is_wp_site' ? (
                          <div className="text-center">{formatBoolean(item[col as keyof SitesprenRecord] as boolean | null)}</div>
                        ) : col === 'sitespren_base' ? (
                          <span className="font-medium">{item.sitespren_base || '-'}</span>
                        ) : (
                          item[col as keyof SitesprenRecord] || '-'
                        )}
                        {hasRightSeparator && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-black"></div>
                        )}
                        {isLastSticky && (
                          <div className="absolute right-0 top-0 bottom-0 bg-black" style={{width: '4px'}}></div>
                        )}
                      </td>
                    );
                  })}
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