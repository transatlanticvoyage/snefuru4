'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SitesprenRecord {
  id: string; // Changed from number to string for UUID
  created_at: string;
  sitespren_base: string | null;
  ns_full: string | null;
  ip_address: string | null;
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
  is_starred1: string | null;
}

interface SitesprenTableProps {
  data: SitesprenRecord[];
  userId: string;
  onSelectionChange?: (selectedIds: string[]) => void;
  onDataUpdate?: (updatedData: SitesprenRecord[]) => void;
  searchTerm?: string;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  totalUnfilteredCount?: number;
}

type SortField = keyof SitesprenRecord;
type SortOrder = 'asc' | 'desc';

// Define all columns in order (including action columns)
const allColumns = [
  'checkbox',           // 1
  'tool_buttons',       // 2  
  'id',                // 3
  'created_at',        // 4
  'is_starred1',       // 5
  'sitespren_base',    // 6
  'ns_full',           // 7 (new field)
  'ip_address',        // 8 (new field)
  'domain_registrar_info', // 9 (new field)
  'fk_domreg_hostaccount', // 10
  'true_root_domain',  // 11
  'full_subdomain',    // 12
  'webproperty_type',  // 13
  'fk_users_id',       // 14
  'updated_at',        // 15
  'wpuser1',           // 16
  'wppass1',           // 17
  'ruplin_apikey',     // 18
  'wp_rest_app_pass',  // 19
  'wp_plugin_installed1', // 20
  'wp_plugin_connected2', // 21
  'is_wp_site'         // 22
];

