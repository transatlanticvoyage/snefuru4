'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ContentDataLineageTableHeaderTierSystem1 from '@/app/components/ContentDataLineageTableHeaderTierSystem1';
import { useCustomColors } from '@/app/hooks/useCustomColors';

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
  selectedRows?: Set<string>;
  onSelectionChange?: (selectedRows: Set<string>) => void;
}

type SortField = 'post_title' | 'fk_sitespren_base' | 'post_type' | 'post_status' | 'i_sync_completed_at' | 'created_at';
type SortOrder = 'asc' | 'desc';
type ColumnTemplateKey = 'option1' | 'option2' | 'option3' | 'option4' | 'option5' | 'option6' | 'option7';

const allColumns = [
  'select',
  'actions',
  'post_id',
  'post_title',
  'fk_sitespren_base',
  'post_name',
  'post_type',
  'post_status',
  'i_sync_method',
  'i_sync_completed_at',
  'a_elementor_substance',
  'internal_post_id',
  'fk_users_id',
  'fk_sitespren_id',
  'post_author',
  'post_date',
  'post_date_gmt',
  'post_modified',
  'post_content',
  'post_content_filtered',
  'post_excerpt',
  'post_password',
  'comment_status',
  'ping_status',
  'to_ping',
  'pinged',
  'guid',
  'post_parent',
  'menu_order',
  'post_mime_type',
  'comment_count',
  'i_raw_metadata',
  'i_sync_version',
  'i_sync_status',
  'i_sync_started_at',
  'i_sync_attempt_count',
  'i_sync_error_message',
  'created_at',
  'updated_at'
];

const columnTemplates: Record<ColumnTemplateKey, { name: string; range: string; columns: string[] }> = {
  'option1': {
    name: 'col temp all',
    range: 'columns 1-~',
    columns: allColumns
  },
  'option2': {
    name: 'col temp a',
    range: 'columns 1-7',
    columns: allColumns.slice(0, 7)
  },
  'option3': {
    name: 'col temp b',
    range: 'columns 8-14',
    columns: allColumns.slice(7, 14)
  },
  'option4': {
    name: 'col temp c',
    range: 'columns 15-21',
    columns: allColumns.slice(14, 21)
  },
  'option5': {
    name: 'col temp d',
    range: 'columns 22-28',
    columns: allColumns.slice(21, 28)
  },
  'option6': {
    name: 'col temp e',
    range: 'columns 29-35',
    columns: allColumns.slice(28, 35)
  },
  'option7': {
    name: 'col temp f',
    range: 'columns 36-42',
    columns: allColumns.slice(35, 42)
  }
};

