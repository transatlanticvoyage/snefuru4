'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface KeywordRecord {
  keyword_id: number;
  keyword_datum: string;
  search_volume: number | null;
  cpc: number | null;
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
  tags?: Array<{ tag_id: number; tag_name: string }>;
}

interface ColumnDefinition {
  key: string;
  label: string;
  type: string;
  leftSeparator?: string;
  rightSeparator?: string;
}

const columns: ColumnDefinition[] = [
  { key: 'keyword_id', label: 'keyword_id', type: 'number' },
  { key: 'keyword_datum', label: 'keyword_datum', type: 'text' },
  { key: 'search_volume', label: 'search_volume', type: 'number' },
  { key: 'cpc', label: 'cpc', type: 'number', rightSeparator: 'black-4px' },
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
  { key: 'tags', label: 'tags', type: 'tags' }
];

interface KeywordsHubTableProps {
  selectedTagId?: number;
  onColumnPaginationRender?: (controls: {
    ColumnPaginationBar1: () => JSX.Element | null;
    ColumnPaginationBar2: () => JSX.Element | null;
  }) => void;
  initialColumnsPerPage?: number;
  initialColumnPage?: number;
  onColumnPaginationChange?: (columnsPerPage: number, currentPage: number) => void;
}

export default function KeywordsHubTable({ 
  selectedTagId, 
  onColumnPaginationRender, 
  initialColumnsPerPage = 8,
  initialColumnPage = 1,
  onColumnPaginationChange
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
    try {
      setLoading(true);
      
      let query = supabase
        .from('keywordshub')
        .select('*');

      // If a tag is selected, filter by keywords that have this tag
      if (selectedTagId) {
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
      
      // Fetch tag information for each keyword
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
        
        // Add tags to keywords
        const keywordsWithTags = keywords.map(keyword => ({
          ...keyword,
          tags: tagsByKeywordId[keyword.keyword_id] || []
        }));
        
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
    fetchData();
  }, [selectedTagId]);

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
  const stickyColumnKeys = ['keyword_id', 'keyword_datum', 'search_volume', 'cpc'];
  const stickyColumns = columns.filter(col => stickyColumnKeys.includes(col.key));
  const paginatedColumns = columns.filter(col => !stickyColumnKeys.includes(col.key));
  
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

  // Notify parent of column pagination changes
  useEffect(() => {
    if (onColumnPaginationChange) {
      onColumnPaginationChange(columnsPerPage, currentColumnPage);
    }
  }, [columnsPerPage, currentColumnPage, onColumnPaginationChange]);

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
    setRefreshingKeywords(prev => new Set([...prev, keywordId]));
    
    try {
      const response = await fetch('/api/dataforseo-refresh-live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword_id: keywordId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to refresh data');
      }

      // Update local data with refreshed values
      setData(prevData => 
        prevData.map(item => 
          item.keyword_id === keywordId 
            ? { 
                ...item, 
                ...result.data,
                updated_at: new Date().toISOString() 
              }
            : item
        )
      );

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
    setBulkRefreshing(true);
    
    try {
      // Get selected keywords
      const selectedKeywordIds = Array.from(selectedRows);
      if (selectedKeywordIds.length === 0) {
        alert('Please select keywords to refresh');
        return;
      }

      const response = await fetch('/api/dataforseo-refresh-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          keyword_ids: selectedKeywordIds,
          field: 'cpc'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start bulk refresh');
      }

      alert(`Bulk refresh started for ${selectedKeywordIds.length} keywords. Results will be available shortly.`);
      
      // Refresh the table data after a delay
      setTimeout(() => {
        fetchData();
      }, 5000);

    } catch (error) {
      console.error('❌ Failed to start bulk refresh:', error);
      alert(`Failed to start bulk refresh: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBulkRefreshing(false);
    }
  };

  // Create new inline record
  const createNewInline = async () => {
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
  };

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
    const value = item[column.key as keyof KeywordRecord];
    const isEditing = editingCell?.id === item.keyword_id && editingCell?.field === column.key;
    const isReadOnly = column.key === 'keyword_id' || column.key === 'created_at' || column.key === 'updated_at';

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
      
      return (
        <div
          className={cellClass}
          onClick={() => !isReadOnly && startEditing(item.keyword_id, column.key, value)}
        >
          {typeof value === 'number' ? (column.key === 'rel_dfs_location_code' ? value.toString() : value.toLocaleString()) : value}
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
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex-none bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <NubraTablefaceKite text="nubra-tableface-kite" />
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
            
            {/* DataForSEO Bulk Refresh Controls */}
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
              
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
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
          </div>
        </div>
      </div>

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
                      column.key === 'tags' ? '' : 'bg-[#bcc4f1]'
                    } ${
                      column.leftSeparator === 'black-4px' ? 'border-l-black border-l-[4px]' : ''
                    } ${
                      column.rightSeparator === 'black-4px' ? 'border-r-black border-r-[4px]' : ''
                    }`}
                    style={{ 
                      backgroundColor: column.key === 'tags' ? '#d3d3d3' : undefined 
                    }}
                  >
                    <span className="font-bold text-xs">
                      {column.key === 'tags' ? 'multi db tables' : 'keywordshub'}
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
                    className={`px-2 py-3 text-left border border-gray-200 cursor-pointer hover:bg-gray-100 ${
                      column.leftSeparator === 'black-4px' ? 'border-l-black border-l-[4px]' : ''
                    } ${
                      column.rightSeparator === 'black-4px' ? 'border-r-black border-r-[4px]' : ''
                    }`}
                    onClick={() => handleSort(column.key as keyof KeywordRecord)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-xs lowercase">{column.label}</span>
                      {sortField === column.key && (
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
  );
}