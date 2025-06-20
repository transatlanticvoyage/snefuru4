"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  created_at: string;
  updated_at: string;
}

interface GconPiecesTableProps {
  initialData: GconPiece[];
  userId: string;
}

type SortField = "meta_title" | "asn_sitespren_base" | "pub_status" | "date_time_pub_carry" | "pageslug" | "created_at" | "updated_at";
type SortOrder = "asc" | "desc";
type ColumnTemplateKey = 'option1' | 'option2' | 'option3' | 'option4' | 'option5';

const allColumns = [
  'select',
  'actions',
  'id',
  'is_starred1',
  'is_starred2',
  'meta_title', 
  'h1title',
  'pgb_h1title',
  'corpus1',
  'corpus2',
  'asn_sitespren_base',
  'asn_nwpi_posts_id',
  'asn_imgplanbatch_id',
  'image_pack1',
  'pub_status',
  'date_time_pub_carry',
  'pageslug',
  'pageurl',
  'pelementor_cached',
  'pelementor_edits',
  'created_at',
  'updated_at'
];

// Mapping from gcon_pieces fields to their nwpi_content source fields
const sourceFieldMapping: Record<string, string> = {
  'meta_title': 'post_title',
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

export default function GconPiecesTable({ initialData, userId }: GconPiecesTableProps) {
  const [data, setData] = useState<GconPiece[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterSite, setFilterSite] = useState("");
  const [filterPage, setFilterPage] = useState("");
  const [selectedColumnTemplate, setSelectedColumnTemplate] = useState<ColumnTemplateKey>('option1');
  const [stickyColumnCount, setStickyColumnCount] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [updatingStars, setUpdatingStars] = useState<Set<string>>(new Set());
  const [nsFullData, setNsFullData] = useState<string>('');
  
  const router = useRouter();
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

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
      const savedColTemp = localStorage.getItem('pedazos1_columnTemplate');
      if (savedColTemp && savedColTemp in columnTemplates) {
        setSelectedColumnTemplate(savedColTemp as ColumnTemplateKey);
      }
    }
    
    if (urlStickyCol) {
      const stickyCount = parseInt(urlStickyCol.replace('option', ''));
      if (!isNaN(stickyCount) && stickyCount >= 0 && stickyCount <= 5) {
        setStickyColumnCount(stickyCount);
      }
    } else {
      // Fall back to localStorage
      const savedStickyCount = localStorage.getItem('pedazos1_stickyColumns');
      if (savedStickyCount) {
        const count = parseInt(savedStickyCount);
        if (!isNaN(count) && count >= 0 && count <= 5) {
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
    router.replace(`/pedazos1?${params.toString()}`, { scroll: false });
    
    // Update localStorage
    localStorage.setItem('pedazos1_columnTemplate', selectedColumnTemplate);
    localStorage.setItem('pedazos1_stickyColumns', stickyColumnCount.toString());
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

      return matchesSearch && matchesSite && matchesPage;
    });
  }, [data, searchTerm, filterSite, filterPage]);

  // Sort logic
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aVal: string | number = a[sortField] || "";
      let bVal: string | number = b[sortField] || "";

      if (sortField === "created_at" || sortField === "updated_at") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }

      if (sortOrder === "asc") {
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

  const handleFilterSite = (site: string) => {
    setFilterSite(site);
    setCurrentPage(1);
  };

  const handleFilterPage = (page: string) => {
    setFilterPage(page);
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
              value={filterPage}
              onChange={(e) => handleFilterPage(e.target.value)}
            >
              <option value="">All Pages</option>
              {uniquePages.map(page => (
                <option key={page} value={page}>{page}</option>
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
          <table className="w-full">
            <thead>
              {/* First row - Source (nwpi_content) */}
              <tr className="bg-gray-50">
                {visibleColumns.map((col, index) => {
                  const isSticky = index < stickyColumnCount;
                  const isSeparator = index === stickyColumnCount - 1 && stickyColumnCount > 0;
                  const sourceField = sourceFieldMapping[col];
                  
                  return (
                    <th
                      key={`source-${col}`}
                      className={`text-left text-xs text-gray-700 lowercase tracking-wider ${
                        col === 'select' ? 'px-[6px] py-2' : 'px-6 py-2'
                      } ${isSticky ? 'sticky bg-gray-50 z-10' : ''} ${
                        isSeparator ? 'border-r-4 border-black' : ''
                      }`}
                      style={isSticky ? { left: `${index * 150}px` } : {}}
                    >
                      {col === 'select' || col === 'actions' ? (
                        <div className="h-8"></div>
                      ) : sourceField ? (
                        <div className="flex flex-col">
                          <div className="font-normal text-xs">nwpi_content</div>
                          <div className="font-bold">{sourceField}</div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="font-normal text-xs text-gray-400">-</div>
                          <div className="font-bold text-gray-400">-</div>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
              
              {/* Second row - Target (gcon_pieces) */}
              <tr className="bg-blue-100">
                {visibleColumns.map((col, index) => {
                  const isSticky = index < stickyColumnCount;
                  const isSeparator = index === stickyColumnCount - 1 && stickyColumnCount > 0;
                  const isSortable = ['meta_title', 'asn_sitespren_base', 'pub_status', 'date_time_pub_carry', 'pageslug', 'created_at', 'updated_at'].includes(col);
                  
                  return (
                    <th
                      key={`target-${col}`}
                      className={`text-left text-xs text-gray-700 lowercase tracking-wider ${
                        col === 'select' ? 'px-[6px] py-2' : 'px-6 py-2'
                      } ${isSortable ? 'cursor-pointer hover:bg-blue-200' : ''} ${
                        isSticky ? 'sticky bg-blue-100 z-10' : ''
                      } ${isSeparator ? 'border-r-4 border-black' : ''}`}
                      style={isSticky ? { left: `${index * 150}px` } : {}}
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
                          <div className="font-normal text-xs">actions</div>
                          <div className="font-bold">actions</div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="font-normal text-xs">gcon_pieces</div>
                          <div className="font-bold">
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
                        className={`text-sm text-gray-900 ${
                          col === 'select' ? 'px-[6px] py-[6px]' : 'px-6 py-4'
                        } ${isSticky ? 'sticky bg-white z-10' : ''} ${
                          isSeparator ? 'border-r-4 border-black' : ''
                        } ${col === 'actions' || col === 'select' ? 'whitespace-nowrap' : ''}`}
                        style={isSticky ? { left: `${index * 150}px` } : {}}
                        onClick={col === 'select' ? () => handleRowSelect(item.id) : undefined}
                      >
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
                          <Link
                            href={`/pedbar?id=${item.id}`}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Individual View
                          </Link>
                        ) : col === 'created_at' || col === 'updated_at' || col === 'date_time_pub_carry' ? (
                          <span className="whitespace-nowrap text-gray-500">
                            {item[col] ? formatDate(item[col]) : '-'}
                          </span>
                        ) : col === 'id' ? (
                          <span className="whitespace-nowrap text-xs font-mono">
                            {truncateText(item[col], 8)}
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
                        ) : col === 'corpus1' || col === 'corpus2' ? (
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