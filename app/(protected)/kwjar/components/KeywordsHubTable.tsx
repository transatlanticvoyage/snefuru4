'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface KeywordRecord {
  keyword_id: number;
  keyword_datum: string;
  search_volume: number | null;
  cpc: number | null;
  semrush_volume: number | null;
  rel_dfs_location_code: number | null;
  location_display_name: string | null;
  location_coordinate: string | null;
  language_code: string | null;
  language_name: string | null;
  competition: string | null;
  competition_index: number | null;
  low_top_of_page_bid: number | null;
  high_top_of_page_bid: number | null;
  api_fetched_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_updated_by: string | null;
  cached_cncglub_ids: string | null;
  rel_industry_id: number | null;
  cached_city_name: string | null;
  // SERP fetch tracking fields
  serp_results_count: number;
  serp_last_fetched_at: string | null;
  serp_fetch_status: 'none' | 'pending' | 'completed' | 'error';
  tags?: Array<{ tag_id: number; tag_name: string }>;
  // Joined industry data
  industries?: {
    industry_name: string | null;
  } | null;
  // Cache staleness tracking
  cache_status?: 'CURRENT' | 'STALE' | 'NO_CACHE';
  // Universal SERP zone cache data (method-1) - All domains with EMD flags
  serp_cache_m1?: {
    total_emd_count: number | null;
    zone_1_emd_count: number | null;
    zone_2_emd_count: number | null;
    zone_3_emd_count: number | null;
    zone_4_10_emd_count: number | null;
    zone_11_25_emd_count: number | null;
    zone_26_50_emd_count: number | null;
    zone_51_100_emd_count: number | null;
    zone_1_domains: { domains: Array<{domain: string; rank: number; url: string; is_emd_m1: boolean}> } | null;
    zone_2_domains: { domains: Array<{domain: string; rank: number; url: string; is_emd_m1: boolean}> } | null;
    zone_3_domains: { domains: Array<{domain: string; rank: number; url: string; is_emd_m1: boolean}> } | null;
    zone_4_10_domains: { domains: Array<{domain: string; rank: number; url: string; is_emd_m1: boolean}> } | null;
    zone_11_25_domains: { domains: Array<{domain: string; rank: number; url: string; is_emd_m1: boolean}> } | null;
    zone_26_50_domains: { domains: Array<{domain: string; rank: number; url: string; is_emd_m1: boolean}> } | null;
    zone_51_100_domains: { domains: Array<{domain: string; rank: number; url: string; is_emd_m1: boolean}> } | null;
  } | null;
}

interface ColumnDefinition {
  key: string;
  label: string;
  type: string;
  leftSeparator?: string;
  rightSeparator?: string;
  headerRow1Text?: string;
  headerRow2Text?: string;
  headerRow1BgClass?: string;
  readOnly?: boolean;
  isJoined?: boolean;
  isHoistColumn?: boolean;
}

const columns: ColumnDefinition[] = [
  { key: 'serp_tool', label: 'serp_tool', type: 'button' },
  { key: 'keyword_id', label: 'keyword_id', type: 'number' },
  { 
    key: 'hoist_note1', 
    label: 'note1', 
    type: 'text',
    headerRow1Text: 'hoist',
    headerRow2Text: 'note1',
    readOnly: true,
    isHoistColumn: true
  },
  { 
    key: 'hoist_ven_metro_pop', 
    label: 'ven_metro_pop', 
    type: 'text',
    headerRow1Text: 'hoist',
    headerRow2Text: 'ven_metro_pop',
    readOnly: true,
    isHoistColumn: true
  },
  { 
    key: 'hoist_ven_city_pop', 
    label: 'ven_city_pop', 
    type: 'text',
    headerRow1Text: 'hoist',
    headerRow2Text: 'ven_city_pop',
    readOnly: true,
    isHoistColumn: true
  },
  { key: 'keyword_datum', label: 'keyword_datum', type: 'text' },
  { 
    key: 'serp_status', 
    label: 'serp_status', 
    type: 'serp_indicator',
    leftSeparator: 'black-4px',
    headerRow1Text: 'keywordshub',
    headerRow2Text: 'F400 SERP'
  },
  { key: 'search_volume', label: 'search_volume', type: 'number' },
  { key: 'cpc', label: 'cpc', type: 'number' },
  { 
    key: 'semrush_volume', 
    label: 'semrush_volume', 
    type: 'number',
    headerRow1Text: 'keywordshub',
    headerRow2Text: 'semrush_volume',
    rightSeparator: 'black-4px'
  },
  { key: 'rel_dfs_location_code', label: 'rel_dfs_location_code', type: 'number' },
  { key: 'location_display_name', label: 'location_display_name', type: 'text' },
  { key: 'location_coordinate', label: 'location_coordinate', type: 'text' },
  { key: 'language_code', label: 'language_code', type: 'text', leftSeparator: 'black-4px' },
  { key: 'language_name', label: 'language_name', type: 'text' },
  { key: 'competition', label: 'competition', type: 'text', leftSeparator: 'black-4px' },
  { key: 'competition_index', label: 'competition_index', type: 'number' },
  { key: 'low_top_of_page_bid', label: 'low_top_of_page_bid', type: 'number' },
  { key: 'high_top_of_page_bid', label: 'high_top_of_page_bid', type: 'number' },
  { key: 'api_fetched_at', label: 'api_fetched_at', type: 'datetime' },
  { key: 'created_at', label: 'created_at', type: 'datetime' },
  { key: 'updated_at', label: 'updated_at', type: 'datetime' },
  { key: 'created_by', label: 'created_by', type: 'text' },
  { key: 'last_updated_by', label: 'last_updated_by', type: 'text' },
  { key: 'tags', label: 'tags', type: 'tags' },
  { key: 'reverse_lookup', label: 'reverse_lookup', type: 'text', headerRow1Text: 'keywordshub', headerRow2Text: 'cached_cncglub_ids (revlook)', headerRow1BgClass: 'bg-gray-200' },
  { 
    key: 'rel_industry_id', 
    label: 'rel_industry_id', 
    type: 'number',
    leftSeparator: 'black-4px',
    headerRow1Text: 'keywordshub',
    headerRow2Text: 'rel_industry_id'
  },
  { 
    key: 'industries.industry_name', 
    label: 'industry_name', 
    type: 'text',
    headerRow1Text: 'industries',
    headerRow2Text: 'industry_name',
    isJoined: true,
    readOnly: true
  },
  { 
    key: 'cached_city_name', 
    label: 'cached_city_name', 
    type: 'text',
    leftSeparator: 'black-4px',
    headerRow1Text: 'keywordshub',
    headerRow2Text: 'cached_city_name'
  },
  
  // ═══════════════════════════════════════════════════════════
  // METHOD-1 ZONE COLUMNS (15 columns total)
  // ═══════════════════════════════════════════════════════════
  
  // COUNT COLUMNS (8 columns) - Updated with new column names
  { 
    key: 'serp_cache_m1.total_emd_count', 
    label: 'Total EMD Count', 
    type: 'number',
    leftSeparator: 'black-4px',
    headerRow1Text: 'method-1',
    headerRow2Text: 'total',
    readOnly: true
  },
  { 
    key: 'serp_cache_m1.zone_1_emd_count', 
    label: 'Zone 1', 
    type: 'number',
    headerRow1Text: 'zone',
    headerRow2Text: '1',
    readOnly: true
  },
  { 
    key: 'serp_cache_m1.zone_2_emd_count', 
    label: 'Zone 2', 
    type: 'number',
    headerRow1Text: 'zone',
    headerRow2Text: '2',
    readOnly: true
  },
  { 
    key: 'serp_cache_m1.zone_3_emd_count', 
    label: 'Zone 3', 
    type: 'number',
    headerRow1Text: 'zone',
    headerRow2Text: '3',
    readOnly: true
  },
  { 
    key: 'serp_cache_m1.zone_4_10_emd_count', 
    label: 'Zone 4-10', 
    type: 'number',
    headerRow1Text: 'zone',
    headerRow2Text: '4-10',
    readOnly: true
  },
  { 
    key: 'serp_cache_m1.zone_11_25_emd_count', 
    label: 'Zone 11-25', 
    type: 'number',
    headerRow1Text: 'zone',
    headerRow2Text: '11-25',
    readOnly: true
  },
  { 
    key: 'serp_cache_m1.zone_26_50_emd_count', 
    label: 'Zone 26-50', 
    type: 'number',
    headerRow1Text: 'zone',
    headerRow2Text: '26-50',
    readOnly: true
  },
  { 
    key: 'serp_cache_m1.zone_51_100_emd_count', 
    label: 'Zone 51-100', 
    type: 'number',
    headerRow1Text: 'zone',
    headerRow2Text: '51-100',
    readOnly: true
  },
  
  // DOMAIN COLUMNS (7 columns) - Updated type to serp_domains
  { 
    key: 'serp_cache_m1.zone_1_domains', 
    label: 'Zone 1 Domains', 
    type: 'serp_domains',
    leftSeparator: 'black-4px',
    headerRow1Text: 'domains',
    headerRow2Text: '1',
    readOnly: true
  },
  { 
    key: 'serp_cache_m1.zone_2_domains', 
    label: 'Zone 2 Domains', 
    type: 'serp_domains',
    headerRow1Text: 'zone',
    headerRow2Text: '2',
    readOnly: true
  },
  { 
    key: 'serp_cache_m1.zone_3_domains', 
    label: 'Zone 3 Domains', 
    type: 'serp_domains',
    headerRow1Text: 'zone',
    headerRow2Text: '3',
    readOnly: true
  },
  { 
    key: 'serp_cache_m1.zone_4_10_domains', 
    label: 'Zone 4-10 Domains', 
    type: 'serp_domains',
    headerRow1Text: 'zone',
    headerRow2Text: '4-10',
    readOnly: true
  },
  { 
    key: 'serp_cache_m1.zone_11_25_domains', 
    label: 'Zone 11-25 Domains', 
    type: 'serp_domains',
    headerRow1Text: 'zone',
    headerRow2Text: '11-25',
    readOnly: true
  },
  { 
    key: 'serp_cache_m1.zone_26_50_domains', 
    label: 'Zone 26-50 Domains', 
    type: 'serp_domains',
    headerRow1Text: 'zone',
    headerRow2Text: '26-50',
    readOnly: true
  },
  { 
    key: 'serp_cache_m1.zone_51_100_domains', 
    label: 'Zone 51-100 Domains', 
    type: 'serp_domains',
    headerRow1Text: 'zone',
    headerRow2Text: '51-100',
    readOnly: true
  }
];

