'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

interface AddressEntitiesRocketChamberProps {
  data: any[];
  onPaginationRender?: (controls: {
    RowPaginationBar1: () => JSX.Element | null;
    RowPaginationBar2: () => JSX.Element | null;
    ColumnPaginationBar1: () => JSX.Element | null;
    ColumnPaginationBar2: () => JSX.Element | null;
  }) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onPillarShiftClick?: () => void;
  onAddressOptionsClick?: () => void;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  columnsPerPage: number;
  currentColumnPage: number;
  onColumnPageChange: (page: number) => void;
  onColumnsPerPageChange: (columnsPerPage: number) => void;
}

export default function AddressEntitiesRocketChamber({
  data,
  onPaginationRender,
  searchValue,
  onSearchChange,
  onPillarShiftClick,
  onAddressOptionsClick,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  columnsPerPage,
  currentColumnPage,
  onColumnPageChange,
  onColumnsPerPageChange
}: AddressEntitiesRocketChamberProps) {
  
  // Sample columns for address entities (this would be configured based on actual data structure)
  const allColumns = [
    'addresspren_id', 'fk_addressglub_id', 'address_label', 'org_is_starred', 'org_is_flagged',
    'org_is_circled', 'org_is_squared', 'org_is_triangled', 'related_sites_internal', 'related_sites_external',
    'full_address_input', 'internal_notes', 'address_purpose', 'is_primary', 'is_active', 'is_favorite',
    'last_used_at', 'usage_count', 'addresspren_created_at', 'addressglub_id', 'street_1', 'street_2',
    'city', 'state_code', 'state_full', 'zip_code', 'country_code', 'country'
  ];
  
  const paginatedColumns = useMemo(() => allColumns.slice(), [allColumns]);
  const totalColumnPages = useMemo(() => Math.ceil(paginatedColumns.length / columnsPerPage), [paginatedColumns, columnsPerPage]);

  // Filter and pagination logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (!searchValue) return true;
      
      const searchLower = searchValue.toLowerCase();
      return (
        item.address_label?.toLowerCase().includes(searchLower) ||
        item.full_address_input?.toLowerCase().includes(searchLower) ||
        item.city?.toLowerCase().includes(searchLower) ||
        item.state_full?.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchValue]);

  const totalPages = Math.ceil(filteredData.length / (itemsPerPage === -1 ? filteredData.length : itemsPerPage));

  // Row Pagination Bar 1: Items per page selector with circular navigation
  const RowPaginationBar1 = () => {
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
                    onItemsPerPageChange(filteredData.length || 1000);
                  } else {
                    onItemsPerPageChange(value as number);
                  }
                  onPageChange(1);
                }}
                className={`px-2 py-2.5 text-sm border cursor-pointer ${
                  (value === 'All' ? filteredData.length : value) === itemsPerPage
                    ? 'text-black border-black font-medium'
                    : 'bg-white hover:bg-gray-200'
                } ${
                  value === 10 ? 'rounded-l border-r-0' : 
                  value === 'All' ? 'rounded-r' : 'border-r-0'
                }`}
                style={{ 
                  fontSize: '14px', 
                  paddingTop: '10px', 
                  paddingBottom: '10px'
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

  // Row Pagination Bar 2: Page navigation with circular navigation
  const RowPaginationBar2 = () => {
    if (filteredData.length === 0) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Row page:</span>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Previous button - Circular refresh wheel */}
            <button
              onClick={() => onPageChange(currentPage === 1 ? totalPages : currentPage - 1)}
              className="relative inline-flex items-center rounded-l-md px-2 py-2.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer"
              style={{ 
                fontSize: '14px', 
                paddingTop: '10px', 
                paddingBottom: '10px'
              }}
            >
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 2C8.5 2 5.5 3.5 3.5 6.5M12 2C15.5 2 18.5 3.5 20.5 6.5M12 2v4M3.5 6.5L6 9M20.5 6.5L18 9M12 22C8.5 22 5.5 20.5 3.5 17.5M12 22C15.5 22 18.5 20.5 20.5 17.5M12 22v-4M3.5 17.5L6 15M20.5 17.5L18 15"/>
              </svg>
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
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
              onClick={() => onPageChange(currentPage === totalPages ? 1 : currentPage + 1)}
              className="relative inline-flex items-center rounded-r-md px-2 py-2.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer"
              style={{ 
                fontSize: '14px', 
                paddingTop: '10px', 
                paddingBottom: '10px'
              }}
            >
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 2C8.5 2 5.5 3.5 3.5 6.5M12 2C15.5 2 18.5 3.5 20.5 6.5M12 2v4M3.5 6.5L6 9M20.5 6.5L18 9M12 22C8.5 22 5.5 20.5 3.5 17.5M12 22C15.5 22 18.5 20.5 20.5 17.5M12 22v-4M3.5 17.5L6 15M20.5 17.5L18 15"/>
              </svg>
            </button>
          </nav>
        </div>
      </div>
    );
  };

  // Column Pagination Bar 1: Columns per page selector
  const ColumnPaginationBar1 = () => {
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Cols/page:</span>
          <button
            onClick={() => {
              onColumnsPerPageChange(6);
              onColumnPageChange(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-l -mr-px cursor-pointer ${
              columnsPerPage === 6 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
            }}
          >
            6
          </button>
          <button
            onClick={() => {
              onColumnsPerPageChange(8);
              onColumnPageChange(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 8 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            8
          </button>
          <button
            onClick={() => {
              onColumnsPerPageChange(12);
              onColumnPageChange(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 12 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            12
          </button>
          <button
            onClick={() => {
              onColumnsPerPageChange(20);
              onColumnPageChange(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-r cursor-pointer ${
              columnsPerPage === 20 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            20
          </button>
        </div>
      </div>
    );
  };

  // Column Pagination Bar 2: Column page navigation with circular navigation
  const ColumnPaginationBar2 = () => {
    if (totalColumnPages <= 1) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Col page:</span>
          <button
            onClick={() => onColumnPageChange(1)}
            disabled={currentColumnPage === 1}
            className="px-2 py-2.5 text-sm border rounded-l -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ≪
          </button>
          <button
            onClick={() => onColumnPageChange(currentColumnPage === 1 ? totalColumnPages : currentColumnPage - 1)}
            className="px-2 py-2.5 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 2C8.5 2 5.5 3.5 3.5 6.5M12 2C15.5 2 18.5 3.5 20.5 6.5M12 2v4M3.5 6.5L6 9M20.5 6.5L18 9M12 22C8.5 22 5.5 20.5 3.5 17.5M12 22C15.5 22 18.5 20.5 20.5 17.5M12 22v-4M3.5 17.5L6 15M20.5 17.5L18 15"/>
            </svg>
          </button>
          
          {Array.from({ length: Math.min(5, totalColumnPages) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(totalColumnPages - 4, currentColumnPage - 2)) + i;
            if (pageNum > totalColumnPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => onColumnPageChange(pageNum)}
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
            onClick={() => onColumnPageChange(currentColumnPage === totalColumnPages ? 1 : currentColumnPage + 1)}
            className="px-2 py-2.5 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 2C8.5 2 5.5 3.5 3.5 6.5M12 2C15.5 2 18.5 3.5 20.5 6.5M12 2v4M3.5 6.5L6 9M20.5 6.5L18 9M12 22C8.5 22 5.5 20.5 3.5 17.5M12 22C15.5 22 18.5 20.5 20.5 17.5M12 22v-4M3.5 17.5L6 15M20.5 17.5L18 15"/>
            </svg>
          </button>
          <button
            onClick={() => onColumnPageChange(totalColumnPages)}
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

  // Pass pagination components to parent
  useEffect(() => {
    if (onPaginationRender) {
      onPaginationRender({
        RowPaginationBar1,
        RowPaginationBar2,
        ColumnPaginationBar1,
        ColumnPaginationBar2
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
            {/* Row pagination, search box, and column pagination table */}
            <table style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>row pagination</span>
                      <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                        Showing <span style={{ fontWeight: 'bold' }}>{Math.min(itemsPerPage === -1 ? filteredData.length : itemsPerPage, filteredData.length)}</span> of <span style={{ fontWeight: 'bold' }}>{filteredData.length}</span> results
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
                      pillarshift coltemp
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      address options
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
                      {RowPaginationBar1()}
                      {RowPaginationBar2()}
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <div className="flex items-end">
                      <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search address entities..."
                        className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        style={{ width: '200px', marginBottom: '3px' }}
                      />
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <button
                      onClick={onPillarShiftClick}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      use the pillarshift coltemp system
                    </button>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <button
                      onClick={onAddressOptionsClick}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      address options
                    </button>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <div className="flex items-end space-x-4">
                      {ColumnPaginationBar1()}
                      {ColumnPaginationBar2()}
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