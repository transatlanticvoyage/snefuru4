"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ContentDataLineageTableHeaderTierSystem1 from '@/app/components/ContentDataLineageTableHeaderTierSystem1';
import { useCustomColors } from '@/app/hooks/useCustomColors';

interface GconPiece {
  id: string;
  fk_users_id: string;
  meta_title: string | null;
  h1title: string | null;
  pgb_h1title: string | null;
  corpus1: string | null;
  corpus2: string | null;
  asn_sitespren_base: string | null;
  asn_nwpi_posts_id: string | null;
  asn_imgplanbatch_id: string | null;
  image_pack1: any;
  pub_status: string | null;
  date_time_pub_carry: string | null;
  pageslug: string | null;
  pageurl: string | null;
  pelementor_cached: any;
  pelementor_edits: any;
  is_starred1: string | null;
  is_starred2: string | null;
  g_post_type: string | null;
  g_post_status: string | null;
  g_post_id: string | null;
  created_at: string;
  updated_at: string;
}

interface GconPiecesTableProps {
  initialData: GconPiece[];
  userId: string;
  selectedRows?: Set<string>;
  onSelectionChange?: (selectedRows: Set<string>) => void;
}

type SortField = "meta_title" | "post_name" | "asn_sitespren_base" | "g_post_type" | "g_post_status" | "pub_status" | "date_time_pub_carry" | "pageslug" | "created_at" | "updated_at" | "is_starred1" | "is_starred2";
type SortOrder = "asc" | "desc";
type ColumnTemplateKey = 'option1' | 'option2' | 'option3' | 'option4' | 'option5';

const allColumns = [
  'select',
  'actions',
  'id',
  'is_starred1',
  'is_starred2',
  'g_post_id',
  'meta_title',
  'post_name',
  'g_post_type',
  'g_post_status',
  'pageurl',
  'asn_sitespren_base',
  'h1title',
  'pgb_h1title',
  'corpus1',
  'corpus2',
  'asn_nwpi_posts_id',
  'asn_imgplanbatch_id',
  'image_pack1',
  'pub_status',
  'date_time_pub_carry',
  'pageslug',
  'pelementor_cached',
  'pelementor_edits',
  'created_at',
  'updated_at'
];

// Mapping from gcon_pieces fields to their nwpi_content source fields
const sourceFieldMapping: Record<string, string> = {
  'meta_title': 'post_title',
  'post_name': 'post_name',
  'h1title': 'post_title', 
  'pgb_h1title': 'post_title',
  'corpus1': 'post_content',
  'corpus2': 'post_excerpt',
  'asn_sitespren_base': 'fk_sitespren_base',
  'asn_nwpi_posts_id': 'post_id', // computed field
  'pageslug': 'post_name',
  'pageurl': 'post_name', // computed field
  'pelementor_cached': 'a_elementor_substance',
  'pub_status': 'post_date', // computed field  
  'date_time_pub_carry': 'post_date'
};

const columnTemplates: Record<ColumnTemplateKey, { name: string; range: string; columns: string[] }> = {
  'option1': {
    name: 'col temp all',
    range: 'columns 1-22',
    columns: allColumns
  },
  'option2': {
    name: 'col temp a',
    range: 'columns 1-7',
    columns: allColumns.slice(0, 7)
  },
  'option3': {
    name: 'col temp b',
    range: 'columns 8-15',
    columns: allColumns.slice(7, 15)
  },
  'option4': {
    name: 'col temp c',
    range: 'columns 16-22',
    columns: allColumns.slice(15, 22)
  },
  'option5': {
    name: 'col temp d',
    range: 'empty',
    columns: []
  }
};

