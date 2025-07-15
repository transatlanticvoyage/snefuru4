'use client';

// @xpage-metadata
// URL: /admin/xpagesmanager1
// Title: X Pages Manager - Snefuru
// Last Sync: 2024-01-10T10:30:00Z

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import xpageCache from '@/app/metadata/xpage-cache.json';
import { syncXPageMetadataAPI } from '@/app/utils/syncXPageMetadata';

interface XPage {
  xpage_id: number;
  current_state_of_meta_title_system: string | null;
  goal_for_meta_title_system: string | null;
  title1: string | null;
  main_url: string | null;
  meta_title: string | null;
  title2: string | null;
  desc1: string | null;
  caption: string | null;
  pagepath_url: string | null;
  pagepath_long: string | null;
  pagepath_short: string | null;
  position_marker: number | null;
  show_in_all_pages_nav_area1: boolean | null;
  broad_parent_container: string | null;
  has_mutation_observer: string | null;
  starred: boolean | null;
  flagged: boolean | null;
  penatgoned: boolean | null;
  circled: boolean | null;
  created_at: string;
  updated_at: string;
}

export default function XPagesManager1Page() {
  const XPAGE_ID = 102; // Moved inside component to fix Next.js build error
  
  const { user } = useAuth();
  const [xpages, setXpages] = useState<XPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(200);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{id: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [filterParentContainer, setFilterParentContainer] = useState<string>('');
  const [filterShowInNav, setFilterShowInNav] = useState<string>('');
  const [sortField, setSortField] = useState<keyof XPage>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [syncingField, setSyncingField] = useState<number | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ xpage_id: number; message: string; success: boolean } | null>(null);
  const [directSyncLoading, setDirectSyncLoading] = useState(false);
  const [directSyncMessage, setDirectSyncMessage] = useState<{ message: string; success: boolean } | null>(null);
  
  const supabase = createClientComponentClient();
  
  // Get static metadata from cache
  const staticMetadata = (xpageCache as any)[XPAGE_ID.toString()];

  // Define column order and properties
  const columns: Array<{ key: keyof XPage; type: string; width: string; group?: string; separator?: 'right' }> = [
    { key: 'xpage_id', type: 'integer', width: '80px' },
    { key: 'starred', type: 'boolean-icon', width: '30px', group: 'icons' },
    { key: 'flagged', type: 'boolean-icon', width: '30px', group: 'icons' },
    { key: 'penatgoned', type: 'boolean-icon', width: '30px', group: 'icons' },
    { key: 'circled', type: 'boolean-icon', width: '30px', group: 'icons' },
    { key: 'current_state_of_meta_title_system', type: 'text', width: '200px' },
    { key: 'goal_for_meta_title_system', type: 'text', width: '200px', separator: 'right' },
    { key: 'meta_title', type: 'text', width: '200px' },
    { key: 'main_url', type: 'text', width: '200px', separator: 'right' },
    { key: 'title1', type: 'text', width: '200px' },
    { key: 'title2', type: 'text', width: '200px' },
    { key: 'desc1', type: 'text', width: '200px' },
    { key: 'caption', type: 'text', width: '200px' },
    { key: 'pagepath_url', type: 'text', width: '200px' },
    { key: 'pagepath_long', type: 'text', width: '200px' },
    { key: 'pagepath_short', type: 'text', width: '200px' },
    { key: 'position_marker', type: 'integer', width: '120px' },
    { key: 'show_in_all_pages_nav_area1', type: 'boolean', width: '80px' },
    { key: 'broad_parent_container', type: 'text', width: '200px' },
    { key: 'has_mutation_observer', type: 'text', width: '150px' },
    { key: 'created_at', type: 'text', width: '200px' },
    { key: 'updated_at', type: 'text', width: '200px' }
  ];

  useEffect(() => {
    // Use static title from cache, fallback to hardcoded
    const staticTitle = staticMetadata?.title || 'X Pages Manager - Snefuru';
    document.title = staticTitle;
    fetchXPages();
  }, [staticMetadata?.title]);

  const fetchXPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('xpages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching xpages:', error);
        return;
      }

      setXpages(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewXPage = async () => {
    try {
      const { data, error } = await supabase
        .from('xpages')
        .insert({
          current_state_of_meta_title_system: null,
          goal_for_meta_title_system: null,
          title1: null,
          main_url: null,
          meta_title: null,
          title2: null,
          desc1: null,
          caption: null,
          pagepath_url: null,
          pagepath_long: null,
          pagepath_short: null,
          position_marker: null,
          show_in_all_pages_nav_area1: null,
          broad_parent_container: null,
          starred: false,
          flagged: false,
          penatgoned: false,
          circled: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new xpage:', error);
        return;
      }

      // Add the new record to the local state
      setXpages(prev => [data, ...prev]);
      
      // Reset to first page to show the new record
      setCurrentPage(1);
    } catch (error) {
      console.error('Error creating new xpage:', error);
    }
  };

  const updateField = async (id: number, field: keyof XPage, value: any) => {
    try {
      const { error } = await supabase
        .from('xpages')
        .update({ [field]: value })
        .eq('xpage_id', id);

      if (error) {
        console.error('Error updating field:', error);
        return;
      }

      // Update local state
      setXpages(prev => prev.map(item => 
        item.xpage_id === id ? { ...item, [field]: value } : item
      ));
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  const handleCellClick = (id: number, field: string, currentValue: any) => {
    if (field === 'xpage_id' || field === 'created_at' || field === 'updated_at') {
      return; // Don't allow editing these fields
    }
    
    // Handle boolean-icon fields with direct toggle
    const column = columns.find(col => col.key === field);
    if (column?.type === 'boolean-icon') {
      handleBooleanToggle(id, field as keyof XPage, currentValue as boolean | null);
      return;
    }
    
    setEditingCell({ id, field });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    let processedValue: any = editValue;

    // Process value based on field type
    const column = columns.find(col => col.key === field);
    if (column?.type === 'integer') {
      processedValue = editValue === '' ? null : parseInt(editValue);
      if (isNaN(processedValue)) {
        processedValue = null;
      }
    } else if (column?.type === 'boolean') {
      processedValue = editValue === 'true';
    } else if (editValue === '') {
      processedValue = null;
    }

    await updateField(id, field as keyof XPage, processedValue);
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleBooleanToggle = async (id: number, field: keyof XPage, currentValue: boolean | null) => {
    const newValue = currentValue === null ? true : !currentValue;
    await updateField(id, field, newValue);
  };

  // Sync button handler (borrowed from Bensa system)
  const handleSyncButtonClick = async (xpage_id: number) => {
    setSyncingField(xpage_id);
    setSyncMessage(null);
    
    try {
      const result = await syncXPageMetadataAPI();
      setSyncMessage({
        xpage_id,
        message: result.message,
        success: result.success
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSyncMessage(null);
      }, 3000);
    } catch (error) {
      setSyncMessage({
        xpage_id,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSyncMessage(null);
      }, 3000);
    } finally {
      setSyncingField(null);
    }
  };

  const PushXPagesMetaTitleDirectToPageComponent = async () => {
    if (selectedRows.size === 0) {
      setDirectSyncMessage({
        message: 'Please select at least one row from the table',
        success: false
      });
      setTimeout(() => setDirectSyncMessage(null), 5000);
      return;
    }

    setDirectSyncLoading(true);
    setDirectSyncMessage(null);

    try {
      // Get selected xpages data
      const selectedXPages = xpages.filter(xpage => selectedRows.has(xpage.xpage_id));
      
      // Map XPAGE_ID to file paths (testing with gconjar1 and sitejar4)
      const pageMapping = [
        { xpage_id: 15, filePath: '/app/(protected)/sitejar4/page.tsx' },
        { xpage_id: 16, filePath: '/app/(protected)/gconjar1/page.tsx' }
      ];

      const results = [];
      
      for (const xpage of selectedXPages) {
        const mapping = pageMapping.find(m => m.xpage_id === xpage.xpage_id);
        
        if (!mapping) {
          results.push(`XPAGE_ID ${xpage.xpage_id}: No file mapping found - skipped`);
          continue;
        }

        if (!xpage.meta_title) {
          results.push(`XPAGE_ID ${xpage.xpage_id}: No meta_title set - skipped`);
          continue;
        }

        // Call API to update the page component file
        const response = await fetch('/api/update-page-title', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filePath: mapping.filePath,
            newTitle: xpage.meta_title,
            xpageId: xpage.xpage_id
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          results.push(`XPAGE_ID ${xpage.xpage_id}: Updated successfully`);
        } else {
          results.push(`XPAGE_ID ${xpage.xpage_id}: ${result.error}`);
        }
      }

      setDirectSyncMessage({
        message: results.join(' | '),
        success: results.every(r => r.includes('Updated successfully'))
      });

    } catch (error) {
      console.error('Direct sync error:', error);
      setDirectSyncMessage({
        message: 'Error: Failed to update page components',
        success: false
      });
    } finally {
      setDirectSyncLoading(false);
      setTimeout(() => setDirectSyncMessage(null), 8000);
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = xpages.filter(item => {
      const matchesSearch = !searchTerm || 
        Object.values(item).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesParentContainer = !filterParentContainer || 
        item.broad_parent_container === filterParentContainer;
      
      const matchesShowInNav = !filterShowInNav || 
        (filterShowInNav === 'true' ? item.show_in_all_pages_nav_area1 === true :
         filterShowInNav === 'false' ? item.show_in_all_pages_nav_area1 === false :
         filterShowInNav === 'null' ? item.show_in_all_pages_nav_area1 === null : true);

      return matchesSearch && matchesParentContainer && matchesShowInNav;
    });

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === null) return sortOrder === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [xpages, searchTerm, filterParentContainer, filterShowInNav, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof XPage) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Icon rendering functions
  const renderIcon = (iconType: string, isActive: boolean | null) => {
    const baseStyle = {
      width: '20px',
      height: '20px',
      display: 'inline-block',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    };

    const activeStyle = {
      ...baseStyle,
      backgroundColor: '#000',
      border: '1px solid #000'
    };

    const inactiveStyle = {
      ...baseStyle,
      backgroundColor: 'transparent',
      border: '1px solid #666'
    };

    switch (iconType) {
      case 'starred':
        return (
          <div style={isActive ? activeStyle : inactiveStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isActive ? '#fff' : 'none'} stroke={isActive ? '#fff' : '#666'} strokeWidth="2">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </div>
        );
      case 'flagged':
        return (
          <div style={isActive ? activeStyle : inactiveStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isActive ? '#fff' : 'none'} stroke={isActive ? '#fff' : '#666'} strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </div>
        );
      case 'penatgoned':
        return (
          <div style={isActive ? activeStyle : inactiveStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isActive ? '#fff' : 'none'} stroke={isActive ? '#fff' : '#666'} strokeWidth="2">
              <polygon points="12,2 18.9,8.6 15.5,18.1 8.5,18.1 5.1,8.6" />
            </svg>
          </div>
        );
      case 'circled':
        return (
          <div style={isActive ? activeStyle : inactiveStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isActive ? '#fff' : 'none'} stroke={isActive ? '#fff' : '#666'} strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const renderCell = (item: XPage, column: typeof columns[0]) => {
    const value = item[column.key];
    const isEditing = editingCell?.id === item.xpage_id && editingCell?.field === column.key;
    const isReadOnly = column.key === 'xpage_id' || column.key === 'created_at' || column.key === 'updated_at';

    // Handle boolean-icon fields
    if (column.type === 'boolean-icon' && !isReadOnly) {
      return (
        <div 
          className="flex items-center justify-center p-0 m-0"
          onClick={() => handleBooleanToggle(item.xpage_id, column.key as keyof XPage, value as boolean | null)}
          style={{ padding: 0, margin: 0 }}
        >
          {renderIcon(column.key, value as boolean | null)}
        </div>
      );
    }

    if (column.type === 'boolean' && !isReadOnly) {
      return (
        <button
          onClick={() => handleBooleanToggle(item.xpage_id, column.key as keyof XPage, value as boolean | null)}
          className={`w-12 h-6 rounded-full transition-colors ${
            value === true ? 'bg-green-500' : 
            value === false ? 'bg-gray-300' : 'bg-yellow-300'
          }`}
        >
          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
            value === true ? 'translate-x-6' : 
            value === false ? 'translate-x-1' : 'translate-x-3'
          }`} />
        </button>
      );
    }

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleCellSave}
            className="text-green-600 hover:text-green-800 text-sm"
            title="Save"
          >
            ✓
          </button>
          <button
            onClick={handleCellCancel}
            className="text-red-600 hover:text-red-800 text-sm"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      );
    }

    // Special handling for meta_title column with sync button (borrowed from Bensa system)
    if (column.key === 'meta_title') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '10px', 
            fontWeight: 'bold', 
            color: '#666',
            whiteSpace: 'nowrap'
          }}>
            button <br></br>
            de bensa
          </span>
          <button
            onClick={() => handleSyncButtonClick(item.xpage_id)}
            disabled={syncingField === item.xpage_id}
            style={{
              padding: '4px 8px',
              backgroundColor: syncingField === item.xpage_id ? '#9ca3af' : '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: syncingField === item.xpage_id ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {syncingField === item.xpage_id ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>⟲</span>
                SYNCING...
              </>
            ) : (
              'SYNC'
            )}
          </button>
          <div
            onClick={() => !isReadOnly && handleCellClick(item.xpage_id, column.key, value)}
            className={`min-w-[30px] min-h-[1.25rem] px-1 py-0.5 rounded break-words ${
              !isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
            } ${isReadOnly ? 'text-gray-500' : ''}`}
            style={{ maxWidth: '200px', wordWrap: 'break-word', overflowWrap: 'break-word' }}
            title={isReadOnly ? value?.toString() || '' : `${value?.toString() || ''} (Click to edit)`}
          >
            {value?.toString() || ''}
          </div>
          {syncMessage && syncMessage.xpage_id === item.xpage_id && (
            <div style={{
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: syncMessage.success ? '#10b981' : '#ef4444',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              maxWidth: '150px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {syncMessage.message}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        onClick={() => !isReadOnly && handleCellClick(item.xpage_id, column.key, value)}
        className={`min-w-[30px] min-h-[1.25rem] px-1 py-0.5 rounded break-words ${
          !isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
        } ${isReadOnly ? 'text-gray-500' : ''}`}
        style={{ maxWidth: '200px', wordWrap: 'break-word', overflowWrap: 'break-word' }}
        title={isReadOnly ? value?.toString() || '' : `${value?.toString() || ''} (Click to edit)`}
      >
        {column.key === 'created_at' || column.key === 'updated_at' 
          ? new Date(value as string).toLocaleString()
          : value?.toString() || ''
        }
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">XPages Manager</h1>
            <p className="text-gray-600">Manage internal application pages</p>
          </div>
          <button
            onClick={createNewXPage}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
          >
            Create New XPage in DB
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search all fields..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent Container</label>
          <select
            value={filterParentContainer}
            onChange={(e) => {
              setFilterParentContainer(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All</option>
            <option value="admin">admin</option>
            <option value="navgroup1">navgroup1</option>
            <option value="navgroup91">navgroup91</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Show in Nav</label>
          <select
            value={filterShowInNav}
            onChange={(e) => {
              setFilterShowInNav(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All</option>
            <option value="true">True</option>
            <option value="false">False</option>
            <option value="null">Null</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Direct Sync Button */}
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">sync_button_direct_to_page_component</h3>
            <p className="text-sm text-yellow-700 mb-3">
              Select rows below and click to push meta_title directly to page component files. 
              <strong>Testing only on /gconjar1 and /sitejar4</strong>
            </p>
            {directSyncMessage && (
              <div className={`p-3 rounded-md text-sm ${
                directSyncMessage.success 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                {directSyncMessage.message}
              </div>
            )}
          </div>
          <button
            onClick={PushXPagesMetaTitleDirectToPageComponent}
            disabled={directSyncLoading || selectedRows.size === 0}
            className={`px-6 py-3 rounded-md font-semibold text-white transition-colors ${
              directSyncLoading || selectedRows.size === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {directSyncLoading ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⟲</span>
                Pushing...
              </span>
            ) : (
              `Push Direct (${selectedRows.size} selected)`
            )}
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} items
        {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="border-collapse border border-gray-200" style={{ minWidth: '1600px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left border border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(paginatedData.map(item => item.xpage_id)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                  />
                </th>
                {columns.map((column, index) => {
                  const isReadOnly = column.key === 'xpage_id' || column.key === 'created_at' || column.key === 'updated_at';
                  const isFirstInGroup = column.group === 'icons' && (index === 0 || columns[index - 1].group !== 'icons');
                  const isLastInGroup = column.group === 'icons' && (index === columns.length - 1 || columns[index + 1].group !== 'icons');
                  const isIconColumn = column.type === 'boolean-icon';
                  const hasRightSeparator = column.separator === 'right';
                  
                  return (
                    <th
                      key={column.key}
                      className={`text-left cursor-pointer hover:bg-gray-100 border border-gray-200 ${
                        isIconColumn ? 'p-0' : 'px-4 py-3'
                      } ${isFirstInGroup ? 'border-l-4 border-l-black' : ''} ${isLastInGroup ? 'border-r-4 border-r-black' : ''} ${hasRightSeparator ? 'border-r-4 border-r-black' : ''}`}
                      style={{ 
                        width: column.width,
                        minWidth: column.width,
                        maxWidth: column.width,
                        ...(isIconColumn && { 
                          verticalAlign: 'top',
                          height: 'auto'
                        })
                      }}
                      onClick={() => handleSort(column.key)}
                    >
                      <div className={`${isIconColumn ? 'p-0' : 'flex items-center space-x-1'}`}>
                        <span 
                          className={`font-bold text-xs lowercase ${isReadOnly ? 'text-gray-500' : 'text-gray-900'}`}
                          style={isIconColumn ? {
                            wordBreak: 'break-all',
                            lineHeight: '1.1',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxHeight: '3.3em'
                          } : {}}
                        >
                          {column.key}
                        </span>
                        {!isReadOnly && column.type !== 'boolean-icon' && (
                          <span className="text-blue-500 text-xs" title="Click cells to edit">
                            ✎
                          </span>
                        )}
                        {sortField === column.key && (
                          <span className="text-gray-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.xpage_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border border-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.xpage_id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRows);
                        if (e.target.checked) {
                          newSelected.add(item.xpage_id);
                        } else {
                          newSelected.delete(item.xpage_id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    />
                  </td>
                  {columns.map((column, index) => {
                    const isFirstInGroup = column.group === 'icons' && (index === 0 || columns[index - 1].group !== 'icons');
                    const isLastInGroup = column.group === 'icons' && (index === columns.length - 1 || columns[index + 1].group !== 'icons');
                    const isIconColumn = column.type === 'boolean-icon';
                    const hasRightSeparator = column.separator === 'right';
                    
                    return (
                      <td
                        key={column.key}
                        className={`text-sm border border-gray-200 ${
                          isIconColumn ? 'p-0' : 'px-4 py-3'
                        } ${isFirstInGroup ? 'border-l-4 border-l-black' : ''} ${isLastInGroup ? 'border-r-4 border-r-black' : ''} ${hasRightSeparator ? 'border-r-4 border-r-black' : ''}`}
                        style={{ width: column.width }}
                      >
                        {renderCell(item, column)}
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
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 border rounded-md ${
                    currentPage === pageNum 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}