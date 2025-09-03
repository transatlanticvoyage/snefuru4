'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

interface HostEntitiesRocketChamberProps {
  data: any[];
  onPaginationRender?: (controls: {
    HostRowPaginationBar1: () => JSX.Element | null;
    HostRowPaginationBar2: () => JSX.Element | null;
    HostColumnPaginationBar1: () => JSX.Element | null;
    HostColumnPaginationBar2: () => JSX.Element | null;
  }) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onHostOptionsClick?: () => void;
  onHostManagementClick?: () => void;
}

export default function HostEntitiesRocketChamber({
  data,
  onPaginationRender,
  searchValue,
  onSearchChange,
  onHostOptionsClick,
  onHostManagementClick
}: HostEntitiesRocketChamberProps) {
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentColumnPage, setCurrentColumnPage] = useState(1);
  const [columnsPerPage, setColumnsPerPage] = useState(8);

  // Sample columns for host entities (this would be configured based on actual data structure)
  const allColumns = [
    'id', 'username', 'host_company_name', 'portal_url1', 'api_management_url',
    'hostacct_apikey1', 'domains_glacier', 'paymentdate_first', 'price', 'currency',
    'panel_url1', 'panel_user', 'panel_type', 'panel_ns', 'notes1'
  ];
  
  const paginatedColumns = useMemo(() => allColumns.slice(), [allColumns]);
  const totalColumnPages = useMemo(() => Math.ceil(paginatedColumns.length / columnsPerPage), [paginatedColumns, columnsPerPage]);

  // Filter and pagination logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (!searchValue) return true;
      
      const searchLower = searchValue.toLowerCase();
      return (
        item.username?.toLowerCase().includes(searchLower) ||
        item.host_company?.name?.toLowerCase().includes(searchLower) ||
        item.api_management_url?.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchValue]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Host Row Pagination Bar 1: Items per page selector
  const HostRowPaginationBar1 = () => {
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Rows/page:</span>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            {[10, 25, 50, 100, 200, 'All'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  if (value === 'All') {
                    setItemsPerPage(filteredData.length || 1000);
                  } else {
                    setItemsPerPage(value as number);
                  }
                  setCurrentPage(1);
                }}
                className={`
                  px-2 py-2.5 text-sm font-medium border -mr-px cursor-pointer
                  ${value === 10 ? 'rounded-l' : ''}
                  ${value === 'All' ? 'rounded-r' : ''}
                  ${(value === 'All' && itemsPerPage >= filteredData.length) || itemsPerPage === value
                    ? 'text-black border-black'
                    : 'bg-white hover:bg-gray-200'
                  }
                `}
                style={{ 
                  fontSize: '14px', 
                  paddingTop: '10px', 
                  paddingBottom: '10px',
                  backgroundColor: (value === 'All' && itemsPerPage >= filteredData.length) || itemsPerPage === value 
                    ? '#f8f782' : undefined
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Host Row Pagination Bar 2: Page navigation
  const HostRowPaginationBar2 = () => {
    if (filteredData.length === 0) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Row page:</span>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Previous button - Circular refresh wheel */}
            <button
              onClick={() => setCurrentPage(currentPage === 1 ? totalPages : currentPage - 1)}
              className="relative inline-flex items-center rounded-l-md px-2 py-2.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer"
              style={{ 
                fontSize: '14px', 
                paddingTop: '10px', 
                paddingBottom: '10px'
              }}
            >
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2.5 text-sm font-semibold ring-1 ring-inset ring-gray-300 cursor-pointer ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                  style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next button - Circular refresh wheel */}
            <button
              onClick={() => setCurrentPage(currentPage === totalPages ? 1 : currentPage + 1)}
              className="relative inline-flex items-center rounded-r-md px-2 py-2.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer"
              style={{ 
                fontSize: '14px', 
                paddingTop: '10px', 
                paddingBottom: '10px'
              }}
            >
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M23 4v6h-6" />
                <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    );
  };

  // Host Column Pagination Bar 1: Columns per page selector
  const HostColumnPaginationBar1 = () => {
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Cols/page:</span>
          <button
            onClick={() => {
              setColumnsPerPage(6);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-l -mr-px cursor-pointer ${
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
              setColumnsPerPage(allColumns.length);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-r cursor-pointer ${
              columnsPerPage >= allColumns.length ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage >= allColumns.length ? '#f8f782' : undefined
            }}
          >
            All
          </button>
        </div>
      </div>
    );
  };

  // Host Column Pagination Bar 2: Column page navigation
  const HostColumnPaginationBar2 = () => {
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
            ≪
          </button>
          <button
            onClick={() => setCurrentColumnPage(currentColumnPage === 1 ? totalColumnPages : currentColumnPage - 1)}
            className="px-2 py-2.5 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          
          {Array.from({ length: Math.min(5, totalColumnPages) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(totalColumnPages - 4, currentColumnPage - 2)) + i;
            if (pageNum > totalColumnPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentColumnPage(pageNum)}
                className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
                  pageNum === currentColumnPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-white hover:bg-gray-200'
                }`}
                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentColumnPage(currentColumnPage === totalColumnPages ? 1 : currentColumnPage + 1)}
            className="px-2 py-2.5 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentColumnPage(totalColumnPages)}
            disabled={currentColumnPage === totalColumnPages}
            className="px-2 py-2.5 text-sm border rounded-r disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ≫
          </button>
        </div>
      </div>
    );
  };

  // Call onPaginationRender when pagination bars are ready
  useEffect(() => {
    if (onPaginationRender) {
      onPaginationRender({
        HostRowPaginationBar1,
        HostRowPaginationBar2,
        HostColumnPaginationBar1,
        HostColumnPaginationBar2
      });
    }
  }, [currentPage, itemsPerPage, currentColumnPage, columnsPerPage, filteredData.length, totalPages, totalColumnPages, onPaginationRender]);

  return (
    <div className="rocket_chamber_div" style={{ 
      border: '1px solid black', 
      borderBottom: 'none',
      padding: 0,
      margin: 0,
      marginBottom: 0,
      marginTop: 0,
      position: 'relative'
    }}>
      <div style={{ 
        position: 'absolute', 
        top: '4px', 
        left: '4px', 
        fontSize: '16px', 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <svg 
          width="22" 
          height="22" 
          viewBox="0 0 24 24" 
          fill="black"
          style={{ transform: 'rotate(15deg)' }}
        >
          {/* Rocket body */}
          <ellipse cx="12" cy="8" rx="3" ry="6" fill="black"/>
          {/* Rocket nose cone */}
          <path d="M12 2 L15 8 L9 8 Z" fill="black"/>
          {/* Left fin */}
          <path d="M9 12 L7 14 L9 16 Z" fill="black"/>
          {/* Right fin */}
          <path d="M15 12 L17 14 L15 16 Z" fill="black"/>
          {/* Exhaust flames */}
          <path d="M10 14 L9 18 L10.5 16 L12 20 L13.5 16 L15 18 L14 14 Z" fill="black"/>
          {/* Window */}
          <circle cx="12" cy="6" r="1" fill="white"/>
        </svg>
        rocket_chamber
      </div>
      <div style={{ marginTop: '24px', paddingTop: '4px', paddingBottom: 0, paddingLeft: '8px', paddingRight: '8px' }}>
        <div className="flex items-end justify-between">
          <div className="flex items-end space-x-8">
            {/* Host entities pagination, search box, and column pagination table */}
            <table style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>row pagination</span>
                      <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                        Showing <span style={{ fontWeight: 'bold' }}>{paginatedData.length}</span> of <span style={{ fontWeight: 'bold' }}>{filteredData.length}</span> results
                      </span>
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      search box 2
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      host options
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      host management
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>column pagination</span>
                      <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                        Showing <span style={{ fontWeight: 'bold' }}>{Math.min(columnsPerPage, paginatedColumns.length - ((currentColumnPage - 1) * columnsPerPage))}</span> non-sticky columns of <span style={{ fontWeight: 'bold' }}>{allColumns.length}</span> sourcedef columns
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <div className="flex items-end space-x-4">
                      {HostRowPaginationBar1()}
                      {HostRowPaginationBar2()}
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <div className="flex items-end">
                      <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search host entities..."
                        className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        style={{ width: '200px', marginBottom: '3px' }}
                      />
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <button
                      onClick={onHostOptionsClick}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      host options
                    </button>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <button
                      onClick={onHostManagementClick}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      use host management system
                    </button>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <div className="flex items-end space-x-4">
                      {HostColumnPaginationBar1()}
                      {HostColumnPaginationBar2()}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}