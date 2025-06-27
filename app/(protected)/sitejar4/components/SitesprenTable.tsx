'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatDateForCreatedAt } from '@/app/utils/dateUtils';

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
  // New joined columns from sitespren_large_view_1
  registrar_username: string | null;
  registrar_company_id: string | null;
  registrar_company_name: string | null;
  registrar_portal_url: string | null;
}

interface SitesprenTableProps {
  data: SitesprenRecord[];
  userId: string;
  userInternalId: string;
  onSelectionChange?: (selectedIds: string[]) => void;
  onDataUpdate?: (updatedData: SitesprenRecord[]) => void;
  searchTerm?: string;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  totalUnfilteredCount?: number;
  onTagsUpdate?: (tagsData: {
    tags: any[];
    selectedTags: Set<string>;
    tagsFeedback: {type: 'success' | 'error' | 'info', message: string} | null;
    functions: {
      handleCreateTag: () => Promise<void>;
      handleUpdateTag: () => Promise<void>;
      handleDeleteTag: (tagId: string) => Promise<void>;
      handleAddSitesToTag: () => Promise<void>;
      handleTagSelection: (tagId: string, isSelected: boolean) => void;
      startEditingTag: (tag: any) => void;
      cancelEditingTag: () => void;
    };
    formData: {
      newTagName: string;
      setNewTagName: (name: string) => void;
      newTagOrder: number;
      setNewTagOrder: (order: number) => void;
      editingTagId: string | null;
      editingTagName: string;
      setEditingTagName: (name: string) => void;
      editingTagOrder: number;
      setEditingTagOrder: (order: number) => void;
    };
    loadingStates: {
      isCreatingTag: boolean;
      isUpdatingTag: boolean;
      isDeletingTag: Set<string>;
      isAddingSitesToTag: boolean;
    };
  }) => void;
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

export default function SitesprenTable({ data, userId, userInternalId, onSelectionChange, onDataUpdate, searchTerm: externalSearchTerm, onSearchChange: externalOnSearchChange, totalUnfilteredCount, onTagsUpdate }: SitesprenTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterWpSite, setFilterWpSite] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('');
  const [tagFilteredSiteIds, setTagFilteredSiteIds] = useState<string[]>([]);
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
  const [registrarPopupOpen, setRegistrarPopupOpen] = useState<string | null>(null);
  const [allHostAccounts, setAllHostAccounts] = useState<any[]>([]);
  const [editPopupOpen, setEditPopupOpen] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<SitesprenRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [scrapingLinks, setScrapingLinks] = useState<Set<string>>(new Set());
  const [linksharnData, setLinksharnData] = useState<{[key: string]: any[]}>({});
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [newTagName, setNewTagName] = useState('');
  const [newTagOrder, setNewTagOrder] = useState(0);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [editingTagOrder, setEditingTagOrder] = useState(0);
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);
  const [isDeletingTag, setIsDeletingTag] = useState<Set<string>>(new Set());
  const [isAddingSitesToTag, setIsAddingSitesToTag] = useState(false);
  const [tagsFeedback, setTagsFeedback] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [showCopyOverlay, setShowCopyOverlay] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  
  const supabase = createClientComponentClient();
  
  // Column template and sticky state
  const [selectedColumnTemplate, setSelectedColumnTemplate] = useState('option1');
  const [selectedStickyColumns, setSelectedStickyColumns] = useState('option1');

  // Load state from URL parameters and localStorage on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const colTempParam = urlParams.get('coltemp') || localStorage.getItem('sitejar4_coltemp') || 'option1';
    const stickyColParam = urlParams.get('stickycol') || localStorage.getItem('sitejar4_stickycol') || 'option1';
    const stagParam = urlParams.get('stag') || '';
    
    setSelectedColumnTemplate(colTempParam);
    setSelectedStickyColumns(stickyColParam);
    setFilterTag(stagParam);
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

  const updateUrlAndStorage = (colTemp: string, stickyCol: string, stagFilter?: string) => {
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('coltemp', colTemp);
    url.searchParams.set('stickycol', stickyCol);
    
    if (stagFilter && stagFilter.trim()) {
      url.searchParams.set('stag', stagFilter);
    } else {
      url.searchParams.delete('stag');
    }
    
    window.history.replaceState({}, '', url.toString());
    
    // Update localStorage
    localStorage.setItem('sitejar4_coltemp', colTemp);
    localStorage.setItem('sitejar4_stickycol', stickyCol);
  };

  const handleColumnTemplateChange = (option: string) => {
    setSelectedColumnTemplate(option);
    updateUrlAndStorage(option, selectedStickyColumns, filterTag);
  };

  const handleStickyColumnsChange = (option: string) => {
    setSelectedStickyColumns(option);
    updateUrlAndStorage(selectedColumnTemplate, option, filterTag);
  };

  const handleTagFilterChange = (tagId: string) => {
    setFilterTag(tagId);
    updateUrlAndStorage(selectedColumnTemplate, selectedStickyColumns, tagId);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Fetch sites by tag when tag filter changes
  const fetchSitesByTag = async (tagId: string) => {
    if (!tagId || !userInternalId) {
      setTagFilteredSiteIds([]);
      return;
    }

    try {
      const response = await fetch(`/api/get_sites_by_tag?user_internal_id=${userInternalId}&tag_id=${tagId}`);
      const result = await response.json();

      if (result.success) {
        setTagFilteredSiteIds(result.data.site_ids || []);
      } else {
        console.error('Error fetching sites by tag:', result.error);
        setTagFilteredSiteIds([]);
      }
    } catch (error) {
      console.error('Error fetching sites by tag:', error);
      setTagFilteredSiteIds([]);
    }
  };

  // Effect to fetch sites by tag when filter changes
  useEffect(() => {
    if (filterTag) {
      fetchSitesByTag(filterTag);
    } else {
      setTagFilteredSiteIds([]);
    }
  }, [filterTag, userInternalId]);

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

      // Tag filter
      const matchesTagFilter = filterTag === '' || tagFilteredSiteIds.includes(item.id);

      return matchesWpFilter && matchesTagFilter;
    });
  }, [data, filterWpSite, filterTag, tagFilteredSiteIds]);

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

  // Fetch host accounts for the popup
  const fetchHostAccountsForPopup = async () => {
    if (!userInternalId || allHostAccounts.length > 0) return;

    try {
      const params = new URLSearchParams({
        user_internal_id: userInternalId
      });

      const response = await fetch(`/api/get_domain_registrar_info?${params}`);
      const result = await response.json();

      if (result.success && result.data.all_host_accounts) {
        setAllHostAccounts(result.data.all_host_accounts);
      }
    } catch (error) {
      console.error('Error fetching host accounts:', error);
    }
  };


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
        const message = `✅ ${data.message} (${data.count} items)`;
        setSyncResults(prev => ({
          ...prev,
          [siteId]: {
            type: 'success',
            message: message
          }
        }));
        
        // Also set gadget feedback directly for immediate display
        setGadgetFeedback({
          action: `wpsv2_sync (${method})`,
          message: message,
          type: 'success',
          timestamp: new Date().toISOString()
        });
      } else {
        const message = `❌ ${data.message}`;
        setSyncResults(prev => ({
          ...prev,
          [siteId]: {
            type: 'error',
            message: message
          }
        }));
        
        // Also set gadget feedback directly for immediate display
        setGadgetFeedback({
          action: `wpsv2_sync (${method})`,
          message: message,
          type: 'error',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      const message = `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setSyncResults(prev => ({
        ...prev,
        [siteId]: {
          type: 'error',
          message: message
        }
      }));
      
      // Also set gadget feedback directly for immediate display
      setGadgetFeedback({
        action: `wpsv2_sync (${method})`,
        message: message,
        type: 'error',
        timestamp: new Date().toISOString()
      });
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
        
        const message = `Plugin: ${pluginStatus} | REST: ${restStatus} | ${data.results.recommendations[0] || 'Test completed'}`;
        setSyncResults(prev => ({
          ...prev,
          [`test_${siteId}`]: {
            type: 'success',
            message: message
          }
        }));
        
        // Also set gadget feedback directly for immediate display
        setGadgetFeedback({
          action: 'test_plugin',
          message: message,
          type: 'success',
          timestamp: new Date().toISOString()
        });
      } else {
        const message = `❌ ${data.message}`;
        setSyncResults(prev => ({
          ...prev,
          [`test_${siteId}`]: {
            type: 'error',
            message: message
          }
        }));
        
        // Also set gadget feedback directly for immediate display
        setGadgetFeedback({
          action: 'test_plugin',
          message: message,
          type: 'error',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      const message = `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setSyncResults(prev => ({
        ...prev,
        [`test_${siteId}`]: {
          type: 'error',
          message: message
        }
      }));
      
      // Also set gadget feedback directly for immediate display
      setGadgetFeedback({
        action: 'test_plugin',
        message: message,
        type: 'error',
        timestamp: new Date().toISOString()
      });
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
        const message = `✅ ${data.message} (Current: ${data.currentVersion || 'Unknown'}, Latest: ${data.latestVersion || 'Unknown'})`;
        setSyncResults(prev => ({
          ...prev,
          [`version_${siteId}`]: {
            type: 'success',
            message: message
          }
        }));
        
        // Also set gadget feedback directly for immediate display
        setGadgetFeedback({
          action: 'check_plugin_version',
          message: message,
          type: 'success',
          timestamp: new Date().toISOString()
        });
      } else {
        const message = `❌ ${data.message}`;
        setSyncResults(prev => ({
          ...prev,
          [`version_${siteId}`]: {
            type: 'error',
            message: message
          }
        }));
        
        // Also set gadget feedback directly for immediate display
        setGadgetFeedback({
          action: 'check_plugin_version',
          message: message,
          type: 'error',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      const message = `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setSyncResults(prev => ({
        ...prev,
        [`version_${siteId}`]: {
          type: 'error',
          message: message
        }
      }));
      
      // Also set gadget feedback directly for immediate display
      setGadgetFeedback({
        action: 'check_plugin_version',
        message: message,
        type: 'error',
        timestamp: new Date().toISOString()
      });
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
        const message = `✅ ${data.message} (Updated to version: ${data.newVersion || 'Unknown'})`;
        setSyncResults(prev => ({
          ...prev,
          [`update_${siteId}`]: {
            type: 'success',
            message: message
          }
        }));
        
        // Also set gadget feedback directly for immediate display
        setGadgetFeedback({
          action: 'update_plugin',
          message: message,
          type: 'success',
          timestamp: new Date().toISOString()
        });
      } else {
        const message = `❌ ${data.message}`;
        setSyncResults(prev => ({
          ...prev,
          [`update_${siteId}`]: {
            type: 'error',
            message: message
          }
        }));
        
        // Also set gadget feedback directly for immediate display
        setGadgetFeedback({
          action: 'update_plugin',
          message: message,
          type: 'error',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      const message = `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setSyncResults(prev => ({
        ...prev,
        [`update_${siteId}`]: {
          type: 'error',
          message: message
        }
      }));
      
      // Also set gadget feedback directly for immediate display
      setGadgetFeedback({
        action: 'update_plugin',
        message: message,
        type: 'error',
        timestamp: new Date().toISOString()
      });
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
        const message = `✅ ${data.message}`;
        setSyncResults(prev => ({
          ...prev,
          [`barkro_${siteId}`]: {
            type: 'success',
            message: message
          }
        }));
        
        // Also set gadget feedback directly for immediate display
        setGadgetFeedback({
          action: 'barkro_push',
          message: message,
          type: 'success',
          timestamp: new Date().toISOString()
        });
      } else {
        const message = `❌ ${data.message}`;
        setSyncResults(prev => ({
          ...prev,
          [`barkro_${siteId}`]: {
            type: 'error',
            message: message
          }
        }));
        
        // Also set gadget feedback directly for immediate display
        setGadgetFeedback({
          action: 'barkro_push',
          message: message,
          type: 'error',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      const message = `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setSyncResults(prev => ({
        ...prev,
        [`barkro_${siteId}`]: {
          type: 'error',
          message: message
        }
      }));
      
      // Also set gadget feedback directly for immediate display
      setGadgetFeedback({
        action: 'barkro_push',
        message: message,
        type: 'error',
        timestamp: new Date().toISOString()
      });
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

      // The individual handlers now set the gadget feedback directly,
      // so we don't need to do anything else here
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
    if (!userInternalId) return;

    try {
      const response = await fetch('/api/update_domain_registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sitespren_id: siteId,
          fk_domreg_hostaccount: newHostAccountId,
          user_internal_id: userInternalId
        })
      });

      const result = await response.json();

      if (result.success) {
        // Find the new registrar info from allHostAccounts
        const newRegistrarInfo = newHostAccountId 
          ? allHostAccounts.find(acc => acc.host_account_id === newHostAccountId)
          : null;

        // Update the main data with both the fk_domreg_hostaccount and the joined registrar fields
        if (onDataUpdate) {
          const updatedData = data.map(site => 
            site.id === siteId 
              ? { 
                  ...site, 
                  fk_domreg_hostaccount: newHostAccountId,
                  registrar_username: newRegistrarInfo?.username || null,
                  registrar_company_id: newRegistrarInfo?.company_id || null,
                  registrar_company_name: newRegistrarInfo?.company_name || null,
                  registrar_portal_url: newRegistrarInfo?.portal_url || null
                }
              : site
          );
          onDataUpdate(updatedData);
        }

        // Also update the edit form data if it's open for this site
        if (editFormData && editFormData.id === siteId) {
          setEditFormData({
            ...editFormData,
            fk_domreg_hostaccount: newHostAccountId,
            registrar_username: newRegistrarInfo?.username || null,
            registrar_company_id: newRegistrarInfo?.company_id || null,
            registrar_company_name: newRegistrarInfo?.company_name || null,
            registrar_portal_url: newRegistrarInfo?.portal_url || null
          });
        }

        setRegistrarPopupOpen(null);
      } else {
        console.error('Failed to update domain registrar:', result.error);
      }
    } catch (error) {
      console.error('Error updating domain registrar:', error);
    }
  };

  // Handle saving changes from the edit popup
  const handleSaveChanges = async () => {
    if (!editFormData || !userInternalId) return;

    setIsUpdating(true);

    try {
      // Prepare the update data (exclude read-only fields)
      const updateData = {
        sitespren_base: editFormData.sitespren_base,
        ns_full: editFormData.ns_full,
        ip_address: editFormData.ip_address,
        true_root_domain: editFormData.true_root_domain,
        full_subdomain: editFormData.full_subdomain,
        webproperty_type: editFormData.webproperty_type,
        wpuser1: editFormData.wpuser1,
        wppass1: editFormData.wppass1,
        ruplin_apikey: editFormData.ruplin_apikey,
        wp_rest_app_pass: editFormData.wp_rest_app_pass,
        wp_plugin_installed1: editFormData.wp_plugin_installed1,
        wp_plugin_connected2: editFormData.wp_plugin_connected2,
        fk_domreg_hostaccount: editFormData.fk_domreg_hostaccount,
        is_wp_site: editFormData.is_wp_site,
        is_starred1: editFormData.is_starred1,
        updated_at: new Date().toISOString()
      };

      // Update the record in Supabase
      const { error } = await supabase
        .from('sitespren')
        .update(updateData)
        .eq('id', editFormData.id)
        .eq('fk_users_id', userInternalId);

      if (error) {
        console.error('Error updating site record:', error);
        return;
      }

      // Update local data
      if (onDataUpdate) {
        const updatedData = data.map(site => 
          site.id === editFormData.id 
            ? { ...editFormData }
            : site
        );
        onDataUpdate(updatedData);
      }

      // Close the popup
      setEditPopupOpen(null);
      setEditFormData(null);

    } catch (error) {
      console.error('Error in handleSaveChanges:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle scraping links from homepage
  const handleScrapeLinksFromHomepage = async (siteId: string, sitesprenBase: string | null) => {
    if (!sitesprenBase || !userInternalId) return;

    setScrapingLinks(prev => new Set([...prev, siteId]));

    try {
      const response = await fetch('/api/scrape_links_from_homepage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sitespren_id: siteId,
          sitespren_base: sitesprenBase,
          user_internal_id: userInternalId
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('Link scraping completed:', result.data);
        
        // Fetch updated linksharn data for this site
        await fetchLinksharnData(siteId, result.data.source_domain);

        // Show feedback message
        setGadgetFeedback({
          action: `ScrapeLinksFromHomepage1`,
          message: `Found ${result.data.total_found} outbound links (${result.data.new_links} new, ${result.data.existing_updated} updated)`,
          type: 'success',
          timestamp: new Date().toISOString()
        });

        // Clear feedback after 5 seconds
        setTimeout(() => setGadgetFeedback(null), 5000);
      } else {
        console.error('Link scraping failed:', result.error);
        setGadgetFeedback({
          action: `ScrapeLinksFromHomepage1`,
          message: `Failed: ${result.error}`,
          type: 'error',
          timestamp: new Date().toISOString()
        });

        // Clear feedback after 5 seconds
        setTimeout(() => setGadgetFeedback(null), 5000);
      }
    } catch (error) {
      console.error('Error scraping links:', error);
      setGadgetFeedback({
        action: `ScrapeLinksFromHomepage1`,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        timestamp: new Date().toISOString()
      });

      // Clear feedback after 5 seconds
      setTimeout(() => setGadgetFeedback(null), 5000);
    } finally {
      setScrapingLinks(prev => {
        const newSet = new Set(prev);
        newSet.delete(siteId);
        return newSet;
      });
    }
  };

  // Fetch linksharn data for a specific site
  const fetchLinksharnData = async (siteId: string, sourceDomain: string) => {
    if (!userInternalId) return;

    try {
      const { data: links, error } = await supabase
        .from('linksharn')
        .select('*')
        .eq('source_domain', sourceDomain)
        .eq('fk_user_id', userInternalId)
        .order('first_seen', { ascending: false });

      if (!error && links) {
        setLinksharnData(prev => ({
          ...prev,
          [siteId]: links
        }));
      }
    } catch (error) {
      console.error('Error fetching linksharn data:', error);
    }
  };

  // Tags management functions
  const fetchTags = async () => {
    if (!userInternalId) return;

    try {
      const response = await fetch(`/api/sitespren_tags?user_internal_id=${userInternalId}`);
      const result = await response.json();

      if (result.success) {
        setTags(result.data || []);
      } else {
        console.error('Error fetching tags:', result.error);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !userInternalId) return;

    setIsCreatingTag(true);
    setTagsFeedback(null);

    try {
      const response = await fetch('/api/sitespren_tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tag_name: newTagName.trim(),
          tag_order: newTagOrder,
          user_internal_id: userInternalId
        })
      });

      const result = await response.json();

      if (result.success) {
        setTagsFeedback({
          type: 'success',
          message: 'Tag created successfully'
        });
        setNewTagName('');
        setNewTagOrder(0);
        await fetchTags();
      } else {
        setTagsFeedback({
          type: 'error',
          message: result.error || 'Failed to create tag'
        });
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      setTagsFeedback({
        type: 'error',
        message: 'Network error occurred'
      });
    } finally {
      setIsCreatingTag(false);
      setTimeout(() => setTagsFeedback(null), 5000);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTagId || !editingTagName.trim() || !userInternalId) return;

    setIsUpdatingTag(true);
    setTagsFeedback(null);

    try {
      const response = await fetch('/api/sitespren_tags', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tag_id: editingTagId,
          tag_name: editingTagName.trim(),
          tag_order: editingTagOrder,
          user_internal_id: userInternalId
        })
      });

      const result = await response.json();

      if (result.success) {
        setTagsFeedback({
          type: 'success',
          message: 'Tag updated successfully'
        });
        setEditingTagId(null);
        setEditingTagName('');
        setEditingTagOrder(0);
        await fetchTags();
      } else {
        setTagsFeedback({
          type: 'error',
          message: result.error || 'Failed to update tag'
        });
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      setTagsFeedback({
        type: 'error',
        message: 'Network error occurred'
      });
    } finally {
      setIsUpdatingTag(false);
      setTimeout(() => setTagsFeedback(null), 5000);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!userInternalId) return;

    const confirmed = window.confirm('Are you sure you want to delete this tag? This will also remove all site associations with this tag.');
    if (!confirmed) return;

    setIsDeletingTag(prev => new Set([...prev, tagId]));
    setTagsFeedback(null);

    try {
      const response = await fetch('/api/sitespren_tags', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tag_id: tagId,
          user_internal_id: userInternalId
        })
      });

      const result = await response.json();

      if (result.success) {
        setTagsFeedback({
          type: 'success',
          message: 'Tag deleted successfully'
        });
        await fetchTags();
      } else {
        setTagsFeedback({
          type: 'error',
          message: result.error || 'Failed to delete tag'
        });
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      setTagsFeedback({
        type: 'error',
        message: 'Network error occurred'
      });
    } finally {
      setIsDeletingTag(prev => {
        const newSet = new Set(prev);
        newSet.delete(tagId);
        return newSet;
      });
      setTimeout(() => setTagsFeedback(null), 5000);
    }
  };

  const handleAddSitesToTag = async () => {
    if (selectedTags.size === 0) {
      setTagsFeedback({
        type: 'error',
        message: 'Please select a tag first'
      });
      setTimeout(() => setTagsFeedback(null), 5000);
      return;
    }

    if (selectedSites.size === 0) {
      setTagsFeedback({
        type: 'error',
        message: 'Please select sites from the main table first'
      });
      setTimeout(() => setTagsFeedback(null), 5000);
      return;
    }

    if (!userInternalId) return;

    setIsAddingSitesToTag(true);
    setTagsFeedback(null);

    try {
      const tagId = Array.from(selectedTags)[0]; // Use first selected tag
      const siteIds = Array.from(selectedSites);

      const response = await fetch('/api/add_sites_to_tag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_ids: siteIds,
          tag_id: tagId,
          user_internal_id: userInternalId
        })
      });

      const result = await response.json();

      if (result.success) {
        setTagsFeedback({
          type: 'success',
          message: result.message
        });
        setSelectedTags(new Set()); // Clear tag selection
      } else {
        setTagsFeedback({
          type: 'error',
          message: result.error || 'Failed to add sites to tag'
        });
      }
    } catch (error) {
      console.error('Error adding sites to tag:', error);
      setTagsFeedback({
        type: 'error',
        message: 'Network error occurred'
      });
    } finally {
      setIsAddingSitesToTag(false);
      setTimeout(() => setTagsFeedback(null), 5000);
    }
  };

  const handleTagSelection = (tagId: string, isSelected: boolean) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.clear(); // Only allow one tag selection at a time
        newSet.add(tagId);
      } else {
        newSet.delete(tagId);
      }
      return newSet;
    });
  };

  const startEditingTag = (tag: any) => {
    setEditingTagId(tag.tag_id);
    setEditingTagName(tag.tag_name);
    setEditingTagOrder(tag.tag_order);
  };

  const cancelEditingTag = () => {
    setEditingTagId(null);
    setEditingTagName('');
    setEditingTagOrder(0);
  };

  // Fetch tags when component mounts or userInternalId changes
  useEffect(() => {
    if (userInternalId) {
      fetchTags();
    }
  }, [userInternalId]);

  // Update parent component with tags data whenever tags state changes
  useEffect(() => {
    if (onTagsUpdate) {
      onTagsUpdate({
        tags,
        selectedTags,
        tagsFeedback,
        functions: {
          handleCreateTag,
          handleUpdateTag,
          handleDeleteTag,
          handleAddSitesToTag,
          handleTagSelection,
          startEditingTag,
          cancelEditingTag
        },
        formData: {
          newTagName,
          setNewTagName,
          newTagOrder,
          setNewTagOrder,
          editingTagId,
          editingTagName,
          setEditingTagName,
          editingTagOrder,
          setEditingTagOrder
        },
        loadingStates: {
          isCreatingTag,
          isUpdatingTag,
          isDeletingTag,
          isAddingSitesToTag
        }
      });
    }
  }, [tags, selectedTags, tagsFeedback, newTagName, newTagOrder, editingTagId, editingTagName, editingTagOrder, isCreatingTag, isUpdatingTag, isDeletingTag, isAddingSitesToTag, onTagsUpdate]);

  // Copy button handler with overlay animation
  const handleCopyClick = async (textToCopy: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent any parent click handlers
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      
      // Start the overlay animation sequence
      setShowCopyOverlay(true);
      
      // Fade in over 0.5s
      setTimeout(() => setOverlayOpacity(1), 10);
      
      // Start fade out after 1.5s (0.5s fade in + 1s visible)
      setTimeout(() => setOverlayOpacity(0), 1500);
      
      // Hide overlay after 2.5s (0.5s fade in + 1s visible + 1s fade out)
      setTimeout(() => setShowCopyOverlay(false), 2500);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  // Auto-fetch linksharn data when rows are expanded
  useEffect(() => {
    expandedRows.forEach(siteId => {
      if (!linksharnData[siteId]) {
        const site = data.find(s => s.id === siteId);
        if (site && site.sitespren_base) {
          const sourceDomain = site.sitespren_base.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          fetchLinksharnData(siteId, sourceDomain);
        }
      }
    });
  }, [expandedRows, userInternalId]);

  // Helper function to render copyable content with copy button
  const renderCopyableContent = (content: string | null | undefined, col: string, fallback: string = '-', copyValue?: string | null | undefined) => {
    const displayValue = content || fallback;
    const valueToCopy = copyValue !== undefined ? (copyValue || fallback) : displayValue;
    return (
      <div className="relative">
        <span 
          className={`${col}-content font-medium block p-2`}
          style={{ paddingRight: '24px' }}
        >
          {displayValue}
        </span>
        <span
          onClick={(e) => handleCopyClick(valueToCopy, e)}
          className={`${col}-copy-btn absolute top-0 right-0 z-10 transition-colors duration-200 cursor-pointer`}
          style={{
            width: '20px',
            height: '11px',
            backgroundColor: '#c0c0c0',
            borderColor: '#918f8f',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fee43b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#c0c0c0';
          }}
          title={`Copy ${col}`}
        />
      </div>
    );
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
            <div>view name: sitespren_large_view_1</div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Tag
            </label>
            <select
              id="tag-filter"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filterTag}
              onChange={(e) => handleTagFilterChange(e.target.value)}
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag.tag_id} value={tag.tag_id}>
                  {tag.tag_name}
                </option>
              ))}
            </select>
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

      {/* Flex container for Essex and Chepno */}
      <div className="flex gap-4 items-start">
        {/* Pagination Controls Essex */}
        <div className="bg-white rounded-lg shadow p-4 w-fit">
        <h3 className="text-sm font-bold text-gray-800 mb-3">pagination_controls_essex</h3>
        
        {/* Results info */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {Math.min(itemsPerPage, sortedData.length)} of {sortedData.length} results
        </div>
        
        {/* Results per page button group */}
        <div className="mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            {[10, 25, 50, 100, 200, 'All'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  if (value === 'All') {
                    setItemsPerPage(sortedData.length || 1000);
                  } else {
                    setItemsPerPage(value as number);
                  }
                  setCurrentPage(1);
                }}
                className={`
                  px-4 py-2 text-sm font-medium border
                  ${value === 10 ? 'rounded-l-lg' : ''}
                  ${value === 'All' ? 'rounded-r-lg' : ''}
                  ${(value === 'All' && itemsPerPage >= sortedData.length) || itemsPerPage === value
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:bg-blue-700 focus:text-white'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                  focus:z-10 focus:ring-2 focus:ring-blue-500
                `}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        
        {/* Page navigation */}
        <div className="flex items-center justify-start">
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Previous button */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`
                relative inline-flex items-center rounded-l-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300
                ${currentPage === 1 
                  ? 'cursor-not-allowed bg-gray-50' 
                  : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                }
              `}
            >
              <span className="text-lg">«</span>
            </button>
            
            {/* Page numbers */}
            {(() => {
              const pageNumbers = [];
              const maxVisiblePages = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
              
              if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }
              
              for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`
                      relative inline-flex items-center px-4 py-2 text-sm font-semibold
                      ${currentPage === i
                        ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }
                    `}
                  >
                    {i}
                  </button>
                );
              }
              
              return pageNumbers;
            })()}
            
            {/* Next button */}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`
                relative inline-flex items-center rounded-r-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300
                ${currentPage === totalPages 
                  ? 'cursor-not-allowed bg-gray-50' 
                  : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                }
              `}
            >
              <span className="text-lg">»</span>
            </button>
          </nav>
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
      </div> {/* End of flex container for Essex and Chepno */}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
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
                          {col === 'is_starred1' ? '•str1' : col} {['id', 'created_at', 'sitespren_base', 'true_root_domain', 'updated_at', 'is_starred1'].includes(col) && sortField === col && (sortOrder === 'asc' ? '↑' : '↓')}
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
                  <tr className="hover:bg-gray-50 border-b border-gray-200">
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
                        className={`text-sm text-gray-900 relative border-r border-gray-200 ${stickyClass} ${bgClass} ${
                          col === 'checkbox' || col === 'tool_buttons' ? 'whitespace-nowrap' : ''
                        } ${col === 'checkbox' ? 'cursor-pointer' : ''} ${col === 'checkbox' || col === 'tool_buttons' || col === 'is_starred1' || col === 'domain_registrar_info' ? '' : 'align-top'}`}
                        style={{
                          ...(isSticky ? { left: leftPosition } : {}),
                          verticalAlign: 'top'
                        }}
                        onClick={col === 'checkbox' ? () => handleSiteSelection(item.id, !selectedSites.has(item.id)) : undefined}
                      >
                        {hasLeftSeparator && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-black"></div>
                        )}
                        <div style={{ height: '48px', maxHeight: '48px', minHeight: '48px', overflow: 'hidden' }}>
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
                            <button
                              onClick={() => {
                                setEditFormData(item);
                                setEditPopupOpen(item.id);
                                fetchHostAccountsForPopup();
                              }}
                              className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                              title="Edit row"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleScrapeLinksFromHomepage(item.id, item.sitespren_base)}
                              disabled={scrapingLinks.has(item.id)}
                              className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              title="Scrape outbound links from homepage"
                            >
                              {scrapingLinks.has(item.id) ? (
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                'L'
                              )}
                            </button>
                            <Link
                              href={`/nwjar1?coltemp=option1&sitebase=${encodeURIComponent(item.sitespren_base || '')}`}
                              className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              title="Open NW Jar"
                            >
                              NW
                            </Link>
                            <Link
                              href={`/gconjar1?coltemp=option1&sitebase=${encodeURIComponent(item.sitespren_base || '')}`}
                              className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                              title="Open GC Jar"
                            >
                              GC
                            </Link>
                          </div>
                        ) : col === 'id' ? (
                          renderCopyableContent(`${item.id.substring(0, 3)}..`, col, '-', item.id)
                        ) : col === 'created_at' ? (
                          (() => {
                            const formattedDate = formatDateForCreatedAt(item.created_at);
                            const parts = formattedDate.split('_');
                            const displayValue = parts.length >= 3 ? (
                              <>
                                {parts[0]}_{parts[1]}_<span style={{color: '#4f4f4f'}}>{parts[2]}</span>
                              </>
                            ) : formattedDate;
                            return (
                              <div className="relative">
                                <span className="created_at-content font-medium block p-2" style={{ paddingRight: '24px' }}>
                                  {displayValue}
                                </span>
                                <span
                                  onClick={(e) => handleCopyClick(formattedDate, e)}
                                  className="created_at-copy-btn absolute top-0 right-0 z-10 transition-colors duration-200 cursor-pointer"
                                  style={{
                                    width: '20px',
                                    height: '11px',
                                    backgroundColor: '#c0c0c0',
                                    borderColor: '#918f8f',
                                    borderWidth: '1px',
                                    borderStyle: 'solid'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee43b'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#c0c0c0'; }}
                                  title="Copy created_at"
                                />
                              </div>
                            );
                          })()
                        ) : col === 'updated_at' ? (
                          renderCopyableContent(formatDate(item[col as keyof SitesprenRecord] as string), col)
                        ) : col === 'fk_users_id' || col === 'fk_domreg_hostaccount' ? (
                          renderCopyableContent(
                            item[col as keyof SitesprenRecord] ? `${(item[col as keyof SitesprenRecord] as string).substring(0, 3)}..` : null, 
                            col, 
                            '-', 
                            item[col as keyof SitesprenRecord] as string
                          )
                        ) : col === 'wppass1' ? (
                          renderCopyableContent(item.wppass1 ? '***' : null, col)
                        ) : col === 'ruplin_apikey' || col === 'wp_rest_app_pass' ? (
                          renderCopyableContent(item[col as keyof SitesprenRecord] ? truncateText(item[col as keyof SitesprenRecord] as string, 15) : null, col)
                        ) : col === 'wp_plugin_installed1' || col === 'wp_plugin_connected2' || col === 'is_wp_site' ? (
                          renderCopyableContent(formatBoolean(item[col as keyof SitesprenRecord] as boolean | null), col)
                        ) : col === 'sitespren_base' ? (
                          <div className="relative">
                            <span 
                              className="sitespren-base-content font-medium block p-2"
                              style={{ paddingRight: '24px' }}
                            >
                              {item.sitespren_base || '-'}
                            </span>
                            <span
                              onClick={(e) => handleCopyClick(item.sitespren_base || '', e)}
                              className="sitespren-base-copy-btn absolute top-0 right-0 z-10 transition-colors duration-200 cursor-pointer"
                              style={{
                                width: '20px',
                                height: '11px',
                                backgroundColor: '#c0c0c0',
                                borderColor: '#918f8f',
                                borderWidth: '1px',
                                borderStyle: 'solid'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fee43b';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#c0c0c0';
                              }}
                              title="Copy domain"
                            />
                          </div>
                        ) : col === 'ns_full' ? (
                          <div className="relative">
                            <div 
                              className="cursor-pointer hover:bg-gray-100 rounded transition-colors p-2"
                              style={{ paddingRight: '24px' }}
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
                                <span className="text-sm font-medium">{dnsData[item.id]?.ns_full || item.ns_full || '-'}</span>
                              )}
                            </div>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyClick(dnsData[item.id]?.ns_full || item.ns_full || '', e);
                              }}
                              className="ns-full-copy-btn absolute top-0 right-0 z-10 transition-colors duration-200 cursor-pointer"
                              style={{
                                width: '20px',
                                height: '11px',
                                backgroundColor: '#c0c0c0',
                                borderColor: '#918f8f',
                                borderWidth: '1px',
                                borderStyle: 'solid'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fee43b';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#c0c0c0';
                              }}
                              title="Copy nameserver"
                            />
                          </div>
                        ) : col === 'ip_address' ? (
                          <div className="relative">
                            <div 
                              className="cursor-pointer hover:bg-gray-100 rounded transition-colors p-2"
                              style={{ paddingRight: '24px' }}
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
                                <span className="text-sm font-medium">{dnsData[item.id]?.ip_address || item.ip_address || '-'}</span>
                              )}
                            </div>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyClick(dnsData[item.id]?.ip_address || item.ip_address || '', e);
                              }}
                              className="ip-address-copy-btn absolute top-0 right-0 z-10 transition-colors duration-200 cursor-pointer"
                              style={{
                                width: '20px',
                                height: '11px',
                                backgroundColor: '#c0c0c0',
                                borderColor: '#918f8f',
                                borderWidth: '1px',
                                borderStyle: 'solid'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fee43b';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#c0c0c0';
                              }}
                              title="Copy IP address"
                            />
                          </div>
                        ) : col === 'domain_registrar_info' ? (
                          <div className="flex items-center gap-2 min-w-[200px]">
                            {item.registrar_company_name ? (
                              <>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">
                                    {item.registrar_company_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {item.registrar_username}
                                  </span>
                                </div>
                                
                                {/* Portal URL Button */}
                                {item.registrar_portal_url && (
                                  <button
                                    onClick={() => window.open(item.registrar_portal_url!, '_blank')}
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
                                    fetchHostAccountsForPopup();
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
                                    fetchHostAccountsForPopup();
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
                          renderCopyableContent(item[col as keyof SitesprenRecord] as string, col)
                        )}
                        </div>
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
                        <div className="space-y-6">
                          {/* Backlinks Section */}
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Backlinks</h4>
                            <div className="text-sm text-gray-700 bg-white p-4 rounded-lg border">
                              <p>View your backlinks (this section will be enhanced in the future)</p>
                            </div>
                          </div>

                          {/* Outbound Links Section */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-semibold text-gray-900">Outbound Links from Homepage</h4>
                              <button
                                onClick={() => {
                                  handleScrapeLinksFromHomepage(item.id, item.sitespren_base);
                                  if (!linksharnData[item.id] && item.sitespren_base) {
                                    fetchLinksharnData(item.id, item.sitespren_base.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]);
                                  }
                                }}
                                disabled={scrapingLinks.has(item.id)}
                                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                              >
                                {scrapingLinks.has(item.id) ? 'Scraping...' : 'Refresh Links'}
                              </button>
                            </div>
                            
                            {linksharnData[item.id] ? (
                              <div className="bg-white rounded-lg border overflow-hidden">
                                {linksharnData[item.id].length > 0 ? (
                                  <>
                                    <div className="px-4 py-2 bg-gray-100 border-b">
                                      <p className="text-sm text-gray-600">
                                        Found {linksharnData[item.id].length} outbound links
                                      </p>
                                    </div>
                                    <div className="overflow-x-auto max-h-96">
                                      <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                          <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target Domain</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Anchor Text</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target URL</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">NoFollow</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">First Seen</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Seen</th>
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                          {linksharnData[item.id].map((link, index) => (
                                            <tr key={link.backlink_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                              <td className="px-3 py-2 text-sm text-gray-900 font-medium">
                                                {link.target_domain}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-gray-600">
                                                {link.backlink_anchor ? (
                                                  <span className="inline-block max-w-xs truncate" title={link.backlink_anchor}>
                                                    {link.backlink_anchor}
                                                  </span>
                                                ) : (
                                                  <span className="text-gray-400 italic">No anchor text</span>
                                                )}
                                              </td>
                                              <td className="px-3 py-2 text-sm">
                                                <a
                                                  href={link.target_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:text-blue-800 underline max-w-xs inline-block truncate"
                                                  title={link.target_url}
                                                >
                                                  {link.target_url}
                                                </a>
                                              </td>
                                              <td className="px-3 py-2 text-sm">
                                                {link.is_nofollow ? (
                                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    NoFollow
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Follow
                                                  </span>
                                                )}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-gray-600">
                                                {link.first_seen ? new Date(link.first_seen).toLocaleDateString() : '-'}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-gray-600">
                                                {link.last_seen ? new Date(link.last_seen).toLocaleDateString() : '-'}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </>
                                ) : (
                                  <div className="px-4 py-8 text-center">
                                    <p className="text-gray-500">No outbound links found</p>
                                    <p className="text-sm text-gray-400 mt-1">Click "Refresh Links" to scrape the homepage</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-white rounded-lg border p-4 text-center">
                                <p className="text-gray-500">Click "Refresh Links" to scrape outbound links from the homepage</p>
                              </div>
                            )}
                          </div>
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

    {/* Row Edit Popup */}
    {editPopupOpen && editFormData && (
      <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl relative max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Edit Site Record</h3>
              <p className="text-sm text-gray-600 mt-1">
                {editFormData.sitespren_base} • {editFormData.id}
              </p>
            </div>
            <button
              onClick={() => {
                setEditPopupOpen(null);
                setEditFormData(null);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                  
                  {/* Site Base */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Domain (sitespren_base)
                    </label>
                    <input
                      type="text"
                      value={editFormData.sitespren_base || ''}
                      onChange={(e) => setEditFormData({...editFormData, sitespren_base: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="example.com"
                    />
                  </div>

                  {/* True Root Domain */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      True Root Domain
                    </label>
                    <input
                      type="text"
                      value={editFormData.true_root_domain || ''}
                      onChange={(e) => setEditFormData({...editFormData, true_root_domain: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="example.com"
                    />
                  </div>

                  {/* Full Subdomain */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Subdomain
                    </label>
                    <input
                      type="text"
                      value={editFormData.full_subdomain || ''}
                      onChange={(e) => setEditFormData({...editFormData, full_subdomain: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="www.example.com"
                    />
                  </div>

                  {/* Web Property Type */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Web Property Type
                    </label>
                    <select
                      value={editFormData.webproperty_type || ''}
                      onChange={(e) => setEditFormData({...editFormData, webproperty_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select type...</option>
                      <option value="WordPress Site">WordPress Site</option>
                      <option value="Static Site">Static Site</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="Landing Page">Landing Page</option>
                      <option value="Blog">Blog</option>
                      <option value="Portfolio">Portfolio</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Network Info */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Network Information</h4>
                  
                  {/* NS Full */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name Servers (ns_full)
                    </label>
                    <textarea
                      value={editFormData.ns_full || ''}
                      onChange={(e) => setEditFormData({...editFormData, ns_full: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="ns1.example.com, ns2.example.com"
                    />
                  </div>

                  {/* IP Address */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IP Address
                    </label>
                    <input
                      type="text"
                      value={editFormData.ip_address || ''}
                      onChange={(e) => setEditFormData({...editFormData, ip_address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="192.168.1.1"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - WordPress & Settings */}
              <div className="space-y-6">
                
                {/* WordPress Settings */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">WordPress Settings</h4>
                  
                  {/* Is WordPress Site Toggle */}
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.is_wp_site || false}
                        onChange={(e) => setEditFormData({...editFormData, is_wp_site: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Is WordPress Site</span>
                    </label>
                  </div>

                  {/* WP Username */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WordPress Username
                    </label>
                    <input
                      type="text"
                      value={editFormData.wpuser1 || ''}
                      onChange={(e) => setEditFormData({...editFormData, wpuser1: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="admin"
                    />
                  </div>

                  {/* WP Password */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WordPress Password
                    </label>
                    <input
                      type="password"
                      value={editFormData.wppass1 || ''}
                      onChange={(e) => setEditFormData({...editFormData, wppass1: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>

                  {/* Plugin Toggles */}
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.wp_plugin_installed1 || false}
                        onChange={(e) => setEditFormData({...editFormData, wp_plugin_installed1: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Plugin Installed</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.wp_plugin_connected2 || false}
                        onChange={(e) => setEditFormData({...editFormData, wp_plugin_connected2: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Plugin Connected</span>
                    </label>
                  </div>
                </div>

                {/* API Keys */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">API & Access</h4>
                  
                  {/* Ruplin API Key */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ruplin API Key
                    </label>
                    <input
                      type="text"
                      value={editFormData.ruplin_apikey || ''}
                      onChange={(e) => setEditFormData({...editFormData, ruplin_apikey: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="API key..."
                    />
                  </div>

                  {/* WP REST App Pass */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WordPress REST App Password
                    </label>
                    <input
                      type="text"
                      value={editFormData.wp_rest_app_pass || ''}
                      onChange={(e) => setEditFormData({...editFormData, wp_rest_app_pass: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="App password..."
                    />
                  </div>

                  {/* Starred */}
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.is_starred1 === 'yes'}
                        onChange={(e) => setEditFormData({...editFormData, is_starred1: e.target.checked ? 'yes' : null})}
                        className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Starred</span>
                    </label>
                  </div>
                </div>

                {/* Domain Registrar Info */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Domain Registrar</h4>
                  
                  {editFormData.registrar_company_name ? (
                    <div className="bg-white p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {editFormData.registrar_company_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {editFormData.registrar_username}
                          </div>
                          {editFormData.registrar_portal_url && (
                            <div className="text-xs text-blue-600">
                              Portal: {editFormData.registrar_portal_url}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setRegistrarPopupOpen(editFormData.id);
                            fetchHostAccountsForPopup();
                          }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">No registrar set</span>
                        <button
                          onClick={() => {
                            setRegistrarPopupOpen(editFormData.id);
                            fetchHostAccountsForPopup();
                          }}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Set Registrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 space-x-3">
            <button
              onClick={() => {
                setEditPopupOpen(null);
                setEditFormData(null);
              }}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveChanges()}
              disabled={isUpdating}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Copy Success Overlay */}
    {showCopyOverlay && (
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div 
          className="bg-white rounded-md shadow-lg flex items-center transition-opacity duration-500"
          style={{
            minWidth: '80px',
            height: '27px',
            backgroundColor: '#ffffff',
            opacity: overlayOpacity,
            paddingLeft: '8px',
            paddingRight: '12px',
            paddingTop: '4px',
            paddingBottom: '4px'
          }}
        >
          {/* Blue checkmark circle */}
          <div className="mr-2 flex-shrink-0">
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none"
              className="text-blue-500"
            >
              <circle cx="12" cy="12" r="12" fill="#2c79ff"/>
              <path 
                d="M9 12l2 2 4-4" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {/* Copied text */}
          <span 
            className="text-blue-500 select-none whitespace-nowrap"
            style={{
              fontSize: '16px',
              color: '#2c79ff',
              fontWeight: 'normal'
            }}
          >
            Copied
          </span>
        </div>
      </div>
    )}
    </>
  );
}