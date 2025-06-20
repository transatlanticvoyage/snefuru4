"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
  created_at: string;
  updated_at: string;
}

interface GconPiecesTableProps {
  initialData: GconPiece[];
  userId: string;
}

type SortField = "meta_title" | "asn_sitespren_base" | "created_at" | "updated_at";
type SortOrder = "asc" | "desc";
type ColumnTemplateKey = 'option1' | 'option2' | 'option3' | 'option4' | 'option5';

const allColumns = [
  'select',
  'actions',
  'meta_title', 
  'h1title',
  'asn_sitespren_base',
  'asn_nwpi_posts_id',
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
  }
};

export default function GconPiecesTable({ initialData, userId }: GconPiecesTableProps) {
  const [data] = useState<GconPiece[]>(initialData);
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
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load state from URL params and localStorage on mount
  useEffect(() => {
    // Check URL params first
    const urlColTemp = searchParams?.get('coltemp');
    const urlStickyCol = searchParams?.get('stickycol');
    
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
  }, [searchParams]);

  // Update URL and localStorage when selections change
  useEffect(() => {
    // Update URL
    const params = new URLSearchParams();
    params.set('coltemp', selectedColumnTemplate);
    if (stickyColumnCount > 0) {
      params.set('stickycol', `option${stickyColumnCount}`);
    }
    router.replace(`/pedazos1?${params.toString()}`, { scroll: false });
    
    // Update localStorage
    localStorage.setItem('pedazos1_columnTemplate', selectedColumnTemplate);
    localStorage.setItem('pedazos1_stickyColumns', stickyColumnCount.toString());
  }, [selectedColumnTemplate, stickyColumnCount, router]);

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
        item.corpus2?.toLowerCase().includes(searchLower);

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
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search titles and content..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filterSite}
              onChange={(e) => handleFilterSite(e.target.value)}
            >
              <option value="">All Sites</option>
              {uniqueSites.map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
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
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.map((col, index) => {
                  const isSticky = index < stickyColumnCount;
                  const isSeparator = index === stickyColumnCount - 1 && stickyColumnCount > 0;
                  const isSortable = ['meta_title', 'asn_sitespren_base', 'created_at', 'updated_at'].includes(col);
                  
                  return (
                    <th
                      key={col}
                      className={`text-left text-xs font-bold text-gray-700 lowercase tracking-wider ${
                        col === 'select' ? 'px-[6px] py-[6px]' : 'px-6 py-3'
                      } ${isSortable ? 'cursor-pointer hover:bg-gray-100' : ''} ${
                        isSticky ? 'sticky bg-gray-50 z-10' : ''
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
                      ) : (
                        <>
                          {col} {isSortable && sortField === col && (sortOrder === "asc" ? "↑" : "↓")}
                        </>
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
                        ) : col === 'created_at' || col === 'updated_at' ? (
                          <span className="whitespace-nowrap text-gray-500">
                            {formatDate(item[col])}
                          </span>
                        ) : col === 'meta_title' || col === 'h1title' ? (
                          truncateText(item[col], 60)
                        ) : col === 'asn_nwpi_posts_id' ? (
                          <span className="whitespace-nowrap">
                            {truncateText(item[col], 30)}
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