export default function GconPiecesTable({ initialData, userId, selectedRows: externalSelectedRows, onSelectionChange }: GconPiecesTableProps) {
  const [data, setData] = useState<GconPiece[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [secondarySortField, setSecondarySortField] = useState<SortField | null>(null);
  const [secondarySortOrder, setSecondarySortOrder] = useState<SortOrder>("asc");
  const [filterSite, setFilterSite] = useState("");
  const [filterPage, setFilterPage] = useState("");
  const [filterPostStatus, setFilterPostStatus] = useState("");
  const [selectedColumnTemplate, setSelectedColumnTemplate] = useState<ColumnTemplateKey>('option1');
  const [stickyColumnCount, setStickyColumnCount] = useState<number>(0);
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set());
  const [updatingStars, setUpdatingStars] = useState<Set<string>>(new Set());
  const [nsFullData, setNsFullData] = useState<string>('');
  
  const router = useRouter();
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  // Use external selection state if provided, otherwise use internal state
  const selectedRows = externalSelectedRows || internalSelectedRows;
  const setSelectedRows = onSelectionChange || setInternalSelectedRows;

  // Fetch custom colors for native tier
  const { colors } = useCustomColors(['nativetier_gconjar_bgcolor1']);

  // Load state from URL params and localStorage on mount with site-specific persistence
  useEffect(() => {
    // Extract URL parameters
    const urlColTemp = searchParams?.get('coltemp');
    const urlStickyCol = searchParams?.get('stickycol');
    const urlSiteBase = searchParams?.get('sitebase');
    const urlPostStatus = searchParams?.get('g_post_status');
    const urlSortField = searchParams?.get('sortField');
    const urlSortOrder = searchParams?.get('sortOrder');
    const urlSecondarySortField = searchParams?.get('secondarySort');
    const urlSecondarySortOrder = searchParams?.get('secondaryOrder');
    const urlSearch = searchParams?.get('search');
    const urlFilterPage = searchParams?.get('filterPage');
    
    // Determine if we have a complete URL or just sitebase
    const hasOnlySiteBase = urlSiteBase && !urlColTemp && !urlPostStatus && !urlSortField && !urlSearch;
    
    if (hasOnlySiteBase) {
      // User visited with just sitebase - restore last state for this site
      const siteKey = decodeURIComponent(urlSiteBase);
      const savedState = localStorage.getItem(`gconjar1_state_${siteKey}`);
      
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          
          // Restore all state from localStorage for this site
          setFilterSite(siteKey);
          setSelectedColumnTemplate(state.selectedColumnTemplate || 'option1');
          setStickyColumnCount(state.stickyColumnCount || 0);
          setFilterPostStatus(state.filterPostStatus || '');
          setFilterPage(state.filterPage || '');
          setSortField(state.sortField || 'created_at');
          setSortOrder(state.sortOrder || 'desc');
          setSecondarySortField(state.secondarySortField || null);
          setSecondarySortOrder(state.secondarySortOrder || 'asc');
          setSearchTerm(state.searchTerm || '');
          
          return; // Exit early, the URL will be updated by the other useEffect
        } catch (e) {
          console.warn('Failed to parse saved state for site:', siteKey);
        }
      }
      
      // No saved state for this site, just set the site filter
      setFilterSite(siteKey);
      return;
    }
    
    // Full URL with parameters - load from URL (priority over localStorage)
    if (urlSiteBase) {
      setFilterSite(decodeURIComponent(urlSiteBase));
    }
    
    if (urlColTemp && urlColTemp in columnTemplates) {
      setSelectedColumnTemplate(urlColTemp as ColumnTemplateKey);
    }
    
    if (urlStickyCol) {
      const stickyCount = parseInt(urlStickyCol.replace('option', ''));
      if (!isNaN(stickyCount) && stickyCount >= 0 && stickyCount <= 5) {
        setStickyColumnCount(stickyCount);
      }
    }
    
    if (urlPostStatus && (urlPostStatus === 'publish' || urlPostStatus === 'draft')) {
      setFilterPostStatus(urlPostStatus);
    }
    
    if (urlSortField) {
      const validSortFields: SortField[] = ["meta_title", "asn_sitespren_base", "g_post_type", "g_post_status", "pub_status", "date_time_pub_carry", "pageslug", "created_at", "updated_at", "is_starred1", "is_starred2"];
      if (validSortFields.includes(urlSortField as SortField)) {
        setSortField(urlSortField as SortField);
      }
    }
    
    if (urlSortOrder && (urlSortOrder === 'asc' || urlSortOrder === 'desc')) {
      setSortOrder(urlSortOrder as SortOrder);
    }
    
    if (urlSecondarySortField) {
      const validSortFields: SortField[] = ["meta_title", "asn_sitespren_base", "g_post_type", "g_post_status", "pub_status", "date_time_pub_carry", "pageslug", "created_at", "updated_at", "is_starred1", "is_starred2"];
      if (validSortFields.includes(urlSecondarySortField as SortField)) {
        setSecondarySortField(urlSecondarySortField as SortField);
      }
    }
    
    if (urlSecondarySortOrder && (urlSecondarySortOrder === 'asc' || urlSecondarySortOrder === 'desc')) {
      setSecondarySortOrder(urlSecondarySortOrder as SortOrder);
    }
    
    if (urlSearch) {
      setSearchTerm(decodeURIComponent(urlSearch));
    }
    
    if (urlFilterPage) {
      setFilterPage(decodeURIComponent(urlFilterPage));
    }
  }, [searchParams]);

  // Update URL and localStorage when selections change
  useEffect(() => {
    // Update URL - sitebase must come first
    const params = new URLSearchParams();
    
    // 1. sitebase comes first (most important for site-specific state)
    if (filterSite) {
      params.set('sitebase', encodeURIComponent(filterSite));
    }
    
    // 2. Column and display settings
    params.set('coltemp', selectedColumnTemplate);
    if (stickyColumnCount > 0) {
      params.set('stickycol', `option${stickyColumnCount}`);
    }
    
    // 3. Content filters
    if (filterPostStatus) {
      params.set('g_post_status', filterPostStatus);
    }
    if (filterPage) {
      params.set('filterPage', encodeURIComponent(filterPage));
    }
    
    // 4. Sorting
    if (sortField !== 'created_at' || sortOrder !== 'desc') {
      params.set('sortField', sortField);
      params.set('sortOrder', sortOrder);
    }
    if (secondarySortField) {
      params.set('secondarySort', secondarySortField);
      params.set('secondaryOrder', secondarySortOrder);
    }
    
    // 5. Search (last, most likely to change frequently)
    if (searchTerm) {
      params.set('search', encodeURIComponent(searchTerm));
    }
    // Use replace for real-time updates to avoid cluttering browser history
    // Browser back/forward will still work due to different filter combinations
    router.replace(`/gconjar1?${params.toString()}`, { scroll: false });
    
    // Update localStorage with site-specific keys
    const siteKey = filterSite || 'default';
    const stateToSave = {
      selectedColumnTemplate,
      stickyColumnCount,
      filterPostStatus,
      filterPage,
      sortField,
      sortOrder,
      secondarySortField,
      secondarySortOrder,
      searchTerm
    };
    localStorage.setItem(`gconjar1_state_${siteKey}`, JSON.stringify(stateToSave));
  }, [selectedColumnTemplate, stickyColumnCount, filterSite, filterPostStatus, filterPage, sortField, sortOrder, secondarySortField, secondarySortOrder, searchTerm, router]);

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

  // Get unique sites and pages for filter dropdowns
  const uniqueSites = useMemo(() => {
    const sites = data
      .map(item => item.asn_sitespren_base)
      .filter(Boolean) as string[];
    return [...new Set(sites)].sort();
  }, [data]);

  const uniquePages = useMemo(() => {
    const pages = data
      .map(item => item.asn_nwpi_posts_id)
      .filter(Boolean) as string[];
    return [...new Set(pages)].sort();
  }, [data]);

  // Filter and search logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        item.meta_title?.toLowerCase().includes(searchLower) ||
        item.h1title?.toLowerCase().includes(searchLower) ||
        item.pgb_h1title?.toLowerCase().includes(searchLower) ||
        item.corpus1?.toLowerCase().includes(searchLower) ||
        item.corpus2?.toLowerCase().includes(searchLower) ||
        item.pageslug?.toLowerCase().includes(searchLower) ||
        item.pageurl?.toLowerCase().includes(searchLower) ||
        item.pub_status?.toLowerCase().includes(searchLower);

      // Site filter
      const matchesSite = !filterSite || item.asn_sitespren_base === filterSite;

      // Page filter
      const matchesPage = !filterPage || item.asn_nwpi_posts_id === filterPage;

      // Post status filter
      const matchesPostStatus = !filterPostStatus || item.g_post_status === filterPostStatus;

      return matchesSearch && matchesSite && matchesPage && matchesPostStatus;
    });
  }, [data, searchTerm, filterSite, filterPage, filterPostStatus]);

  // Sort logic
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      // Helper function to process field values for comparison
      const processValue = (item: any, field: SortField): string | number => {
        let val = item[field] || "";
        if (field === "created_at" || field === "updated_at") {
          return new Date(val).getTime();
        } else {
          return val.toString().toLowerCase();
        }
      };

      // Primary sort comparison
      let aVal = processValue(a, sortField);
      let bVal = processValue(b, sortField);

      let primaryResult = 0;
      if (sortOrder === "asc") {
        primaryResult = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        primaryResult = aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }

      // If primary values are equal and we have a secondary sort field, use it for tie-breaking
      if (primaryResult === 0 && secondarySortField) {
        let aSecondaryVal = processValue(a, secondarySortField);
        let bSecondaryVal = processValue(b, secondarySortField);

        if (secondarySortOrder === "asc") {
          return aSecondaryVal > bSecondaryVal ? 1 : aSecondaryVal < bSecondaryVal ? -1 : 0;
        } else {
          return aSecondaryVal < bSecondaryVal ? 1 : aSecondaryVal > bSecondaryVal ? -1 : 0;
        }
      }

      return primaryResult;
    });

    return sorted;
  }, [filteredData, sortField, sortOrder, secondarySortField, secondarySortOrder]);

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
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Reset to first page when filters change
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleClearAllFiltersExceptSite = () => {
    // Reset all filters to defaults while keeping the site filter
    setSearchTerm("");
    setFilterPostStatus("");
    setFilterPage("");
    setSortField("created_at");
    setSortOrder("desc");
    setSecondarySortField(null);
    setSecondarySortOrder("asc");
    setSelectedColumnTemplate('option1');
    setStickyColumnCount(0);
    setCurrentPage(1);
    // filterSite is preserved
  };

  const handleFilterSite = (site: string) => {
    setFilterSite(site);
    setCurrentPage(1);
  };

  const handleFilterPage = (page: string) => {
    setFilterPage(page);
    setCurrentPage(1);
  };

  const handleFilterPostStatus = (status: string) => {
    setFilterPostStatus(status);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string | null, maxLength: number = 50) => {
    if (!text) return "-";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
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
      const allRowIds = new Set(paginatedData.map(item => item.id));
      setSelectedRows(allRowIds);
    }
  };

  // Handle star click
  const handleStarClick = async (itemId: string, starField: 'is_starred1' | 'is_starred2') => {
    const updateKey = `${itemId}_${starField}`;
    setUpdatingStars(prev => new Set([...prev, updateKey]));

    try {
      const currentItem = data.find(item => item.id === itemId);
      const newValue = currentItem?.[starField] === 'yes' ? null : 'yes';

      // Update database
      const { error } = await supabase
        .from('gcon_pieces')
        .update({ [starField]: newValue })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating star:', error);
      } else {
        // Update local state
        setData(prevData => 
          prevData.map(item => 
            item.id === itemId 
              ? { ...item, [starField]: newValue }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating star:', error);
    } finally {
      setUpdatingStars(prev => {
        const newSet = new Set(prev);
        newSet.delete(updateKey);
        return newSet;
      });
    }
  };

  const visibleColumns = getVisibleColumns();

  // Status badge styling function (copied from nwjar1)
  const getStatusBadge = (status: string | null) => {
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

  return (
    <div className="space-y-4">
      {/* Column Template System */}
      <div className="flex items-center space-x-4">
        {/* SQL View Info */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3" style={{maxWidth: '130px', maxHeight: '75px'}}>
          <div className="text-xs text-gray-600">
            <div className="font-semibold mb-1">SQL View Info</div>
            <div className="text-gray-700">view name: gcon_pieces</div>
            <div className="text-gray-700"># columns: {allColumns.length}</div>
          </div>
        </div>

        {/* Column Templates */}
        <div className="flex flex-col space-y-2">
          <div className="text-sm font-bold text-gray-700">Column Templates (Show/Hide)</div>
          <div className="flex space-x-2" style={{maxWidth: '600px', height: '75px'}}>
            {Object.entries(columnTemplates).map(([key, template]) => (
              <button
                key={key}
                onClick={() => setSelectedColumnTemplate(key as ColumnTemplateKey)}
                className={`flex flex-col justify-center items-center text-xs leading-tight border rounded-lg transition-colors ${
                  selectedColumnTemplate === key
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                style={{width: '120px', height: '100%'}}
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
            {[0, 1, 2, 3, 4, 5].map((count) => (
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
        <div className="flex flex-wrap items-start" style={{ gap: '50px', paddingTop: '24px' }}>
          <div>
            <div className="flex">
              <input
                type="text"
                placeholder="Search titles and content..."
                className="px-4 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ width: '200px' }}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <button
                onClick={handleClearSearch}
                className="px-2 py-2 bg-yellow-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-yellow-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs font-bold"
                style={{ 
                  minWidth: '40px',
                  height: '42px', // Same as input height (py-2 + border)
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Clear search"
              >
                CL
              </button>
            </div>
            
            {/* Clear All Filters Button - directly below search box */}
            <button
              onClick={handleClearAllFiltersExceptSite}
              className="px-3 py-2 border border-gray-300 rounded-md hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              style={{ 
                backgroundColor: '#f5deb3', // beige with hint of orange
                color: '#2d2d2d', // dark gray, almost black
                fontSize: '10px',
                lineHeight: '1.2',
                marginTop: '12px',
                cursor: 'pointer'
              }}
              title="Reset all filters and parameters except site selection"
            >
              clear browser url<br />parameters except sitebase
            </button>
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
              value={filterPage}
              onChange={(e) => handleFilterPage(e.target.value)}
            >
              <option value="">All Pages</option>
              {uniquePages.map(page => (
                <option key={page} value={page}>{page}</option>
              ))}
            </select>
          </div>
          
          {/* Secondary Sort Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Sort
            </label>
            <div className="flex gap-2">
              <select
                value={secondarySortField || ""}
                onChange={(e) => setSecondarySortField(e.target.value ? e.target.value as SortField : null)}
                className={`px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                  secondarySortField 
                    ? 'bg-amber-800 text-white border-amber-800' 
                    : 'bg-white text-gray-900 border-gray-300'
                }`}
              >
                <option value="">Default (no secondary sort)</option>
                <option value="meta_title" disabled={sortField === "meta_title"} className={sortField === "meta_title" ? "text-gray-400" : ""}>meta_title</option>
                <option value="asn_sitespren_base" disabled={sortField === "asn_sitespren_base"} className={sortField === "asn_sitespren_base" ? "text-gray-400" : ""}>asn_sitespren_base</option>
                <option value="g_post_type" disabled={sortField === "g_post_type"} className={sortField === "g_post_type" ? "text-gray-400" : ""}>g_post_type</option>
                <option value="g_post_status" disabled={sortField === "g_post_status"} className={sortField === "g_post_status" ? "text-gray-400" : ""}>g_post_status</option>
                <option value="pub_status" disabled={sortField === "pub_status"} className={sortField === "pub_status" ? "text-gray-400" : ""}>pub_status</option>
                <option value="date_time_pub_carry" disabled={sortField === "date_time_pub_carry"} className={sortField === "date_time_pub_carry" ? "text-gray-400" : ""}>date_time_pub_carry</option>
                <option value="pageslug" disabled={sortField === "pageslug"} className={sortField === "pageslug" ? "text-gray-400" : ""}>pageslug</option>
                <option value="created_at" disabled={sortField === "created_at"} className={sortField === "created_at" ? "text-gray-400" : ""}>created_at</option>
                <option value="updated_at" disabled={sortField === "updated_at"} className={sortField === "updated_at" ? "text-gray-400" : ""}>updated_at</option>
                <option value="is_starred1" disabled={sortField === "is_starred1"} className={sortField === "is_starred1" ? "text-gray-400" : ""}>is_starred1</option>
                <option value="is_starred2" disabled={sortField === "is_starred2"} className={sortField === "is_starred2" ? "text-gray-400" : ""}>is_starred2</option>
              </select>
              {secondarySortField && (
                <select
                  value={secondarySortOrder}
                  onChange={(e) => setSecondarySortOrder(e.target.value as SortOrder)}
                  className="px-3 py-2 border border-amber-800 bg-amber-800 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="asc">↑ Asc</option>
                  <option value="desc">↓ Desc</option>
                </select>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-700">g_post_status</span>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filterPostStatus}
              onChange={(e) => handleFilterPostStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="publish">Published</option>
              <option value="draft">Draft</option>
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
          <table className="w-full">
            <thead>
              {/* CDLTHTS - 4-tier header system */}
              <ContentDataLineageTableHeaderTierSystem1
                visibleColumns={visibleColumns}
                stickyColumnCount={stickyColumnCount}
                pageType="gconjar1"
              />
              
              {/* Native tier - Main gcon_pieces header row */}
              <tr style={{ backgroundColor: colors['nativetier_gconjar_bgcolor1'] || '#dbeafe' }}>
                {visibleColumns.map((col, index) => {
                  const isSticky = index < stickyColumnCount;
                  const isSeparator = index === stickyColumnCount - 1 && stickyColumnCount > 0;
                  const isSortable = ['meta_title', 'asn_sitespren_base', 'g_post_type', 'g_post_status', 'pub_status', 'date_time_pub_carry', 'pageslug', 'created_at', 'updated_at', 'is_starred1', 'is_starred2'].includes(col);
                  
                  return (
                    <th
                      key={`native-${col}`}
                      className={`kz_gconjar1_table_cell text-left text-xs text-gray-700 lowercase tracking-wider ${
                        col === 'select' ? 'px-[6px] py-2' : 'px-6 py-2'
                      } ${isSortable ? 'cursor-pointer hover:bg-blue-200' : ''} ${
                        isSticky ? 'sticky z-10' : ''
                      } ${isSeparator ? 'border-r-4 border-black' : ''}`}
                      style={{
                        backgroundColor: colors['nativetier_gconjar_bgcolor1'] || '#dbeafe',
                        ...(isSticky ? { left: `${index * 150}px` } : {}),
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
                      ) : col === 'actions' ? (
                        <div className="flex flex-col">
                          <div className="font-normal text-xs">nativetier</div>
                          <div className="font-bold">actions</div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="font-normal text-xs">gcon_pieces</div>
                          <div className="font-bold flex items-center gap-1">
                            {/* Primary sort indicator - red star with white "1" */}
                            {isSortable && sortField === col && (
                              <span className="relative inline-flex items-center justify-center text-red-600 leading-none" style={{ fontSize: '1.81em' }}>
                                ★
                                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold" style={{ fontSize: '10px' }}>
                                  1
                                </span>
                              </span>
                            )}
                            {/* Secondary sort indicator - maroon star with white "2" */}
                            {isSortable && secondarySortField === col && (
                              <span className="relative inline-flex items-center justify-center text-amber-800 leading-none" style={{ fontSize: '1.81em' }}>
                                ★
                                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold" style={{ fontSize: '10px' }}>
                                  2
                                </span>
                              </span>
                            )}
                            {col} {isSortable && sortField === col && (sortOrder === "asc" ? "↑" : "↓")}
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
                <tr key={item.id} className="hover:bg-gray-50">
                  {visibleColumns.map((col, index) => {
                    const isSticky = index < stickyColumnCount;
                    const isSeparator = index === stickyColumnCount - 1 && stickyColumnCount > 0;
                    
                    return (
                      <td
                        key={col}
                        className={`kz_gconjar1_table_cell text-sm text-gray-900 ${
                          isSticky ? 'sticky bg-white z-10' : ''
                        } ${
                          isSeparator ? 'border-r-4 border-black' : ''
                        } ${col === 'actions' || col === 'select' ? 'whitespace-nowrap' : ''}`}
                        style={isSticky ? { left: `${index * 150}px`, padding: '0' } : { padding: '0' }}
                        onClick={col === 'select' ? () => handleRowSelect(item.id) : undefined}
                      >
                        <div className="kz_rigid_div_inside_td_1">
                        {col === 'select' ? (
                          <div 
                            className="cursor-pointer flex items-center justify-center w-full h-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowSelect(item.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedRows.has(item.id)}
                              onChange={() => {}} // Handled by div click
                              className="w-[18px] h-[18px] cursor-pointer"
                              style={{ width: '18px', height: '18px' }}
                            />
                          </div>
                        ) : col === 'actions' ? (
                          <div className="w-80 space-y-1">
                            {/* First row - 5 buttons (mesagen, edable and valan first) */}
                            <div className="flex gap-1">
                              <Link
                                href={`/mesagen`}
                                className="inline-flex items-center px-2 py-1 border border-purple-300 text-xs font-medium rounded text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                              >
                                /mesagen
                              </Link>
                              <Link
                                href={`/edable/${item.id}`}
                                className="inline-flex items-center px-2 py-1 border border-purple-300 text-xs font-medium rounded text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                              >
                                /edable
                              </Link>
                              <Link
                                href={`/valan?id=${item.id}`}
                                className="inline-flex items-center px-2 py-1 border border-green-300 text-xs font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                              >
                                /valan
                              </Link>
                              <Link
                                href={`/torya?id=${item.id}`}
                                className="inline-flex items-center px-2 py-1 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                              >
                                /torya
                              </Link>
                              <Link
                                href={`/torlid1?id=${item.id}&mtab=talk1`}
                                className="inline-flex items-center px-2 py-1 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                              >
                                /torlid1
                              </Link>
                            </div>
                            {/* Second row - 5 buttons */}
                            <div className="flex gap-1">
                              <Link
                                href={`/pedbar?id=${item.id}`}
                                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                              >
                                /pedbar
                              </Link>
                              <Link
                                href={`/pedtor1?id=${item.id}`}
                                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                              >
                                /pedtor
                              </Link>
                              <Link
                                href={`/flatx1?id=${item.id}`}
                                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                              >
                                /flatx1
                              </Link>
                              <Link
                                href={`/slotx1?id=${item.id}`}
                                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                              >
                                /slotx1
                              </Link>
                              <Link
                                href={`/fanex1?id=${item.id}`}
                                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                              >
                                /fanex1
                              </Link>
                            </div>
                            {/* Third row - 1 button */}
                            <div className="flex gap-1">
                              <Link
                                href={`/karfi1?id=${item.id}`}
                                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                              >
                                /karfi1
                              </Link>
                            </div>
                          </div>
                        ) : col === 'created_at' || col === 'updated_at' || col === 'date_time_pub_carry' ? (
                          <span className="whitespace-nowrap text-gray-500">
                            {item[col] ? formatDate(item[col]) : '-'}
                          </span>
                        ) : col === 'id' ? (
                          <span className="whitespace-nowrap text-xs font-mono">
                            {truncateText(item[col], 8)}
                          </span>
                        ) : col === 'g_post_id' ? (
                          <span className="whitespace-nowrap text-xs font-mono text-gray-600">
                            {item.g_post_id || '-'}
                          </span>
                        ) : col === 'is_starred1' || col === 'is_starred2' ? (
                          <div 
                            className="flex justify-center items-center cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                            onClick={() => handleStarClick(item.id, col as 'is_starred1' | 'is_starred2')}
                          >
                            {updatingStars.has(`${item.id}_${col}`) ? (
                              <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg 
                                className={`h-5 w-5 transition-colors ${
                                  item[col] === 'yes' ? 'text-blue-900 fill-current' : 'text-gray-300 hover:text-gray-400'
                                }`}
                                fill={item[col] === 'yes' ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                          </div>
                        ) : col === 'meta_title' || col === 'h1title' || col === 'pgb_h1title' ? (
                          truncateText(item[col], 60)
                        ) : col === 'g_post_type' ? (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full whitespace-nowrap">
                            {item.g_post_type || 'unknown'}
                          </span>
                        ) : col === 'g_post_status' ? (
                          getStatusBadge(item.g_post_status)
                        ) : col === 'corpus1' ? (
                          (() => {
                            const text = item[col];
                            if (!text) return "-";
                            return text.length > 10 ? text.substring(0, 10) + "..." : text;
                          })()
                        ) : col === 'corpus2' ? (
                          truncateText(item[col], 100)
                        ) : col === 'asn_nwpi_posts_id' || col === 'asn_imgplanbatch_id' ? (
                          <span className="whitespace-nowrap">
                            {truncateText(item[col], 30)}
                          </span>
                        ) : col === 'pub_status' ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item[col] === 'published' ? 'bg-green-100 text-green-800' :
                            item[col] === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item[col] || 'draft'}
                          </span>
                        ) : col === 'pageslug' || col === 'pageurl' ? (
                          <span className="whitespace-nowrap">
                            {truncateText(item[col], 40)}
                          </span>
                        ) : col === 'image_pack1' || col === 'pelementor_cached' || col === 'pelementor_edits' ? (
                          <span className="text-xs text-gray-500">
                            {item[col] ? 'JSON data' : '-'}
                          </span>
                        ) : (
                          <span className="whitespace-nowrap">
                            {item[col as keyof GconPiece] || "-"}
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
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}