export default function NwpiContentTable({ data, userId, selectedRows: externalSelectedRows, onSelectionChange }: NwpiContentTableProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('i_sync_completed_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterSite, setFilterSite] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSyncMethod, setFilterSyncMethod] = useState('');
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set());
  const [selectedColumnTemplate, setSelectedColumnTemplate] = useState<ColumnTemplateKey>('option1');
  const [stickyColumnCount, setStickyColumnCount] = useState<number>(0);
  const [nsFullData, setNsFullData] = useState<string>('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  // Use external selection state if provided, otherwise use internal state
  const selectedRows = externalSelectedRows || internalSelectedRows;
  const setSelectedRows = onSelectionChange || setInternalSelectedRows;

  // Fetch custom colors for native tier
  const { colors } = useCustomColors(['nativetier_nwjar_bgcolor1']);

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

  // Load state from URL params and localStorage on mount
  useEffect(() => {
    // Check URL params first
    const urlColTemp = searchParams?.get('coltemp');
    const urlStickyCol = searchParams?.get('stickycol');
    const urlSiteBase = searchParams?.get('sitebase');
    
    if (urlColTemp && urlColTemp in columnTemplates) {
      setSelectedColumnTemplate(urlColTemp as ColumnTemplateKey);
    } else {
      // Fall back to localStorage
      const savedColTemp = localStorage.getItem('nwjar1_columnTemplate');
      if (savedColTemp && savedColTemp in columnTemplates) {
        setSelectedColumnTemplate(savedColTemp as ColumnTemplateKey);
      }
    }
    
    if (urlStickyCol) {
      const stickyCount = parseInt(urlStickyCol.replace('option', ''));
      if (!isNaN(stickyCount) && stickyCount >= 0 && stickyCount <= 7) {
        setStickyColumnCount(stickyCount);
      }
    } else {
      // Fall back to localStorage
      const savedStickyCount = localStorage.getItem('nwjar1_stickyColumns');
      if (savedStickyCount) {
        const count = parseInt(savedStickyCount);
        if (!isNaN(count) && count >= 0 && count <= 7) {
          setStickyColumnCount(count);
        }
      }
    }
    
    // Set site filter from URL parameter
    if (urlSiteBase) {
      setFilterSite(urlSiteBase);
    }
  }, [searchParams]);

  // Update URL and localStorage when selections change
  useEffect(() => {
    // Update URL
    const params = new URLSearchParams();
    params.set('coltemp', selectedColumnTemplate);
    if (stickyColumnCount > 0) {
      params.set('stickycol', `option${stickyColumnCount}`);
    }
    if (filterSite) {
      params.set('sitebase', filterSite);
    }
    router.replace(`/nwjar1?${params.toString()}`, { scroll: false });
    
    // Update localStorage
    localStorage.setItem('nwjar1_columnTemplate', selectedColumnTemplate);
    localStorage.setItem('nwjar1_stickyColumns', stickyColumnCount.toString());
  }, [selectedColumnTemplate, stickyColumnCount, filterSite, router]);

  // Fetch ns_full data from sitespren table
  useEffect(() => {
    const fetchNsFullData = async () => {
      try {
        // Get the internal user ID first
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', userId)
          .single();

        if (userError || !userData) {
          console.error('Error fetching user:', userError);
          return;
        }

        // Fetch ns_full data from sitespren table for this user
        const { data: sitesprenData, error: sitesprenError } = await supabase
          .from('sitespren')
          .select('ns_full')
          .eq('fk_users_id', userData.id)
          .limit(1)
          .single();

        if (sitesprenError) {
          console.error('Error fetching ns_full:', sitesprenError);
          setNsFullData('No data found');
        } else {
          setNsFullData(sitesprenData?.ns_full || 'No data found');
        }
      } catch (error) {
        console.error('Error in fetchNsFullData:', error);
        setNsFullData('Error loading data');
      }
    };

    if (userId) {
      fetchNsFullData();
    }
  }, [userId, supabase]);

  // Get visible columns based on template and sticky columns
  const getVisibleColumns = () => {
    const templateColumns = columnTemplates[selectedColumnTemplate].columns;
    const stickyColumns = allColumns.slice(0, stickyColumnCount);
    const nonStickyTemplateColumns = templateColumns.filter(col => !stickyColumns.includes(col));
    return [...stickyColumns, ...nonStickyTemplateColumns];
  };

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

  // Reset to first page when filters change
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleFilterSite = (site: string) => {
    setFilterSite(site);
    setCurrentPage(1);
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

  const visibleColumns = getVisibleColumns();

  return (
    <div className="space-y-4">
      {/* Column Template System */}
      <div className="flex items-center space-x-4">
        {/* SQL View Info */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-2" style={{maxWidth: '130px', minHeight: '85px'}}>
          <div className="text-xs text-gray-600">
            <div className="font-semibold mb-1">SQL View Info</div>
            <div className="text-gray-700">view name: nwpi_content</div>
            <div className="text-gray-700"># columns: {allColumns.length}</div>
          </div>
        </div>

        {/* Column Templates */}
        <div className="flex flex-col space-y-2">
          <div className="text-sm font-bold text-gray-700">Column Templates (Show/Hide)</div>
          <div className="flex space-x-1" style={{maxWidth: '850px', height: '75px'}}>
            {Object.entries(columnTemplates).map(([key, template]) => (
              <button
                key={key}
                onClick={() => setSelectedColumnTemplate(key as ColumnTemplateKey)}
                className={`flex flex-col justify-center items-center text-xs leading-tight border rounded-lg transition-colors ${
                  selectedColumnTemplate === key
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                style={{width: '115px', height: '100%'}}
              >
                <div className="font-semibold">{key.toUpperCase()}</div>
                <div>{template.name}</div>
                <div>{template.range}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sticky Columns */}
        <div className="flex flex-col space-y-2">
          <div className="text-sm font-bold text-gray-700">Sticky Columns At Left Side Of UI Grid Table</div>
          <div className="flex space-x-1">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((count) => (
              <button
                key={count}
                onClick={() => setStickyColumnCount(count)}
                className={`flex flex-col justify-center items-center text-xs leading-tight border rounded transition-colors ${
                  stickyColumnCount === count
                    ? 'bg-green-700 text-white border-green-700'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
                style={{width: '60px', height: '55px'}}
              >
                <div className="font-semibold">OPTION {count === 0 ? 'OFF' : count}</div>
                <div className="text-center whitespace-pre-line">
                  {count === 0 ? 'none' : `${count} left-most\ncolumn${count > 1 ? 's' : ''}`}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow relative" style={{ border: '1px solid black' }}>
        {/* Label in top left corner */}
        <div 
          className="absolute top-2 left-2 font-bold text-black"
          style={{ fontSize: '14px' }}
        >
          uielement308
        </div>
        <div className="flex flex-wrap items-start" style={{ gap: '50px' }}>
          <div>
            <input
              type="text"
              placeholder="Search titles and content..."
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ width: '200px' }}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          {/* Site Widget Container */}
          <div 
            className="relative bg-white border border-gray-300 rounded p-3"
            style={{ border: '1px solid black' }}
          >
            {/* Label in top left corner */}
            <div 
              className="absolute top-2 left-2 font-bold text-black"
              style={{ fontSize: '14px' }}
            >
              uiel_sitewidget1
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <select
                className={`px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  filterSite 
                    ? 'bg-blue-900 text-white border-blue-900 font-bold' 
                    : 'bg-white text-gray-900 border-gray-300'
                }`}
                style={{ width: '350px' }}
                value={filterSite}
                onChange={(e) => handleFilterSite(e.target.value)}
              >
                <option value="">All Sites</option>
                {uniqueSites.map(site => (
                  <option key={site} value={site}>{site}</option>
                ))}
              </select>
              {/* Container for absolutely positioned elements */}
              <div 
                className="relative"
                style={{ 
                  height: '33px', // 3px gap + 14px squares + 16px NS row
                  width: '384px' // 350px data box + 34px NS label
                }}
              >
                {/* Colored squares */}
                <div 
                  className="absolute bg-black"
                  style={{
                    width: '14px',
                    height: '14px',
                    top: '3px',
                    left: '0px'
                  }}
                />
                <div 
                  className="absolute bg-red-500"
                  style={{
                    width: '14px',
                    height: '14px',
                    top: '3px',
                    left: '17px'
                  }}
                />
                <div 
                  className="absolute bg-blue-500"
                  style={{
                    width: '14px',
                    height: '14px',
                    top: '3px',
                    left: '34px'
                  }}
                />
                {/* NS label and data area */}
                <div 
                  className="absolute bg-gray-200 border border-gray-300 flex items-center justify-center"
                  style={{
                    width: '34px',
                    height: '16px',
                    top: '17px', // 3px + 14px = 17px from top of container
                    left: '0px',
                    fontSize: '13px'
                  }}
                >
                  NS
                </div>
                <div 
                  className="absolute bg-white border border-gray-300 flex items-center px-2"
                  style={{
                    width: '350px',
                    height: '16px',
                    top: '17px', // Same level as NS label
                    left: '34px', // Immediately adjoining to the right
                    fontSize: '12px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {nsFullData}
                </div>
              </div>
            </div>
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
              {/* 4-Tier Header System */}
              <ContentDataLineageTableHeaderTierSystem1
                visibleColumns={visibleColumns}
                stickyColumnCount={stickyColumnCount}
                tier2Content={visibleColumns} // nwpi_content fields
                pageType="nwjar1"
              />
              
              {/* Native Tier (blue header row) */}
              <tr style={{ backgroundColor: colors['nativetier_nwjar_bgcolor1'] || '#dbeafe' }}>
                {visibleColumns.map((col, index) => {
                  const isSticky = index < stickyColumnCount;
                  const isSeparator = index === stickyColumnCount - 1 && stickyColumnCount > 0;
                  const isSortable = ['post_title', 'fk_sitespren_base', 'post_type', 'post_status', 'i_sync_completed_at', 'created_at'].includes(col);
                  
                  let hoverColor = '';
                  
                  // Define all nwpi_content fields
                  const nwpiContentFields = [
                    'internal_post_id', 'fk_users_id', 'fk_sitespren_id', 'fk_sitespren_base',
                    'post_id', 'post_author', 'post_date', 'post_date_gmt', 'post_modified',
                    'post_content', 'post_content_filtered', 'post_title', 'post_excerpt',
                    'post_status', 'post_type', 'post_name', 'post_password', 'comment_status',
                    'ping_status', 'to_ping', 'pinged', 'guid', 'post_parent', 'menu_order',
                    'post_mime_type', 'comment_count', 'i_raw_metadata', 'i_sync_method',
                    'i_sync_version', 'i_sync_status', 'i_sync_started_at', 'i_sync_completed_at',
                    'i_sync_attempt_count', 'i_sync_error_message', 'a_elementor_substance',
                    'created_at', 'updated_at'
                  ];
                  
                  if (nwpiContentFields.includes(col)) {
                    hoverColor = 'hover:bg-yellow-100';
                  } else if (col === 'select' || col === 'actions') {
                    hoverColor = 'hover:bg-gray-200';
                  } else {
                    hoverColor = 'hover:bg-blue-200';
                  }
                  
                  return (
                    <th
                      key={col}
                      className={`kz_nwjar1_table_cell text-left text-xs font-bold text-gray-700 lowercase tracking-wider ${
                        col === 'select' ? 'px-[6px] py-[6px]' : 'px-4 py-3'
                      } ${isSortable ? `cursor-pointer ${hoverColor}` : ''} ${
                        isSticky ? `sticky z-10` : ''
                      } ${isSeparator ? 'border-r-4 border-black' : ''}`}
                      style={{
                        backgroundColor: colors['nativetier_nwjar_bgcolor1'] || '#dbeafe',
                        ...(isSticky ? { left: `${index * 150}px` } : {})
                      }}
                      onClick={isSortable ? () => handleSort(col as SortField) : undefined}
                    >
                      {col === 'select' ? (
                        <div 
                          className="cursor-pointer flex items-center justify-center w-full h-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAll();
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                            onChange={() => {}} // Handled by div click
                            className="w-[18px] h-[18px] cursor-pointer"
                            style={{ width: '18px', height: '18px' }}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="text-gray-500 font-normal text-xs">
                            {col === 'actions' ? 'nativetier' : (nwpiContentFields.includes(col) ? 'nwpi_content' : '')}
                          </div>
                          <div className="font-bold">
                            {col} {isSortable && sortField === col && (sortOrder === 'asc' ? '↑' : '↓')}
                          </div>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.internal_post_id} className="hover:bg-gray-50">
                  {visibleColumns.map((col, index) => {
                    const isSticky = index < stickyColumnCount;
                    const isSeparator = index === stickyColumnCount - 1 && stickyColumnCount > 0;
                    
                    return (
                      <td
                        key={col}
                        className={`kz_nwjar1_table_cell text-sm text-gray-900 ${
                          isSticky ? 'sticky bg-white z-10' : ''
                        } ${
                          isSeparator ? 'border-r-4 border-black' : ''
                        } ${col === 'actions' || col === 'select' ? 'whitespace-nowrap' : ''}`}
                        style={isSticky ? { left: `${index * 150}px`, padding: '0' } : { padding: '0' }}
                      >
                        <div 
                          className={`kz_rigid_div_inside_td_1 ${
                            col === 'select' ? 'px-[6px] py-[6px]' : 'px-4 py-3'
                          }`}
                          style={{ padding: '4px' }}
                        >
                        {col === 'select' ? (
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
                        ) : col === 'actions' ? (
                          <Link
                            href={`/nwivid?contentid=${encodeURIComponent(item.internal_post_id)}`}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Individual View
                          </Link>
                        ) : col === 'post_title' ? (
                          <div className="max-w-xs">
                            <div className="font-medium">{truncateText(item.post_title, 60)}</div>
                            {item.post_excerpt && (
                              <div className="text-xs text-gray-500 mt-1">
                                {truncateText(item.post_excerpt, 80)}
                              </div>
                            )}
                          </div>
                        ) : col === 'fk_sitespren_base' ? (
                          <span className="whitespace-nowrap text-gray-900 font-medium">
                            {item.fk_sitespren_base || '-'}
                          </span>
                        ) : col === 'post_type' ? (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full whitespace-nowrap">
                            {item.post_type || 'unknown'}
                          </span>
                        ) : col === 'post_status' ? (
                          getStatusBadge(item.post_status, item.i_sync_status)
                        ) : col === 'i_sync_method' ? (
                          getSyncMethodBadge(item.i_sync_method)
                        ) : col === 'i_sync_completed_at' ? (
                          <span className="whitespace-nowrap text-gray-500 text-xs">
                            {formatDate(item.i_sync_completed_at)}
                          </span>
                        ) : col === 'a_elementor_substance' ? (
                          <div className="text-center">
                            {item.a_elementor_substance ? (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                ✓ Elementor
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                                No Data
                              </span>
                            )}
                          </div>
                        ) : col === 'post_id' ? (
                          <span className="whitespace-nowrap text-gray-500 text-xs">
                            {item.post_id}
                          </span>
                        ) : col === 'created_at' || col === 'updated_at' ? (
                          <span className="whitespace-nowrap text-gray-500 text-xs">
                            {formatDate(item[col])}
                          </span>
                        ) : col === 'post_date' || col === 'post_date_gmt' || col === 'post_modified' || col === 'i_sync_started_at' ? (
                          <span className="whitespace-nowrap text-gray-500 text-xs">
                            {formatDate(item[col as keyof NwpiContent] as string)}
                          </span>
                        ) : (
                          <span className="whitespace-nowrap text-gray-500 text-xs">
                            {truncateText(String(item[col as keyof NwpiContent] || '-'), 30)}
                          </span>
                        )}
                        </div>
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