interface KeywordsHubTableProps {
  selectedTagId?: number;
  tagFilterRefreshKey?: number;
  showHoistColumns?: boolean;
  onColumnPaginationRender?: (controls: {
    ColumnPaginationBar1: () => JSX.Element | null;
    ColumnPaginationBar2: () => JSX.Element | null;
  }) => void;
  initialColumnsPerPage?: number;
  initialColumnPage?: number;
  onColumnPaginationChange?: (columnsPerPage: number, currentPage: number) => void;
  onMainPaginationRender?: (controls: {
    PaginationControls: () => JSX.Element;
    SearchField: () => JSX.Element;
  }) => void;
  onTableActionsRender?: (controls: {
    DataForSEOActions: () => JSX.Element;
  }) => void;
  onSelectedRowsChange?: (selectedIds: number[]) => void;
}

// Helper function to format relative time
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default function KeywordsHubTable({ 
  selectedTagId,
  tagFilterRefreshKey = 0,
  showHoistColumns = true,
  onColumnPaginationRender, 
  initialColumnsPerPage = 8,
  initialColumnPage = 1,
  onColumnPaginationChange,
  onMainPaginationRender,
  onTableActionsRender,
  onSelectedRowsChange
}: KeywordsHubTableProps) {
  const { user } = useAuth();
  const [data, setData] = useState<KeywordRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof KeywordRecord>('created_at');
  const [fetchingSerpKeywords, setFetchingSerpKeywords] = useState<Set<number>>(new Set());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Column pagination states
  const [columnsPerPage, setColumnsPerPage] = useState(initialColumnsPerPage); // Show 8 columns at a time
  const [currentColumnPage, setCurrentColumnPage] = useState(initialColumnPage);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // DataForSEO refresh states
  const [refreshingKeywords, setRefreshingKeywords] = useState<Set<number>>(new Set());
  const [bulkRefreshing, setBulkRefreshing] = useState(false);
  const [blankRefreshing, setBlankRefreshing] = useState(false);
  const [reverseLookupRefreshing, setReverseLookupRefreshing] = useState(false);
  
  // Form data for creating
  const [formData, setFormData] = useState({
    keyword_datum: '',
    search_volume: 0,
    cpc: 0,
    rel_dfs_location_code: 2840,
    location_display_name: '',
    location_coordinate: '',
    language_code: 'en',
    language_name: 'English',
    competition: '',
    competition_index: 0,
    low_top_of_page_bid: 0,
    high_top_of_page_bid: 0
  });

  const supabase = createClientComponentClient();

  // Get user ID
  const [userInternalId, setUserInternalId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      if (user?.id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        
        if (userData) {
          setUserInternalId(userData.id);
        }
      }
    };
    getUserId();
  }, [user, supabase]);

  // Fetch data
  const fetchData = async () => {
    console.log('🏷️ [FETCH DATA] Called with selectedTagId:', selectedTagId);
    try {
      setLoading(true);
      
      let query = supabase
        .from('keywordshub')
        .select(`
          *,
          industries:rel_industry_id (
            industry_name
          )
        `);

      // If a tag is selected, filter by keywords that have this tag
      if (selectedTagId) {
        console.log('🏷️ [FETCH DATA] Filtering by tag ID:', selectedTagId);
        // Get keyword IDs that have this tag
        const { data: taggedKeywordIds, error: tagError } = await supabase
          .from('keywordshub_tag_relations')
          .select('fk_keyword_id')
          .eq('fk_tag_id', selectedTagId);

        if (tagError) throw tagError;

        const keywordIds = taggedKeywordIds.map(rel => rel.fk_keyword_id);
        
        if (keywordIds.length > 0) {
          query = query.in('keyword_id', keywordIds);
        } else {
          // No keywords have this tag, return empty array
          setData([]);
          setLoading(false);
          return;
        }
      }

      const { data: keywords, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch tag information and cache data for each keyword
      if (keywords && keywords.length > 0) {
        const keywordIds = keywords.map(k => k.keyword_id);
        
        // Get all tag relations for these keywords
        const { data: tagRelations, error: tagRelError } = await supabase
          .from('keywordshub_tag_relations')
          .select(`
            fk_keyword_id,
            keywordshub_tags (
              tag_id,
              tag_name
            )
          `)
          .in('fk_keyword_id', keywordIds);
        
        if (tagRelError) {
          console.error('Error fetching tag relations:', tagRelError);
        }
        
        // Get Universal SERP zone cache data for method-1
        const { data: cacheData, error: cacheError } = await supabase
          .from('keywordshub_serp_zone_cache')
          .select(`
            keyword_id,
            total_emd_count,
            zone_1_emd_count,
            zone_2_emd_count,
            zone_3_emd_count,
            zone_4_10_emd_count,
            zone_11_25_emd_count,
            zone_26_50_emd_count,
            zone_51_100_emd_count,
            zone_1_domains,
            zone_2_domains,
            zone_3_domains,
            zone_4_10_domains,
            zone_11_25_domains,
            zone_26_50_domains,
            zone_51_100_domains,
            cached_at,
            latest_fetch_id,
            source_fetch_id
          `)
          .eq('emd_stamp_method', 'method-1')
          .eq('is_current', true)  // Only fetch current cache, not historical
          .in('keyword_id', keywordIds);
        
        if (cacheError) {
          console.error('Error fetching EMD zone cache:', cacheError);
        }

        // Get latest fetch_id for each keyword to detect staleness
        const { data: latestFetches, error: fetchError } = await supabase
          .from('zhe_serp_fetches')
          .select('rel_keyword_id, fetch_id')
          .eq('is_latest', true)
          .in('rel_keyword_id', keywordIds);

        if (fetchError) {
          console.error('Error fetching latest fetches:', fetchError);
        }
        
        // Group tags by keyword_id
        const tagsByKeywordId: Record<number, Array<{ tag_id: number; tag_name: string }>> = {};
        
        if (tagRelations) {
          tagRelations.forEach(relation => {
            const keywordId = relation.fk_keyword_id;
            const tagInfo = relation.keywordshub_tags;
            
            if (tagInfo) {
              if (!tagsByKeywordId[keywordId]) {
                tagsByKeywordId[keywordId] = [];
              }
              tagsByKeywordId[keywordId].push({ tag_id: tagInfo.tag_id, tag_name: tagInfo.tag_name });
            }
          });
        }
        
        // Group cache data by keyword_id
        const cacheByKeywordId: Record<number, any> = {};
        
        if (cacheData) {
          cacheData.forEach(cache => {
            cacheByKeywordId[cache.keyword_id] = cache;
          });
        }

        // Create latest fetch lookup for staleness detection
        const latestFetchByKeywordId: Record<number, number> = {};
        
        if (latestFetches) {
          latestFetches.forEach(fetch => {
            latestFetchByKeywordId[fetch.rel_keyword_id] = fetch.fetch_id;
          });
        }
        
        // Calculate cache status for each keyword
        const cacheStatusByKeywordId: Record<number, 'CURRENT' | 'STALE' | 'NO_CACHE'> = {};
        
        keywordIds.forEach(kwId => {
          const cache = cacheByKeywordId[kwId];
          const latestFetchId = latestFetchByKeywordId[kwId];
          
          if (!cache) {
            cacheStatusByKeywordId[kwId] = 'NO_CACHE';
          } else if (cache.source_fetch_id === latestFetchId) {
            cacheStatusByKeywordId[kwId] = 'CURRENT';
          } else {
            cacheStatusByKeywordId[kwId] = 'STALE';
          }
        });
        
        // Add tags, cache data, and cache status to keywords
        const keywordsWithTags = keywords.map(keyword => ({
          ...keyword,
          tags: tagsByKeywordId[keyword.keyword_id] || [],
          serp_cache_m1: cacheByKeywordId[keyword.keyword_id] || null,
          cache_status: cacheStatusByKeywordId[keyword.keyword_id] || 'NO_CACHE'
        }));
        
        console.log('🏷️ [FETCH DATA] Loaded cache data for', Object.keys(cacheByKeywordId).length, 'keywords');
        
        setData(keywordsWithTags);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching keywords:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🏷️ [KEYWORDS HUB TABLE] useEffect triggered - selectedTagId:', selectedTagId, 'refreshKey:', tagFilterRefreshKey);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTagId, tagFilterRefreshKey, supabase]);

  // Listen for refresh events from parent
  useEffect(() => {
    const handleRefresh = () => {
      fetchData();
    };
    window.addEventListener('kwjar-refresh-needed', handleRefresh);
    return () => window.removeEventListener('kwjar-refresh-needed', handleRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify parent when selected rows change
  useEffect(() => {
    if (onSelectedRowsChange) {
      onSelectedRowsChange(Array.from(selectedRows));
    }
  }, [selectedRows]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      if (!searchTerm) return true;
      return Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
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
  }, [data, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / (itemsPerPage === 0 ? filteredAndSortedData.length : itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = itemsPerPage === 0 ? filteredAndSortedData : filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Column pagination logic with sticky columns
  const baseStickyKeys = ['serp_tool', 'keyword_id', 'keyword_datum', 'search_volume', 'cpc'];
  const hoistColumnKeys = ['hoist_note1', 'hoist_ven_metro_pop', 'hoist_ven_city_pop'];
  
  // Filter columns based on hoist toggle - remove hoist columns entirely if toggle is OFF
  const activeColumns = showHoistColumns 
    ? columns 
    : columns.filter(col => !hoistColumnKeys.includes(col.key));
  
  // Build sticky column keys with hoist columns inserted between keyword_id and keyword_datum
  const stickyColumnKeys = showHoistColumns 
    ? [...baseStickyKeys.slice(0, 2), ...hoistColumnKeys, ...baseStickyKeys.slice(2)]
    : baseStickyKeys;
  
  const stickyColumns = activeColumns.filter(col => stickyColumnKeys.includes(col.key));
  const paginatedColumns = activeColumns.filter(col => !stickyColumnKeys.includes(col.key));
  
  const totalColumnPages = columnsPerPage === 0 ? 1 : Math.ceil(paginatedColumns.length / columnsPerPage);
  const startColumnIndex = columnsPerPage === 0 ? 0 : (currentColumnPage - 1) * columnsPerPage;
  const visiblePaginatedColumns = columnsPerPage === 0 ? paginatedColumns : paginatedColumns.slice(startColumnIndex, startColumnIndex + columnsPerPage);
  
  // Combined visible columns: sticky columns + paginated columns
  const visibleColumns = [...stickyColumns, ...visiblePaginatedColumns];

  // Handle sort
  const handleSort = (field: keyof KeywordRecord) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle row selection
  const handleRowSelect = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(item => item.keyword_id)));
    }
  };

  // Column Pagination Components - Define before use
  // Bar 1: Columns per page quantity selector
  const ColumnPaginationBar1 = () => {
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Cols/page:</span>
          <button
            onClick={() => {
              setColumnsPerPage(0);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-l -mr-px cursor-pointer ${
              columnsPerPage === 0 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 0 ? '#f8f782' : undefined
            }}
          >
            All
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(4);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 4 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 4 ? '#f8f782' : undefined
            }}
          >
            4
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(6);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 6 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 6 ? '#f8f782' : undefined
            }}
          >
            6
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(8);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 8 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 8 ? '#f8f782' : undefined
            }}
          >
            8
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(10);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 10 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 10 ? '#f8f782' : undefined
            }}
          >
            10
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(12);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-r cursor-pointer ${
              columnsPerPage === 12 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 12 ? '#f8f782' : undefined
            }}
          >
            12
          </button>
        </div>
      </div>
    );
  };

  // Bar 2: Current column page selector
  const ColumnPaginationBar2 = () => {
    if (totalColumnPages <= 1) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Col page:</span>
          <button
            onClick={() => setCurrentColumnPage(1)}
            disabled={currentColumnPage === 1}
            className="px-2 py-2.5 text-sm border rounded-l -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            First
          </button>
          <button
            onClick={() => setCurrentColumnPage(currentColumnPage - 1)}
            disabled={currentColumnPage === 1}
            className="px-2 py-2.5 text-sm border -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            Prev
          </button>
          
          {Array.from({ length: Math.min(5, totalColumnPages) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(totalColumnPages - 4, currentColumnPage - 2)) + i;
            if (pageNum > totalColumnPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentColumnPage(pageNum)}
                className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
                  currentColumnPage === pageNum 
                    ? 'text-black border-black' 
                    : 'bg-white hover:bg-gray-200'
                }`}
                style={{ 
                  fontSize: '14px', 
                  paddingTop: '10px', 
                  paddingBottom: '10px',
                  backgroundColor: currentColumnPage === pageNum ? '#f8f782' : undefined
                }}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentColumnPage(currentColumnPage + 1)}
            disabled={currentColumnPage === totalColumnPages}
            className="px-2 py-2.5 text-sm border -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            Next
          </button>
          <button
            onClick={() => setCurrentColumnPage(totalColumnPages)}
            disabled={currentColumnPage === totalColumnPages}
            className="px-2 py-2.5 text-sm border rounded-r disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  // Pass pagination components to parent
  useEffect(() => {
    if (onColumnPaginationRender) {
      onColumnPaginationRender({
        ColumnPaginationBar1,
        ColumnPaginationBar2
      });
    }
  }, [onColumnPaginationRender, currentColumnPage, totalColumnPages, columnsPerPage]);

  // Pass main pagination controls to parent
  useEffect(() => {
    if (onMainPaginationRender) {
      onMainPaginationRender({
        PaginationControls,
        SearchField
      });
    }
  }, [onMainPaginationRender, currentPage, totalPages, itemsPerPage, searchTerm]);

  // Notify parent of column pagination changes
  const prevColumnsPerPage = useRef(initialColumnsPerPage);
  const prevCurrentColumnPage = useRef(initialColumnPage);
  
  useEffect(() => {
    // Only notify parent if values have actually changed from the initial values
    const columnsChanged = columnsPerPage !== prevColumnsPerPage.current;
    const pageChanged = currentColumnPage !== prevCurrentColumnPage.current;
    
    if (onColumnPaginationChange && (columnsChanged || pageChanged)) {
      prevColumnsPerPage.current = columnsPerPage;
      prevCurrentColumnPage.current = currentColumnPage;
      onColumnPaginationChange(columnsPerPage, currentColumnPage);
    }
  }, [columnsPerPage, currentColumnPage]);

  // Inline editing functions
  const startEditing = (id: number, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditingValue(currentValue?.toString() || '');
  };

  const saveEdit = async () => {
    if (!editingCell || !userInternalId) return;
    
    try {
      let value: any = editingValue;
      
      // Convert value based on field type
      const column = columns.find(col => col.key === editingCell.field);
      if (column?.type === 'number') {
        value = editingValue === '' ? null : Number(editingValue);
      }

      const { error } = await supabase
        .from('keywordshub')
        .update({ 
          [editingCell.field]: value,
          last_updated_by: userInternalId
        })
        .eq('keyword_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.keyword_id === editingCell.id 
            ? { ...item, [editingCell.field]: value, updated_at: new Date().toISOString() }
            : item
        )
      );

      setEditingCell(null);
      setEditingValue('');
    } catch (error) {
      console.error('Error updating field:', error);
      alert('Failed to update field');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // DataForSEO refresh function (Live endpoint)
  const refreshDataForSEO = async (keywordId: number) => {
    console.log('🔷 [INDIVIDUAL REFRESH] Starting refresh for keyword ID:', keywordId);
    const keyword = data.find(k => k.keyword_id === keywordId);
    console.log('🔷 [INDIVIDUAL REFRESH] Keyword data:', {
      keyword_id: keywordId,
      keyword_datum: keyword?.keyword_datum,
      current_search_volume: keyword?.search_volume,
      current_cpc: keyword?.cpc,
      rel_dfs_location_code: keyword?.rel_dfs_location_code,
      language_code: keyword?.language_code
    });
    
    setRefreshingKeywords(prev => new Set([...prev, keywordId]));
    
    try {
      console.log('🔷 [INDIVIDUAL REFRESH] Calling API endpoint /api/dataforseo-refresh-live');
      const response = await fetch('/api/dataforseo-refresh-live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword_id: keywordId }),
      });

      console.log('🔷 [INDIVIDUAL REFRESH] API Response status:', response.status);
      const result = await response.json();
      console.log('🔷 [INDIVIDUAL REFRESH] API Response data:', result);

      if (!response.ok) {
        console.error('🔷 [INDIVIDUAL REFRESH] API Error:', result);
        throw new Error(result.error || 'Failed to refresh data');
      }

      // Update local data with refreshed values
      console.log('🔷 [INDIVIDUAL REFRESH] Updating local state with:', result.data);
      setData(prevData => {
        const newData = prevData.map(item => 
          item.keyword_id === keywordId 
            ? { 
                ...item, 
                ...result.data,
                updated_at: new Date().toISOString() 
              }
            : item
        );
        const updatedKeyword = newData.find(k => k.keyword_id === keywordId);
        console.log('🔷 [INDIVIDUAL REFRESH] Updated keyword in state:', {
          keyword_id: keywordId,
          new_search_volume: updatedKeyword?.search_volume,
          new_cpc: updatedKeyword?.cpc
        });
        return newData;
      });

      console.log('✅ DataForSEO data refreshed for keyword:', keywordId);
    } catch (error) {
      console.error('❌ Failed to refresh DataForSEO data:', error);
      alert(`Failed to refresh data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRefreshingKeywords(prev => {
        const newSet = new Set(prev);
        newSet.delete(keywordId);
        return newSet;
      });
    }
  };

  // Bulk refresh function
  const bulkRefreshMetrics = async () => {
    console.log('🔶 [BULK REFRESH] Starting bulk refresh function');
    setBulkRefreshing(true);
    
    try {
      // Get selected keywords
      const selectedKeywordIds = Array.from(selectedRows);
      console.log('🔶 [BULK REFRESH] Selected keyword IDs:', selectedKeywordIds);
      
      if (selectedKeywordIds.length === 0) {
        console.log('🔶 [BULK REFRESH] No keywords selected, showing alert');
        alert('Please select keywords to refresh');
        return;
      }

      // Get keyword details for debugging
      const selectedKeywords = data.filter(k => selectedKeywordIds.includes(k.keyword_id));
      console.log('🔶 [BULK REFRESH] Selected keywords details:', selectedKeywords.map(k => ({
        keyword_id: k.keyword_id,
        keyword_datum: k.keyword_datum,
        current_search_volume: k.search_volume,
        current_cpc: k.cpc,
        rel_dfs_location_code: k.rel_dfs_location_code,
        language_code: k.language_code
      })));

      console.log(`🚀 Starting bulk refresh for ${selectedKeywordIds.length} keywords...`);
      console.log('📋 Keyword IDs:', selectedKeywordIds.slice(0, 10), selectedKeywordIds.length > 10 ? `... and ${selectedKeywordIds.length - 10} more` : '');

      const startTime = Date.now();
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after 120 seconds (${selectedKeywordIds.length} keywords)`));
        }, 120000); // 2 minutes timeout
      });

      const requestPayload = {
        keyword_ids: selectedKeywordIds,
        field: 'cpc'
      };
      
      console.log(`📦 Request payload size: ${JSON.stringify(requestPayload).length} characters`);

      // Race between fetch and timeout
      const fetchPromise = fetch('/api/dataforseo-refresh-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      const fetchTime = Date.now() - startTime;
      
      console.log(`⏱️ Fetch completed in ${fetchTime}ms (${(fetchTime / 1000).toFixed(1)}s)`);
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error Response (${response.status}):`, errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const totalTime = Date.now() - startTime;
      
      console.log(`✅ Full request completed in ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);
      console.log('📊 API Response:', result);

      // Enhanced success message with actual processing details
      const successMsg = `✅ BULK REFRESH COMPLETED SUCCESSFULLY\n\n` +
        `🎯 Keywords Processed: ${selectedKeywordIds.length}\n` +
        `⏱️  Processing Time: ${(totalTime / 1000).toFixed(1)} seconds\n` +
        `📊 Status: ${result.message || 'Processing initiated'}\n\n` +
        `🔍 Background processing has been initiated.\n` +
        `📈 Updated metrics will appear in the table shortly.\n\n` +
        `💡 The system successfully processed your large batch!`;
      
      alert(successMsg);
      
      // Refresh the table data after a delay to show updated metrics
      setTimeout(() => {
        console.log('🔄 Refreshing table data to show updated metrics...');
        fetchData();
      }, 5000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Bulk refresh failed:', {
        error: errorMessage,
        keywordCount: Array.from(selectedRows).length,
        timestamp: new Date().toISOString()
      });
      
      // More detailed error message for user
      alert(`Failed to start bulk refresh: ${errorMessage}\n\nKeywords: ${Array.from(selectedRows).length}\nTime: ${new Date().toLocaleTimeString()}\n\nCheck console for details.`);
    } finally {
      setBulkRefreshing(false);
    }
  };

  // Bulk refresh function for blank keywords only
  const bulkRefreshBlanks = async () => {
    setBlankRefreshing(true);
    
    try {
      // Filter keywords that have blank/null cpc OR search_volume
      const blankKeywordIds = data
        .filter(keyword => 
          (keyword.cpc === null || keyword.cpc === undefined) || 
          (keyword.search_volume === null || keyword.search_volume === undefined)
        )
        .map(keyword => keyword.keyword_id);

      if (blankKeywordIds.length === 0) {
        alert('No keywords with blank CPC or search volume found.');
        return;
      }

      const response = await fetch('/api/dataforseo-refresh-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          keyword_ids: blankKeywordIds,
          field: 'cpc'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start bulk refresh');
      }

      alert(`Bulk refresh started for ${blankKeywordIds.length} keywords with blank data. Results will be available shortly.`);
      
      // Refresh the table data after a delay
      setTimeout(() => {
        fetchData();
      }, 5000);

    } catch (error) {
      console.error('❌ Failed to start blank refresh:', error);
      alert(`Failed to start blank refresh: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBlankRefreshing(false);
    }
  };

  // Reverse lookup refresh function
  const bulkRefreshReverseLookup = async () => {
    setReverseLookupRefreshing(true);
    
    try {
      // Get all visible keyword IDs (or selected if any)
      const targetKeywordIds = selectedRows.size > 0 
        ? Array.from(selectedRows) 
        : paginatedData.map(keyword => keyword.keyword_id);

      if (targetKeywordIds.length === 0) {
        alert('No keywords available for reverse lookup refresh.');
        return;
      }

      console.log(`🔍 Starting reverse lookup refresh for ${targetKeywordIds.length} keywords...`);
      const startTime = Date.now();

      const response = await fetch('/api/reverse-lookup-refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          keyword_ids: targetKeywordIds
        }),
      });

      const result = await response.json();
      const totalTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(result.error || 'Failed to refresh reverse lookup');
      }

      console.log(`✅ Reverse lookup refresh completed in ${totalTime}ms`);
      console.log('📊 Result:', result);

      alert(`✅ Reverse lookup refresh completed!\n\n` +
            `📊 Keywords processed: ${targetKeywordIds.length}\n` +
            `⏱️  Processing time: ${(totalTime / 1000).toFixed(1)}s\n` +
            `🔍 Updated: ${result.updated || 0} cached values\n\n` +
            `The reverse lookup cache has been updated.`);
      
      // Refresh the table data to show updated cached values
      setTimeout(() => {
        fetchData();
      }, 1000);

    } catch (error) {
      console.error('❌ Failed to refresh reverse lookup:', error);
      alert(`Failed to refresh reverse lookup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setReverseLookupRefreshing(false);
    }
  };

  // Create new inline record
  const createNewInline = useCallback(async () => {
    if (!userInternalId) return;

    try {
      const newRecord = {
        keyword_datum: 'New Keyword',
        search_volume: null,
        cpc: null,
        location_display_name: null,
        location_coordinate: null,
        language_code: 'en',
        language_name: 'English',
        competition: null,
        competition_index: null,
        low_top_of_page_bid: null,
        high_top_of_page_bid: null,
        api_fetched_at: null,
        created_by: userInternalId,
        last_updated_by: userInternalId
      };

      const { data: inserted, error } = await supabase
        .from('keywordshub')
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;

      // Add to local data at the beginning
      setData(prevData => [inserted, ...prevData]);
      
      // Start editing the keyword_datum field immediately
      setTimeout(() => {
        startEditing(inserted.keyword_id, 'keyword_datum', 'New Keyword');
      }, 100);

    } catch (error) {
      console.error('Error creating record:', error);
      alert('Failed to create record');
    }
  }, [userInternalId]);

  // Handle popup form creation
  const handleCreate = async () => {
    if (!userInternalId) return;

    try {
      const insertData = {
        ...formData,
        search_volume: formData.search_volume || null,
        cpc: formData.cpc || null,
        competition_index: formData.competition_index || null,
        low_top_of_page_bid: formData.low_top_of_page_bid || null,
        high_top_of_page_bid: formData.high_top_of_page_bid || null,
        created_by: userInternalId,
        last_updated_by: userInternalId
      };
      
      const { error } = await supabase
        .from('keywordshub')
        .insert([insertData]);
        
      if (error) throw error;
      
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      keyword_datum: '',
      search_volume: 0,
      cpc: 0,
      rel_dfs_location_code: 2840,
      location_display_name: '',
      location_coordinate: '',
      language_code: 'en',
      language_name: 'English',
      competition: '',
      competition_index: 0,
      low_top_of_page_bid: 0,
      high_top_of_page_bid: 0
    });
  };

  // Render cell content
  const renderCell = (item: KeywordRecord, column: typeof columns[0]) => {
    // Handle joined columns
    let value: any;
    if (column.key.includes('.')) {
      const [table, field] = column.key.split('.');
      if (table === 'industries' && item.industries) {
        value = (item.industries as any)[field];
      } else if (table === 'serp_cache_m1' && item.serp_cache_m1) {
        value = (item.serp_cache_m1 as any)[field];
      } else {
        value = null;
      }
    } else {
      value = item[column.key as keyof KeywordRecord];
    }
    
    const isEditing = editingCell?.id === item.keyword_id && editingCell?.field === column.key;
    const isReadOnly = column.readOnly || column.key === 'keyword_id' || column.key === 'created_at' || column.key === 'updated_at';

    if (isEditing && !isReadOnly) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type={column.type === 'number' ? 'number' : 'text'}
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            className="w-full px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={saveEdit}
            className="text-green-600 hover:text-green-800 text-xs"
          >
            ✓
          </button>
          <button
            onClick={cancelEdit}
            className="text-red-600 hover:text-red-800 text-xs"
          >
            ✕
          </button>
        </div>
      );
    }

    const cellClass = "px-2 py-1 cursor-pointer hover:bg-blue-50 text-xs";
    
    if (column.type === 'datetime' && value) {
      return (
        <div
          className={cellClass}
          onClick={() => !isReadOnly && startEditing(item.keyword_id, column.key, value)}
        >
          {new Date(value as string).toLocaleString()}
        </div>
      );
    }

    if (column.type === 'number' && value !== null) {
      // Special handling for search_volume and cpc columns with refresh buttons
      if (column.key === 'search_volume' || column.key === 'cpc') {
        const isRefreshing = refreshingKeywords.has(item.keyword_id);
        
        return (
          <div className="flex items-center justify-between space-x-2">
            <div
              className={cellClass}
              onClick={() => !isReadOnly && startEditing(item.keyword_id, column.key, value)}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                refreshDataForSEO(item.keyword_id);
              }}
              disabled={isRefreshing}
              className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-white transition-colors ${
                isRefreshing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
              title="Refresh data from DataForSEO"
            >
              {isRefreshing ? (
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          </div>
        );
      }
      
      // Check if this is a zone count column (needs staleness indicator)
      const isZoneCountColumn = column.key.includes('serp_cache_m1') && column.key.includes('_emd_count');
      
      return (
        <div
          className={cellClass}
          onClick={() => !isReadOnly && startEditing(item.keyword_id, column.key, value)}
        >
          <div className="flex items-center gap-1">
            <span>{typeof value === 'number' ? (column.key === 'rel_dfs_location_code' ? value.toString() : value.toLocaleString()) : value}</span>
            {isZoneCountColumn && item.cache_status && item.cache_status !== 'CURRENT' && (
              <span className="ml-1">
                {item.cache_status === 'STALE' && <span className="text-orange-500" title="Cache is outdated - run F410+F420">⚠️</span>}
                {item.cache_status === 'NO_CACHE' && <span className="text-red-500" title="No cache - run Gazelle">✗</span>}
              </span>
            )}
          </div>
        </div>
      );
    }

    // Special handling for search_volume and cpc columns with refresh buttons (when null/empty)
    if (column.key === 'search_volume' || column.key === 'cpc') {
      const isRefreshing = refreshingKeywords.has(item.keyword_id);
      
      return (
        <div className="flex items-center justify-between space-x-2">
          <div
            className={cellClass}
            onClick={() => !isReadOnly && startEditing(item.keyword_id, column.key, value)}
          >
            {value?.toString() || ''}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              refreshDataForSEO(item.keyword_id);
            }}
            disabled={isRefreshing}
            className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-white transition-colors ${
              isRefreshing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title="Refresh data from DataForSEO"
          >
            {isRefreshing ? (
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>
      );
    }

    // Special handling for tags column
    if (column.key === 'tags') {
      const tags = item.tags || [];
      return (
        <div className="px-2 py-1 text-xs">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <div
                  key={tag.tag_id}
                  className="inline-flex px-2 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: '#ffffe0', color: '#333' }}
                  title={`Tag ID: ${tag.tag_id}`}
                >
                  ({tag.tag_id}) - {tag.tag_name}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">No tags</span>
          )}
        </div>
      );
    }

    // Special handling for SERP tool column
    if (column.key === 'serp_tool') {
      return (
        <div className="px-2 py-1 flex items-center justify-center">
          <a
            href={`/serpjar?keyword_id=${item.keyword_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-4 h-4 bg-black text-white font-bold text-xs flex items-center justify-center hover:bg-gray-800 transition-colors no-underline inline-block"
            title={`Open SERP tool for keyword: ${item.keyword_datum}`}
            style={{ textDecoration: 'none', lineHeight: '16px' }}
          >
            s
          </a>
        </div>
      );
    }

    // Special handling for reverse lookup column
    if (column.key === 'reverse_lookup') {
      const cachedIds = item.cached_cncglub_ids;
      return (
        <div className="px-2 py-1 text-xs">
          {cachedIds ? (
            <span className="text-blue-600 font-medium">
              {cachedIds.replace(/,/g, '/')}
            </span>
          ) : (
            <span className="text-gray-400 italic">not cached</span>
          )}
        </div>
      );
    }

    // Special handling for joined industry_name column
    if (column.key === 'industries.industry_name') {
      const industryName = item.industries?.industry_name;
      return (
        <div className="px-2 py-1 text-xs cursor-default">
          {industryName ? (
            <span className="text-gray-900">{industryName}</span>
          ) : (
            <span className="text-gray-400 italic">no industry</span>
          )}
        </div>
      );
    }

    // Special handling for SERP status indicator column
    if (column.key === 'serp_status') {
      const status = item.serp_fetch_status;
      const count = item.serp_results_count;
      const lastFetched = item.serp_last_fetched_at;
      const isFetching = fetchingSerpKeywords.has(item.keyword_id);
      
      return (
        <div className="flex items-center justify-between space-x-2 px-2 py-1">
          <div className="flex items-center space-x-2 flex-1">
            {status === 'completed' && (
              <>
                <span className="text-green-600 text-base">✅</span>
                <div className="text-xs">
                  <div className="font-semibold text-gray-900">{count} results</div>
                  {lastFetched && (
                    <div className="text-gray-400">
                      {formatDistanceToNow(new Date(lastFetched))}
                    </div>
                  )}
                </div>
              </>
            )}
            {status === 'pending' && (
              <>
                <span className="text-yellow-600 text-base">⏳</span>
                <span className="text-xs text-yellow-700 font-medium">Fetching...</span>
              </>
            )}
            {status === 'error' && (
              <>
                <span className="text-red-600 text-base">❌</span>
                <span className="text-xs text-red-700 font-medium">Error</span>
              </>
            )}
            {status === 'none' && (
              <>
                <span className="text-gray-400 text-base">⚪</span>
                <span className="text-xs text-gray-500">Not fetched</span>
              </>
            )}
          </div>
          
          {/* Action Button */}
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (isFetching) return;
              
              // Mark as fetching
              setFetchingSerpKeywords(prev => new Set([...prev, item.keyword_id]));
              
              try {
                // Open serpjar in new tab with this keyword_id
                if (status === 'completed') {
                  // If already fetched, just view results
                  window.open(`/serpjar?keyword_id=${item.keyword_id}`, '_blank');
                } else {
                  // If not fetched or error, navigate and they can fetch from there
                  window.open(`/serpjar?keyword_id=${item.keyword_id}`, '_blank');
                }
              } finally {
                // Remove from fetching state after a brief delay
                setTimeout(() => {
                  setFetchingSerpKeywords(prev => {
                    const next = new Set(prev);
                    next.delete(item.keyword_id);
                    return next;
                  });
                }, 1000);
              }
            }}
            disabled={isFetching || status === 'pending'}
            className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-white text-xs font-bold transition-colors ${
              isFetching || status === 'pending'
                ? 'bg-gray-400 cursor-not-allowed'
                : status === 'completed'
                ? 'bg-green-600 hover:bg-green-700'
                : status === 'error'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            title={
              status === 'completed' ? 'View SERP results' :
              status === 'error' ? 'Retry fetch in SERP tool' :
              status === 'pending' ? 'Fetch in progress...' :
              'Fetch SERP in SERP tool'
            }
          >
            {status === 'completed' ? 'v' : 
             status === 'error' ? 'r' : 
             status === 'pending' ? '⋯' : 
             's'}
          </button>
        </div>
      );
    }

    // Special handling for SERP domains column (JSONB with all domains + EMD flags)
    if (column.type === 'serp_domains') {
      // Value should be from serp_cache_m1 nested object
      let domainsData = null;
      let zoneKey = '';
      if (column.key.includes('.')) {
        const [table, field] = column.key.split('.');
        if (table === 'serp_cache_m1' && item.serp_cache_m1) {
          domainsData = (item.serp_cache_m1 as any)[field];
          // Extract zone key from field name (e.g., 'zone_1_domains' -> '1')
          const match = field.match(/zone_(.+)_domains/);
          if (match) {
            zoneKey = match[1]; // '1', '2', '3', '4_10', '11_25', '26_50', '51_100'
          }
          
          // DEBUG: Log what we're receiving for the first 3 zones
          if (['1', '2', '3'].includes(zoneKey) && item.keyword_id) {
            console.log(`🔍 [KW ${item.keyword_id}] Zone ${zoneKey} raw data:`, JSON.stringify(domainsData));
          }
        }
      }

      // Check for new JSONB structure: {domains: [...]}
      const domainsArray = domainsData?.domains;

      if (!domainsArray || !Array.isArray(domainsArray) || domainsArray.length === 0) {
        return (
          <div className="px-2 py-1 text-xs">
            <span className="text-gray-400">-</span>
          </div>
        );
      }

      // Determine which zones should show ALL domains vs ONLY EMD matches
      const showAllDomainsZones = ['1', '2', '3', '4_10'];
      const shouldShowAllDomains = showAllDomainsZones.includes(zoneKey);

      // Filter domains based on zone
      const filteredDomains = shouldShowAllDomains 
        ? domainsArray // Show ALL domains for zones 1, 2, 3, 4-10
        : domainsArray.filter((d: any) => d.is_emd_m1 === true); // Show ONLY EMD for zones 11-25, 26-50, 51-100

      if (filteredDomains.length === 0) {
        return (
          <div className="px-2 py-1 text-xs">
            <span className="text-gray-400">-</span>
          </div>
        );
      }

      // Display domains horizontally with EMD highlighting
      return (
        <div className="px-2 py-1 text-xs whitespace-nowrap">
          <div className="flex items-center gap-2">
            {filteredDomains.map((domainObj: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="text-gray-500 text-[10px]">#{domainObj.rank}</span>
                <a
                  href={domainObj.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${domainObj.is_emd_m1 ? 'text-blue-600' : 'text-black'} hover:underline`}
                  title={`Rank ${domainObj.rank}: ${domainObj.domain}${domainObj.is_emd_m1 ? ' (EMD Match)' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!domainObj.url) {
                      e.preventDefault();
                      alert('No URL available for this result');
                    }
                  }}
                >
                  {domainObj.domain}
                </a>
                {idx < filteredDomains.length - 1 && (
                  <span className="text-gray-400">•</span>
                )}
              </div>
            ))}
            {/* Add staleness indicator at end of domain list (only show warnings/errors) */}
            {item.cache_status && item.cache_status !== 'CURRENT' && (
              <span className="ml-2">
                {item.cache_status === 'STALE' && <span className="text-orange-500" title="Cache is outdated - run F410+F420">⚠️</span>}
                {item.cache_status === 'NO_CACHE' && <span className="text-red-500" title="No cache - run Gazelle">✗</span>}
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        className={cellClass}
        onClick={() => !isReadOnly && startEditing(item.keyword_id, column.key, value)}
      >
        {value?.toString() || ''}
      </div>
    );
  };

  // Pagination Controls Component - Matching /filejar style
  // DataForSEO Actions Component
  const DataForSEOActions = useCallback(() => (
    <div className="flex items-center space-x-2">
      {/* Tooltip label */}
      <div className="relative group">
        <button className="bg-gray-100 text-gray-600 px-3 py-2 rounded-md text-sm font-medium cursor-help border border-gray-300">
          DFS Task Post/Get
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          Task Post/Get: Asynchronous processing
        </div>
      </div>
      
      {/* Refresh Metrics Button */}
      <button
        onClick={bulkRefreshMetrics}
        disabled={bulkRefreshing || selectedRows.size === 0}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          bulkRefreshing || selectedRows.size === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {bulkRefreshing ? 'Processing...' : 'Refresh Metrics'}
      </button>

      {/* Only Refresh Blanks Button */}
      <button
        onClick={bulkRefreshBlanks}
        disabled={blankRefreshing || bulkRefreshing}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          blankRefreshing || bulkRefreshing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {blankRefreshing ? 'Processing...' : 'only refresh blanks'}
      </button>

      {/* Reverse Lookup Refresh Button */}
      <button
        onClick={bulkRefreshReverseLookup}
        disabled={reverseLookupRefreshing || bulkRefreshing || blankRefreshing}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          reverseLookupRefreshing || bulkRefreshing || blankRefreshing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
        title={selectedRows.size > 0 ? `Refresh reverse lookup for ${selectedRows.size} selected keywords` : `Refresh reverse lookup for ${paginatedData.length} visible keywords`}
      >
        {reverseLookupRefreshing ? 'Processing...' : 'refresh reverse lookup'}
      </button>
      
      {/* Create New Buttons */}
      <button
        onClick={createNewInline}
        className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors"
      >
        Create New (Inline)
      </button>
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors"
      >
        Create New (Popup)
      </button>
    </div>
  ), [bulkRefreshing, blankRefreshing, reverseLookupRefreshing, selectedRows.size]);

  // Pass table actions to parent (must be after DataForSEOActions is defined)
  useEffect(() => {
    if (onTableActionsRender) {
      onTableActionsRender({
        DataForSEOActions
      });
    }
  }, [onTableActionsRender, DataForSEOActions]);

  const SearchField = () => {
    return (
      <div className="relative">
        <input
          type="text"
          placeholder="Search all fields..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-80 px-3 py-2 pr-12 border border-gray-300 rounded-md text-sm"
        />
        <button
          onClick={() => {
            setSearchTerm('');
            setCurrentPage(1);
          }}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black px-2 py-1 rounded text-xs font-medium"
        >
          CL
        </button>
      </div>
    );
  };

  const PaginationControls = () => {
    // Always show pagination controls
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <button
            onClick={() => {
              setItemsPerPage(10);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-l -mr-px cursor-pointer ${itemsPerPage === 10 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            10
          </button>
          <button
            onClick={() => {
              setItemsPerPage(20);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 20 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            20
          </button>
          <button
            onClick={() => {
              setItemsPerPage(50);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 50 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            50
          </button>
          <button
            onClick={() => {
              setItemsPerPage(100);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 100 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            100
          </button>
          <button
            onClick={() => {
              setItemsPerPage(200);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 200 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            200
          </button>
          <button
            onClick={() => {
              setItemsPerPage(500);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 500 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            500
          </button>
          <button
            onClick={() => {
              setItemsPerPage(filteredAndSortedData.length);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-r cursor-pointer ${itemsPerPage === filteredAndSortedData.length ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
          >
            All
          </button>
        </div>
        <div className="border-l border-gray-300 pl-2 ml-2">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-2.5 text-sm border rounded-l -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 py-2.5 text-sm border -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            >
              Prev
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
                    currentPage === pageNum 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 py-2.5 text-sm border -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-2.5 text-sm border rounded-r disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading keywords...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      {/* Polka dot pattern CSS for hoist columns */}
      <style jsx>{`
        .hoist-column-header {
          background-color: #F5F5DC;
          background-image: radial-gradient(circle, #D3D3D3 2px, transparent 2px);
          background-size: 12px 12px;
        }
      `}</style>
      
      <div className="h-full flex flex-col">
        {/* Table */}
        <div className="flex-1 bg-white overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="border-collapse border border-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              {/* First header row */}
              <tr>
                <th className="px-2 py-3 text-left border border-gray-200 bg-[#bcc4f1]" style={{ width: '20px' }}>
                  {/* Empty cell for checkbox column */}
                </th>
                {visibleColumns.map((column) => (
                  <th
                    key={`keywordshub-${column.key}`}
                    className={`px-2 py-3 text-left border border-gray-200 ${
                      column.isHoistColumn 
                        ? 'hoist-column-header' 
                        : (column.headerRow1BgClass || (column.key === 'tags' ? '' : 'bg-[#bcc4f1]'))
                    } ${
                      column.leftSeparator === 'black-4px' ? 'border-l-black border-l-[4px]' : ''
                    } ${
                      column.rightSeparator === 'black-4px' ? 'border-r-black border-r-[4px]' : ''
                    }`}
                    style={{ 
                      backgroundColor: column.key === 'tags' ? '#d3d3d3' : (column.isHoistColumn ? '#F5F5DC' : undefined)
                    }}
                  >
                    <span className="font-bold text-xs">
                      {column.key === 'serp_tool' ? 'tool' : 
                       column.headerRow1Text || (column.key === 'tags' ? 'multi db tables' : 'keywordshub')}
                    </span>
                  </th>
                ))}
              </tr>
              <tr>
                <th className="px-2 py-3 text-left border border-gray-200" style={{ width: '20px' }}>
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    style={{ width: '20px', height: '20px' }}
                    onClick={handleSelectAll}
                  >
                    <div
                      className={`w-full h-full border-2 flex items-center justify-center ${
                        selectedRows.size === paginatedData.length && paginatedData.length > 0
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300 bg-white'
                      }`}
                      style={{ width: '20px', height: '20px' }}
                    >
                      {selectedRows.size === paginatedData.length && paginatedData.length > 0 && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                  </div>
                </th>
                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-2 py-3 text-left border border-gray-200 ${
                      column.key === 'serp_tool' ? '' : 'cursor-pointer hover:bg-gray-100'
                    } ${
                      column.leftSeparator === 'black-4px' ? 'border-l-black border-l-[4px]' : ''
                    } ${
                      column.rightSeparator === 'black-4px' ? 'border-r-black border-r-[4px]' : ''
                    }`}
                    onClick={column.key === 'serp_tool' ? undefined : () => handleSort(column.key as keyof KeywordRecord)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-xs lowercase">
                        {column.key === 'serp_tool' ? 'serp' : (column.headerRow2Text || column.label)}
                      </span>
                      {sortField === column.key && column.key !== 'serp_tool' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedData.map((item) => (
                <tr key={item.keyword_id} className="hover:bg-gray-50">
                  <td className="px-2 py-2 border border-gray-200">
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      style={{ width: '20px', height: '20px' }}
                      onClick={() => handleRowSelect(item.keyword_id)}
                    >
                      <div
                        className={`w-full h-full border-2 flex items-center justify-center ${
                          selectedRows.has(item.keyword_id) 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 bg-white'
                        }`}
                        style={{ width: '20px', height: '20px' }}
                      >
                        {selectedRows.has(item.keyword_id) && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                    </div>
                  </td>
                  {visibleColumns.map((column) => (
                    <td 
                      key={column.key} 
                      className={`border border-gray-200 ${
                        column.leftSeparator === 'black-4px' ? 'border-l-black border-l-[4px]' : ''
                      } ${
                        column.rightSeparator === 'black-4px' ? 'border-r-black border-r-[4px]' : ''
                      }`}
                    >
                      {renderCell(item, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex-none bg-white border-t px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <PaginationControls />
            <div className="relative">
              <input
                type="text"
                placeholder="Search all fields..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-80 px-3 py-2 pr-12 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black px-2 py-1 rounded text-xs font-medium"
              >
                CL
              </button>
            </div>
          </div>
          <div></div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Keyword Record</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                  <input
                    type="text"
                    value={formData.keyword_datum}
                    onChange={(e) => setFormData({...formData, keyword_datum: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter keyword"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Volume</label>
                  <input
                    type="number"
                    value={formData.search_volume}
                    onChange={(e) => setFormData({...formData, search_volume: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPC</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cpc}
                    onChange={(e) => setFormData({...formData, cpc: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Display Name</label>
                  <input
                    type="text"
                    value={formData.location_display_name}
                    onChange={(e) => setFormData({...formData, location_display_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="United States"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language Code</label>
                  <input
                    type="text"
                    value={formData.language_code}
                    onChange={(e) => setFormData({...formData, language_code: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="en"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Competition</label>
                  <select
                    value={formData.competition}
                    onChange={(e) => setFormData({...formData, competition: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select competition</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Keyword
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
}