export default function SitesprenTable({ data, userId, onSelectionChange, onDataUpdate, searchTerm: externalSearchTerm, onSearchChange: externalOnSearchChange, totalUnfilteredCount }: SitesprenTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterWpSite, setFilterWpSite] = useState<string>('');
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [syncLoading, setSyncLoading] = useState<Set<string>>(new Set());
  const [syncResults, setSyncResults] = useState<{[key: string]: {type: 'success' | 'error', message: string}}>({});
  const [refreshingCells, setRefreshingCells] = useState<Set<string>>(new Set());
  const [dnsData, setDnsData] = useState<{[key: string]: {ns_full?: string, ip_address?: string}}>({});
  const [updatingStars, setUpdatingStars] = useState<Set<string>>(new Set());
  const [checkingPluginVersion, setCheckingPluginVersion] = useState<Set<string>>(new Set());
  const [updatingPlugin, setUpdatingPlugin] = useState<Set<string>>(new Set());
  const [barkroPushing, setBarkroPushing] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [gadgetFeedback, setGadgetFeedback] = useState<{action: string, message: string, type: 'success' | 'error' | 'info', timestamp: string} | null>(null);
  const [domainRegistrarData, setDomainRegistrarData] = useState<{[key: string]: any}>({});
  const [loadingRegistrarData, setLoadingRegistrarData] = useState<Set<string>>(new Set());
  const [registrarPopupOpen, setRegistrarPopupOpen] = useState<string | null>(null);
  const [allHostAccounts, setAllHostAccounts] = useState<any[]>([]);
  
  const supabase = createClientComponentClient();
  
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

  // Toggle expanded row
  const toggleExpandedRow = (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

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
        return allColumns; // All columns (1-22)
      case 'option2': {
        const templateColumns = allColumns.slice(0, 8); // Columns 1-8
        const combinedColumns = [...stickyColumns];
        templateColumns.forEach(col => {
          if (!stickyColumns.includes(col)) {
            combinedColumns.push(col);
          }
        });
        return combinedColumns;
      }
      case 'option3': {
        const templateColumns = allColumns.slice(8, 15); // Columns 9-15
        const combinedColumns = [...stickyColumns];
        templateColumns.forEach(col => {
          if (!stickyColumns.includes(col)) {
            combinedColumns.push(col);
          }
        });
        return combinedColumns;
      }
      case 'option4': {
        const templateColumns = allColumns.slice(15, 22); // Columns 16-22
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

  // Filter logic (only for WordPress site filter, search is handled by parent)
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // WordPress site filter
      const matchesWpFilter = filterWpSite === '' || 
        (filterWpSite === 'true' && item.is_wp_site === true) ||
        (filterWpSite === 'false' && item.is_wp_site === false) ||
        (filterWpSite === 'null' && item.is_wp_site === null);

      return matchesWpFilter;
    });
  }, [data, filterWpSite]);

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
      } else if (sortField === 'is_starred1') {
        // For starring: "yes" values should come first when descending, null/empty values last
        aVal = aVal === 'yes' ? 1 : 0;
        bVal = bVal === 'yes' ? 1 : 0;
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

  // Fetch domain registrar info for a specific site
  const fetchDomainRegistrarInfo = async (siteId: string, fkDomregHostaccount: string | null) => {
    if (!userId) return;

    setLoadingRegistrarData(prev => new Set([...prev, siteId]));

    try {
      const params = new URLSearchParams({
        user_internal_id: userId,
        ...(fkDomregHostaccount && { fk_domreg_hostaccount: fkDomregHostaccount })
      });

      const response = await fetch(`/api/get_domain_registrar_info?${params}`);
      const result = await response.json();

      if (result.success) {
        setDomainRegistrarData(prev => ({
          ...prev,
          [siteId]: result.data.current_registrar_info
        }));
        
        // Store all host accounts for the popup (only need to do this once)
        if (result.data.all_host_accounts && allHostAccounts.length === 0) {
          setAllHostAccounts(result.data.all_host_accounts);
        }
      }
    } catch (error) {
      console.error('Error fetching domain registrar info:', error);
    } finally {
      setLoadingRegistrarData(prev => {
        const newSet = new Set(prev);
        newSet.delete(siteId);
        return newSet;
      });
    }
  };

  // Fetch domain registrar info for visible sites
  useEffect(() => {
    console.log('DEBUG: useEffect triggered with userId:', userId, 'paginatedData.length:', paginatedData.length);
    
    if (userId && paginatedData.length > 0) {
      console.log('DEBUG: Checking domain registrar info for sites:', paginatedData.map(item => ({
        id: item.id,
        fk_domreg_hostaccount: item.fk_domreg_hostaccount,
        has_registrar_data: !!domainRegistrarData[item.id],
        is_loading: loadingRegistrarData.has(item.id)
      })));

      paginatedData.forEach(item => {
        if (item.fk_domreg_hostaccount && item.fk_domreg_hostaccount.trim() !== '' && !domainRegistrarData[item.id] && !loadingRegistrarData.has(item.id)) {
          console.log('DEBUG: Fetching domain registrar info for site:', item.id, 'with hostaccount:', item.fk_domreg_hostaccount);
          fetchDomainRegistrarInfo(item.id, item.fk_domreg_hostaccount);
        }
      });
    }
  }, [userId, paginatedData, domainRegistrarData, loadingRegistrarData]);

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

  // DNS refresh handlers
  const handleRefreshNS = async (siteId: string, sitesprenBase: string) => {
    const cellKey = `${siteId}_ns`;
    setRefreshingCells(prev => new Set([...prev, cellKey]));

    try {
      const response = await fetch('/api/sites/refresh-ns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId,
          domain: sitesprenBase
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update local state with new NS data
        setDnsData(prev => ({
          ...prev,
          [siteId]: {
            ...prev[siteId],
            ns_full: result.data.ns_full
          }
        }));
      } else {
        console.error('Error refreshing NS:', result.error);
      }
    } catch (error) {
      console.error('Error refreshing NS:', error);
    } finally {
      setRefreshingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }
  };

  const handleRefreshIP = async (siteId: string, sitesprenBase: string) => {
    const cellKey = `${siteId}_ip`;
    setRefreshingCells(prev => new Set([...prev, cellKey]));

    try {
      const response = await fetch('/api/sites/refresh-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId,
          domain: sitesprenBase
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update local state with new IP data
        setDnsData(prev => ({
          ...prev,
          [siteId]: {
            ...prev[siteId],
            ip_address: result.data.ip_address
          }
        }));
      } else {
        console.error('Error refreshing IP:', result.error);
      }
    } catch (error) {
      console.error('Error refreshing IP:', error);
    } finally {
      setRefreshingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }
  };

  // Plugin version check handler
  const handleCheckPluginVersion = async (siteId: string) => {
    setCheckingPluginVersion(prev => new Set([...prev, siteId]));
    
    // Clear previous result for this site
    setSyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[`version_${siteId}`];
      return newResults;
    });

    try {
      const response = await fetch('/api/plugin/check-version', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId,
          userId: userId
        })
      });

      const data = await response.json();

      if (data.success) {
        setSyncResults(prev => ({
          ...prev,
          [`version_${siteId}`]: {
            type: 'success',
            message: `✅ ${data.message} (Current: ${data.currentVersion || 'Unknown'}, Latest: ${data.latestVersion || 'Unknown'})`
          }
        }));
      } else {
        setSyncResults(prev => ({
          ...prev,
          [`version_${siteId}`]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setSyncResults(prev => ({
        ...prev,
        [`version_${siteId}`]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setCheckingPluginVersion(prev => {
        const newSet = new Set(prev);
        newSet.delete(siteId);
        return newSet;
      });
    }
  };

  // Plugin update handler
  const handleUpdatePlugin = async (siteId: string) => {
    setUpdatingPlugin(prev => new Set([...prev, siteId]));
    
    // Clear previous result for this site
    setSyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[`update_${siteId}`];
      return newResults;
    });

    try {
      const response = await fetch('/api/plugin/update', {
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
        setSyncResults(prev => ({
          ...prev,
          [`update_${siteId}`]: {
            type: 'success',
            message: `✅ ${data.message} (Updated to version: ${data.newVersion || 'Unknown'})`
          }
        }));
      } else {
        setSyncResults(prev => ({
          ...prev,
          [`update_${siteId}`]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setSyncResults(prev => ({
        ...prev,
        [`update_${siteId}`]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setUpdatingPlugin(prev => {
        const newSet = new Set(prev);
        newSet.delete(siteId);
        return newSet;
      });
    }
  };

  // Barkro push handler
  const handleBarkroPush = async (siteId: string) => {
    setBarkroPushing(prev => new Set([...prev, siteId]));
    
    // Clear previous result for this site
    setSyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[`barkro_${siteId}`];
      return newResults;
    });

    try {
      const response = await fetch('/api/barkro/push-update', {
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
        setSyncResults(prev => ({
          ...prev,
          [`barkro_${siteId}`]: {
            type: 'success',
            message: `✅ ${data.message}`
          }
        }));
      } else {
        setSyncResults(prev => ({
          ...prev,
          [`barkro_${siteId}`]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setSyncResults(prev => ({
        ...prev,
        [`barkro_${siteId}`]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setBarkroPushing(prev => {
        const newSet = new Set(prev);
        newSet.delete(siteId);
        return newSet;
      });
    }
  };

  // Star click handler
  const handleStarClick = async (siteId: string) => {
    const updateKey = `${siteId}_is_starred1`;
    setUpdatingStars(prev => new Set([...prev, updateKey]));

    try {
      // Find current site data
      const currentSite = data.find(site => site.id === siteId);
      if (!currentSite) return;

      // Toggle star value: if "yes", set to null; if not "yes", set to "yes"
      const newValue = currentSite.is_starred1 === 'yes' ? null : 'yes';

      // Update database
      const { error } = await supabase
        .from('sitespren')
        .update({ is_starred1: newValue })
        .eq('id', siteId);

      if (error) {
        console.error('Error updating star:', error);
        return;
      }

      // Update local data without page refresh
      const updatedData = data.map(site => 
        site.id === siteId 
          ? { ...site, is_starred1: newValue }
          : site
      );
      
      // Call parent component to update the data
      if (onDataUpdate) {
        onDataUpdate(updatedData);
      }
      
    } catch (error) {
      console.error('Error in star click handler:', error);
    } finally {
      setUpdatingStars(prev => {
        const newSet = new Set(prev);
        newSet.delete(updateKey);
        return newSet;
      });
    }
  };

  // Single site action handler for the gadgets section
  const handleSingleSiteAction = async (action: string, method?: string) => {
    const selectedSiteId = Array.from(selectedSites)[0];
    if (!selectedSiteId) return;

    const timestamp = new Date().toISOString();
    setGadgetFeedback({
      action: `${action}${method ? ` (${method})` : ''}`,
      message: 'Processing...',
      type: 'info',
      timestamp
    });

    try {
      let result;
      switch (action) {
        case 'wpsv2_sync':
          result = await handleWpsv2Sync(selectedSiteId, (method as 'plugin_api' | 'rest_api') || 'plugin_api');
          break;
        case 'test_plugin':
          result = await handleWpsv2TestPlugin(selectedSiteId);
          break;
        case 'check_plugin_version':
          result = await handleCheckPluginVersion(selectedSiteId);
          break;
        case 'update_plugin':
          result = await handleUpdatePlugin(selectedSiteId);
          break;
        case 'barkro_push':
          result = await handleBarkroPush(selectedSiteId);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Check if we have a sync result for this action
      const syncResultKey = method ? `${action}_${method}_${selectedSiteId}` : `${action}_${selectedSiteId}`;
      const syncResult = syncResults[syncResultKey];
      
      if (syncResult) {
        setGadgetFeedback({
          action: `${action}${method ? ` (${method})` : ''}`,
          message: syncResult.message,
          type: syncResult.type,
          timestamp
        });
      } else {
        setGadgetFeedback({
          action: `${action}${method ? ` (${method})` : ''}`,
          message: 'Action completed',
          type: 'success',
          timestamp
        });
      }
    } catch (error) {
      setGadgetFeedback({
        action: `${action}${method ? ` (${method})` : ''}`,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        type: 'error',
        timestamp
      });
    }
  };

  // Copy feedback message to clipboard
  const copyFeedbackMessage = async () => {
    if (!gadgetFeedback) return;
    
    const message = `Action: ${gadgetFeedback.action}\nMessage: ${gadgetFeedback.message}\nTime: ${new Date(gadgetFeedback.timestamp).toLocaleString()}`;
    
    try {
      await navigator.clipboard.writeText(message);
      // Briefly show success
      const originalMessage = gadgetFeedback.message;
      setGadgetFeedback({
        ...gadgetFeedback,
        message: 'Message copied to clipboard!'
      });
      setTimeout(() => {
        setGadgetFeedback(prev => prev ? { ...prev, message: originalMessage } : null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Clear feedback message
  const clearFeedbackMessage = () => {
    setGadgetFeedback(null);
  };

  // Update domain registrar for a site
  const updateDomainRegistrar = async (siteId: string, newHostAccountId: string | null) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/update_domain_registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sitespren_id: siteId,
          fk_domreg_hostaccount: newHostAccountId,
          user_internal_id: userId
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update local data
        const newRegistrarInfo = newHostAccountId 
          ? allHostAccounts.find(acc => acc.host_account_id === newHostAccountId)
          : null;

        setDomainRegistrarData(prev => ({
          ...prev,
          [siteId]: newRegistrarInfo
        }));

        // Update the main data as well
        if (onDataUpdate) {
          const updatedData = data.map(site => 
            site.id === siteId 
              ? { ...site, fk_domreg_hostaccount: newHostAccountId }
              : site
          );
          onDataUpdate(updatedData);
        }

        setRegistrarPopupOpen(null);
      } else {
        console.error('Failed to update domain registrar:', result.error);
      }
    } catch (error) {
      console.error('Error updating domain registrar:', error);
    }
  };

  return (
    <>
      <style jsx>{`
        .group {
          position: relative;
        }
        
        .info-icon {
          font-size: 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: help;
        }
        
        .tooltip-content {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 8px;
          background: #1a1a1a;
          color: white;
          padding: 12px;
          border-radius: 6px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          width: 320px;
          z-index: 50;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          pointer-events: none;
        }
        
        .group:hover .tooltip-content {
          opacity: 1;
          visibility: visible;
        }
        
        .tooltip-content::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 20px;
          border: 6px solid transparent;
          border-top-color: #1a1a1a;
        }
        
        .tooltip-content p {
          margin: 4px 0;
        }
        
        .tooltip-content strong {
          color: #60a5fa;
        }
        
        .tooltip-content ol,
        .tooltip-content ul {
          margin: 4px 0;
        }
      `}</style>
      <div className="space-y-4">
      {/* Column Template and View Control System */}
      <div className="flex items-start space-x-4">
        {/* SQL View Info */}
        <div className="bg-gray-100 p-3 rounded-lg border" style={{width: '130px'}}>
          <div className="text-xs font-semibold text-gray-700 mb-1">SQL View Info</div>
          <div className="text-xs text-gray-600">
            <div>view name: sitespren</div>
            <div># columns: {allColumns.length}</div>
          </div>
        </div>

        {/* Column Template Button Bar */}
        <div className="bg-white p-3 rounded-lg border shadow-sm" style={{width: '600px'}}>
          <div className="text-xs font-semibold text-gray-700 mb-2">Column Templates (Show/Hide)</div>
          <div className="flex space-x-1">
            {[
              { id: 'option1', label: 'OPTION 1', subtitle: 'col temp all', range: 'columns 1-22' },
              { id: 'option2', label: 'OPTION 2', subtitle: 'col temp a', range: 'columns 1-8' },
              { id: 'option3', label: 'OPTION 3', subtitle: 'col temp b', range: 'columns 9-15' },
              { id: 'option4', label: 'OPTION 4', subtitle: 'col temp c', range: 'columns 16-22' },
              { id: 'option5', label: 'OPTION 5', subtitle: 'col temp d', range: 'empty' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => handleColumnTemplateChange(option.id)}
                className={`text-xs leading-tight py-1 px-0.5 rounded border text-center ${
                  selectedColumnTemplate === option.id
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                style={{width: '115px', fontSize: '10px'}}
              >
                <div className="font-semibold" style={{fontSize: '10px'}}>{option.label}</div>
                <div style={{fontSize: '9px'}}>{option.subtitle}</div>
                <div style={{fontSize: '9px'}}>{option.range}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sticky Columns Section */}
        <div className="bg-white p-3 rounded-lg border shadow-sm">
          <div className="text-xs font-semibold text-gray-700 mb-2">Sticky Columns At Left Side Of UI Grid Table</div>
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
                className={`text-xs leading-tight py-1 px-0.5 rounded border text-center ${
                  selectedStickyColumns === option.id
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                style={{width: '75px', fontSize: '10px'}}
              >
                <div className="font-semibold" style={{fontSize: '10px'}}>{option.label}</div>
                <div style={{fontSize: '9px'}}>{option.subtitle}</div>
                <div style={{fontSize: '9px'}}>{option.range}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="site-search-table" className="block text-sm font-medium text-gray-700 mb-2">
              Search Sites
            </label>
            <input
              id="site-search-table"
              type="text"
              placeholder="Search by domain, type, or ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={externalSearchTerm || ''}
              onChange={(e) => {
                if (externalOnSearchChange) {
                  externalOnSearchChange(e);
                }
                setCurrentPage(1);
              }}
            />
            {externalSearchTerm && totalUnfilteredCount !== undefined && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {data.length} of {totalUnfilteredCount} sites
              </p>
            )}
          </div>
          <div>
            <label htmlFor="wp-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              id="wp-filter"
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

      {/* Site Gadgets Section */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-bold text-gray-800 mb-4">site_gadgets_chepno</h3>
        
        {/* Sync Actions Buttons */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              onClick={() => handleSingleSiteAction('wpsv2_sync', 'plugin_api')}
              disabled={selectedSites.size !== 1}
              title="Sync site using Plugin API"
            >
              <span className="info-icon group">ℹ</span>
              Plugin API
            </button>
            
            <button
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              onClick={() => handleSingleSiteAction('wpsv2_sync', 'rest_api')}
              disabled={selectedSites.size !== 1}
              title="Sync site using REST API"
            >
              <span className="info-icon group">ℹ</span>
              REST API
            </button>
            
            <button
              className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              onClick={() => handleSingleSiteAction('test_plugin')}
              disabled={selectedSites.size !== 1}
              title="Test plugin connection"
            >
              <span className="info-icon group">ℹ</span>
              Test Plugin
            </button>
            
            <button
              className="px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              onClick={() => handleSingleSiteAction('check_plugin_version')}
              disabled={selectedSites.size !== 1}
              title="Check plugin version"
            >
              <span className="info-icon group">ℹ</span>
              Check Version
            </button>
            
            <button
              className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              onClick={() => handleSingleSiteAction('update_plugin')}
              disabled={selectedSites.size !== 1}
              title="Update plugin"
            >
              <span className="info-icon group">ℹ</span>
              Update Plugin
            </button>
            
            <button
              className="px-3 py-2 text-sm font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              onClick={() => handleSingleSiteAction('barkro_push')}
              disabled={selectedSites.size !== 1}
              title="Push Barkro update"
            >
              <span className="info-icon group">ℹ</span>
              Barkro Push
            </button>
          </div>
          
          {selectedSites.size === 0 && (
            <p className="text-sm text-gray-500 mt-2">Please select exactly 1 site to use these actions</p>
          )}
          {selectedSites.size > 1 && (
            <p className="text-sm text-orange-600 mt-2">Please select only 1 site (currently {selectedSites.size} selected)</p>
          )}
        </div>
        
        <hr className="border-gray-200 mb-4" />
        
        {/* Feedback Message Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Action Feedback</h4>
            <div className="flex gap-2">
              <button
                onClick={() => copyFeedbackMessage()}
                disabled={!gadgetFeedback}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded border disabled:cursor-not-allowed"
              >
                Copy Message
              </button>
              <button
                onClick={() => clearFeedbackMessage()}
                disabled={!gadgetFeedback}
                className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 disabled:bg-gray-50 disabled:text-gray-400 text-red-700 rounded border disabled:cursor-not-allowed"
              >
                Clear Message
              </button>
            </div>
          </div>
          
          <div className="min-h-[80px] p-3 bg-gray-50 border rounded-md">
            {gadgetFeedback ? (
              <div className={`text-sm ${
                gadgetFeedback.type === 'success' ? 'text-green-700' : 
                gadgetFeedback.type === 'error' ? 'text-red-700' : 'text-gray-700'
              }`}>
                <div className="font-medium">{gadgetFeedback.action}</div>
                <div className="mt-1">{gadgetFeedback.message}</div>
                {gadgetFeedback.timestamp && (
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(gadgetFeedback.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">
                No feedback messages yet. Select a site and click an action button.
              </div>
            )}
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                {visibleColumns.map((col, index) => {
                  const { hasLeftSeparator, hasRightSeparator } = getColumnSeparators(col);
                  const isSticky = index < stickyColumnCount;
                  const stickyClass = isSticky ? 'sticky left-0 z-10' : '';
                  const leftPosition = isSticky ? `${index * 150}px` : 'auto';
                  const isLastSticky = index === stickyColumnCount - 1;

                  return (
                    <th
                      key={col}
                      className={`${col === 'checkbox' ? '' : 'px-4 py-3'} text-left text-xs font-bold text-gray-700 relative border-r border-gray-200 ${stickyClass} ${
                        ['id', 'created_at', 'sitespren_base', 'true_root_domain', 'updated_at', 'is_starred1'].includes(col) 
                          ? 'cursor-pointer hover:brightness-95' 
                          : ''
                      } ${col === 'checkbox' ? 'cursor-pointer' : ''}`}
                      style={{
                        ...(isSticky ? { left: leftPosition } : {}),
                        backgroundColor: col === 'checkbox' || col === 'tool_buttons' 
                          ? '#e5e7eb' // gray-200 for action columns
                          : col === 'domain_registrar_info'
                          ? '#fbbf24' // amber-400 for domain registrar info column
                          : '#dbeafe', // blue-100 for sitespren table columns
                        textTransform: 'none',
                        ...(col === 'checkbox' ? {
                          paddingTop: '6px',
                          paddingBottom: '6px',
                          paddingLeft: '10px',
                          paddingRight: '10px'
                        } : {})
                      }}
                      onClick={col === 'checkbox' ? (isAllSelected ? handleClearAll : handleSelectAll) : 
                              (['id', 'created_at', 'sitespren_base', 'true_root_domain', 'updated_at', 'is_starred1'].includes(col) ? () => handleSort(col as SortField) : undefined)}
                    >
                      {hasLeftSeparator && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-black"></div>
                      )}
                      {col === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={isAllSelected ? handleClearAll : handleSelectAll}
                          className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          style={{ width: '26px', height: '26px' }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : col === 'tool_buttons' ? (
                        'tool_buttons'
                      ) : (
                        <>
                          {col} {['id', 'created_at', 'sitespren_base', 'true_root_domain', 'updated_at', 'is_starred1'].includes(col) && sortField === col && (sortOrder === 'asc' ? '↑' : '↓')}
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
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-gray-50">
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
                        className={`${col === 'checkbox' ? '' : 'px-4 py-2'} text-sm text-gray-900 relative border-r border-gray-200 ${stickyClass} ${bgClass} ${
                          col === 'checkbox' || col === 'tool_buttons' ? 'whitespace-nowrap' : ''
                        } ${col === 'checkbox' ? 'cursor-pointer' : ''}`}
                        style={{
                          ...(isSticky ? { left: leftPosition } : {}),
                          ...(col === 'checkbox' ? {
                            paddingTop: '6px',
                            paddingBottom: '6px',
                            paddingLeft: '10px',
                            paddingRight: '10px'
                          } : {})
                        }}
                        onClick={col === 'checkbox' ? () => handleSiteSelection(item.id, !selectedSites.has(item.id)) : undefined}
                      >
                        {hasLeftSeparator && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-black"></div>
                        )}
                        {col === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={selectedSites.has(item.id)}
                            onChange={(e) => handleSiteSelection(item.id, e.target.checked)}
                            className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            style={{ width: '26px', height: '26px' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : col === 'tool_buttons' ? (
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/sitnivid?site=${encodeURIComponent(item.sitespren_base || '')}`}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Individual View
                            </Link>
                            <button
                              onClick={() => window.open(`https://${item.sitespren_base}/wp-admin/`, '_blank')}
                              className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              title="Open WP Admin"
                            >
                              WP
                            </button>
                            <button
                              onClick={() => window.open(`https://${item.sitespren_base}`, '_blank')}
                              className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                              title="Open Site"
                            >
                              Site
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.sitespren_base || '');
                                // Optional: You could add a toast notification here
                              }}
                              className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                              title="Copy domain to clipboard"
                            >
                              📋
                            </button>
                            <button
                              onClick={() => window.open(`https://www.google.com/search?q=site%3A${encodeURIComponent(item.sitespren_base || '')}`, '_blank')}
                              className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              title="Google site: search"
                            >
                              G
                            </button>
                            <button
                              onClick={() => toggleExpandedRow(item.id)}
                              className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              title="View backlinks"
                            >
                              👁
                            </button>
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
                        ) : col === 'ns_full' ? (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                            onClick={() => handleRefreshNS(item.id, item.sitespren_base || '')}
                            title="Click to refresh nameserver info"
                          >
                            {refreshingCells.has(`${item.id}_ns`) ? (
                              <div className="flex justify-center items-center">
                                <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            ) : (
                              <span className="text-sm">{dnsData[item.id]?.ns_full || item.ns_full || '-'}</span>
                            )}
                          </div>
                        ) : col === 'ip_address' ? (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                            onClick={() => handleRefreshIP(item.id, item.sitespren_base || '')}
                            title="Click to refresh IP address info"
                          >
                            {refreshingCells.has(`${item.id}_ip`) ? (
                              <div className="flex justify-center items-center">
                                <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            ) : (
                              <span className="text-sm">{dnsData[item.id]?.ip_address || item.ip_address || '-'}</span>
                            )}
                          </div>
                        ) : col === 'domain_registrar_info' ? (
                          <div className="flex items-center gap-2 min-w-[200px]">
                            {(() => {
                              console.log('DEBUG: Rendering domain registrar for site:', item.id, {
                                fk_domreg_hostaccount: item.fk_domreg_hostaccount,
                                has_registrar_data: !!domainRegistrarData[item.id],
                                is_loading: loadingRegistrarData.has(item.id),
                                registrar_data: domainRegistrarData[item.id]
                              });
                              return null;
                            })()}
                            {loadingRegistrarData.has(item.id) ? (
                              <div className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm text-gray-500">Loading...</span>
                              </div>
                            ) : domainRegistrarData[item.id] ? (
                              <>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">
                                    {domainRegistrarData[item.id].company_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {domainRegistrarData[item.id].username}
                                  </span>
                                </div>
                                
                                {/* Portal URL Button */}
                                {domainRegistrarData[item.id].portal_url && (
                                  <button
                                    onClick={() => window.open(domainRegistrarData[item.id].portal_url, '_blank')}
                                    className="inline-flex items-center justify-center w-8 h-8 text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    title="Open portal URL"
                                  >
                                    🌐
                                  </button>
                                )}
                                
                                {/* Host Account Selection Button */}
                                <button
                                  onClick={() => {
                                    setRegistrarPopupOpen(item.id);
                                    if (allHostAccounts.length === 0) {
                                      fetchDomainRegistrarInfo(item.id, item.fk_domreg_hostaccount);
                                    }
                                  }}
                                  className="inline-flex items-center justify-center w-8 h-8 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  title="Change host account"
                                >
                                  ⚙️
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="text-sm text-gray-400">No registrar set</span>
                                <button
                                  onClick={() => {
                                    setRegistrarPopupOpen(item.id);
                                    fetchDomainRegistrarInfo(item.id, null);
                                  }}
                                  className="inline-flex items-center justify-center w-8 h-8 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  title="Set host account"
                                >
                                  ⚙️
                                </button>
                              </>
                            )}
                          </div>
                        ) : col === 'is_starred1' ? (
                          <div 
                            className="flex justify-center items-center cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                            onClick={() => handleStarClick(item.id)}
                          >
                            {updatingStars.has(`${item.id}_is_starred1`) ? (
                              <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg 
                                className={`h-5 w-5 transition-colors ${
                                  item.is_starred1 === 'yes' ? 'text-blue-900 fill-current' : 'text-gray-300 hover:text-gray-400'
                                }`}
                                fill={item.is_starred1 === 'yes' ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                          </div>
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
                  {expandedRows.has(item.id) && (
                    <tr>
                      <td colSpan={visibleColumns.length} className="bg-gray-50 px-6 py-4">
                        <div className="text-sm text-gray-700">
                          <p>View your backlinks</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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

    {/* Host Account Selection Popup */}
    {registrarPopupOpen && (
      <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Select Domain Registrar Host Account
            </h3>
            <button
              onClick={() => setRegistrarPopupOpen(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {allHostAccounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No host accounts found.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Create host accounts first to assign them to domains.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* None/Clear option */}
                <div
                  className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => updateDomainRegistrar(registrarPopupOpen, null)}
                >
                  <div className="flex items-center flex-1">
                    <div className="w-3 bg-gray-300"></div>
                    <div className="flex-1 px-3">
                      <span className="text-sm font-medium text-gray-500">No Registrar</span>
                      <div className="text-xs text-gray-400">Clear current assignment</div>
                    </div>
                  </div>
                </div>

                {/* Host account options */}
                {allHostAccounts.map((account) => (
                  <div
                    key={account.host_account_id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => updateDomainRegistrar(registrarPopupOpen, account.host_account_id)}
                  >
                    <div className="flex items-center flex-1">
                      {/* Company name */}
                      <div className="w-24 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {account.company_name}
                      </div>
                      
                      {/* Black vertical separator */}
                      <div className="w-px h-8 bg-black mx-3"></div>
                      
                      {/* Username */}
                      <div className="flex-1 px-3">
                        <span className="text-sm font-medium text-gray-900">{account.username}</span>
                        {account.portal_url && (
                          <div className="text-xs text-gray-500 mt-1">
                            Portal: {account.portal_url}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-4 border-t border-gray-200 space-x-3">
            <button
              onClick={() => setRegistrarPopupOpen(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}