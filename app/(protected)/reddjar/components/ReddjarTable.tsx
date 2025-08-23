'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface RedditUrl {
  url_id: number;
  url_datum: string | null;
  count_obls?: number;
  subreddit_name: string | null;
  post_id: string | null;
  post_title: string | null;
  keyword: string | null;
  current_position: number | null;
  previous_position: number | null;
  position_type: string | null;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  number_of_results: number | null;
  estimated_traffic: number | null;
  traffic_percentage: number | null;
  estimated_traffic_cost: number | null;
  trends_data: any;
  serp_features: string[] | null;
  keyword_intents: string[] | null;
  data_timestamp: string | null;
  created_at: string;
  updated_at: string;
}

interface OutboundLink {
  link_id: number;
  source_url_id: number;
  comment_id: string | null;
  source_type: string | null;
  raw_url: string | null;
  resolved_url: string | null;
  domain: string | null;
  anchor_text: string | null;
  http_status: number | null;
  first_seen: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

interface ReddjarTableProps {
  onColumnPaginationRender?: (controls: {
    ColumnPaginationBar1: () => JSX.Element | null;
    ColumnPaginationBar2: () => JSX.Element | null;
  }) => void;
  selectedRows?: Set<number>;
  onSelectionChange?: (selectedRows: Set<number>) => void;
}

export default function ReddjarTable({ 
  onColumnPaginationRender, 
  selectedRows = new Set(), 
  onSelectionChange 
}: ReddjarTableProps = {}) {
  const [data, setData] = useState<RedditUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [sortField, setSortField] = useState<keyof RedditUrl>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Column pagination states
  const [columnsPerPage, setColumnsPerPage] = useState(8); // Show 8 columns at a time
  const [currentColumnPage, setCurrentColumnPage] = useState(1);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Expandable row states
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [outboundLinks, setOutboundLinks] = useState<Record<number, OutboundLink[]>>({});
  const [loadingLinks, setLoadingLinks] = useState<Set<number>>(new Set());
  
  // Form data for creating/editing
  const [formData, setFormData] = useState({
    url_datum: '',
    count_obls: 0,
    subreddit_name: '',
    post_id: '',
    post_title: '',
    keyword: '',
    current_position: 0,
    previous_position: 0,
    position_type: 'Organic',
    search_volume: 0,
    keyword_difficulty: 0,
    cpc: 0,
    competition: 0,
    number_of_results: 0,
    estimated_traffic: 0,
    traffic_percentage: 0,
    estimated_traffic_cost: 0,
    trends_data: '',
    serp_features: '',
    keyword_intents: '',
    data_timestamp: ''
  });
  
  const supabase = createClientComponentClient();
  
  // Column definitions with proper grouping and widths
  const columns: Array<{ 
    key: keyof RedditUrl; 
    type: string; 
    width: string; 
    group?: string; 
    separator?: 'right';
    label: string;
  }> = [
    { key: 'url_id', type: 'integer', width: '80px', label: 'url_id' },
    { key: 'url_datum', type: 'text', width: '280px', label: 'url_datum' },
    { key: 'count_obls', type: 'integer', width: '100px', label: 'count_obls' },
    { key: 'subreddit_name', type: 'text', width: '150px', label: 'subreddit_name' },
    { key: 'post_id', type: 'text', width: '120px', label: 'post_id' },
    { key: 'post_title', type: 'text', width: '250px', label: 'post_title', separator: 'right' },
    { key: 'keyword', type: 'text', width: '200px', label: 'keyword' },
    { key: 'current_position', type: 'integer', width: '80px', label: 'current_position' },
    { key: 'previous_position', type: 'integer', width: '80px', label: 'previous_position' },
    { key: 'position_type', type: 'text', width: '100px', label: 'position_type', separator: 'right' },
    { key: 'search_volume', type: 'integer', width: '100px', label: 'search_volume' },
    { key: 'keyword_difficulty', type: 'integer', width: '80px', label: 'keyword_difficulty' },
    { key: 'cpc', type: 'decimal', width: '80px', label: 'cpc' },
    { key: 'competition', type: 'decimal', width: '80px', label: 'competition' },
    { key: 'number_of_results', type: 'integer', width: '120px', label: 'number_of_results', separator: 'right' },
    { key: 'estimated_traffic', type: 'integer', width: '100px', label: 'estimated_traffic' },
    { key: 'traffic_percentage', type: 'decimal', width: '100px', label: 'traffic_percentage' },
    { key: 'estimated_traffic_cost', type: 'decimal', width: '120px', label: 'estimated_traffic_cost', separator: 'right' },
    { key: 'trends_data', type: 'json', width: '200px', label: 'trends_data' },
    { key: 'serp_features', type: 'array', width: '200px', label: 'serp_features' },
    { key: 'keyword_intents', type: 'array', width: '150px', label: 'keyword_intents', separator: 'right' },
    { key: 'data_timestamp', type: 'date', width: '120px', label: 'data_timestamp' },
    { key: 'created_at', type: 'timestamp', width: '180px', label: 'created_at' },
    { key: 'updated_at', type: 'timestamp', width: '180px', label: 'updated_at' }
  ];
  
  // Column pagination logic
  const totalColumnPages = Math.ceil(columns.length / columnsPerPage);
  const startColumnIndex = (currentColumnPage - 1) * columnsPerPage;
  const visibleColumns = columns.slice(startColumnIndex, startColumnIndex + columnsPerPage);
  
  // Column Pagination Components - Define before use
  // Bar 1: Columns per page quantity selector
  const ColumnPaginationBar1 = () => {
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Cols/page:</span>
          <button
            onClick={() => {
              setColumnsPerPage(4);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-l -mr-px cursor-pointer ${
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
  }, [onColumnPaginationRender, currentColumnPage, totalColumnPages]);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch main data first
      const { data: tableData, error: fetchError } = await supabase
        .from('redditurlsvat')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (fetchError) throw fetchError;
      
      if (!tableData || tableData.length === 0) {
        setData([]);
        return;
      }
      
      // Initialize data with count_obls as 0 for now
      const processedData = tableData.map(item => ({
        ...item,
        count_obls: 0
      }));
      
      setData(processedData);
      
      // Fetch counts asynchronously without blocking the UI
      fetchOutboundLinkCounts(processedData);
      
    } catch (err) {
      console.error('Error fetching reddit urls:', err);
      setError('Failed to fetch reddit urls');
    } finally {
      setLoading(false);
    }
  };

  // Separate function to fetch outbound link counts
  const fetchOutboundLinkCounts = async (tableData: RedditUrl[]) => {
    try {
      // Get all outbound links and count by source_url_id
      const { data: linkCounts } = await supabase
        .from('redditoblinks')
        .select('source_url_id');
      
      if (linkCounts) {
        // Create a map of url_id to count
        const countsMap = new Map();
        linkCounts.forEach(link => {
          const count = countsMap.get(link.source_url_id) || 0;
          countsMap.set(link.source_url_id, count + 1);
        });
        
        // Update the data with counts
        const updatedData = tableData.map(item => ({
          ...item,
          count_obls: countsMap.get(item.url_id) || 0
        }));
        
        setData(updatedData);
      }
    } catch (err) {
      console.warn('Error fetching outbound link counts:', err);
      // Keep the original data with counts as 0
    }
  };
  
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
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof RedditUrl) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle inline editing
  const handleCellClick = (id: number, field: string, currentValue: any) => {
    if (field === 'url_id' || field === 'created_at') {
      return; // Don't allow editing these fields
    }
    
    setEditingCell({ id, field });
    setEditingValue(currentValue?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    let processedValue: any = editingValue;

    // Process value based on field type
    const column = columns.find(col => col.key === field);
    if (column?.type === 'integer') {
      processedValue = editingValue === '' ? null : parseInt(editingValue);
      if (isNaN(processedValue)) {
        processedValue = null;
      }
    } else if (column?.type === 'decimal') {
      processedValue = editingValue === '' ? null : parseFloat(editingValue);
      if (isNaN(processedValue)) {
        processedValue = null;
      }
    } else if (column?.type === 'json') {
      if (editingValue.trim()) {
        try {
          processedValue = JSON.parse(editingValue);
        } catch {
          alert('Invalid JSON format');
          return;
        }
      } else {
        processedValue = null;
      }
    } else if (column?.type === 'array') {
      if (editingValue.trim()) {
        try {
          processedValue = JSON.parse(editingValue);
          if (!Array.isArray(processedValue)) {
            // If it's not an array, make it one
            processedValue = [processedValue];
          }
        } catch {
          // Try to split by comma as fallback
          processedValue = editingValue.split(',').map(s => s.trim()).filter(s => s);
        }
      } else {
        processedValue = null;
      }
    } else if (editingValue === '') {
      processedValue = null;
    }

    await updateField(id, field as keyof RedditUrl, processedValue);
    setEditingCell(null);
    setEditingValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const updateField = async (id: number, field: keyof RedditUrl, value: any) => {
    try {
      const { error } = await supabase
        .from('redditurlsvat')
        .update({ [field]: value })
        .eq('url_id', id);

      if (error) {
        console.error('Error updating field:', error);
        return;
      }

      // Update local state
      setData(prev => prev.map(item => 
        item.url_id === id ? { ...item, [field]: value } : item
      ));
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  // Create new record inline
  const createNewUrlInline = async () => {
    try {
      const { data: newRecord, error } = await supabase
        .from('redditurlsvat')
        .insert({
          url_datum: null,
          subreddit_name: null,
          post_id: null,
          post_title: null,
          keyword: null,
          current_position: null,
          previous_position: 0,
          position_type: 'Organic',
          search_volume: null,
          keyword_difficulty: null,
          cpc: null,
          competition: null,
          number_of_results: null,
          estimated_traffic: null,
          traffic_percentage: 0,
          estimated_traffic_cost: null,
          trends_data: null,
          serp_features: null,
          keyword_intents: null,
          data_timestamp: null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new reddit url record:', error);
        return;
      }

      // Add the new record to the local state
      setData(prev => [newRecord, ...prev]);
      
      // Reset to first page to show the new record
      setCurrentPage(1);
    } catch (error) {
      console.error('Error creating new reddit url record:', error);
    }
  };

  // Handle create from modal
  const handleCreate = async () => {
    try {
      let trendsData = null;
      if (formData.trends_data && formData.trends_data.trim()) {
        try {
          trendsData = JSON.parse(formData.trends_data);
        } catch (parseError) {
          alert('Invalid JSON in trends_data field. Please check the format.');
          return;
        }
      }

      let serpFeatures = null;
      if (formData.serp_features && formData.serp_features.trim()) {
        try {
          serpFeatures = JSON.parse(formData.serp_features);
          if (!Array.isArray(serpFeatures)) {
            serpFeatures = [serpFeatures];
          }
        } catch (parseError) {
          serpFeatures = formData.serp_features.split(',').map(s => s.trim()).filter(s => s);
        }
      }

      let keywordIntents = null;
      if (formData.keyword_intents && formData.keyword_intents.trim()) {
        try {
          keywordIntents = JSON.parse(formData.keyword_intents);
          if (!Array.isArray(keywordIntents)) {
            keywordIntents = [keywordIntents];
          }
        } catch (parseError) {
          keywordIntents = formData.keyword_intents.split(',').map(s => s.trim()).filter(s => s);
        }
      }
      
      const insertData = {
        url_datum: formData.url_datum?.trim() || null,
        subreddit_name: formData.subreddit_name?.trim() || null,
        post_id: formData.post_id?.trim() || null,
        post_title: formData.post_title?.trim() || null,
        keyword: formData.keyword?.trim() || null,
        current_position: formData.current_position || null,
        previous_position: formData.previous_position || 0,
        position_type: formData.position_type?.trim() || 'Organic',
        search_volume: formData.search_volume || null,
        keyword_difficulty: formData.keyword_difficulty || null,
        cpc: formData.cpc || null,
        competition: formData.competition || null,
        number_of_results: formData.number_of_results || null,
        estimated_traffic: formData.estimated_traffic || null,
        traffic_percentage: formData.traffic_percentage || 0,
        estimated_traffic_cost: formData.estimated_traffic_cost || null,
        trends_data: trendsData,
        serp_features: serpFeatures,
        keyword_intents: keywordIntents,
        data_timestamp: formData.data_timestamp?.trim() || null
      };
      
      const { error: insertError } = await supabase
        .from('redditurlsvat')
        .insert([insertData]);
        
      if (insertError) throw insertError;
      
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
      url_datum: '',
      subreddit_name: '',
      post_id: '',
      post_title: '',
      keyword: '',
      current_position: 0,
      previous_position: 0,
      position_type: 'Organic',
      search_volume: 0,
      keyword_difficulty: 0,
      cpc: 0,
      competition: 0,
      number_of_results: 0,
      estimated_traffic: 0,
      traffic_percentage: 0,
      estimated_traffic_cost: 0,
      trends_data: '',
      serp_features: '',
      keyword_intents: '',
      data_timestamp: ''
    });
  };

  // Fetch outbound links for a specific URL
  const fetchOutboundLinks = async (urlId: number) => {
    if (outboundLinks[urlId]) {
      return; // Already fetched
    }

    setLoadingLinks(prev => new Set(prev).add(urlId));
    
    try {
      const { data, error } = await supabase
        .from('redditoblinks')
        .select('*')
        .eq('source_url_id', urlId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching outbound links:', error);
        return;
      }

      setOutboundLinks(prev => ({
        ...prev,
        [urlId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching outbound links:', error);
    } finally {
      setLoadingLinks(prev => {
        const newSet = new Set(prev);
        newSet.delete(urlId);
        return newSet;
      });
    }
  };

  // Toggle expanded row
  const toggleRowExpansion = (urlId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(urlId)) {
      newExpanded.delete(urlId);
    } else {
      newExpanded.add(urlId);
      // Fetch outbound links when expanding
      fetchOutboundLinks(urlId);
    }
    setExpandedRows(newExpanded);
  };

  // Render cell content
  const renderCell = (item: RedditUrl, column: typeof columns[0]) => {
    const value = item[column.key];
    const isEditing = editingCell?.id === item.url_id && editingCell?.field === column.key;
    const isReadOnly = column.key === 'url_id' || column.key === 'created_at';

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <textarea
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCellSave();
              }
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            autoFocus
            rows={column.type === 'json' || column.type === 'array' ? 3 : 1}
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

    // Format display value
    let displayValue = '';
    if (column.type === 'json') {
      displayValue = value ? JSON.stringify(value) : '';
    } else if (column.type === 'array') {
      displayValue = value && Array.isArray(value) ? JSON.stringify(value) : (value ? String(value) : '');
    } else if (column.type === 'timestamp') {
      displayValue = value ? new Date(value as string).toLocaleString() : '';
    } else if (column.type === 'date') {
      displayValue = value ? new Date(value as string).toLocaleDateString() : '';
    } else if (column.type === 'decimal') {
      displayValue = value !== null && value !== undefined ? parseFloat(value as string).toFixed(2) : '';
    } else {
      displayValue = value?.toString() || '';
    }

    // Special handling for count_obls column to show EXP button
    if (column.key === 'count_obls') {
      return (
        <div className="flex items-center gap-1">
          <div
            onClick={() => !isReadOnly && handleCellClick(item.url_id, column.key, value)}
            className={`min-h-[1.25rem] px-1 py-0.5 rounded ${
              !isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
            } ${isReadOnly ? 'text-gray-500' : ''}`}
            style={{ whiteSpace: 'nowrap' }}
            title={isReadOnly ? displayValue : `${displayValue} (Click to edit)`}
          >
            {displayValue}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleRowExpansion(item.url_id);
            }}
            className="w-8 h-7 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded transition-colors flex items-center justify-center"
            style={{ fontSize: '10px' }}
            title={expandedRows.has(item.url_id) ? 'Collapse outbound links' : 'Expand outbound links'}
          >
            EXP
          </button>
        </div>
      );
    }

    // Special handling for url_datum column to show copy and open URL buttons
    if (column.key === 'url_datum') {
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (displayValue) {
                navigator.clipboard.writeText(displayValue);
              }
            }}
            className="w-5 h-5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded transition-colors flex items-center justify-center"
            style={{ fontSize: '10px' }}
            title="Copy URL to clipboard"
          >
            C
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (displayValue) {
                window.open(displayValue, '_blank', 'noopener,noreferrer');
              }
            }}
            className="w-5 h-5 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors flex items-center justify-center"
            title="Open URL in new tab"
          >
            →
          </button>
          <div
            onClick={() => !isReadOnly && handleCellClick(item.url_id, column.key, value)}
            className={`min-h-[1.25rem] px-1 py-0.5 rounded ${
              !isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
            } ${isReadOnly ? 'text-gray-500' : ''}`}
            style={{ whiteSpace: 'nowrap' }}
            title={isReadOnly ? displayValue : `${displayValue} (Click to edit)`}
          >
            {displayValue}
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={() => !isReadOnly && handleCellClick(item.url_id, column.key, value)}
        className={`min-h-[1.25rem] px-1 py-0.5 rounded ${
          !isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
        } ${isReadOnly ? 'text-gray-500' : ''}`}
        style={{ 
          whiteSpace: 'nowrap'
        }}
        title={isReadOnly ? displayValue : `${displayValue} (Click to edit)`}
      >
        {displayValue}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading Reddit URLs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <button
            onClick={() => {
              setItemsPerPage(10);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-l -mr-px cursor-pointer ${itemsPerPage === 10 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px', backgroundColor: itemsPerPage === 10 ? '#f8f782' : undefined }}
          >
            10
          </button>
          <button
            onClick={() => {
              setItemsPerPage(20);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 20 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px', backgroundColor: itemsPerPage === 20 ? '#f8f782' : undefined }}
          >
            20
          </button>
          <button
            onClick={() => {
              setItemsPerPage(50);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 50 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px', backgroundColor: itemsPerPage === 50 ? '#f8f782' : undefined }}
          >
            50
          </button>
          <button
            onClick={() => {
              setItemsPerPage(100);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 100 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px', backgroundColor: itemsPerPage === 100 ? '#f8f782' : undefined }}
          >
            100
          </button>
          <button
            onClick={() => {
              setItemsPerPage(200);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 200 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px', backgroundColor: itemsPerPage === 200 ? '#f8f782' : undefined }}
          >
            200
          </button>
          <button
            onClick={() => {
              setItemsPerPage(500);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${itemsPerPage === 500 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px', backgroundColor: itemsPerPage === 500 ? '#f8f782' : undefined }}
          >
            500
          </button>
          <button
            onClick={() => {
              setItemsPerPage(filteredAndSortedData.length);
              setCurrentPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-r cursor-pointer ${itemsPerPage === filteredAndSortedData.length ? 'text-black border-black' : 'bg-white hover:bg-gray-200'}`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px', backgroundColor: itemsPerPage === filteredAndSortedData.length ? '#f8f782' : undefined }}
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
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 py-2.5 text-sm border -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
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
                  style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 py-2.5 text-sm border -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-2.5 text-sm border rounded-r disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              Last
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Top Controls */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 border-t-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <NubraTablefaceKite text="nubra-tableface-kite" />
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} urls
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>
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
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={createNewUrlInline}
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
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="border-collapse border border-gray-200" style={{ tableLayout: 'auto' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left border border-gray-200">
                  <div 
                    className="w-full h-full cursor-pointer flex items-center justify-center"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      const checkbox = target.closest('th')?.querySelector('input[type="checkbox"]') as HTMLInputElement;
                      if (checkbox && target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change'));
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ width: '20px', height: '20px' }}
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={(e) => {
                        if (onSelectionChange) {
                          if (e.target.checked) {
                            onSelectionChange(new Set(paginatedData.map(item => item.url_id)));
                          } else {
                            onSelectionChange(new Set());
                          }
                        }
                      }}
                    />
                  </div>
                </th>
                {visibleColumns.map((column, index) => {
                  const isReadOnly = column.key === 'url_id' || column.key === 'created_at' || column.key === 'count_obls';
                  const hasRightSeparator = column.separator === 'right';
                  
                  return (
                    <th
                      key={column.key}
                      className={`text-left cursor-pointer hover:bg-gray-100 border border-gray-200 px-2 py-1 ${
                        hasRightSeparator ? 'border-r-4 border-r-black' : ''
                      }`}
                      style={{ 
                        backgroundColor: column.key === 'count_obls' ? '#dbeafe' : undefined,
                        whiteSpace: 'nowrap'
                      }}
                      onClick={() => handleSort(column.key)}
                    >
                      <div className="flex items-center space-x-1">
                        <span 
                          className={`font-bold text-xs lowercase ${isReadOnly ? 'text-gray-500' : 'text-gray-900'}`}
                          style={{
                            wordBreak: 'break-all',
                            lineHeight: '1.1',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxHeight: '2.2em'
                          }}
                        >
                          {column.label.toLowerCase()}
                        </span>
                        {!isReadOnly && (
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
                <>
                  <tr key={item.url_id} className="hover:bg-gray-50">
                    <td className="px-2 py-3 border border-gray-200">
                      <div 
                        className="w-full h-full cursor-pointer flex items-center justify-center"
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          const checkbox = target.closest('td')?.querySelector('input[type="checkbox"]') as HTMLInputElement;
                          if (checkbox && target !== checkbox) {
                            checkbox.checked = !checkbox.checked;
                            checkbox.dispatchEvent(new Event('change'));
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          style={{ width: '20px', height: '20px' }}
                          checked={selectedRows.has(item.url_id)}
                          onChange={(e) => {
                            if (onSelectionChange) {
                              const newSelected = new Set(selectedRows);
                              if (e.target.checked) {
                                newSelected.add(item.url_id);
                              } else {
                                newSelected.delete(item.url_id);
                              }
                              onSelectionChange(newSelected);
                            }
                          }}
                        />
                      </div>
                    </td>
                    {visibleColumns.map((column, index) => {
                      const hasRightSeparator = column.separator === 'right';
                      
                      return (
                        <td
                          key={column.key}
                          className={`text-sm border border-gray-200 px-2 py-1 ${
                            hasRightSeparator ? 'border-r-4 border-r-black' : ''
                          }`}
                          style={{ 
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {renderCell(item, column)}
                        </td>
                      );
                    })}
                  </tr>
                  
                  {/* Expanded row for outbound links */}
                  {expandedRows.has(item.url_id) && (
                    <tr key={`expanded-${item.url_id}`} className="bg-gray-50">
                      <td colSpan={visibleColumns.length + 1} className="px-4 py-4 border border-gray-200">
                        <div className="space-y-3">
                          <h3 className="font-bold text-base text-gray-800">
                            Outbound Links
                          </h3>
                          
                          {loadingLinks.has(item.url_id) ? (
                            <div className="text-gray-500 text-sm">Loading outbound links...</div>
                          ) : outboundLinks[item.url_id]?.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full bg-white border border-gray-300 rounded-md">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300">link_id</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300">source_url_id</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300">comment_id</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300">source_type</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300">raw_url</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300">resolved_url</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300">domain</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300">anchor_text</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300">http_status</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300">first_seen</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300">last_seen</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300">created_at</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300">updated_at</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {outboundLinks[item.url_id].map((link) => (
                                    <tr key={link.link_id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">{link.link_id}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">{link.source_url_id}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">{link.comment_id || '-'}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">{link.source_type || '-'}</td>
                                      <td className="px-3 py-2 text-sm text-blue-600 border-b border-gray-200 max-w-xs truncate" title={link.raw_url || ''}>
                                        {link.raw_url ? (
                                          <a href={link.raw_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            {link.raw_url}
                                          </a>
                                        ) : '-'}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-blue-600 border-b border-gray-200 max-w-xs truncate" title={link.resolved_url || ''}>
                                        {link.resolved_url ? (
                                          <a href={link.resolved_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            {link.resolved_url}
                                          </a>
                                        ) : '-'}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">{link.domain || '-'}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200 max-w-xs truncate" title={link.anchor_text || ''}>{link.anchor_text || '-'}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">{link.http_status || '-'}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">{link.first_seen ? new Date(link.first_seen).toLocaleDateString() : '-'}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">{link.last_seen ? new Date(link.last_seen).toLocaleDateString() : '-'}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">{new Date(link.created_at).toLocaleDateString()}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">{new Date(link.updated_at).toLocaleDateString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-gray-500 text-sm">No outbound links found for this URL.</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} urls
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>
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
          <div className="bg-white p-6 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Reddit URL Record</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* URL Information */}
                <div className="md:col-span-4">
                  <h4 className="font-medium text-gray-700 mb-2">URL Information</h4>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Datum</label>
                  <input
                    type="text"
                    value={formData.url_datum}
                    onChange={(e) => setFormData({...formData, url_datum: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="https://www.reddit.com/r/subreddit/comments/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subreddit Name</label>
                  <input
                    type="text"
                    value={formData.subreddit_name}
                    onChange={(e) => setFormData({...formData, subreddit_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="askreddit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Post ID</label>
                  <input
                    type="text"
                    value={formData.post_id}
                    onChange={(e) => setFormData({...formData, post_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="1kovuni"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Post Title</label>
                  <input
                    type="text"
                    value={formData.post_title}
                    onChange={(e) => setFormData({...formData, post_title: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Post title here..."
                  />
                </div>

                {/* SEO Data */}
                <div className="md:col-span-4 mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">SEO Data</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                  <input
                    type="text"
                    value={formData.keyword}
                    onChange={(e) => setFormData({...formData, keyword: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="best buy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Position</label>
                  <input
                    type="number"
                    value={formData.current_position}
                    onChange={(e) => setFormData({...formData, current_position: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Position</label>
                  <input
                    type="number"
                    value={formData.previous_position}
                    onChange={(e) => setFormData({...formData, previous_position: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position Type</label>
                  <select
                    value={formData.position_type}
                    onChange={(e) => setFormData({...formData, position_type: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="Organic">Organic</option>
                    <option value="AI overview">AI overview</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                {/* Metrics */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Volume</label>
                  <input
                    type="number"
                    value={formData.search_volume}
                    onChange={(e) => setFormData({...formData, search_volume: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keyword Difficulty</label>
                  <input
                    type="number"
                    value={formData.keyword_difficulty}
                    onChange={(e) => setFormData({...formData, keyword_difficulty: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPC</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cpc}
                    onChange={(e) => setFormData({...formData, cpc: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Competition</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.competition}
                    onChange={(e) => setFormData({...formData, competition: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Timestamp</label>
                  <input
                    type="date"
                    value={formData.data_timestamp}
                    onChange={(e) => setFormData({...formData, data_timestamp: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Trends Data (JSON)</label>
                <textarea
                  value={formData.trends_data}
                  onChange={(e) => setFormData({...formData, trends_data: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder='[29,54,36,36,36,24,44,81,44,29,24,36]'
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SERP Features (JSON array or comma-separated)</label>
                  <textarea
                    value={formData.serp_features}
                    onChange={(e) => setFormData({...formData, serp_features: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                    placeholder='["Knowledge panel", "Local pack", "Sitelinks"] or Knowledge panel, Local pack, Sitelinks'
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keyword Intents (JSON array or comma-separated)</label>
                  <textarea
                    value={formData.keyword_intents}
                    onChange={(e) => setFormData({...formData, keyword_intents: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                    placeholder='["commercial", "navigational"] or commercial, navigational'
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create Reddit URL Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

