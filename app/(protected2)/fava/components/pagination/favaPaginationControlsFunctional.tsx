'use client';

import React from 'react';
import { useFunctionalPagination } from './useFavaPagination';

interface FavaPaginationControlsFunctionalProps {
  data: any[];
}

export default function FavaPaginationControlsFunctional({ 
  data 
}: FavaPaginationControlsFunctionalProps) {
  const {
    state,
    actions,
    config,
    visiblePageNumbers,
    isFirstPage,
    isLastPage,
    getPageInfoText,
    getPageRange
  } = useFunctionalPagination(data);

  // Styles based on existing fava pagination controls
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderTop: '1px solid #ddd',
    backgroundColor: '#f8f9fa',
    flexWrap: 'wrap' as const,
    gap: '16px'
  };

  const navigationStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const buttonStyle = {
    padding: '8px 12px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  };

  const buttonDisabledStyle = {
    ...buttonStyle,
    backgroundColor: '#f5f5f5',
    color: '#999',
    cursor: 'not-allowed'
  };

  const buttonActiveStyle = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: '#fff',
    borderColor: '#007bff'
  };

  const selectStyle = {
    padding: '6px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: '#fff'
  };

  const infoStyle = {
    fontSize: '14px',
    color: '#666'
  };

  if (state.totalItems === 0) {
    return (
      <div style={containerStyle}>
        <div style={infoStyle}>No items to display</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Left side - Page info */}
      <div style={infoStyle}>
        {config.showPageInfo && getPageInfoText()}
      </div>

      {/* Center - Navigation controls */}
      {config.showNavigationButtons && (
        <div style={navigationStyle}>
          {/* First page button */}
          <button
            style={isFirstPage ? buttonDisabledStyle : buttonStyle}
            onClick={actions.goToFirstPage}
            disabled={isFirstPage}
            onMouseEnter={(e) => {
              if (!isFirstPage) {
                e.currentTarget.style.backgroundColor = '#e9ecef';
              }
            }}
            onMouseLeave={(e) => {
              if (!isFirstPage) {
                e.currentTarget.style.backgroundColor = '#fff';
              }
            }}
          >
            First
          </button>

          {/* Previous page button */}
          <button
            style={isFirstPage ? buttonDisabledStyle : buttonStyle}
            onClick={actions.goToPreviousPage}
            disabled={isFirstPage}
            onMouseEnter={(e) => {
              if (!isFirstPage) {
                e.currentTarget.style.backgroundColor = '#e9ecef';
              }
            }}
            onMouseLeave={(e) => {
              if (!isFirstPage) {
                e.currentTarget.style.backgroundColor = '#fff';
              }
            }}
          >
            Previous
          </button>

          {/* Page number buttons */}
          {visiblePageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              style={pageNum === state.currentPage ? buttonActiveStyle : buttonStyle}
              onClick={() => actions.goToPage(pageNum)}
              onMouseEnter={(e) => {
                if (pageNum !== state.currentPage) {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                }
              }}
              onMouseLeave={(e) => {
                if (pageNum !== state.currentPage) {
                  e.currentTarget.style.backgroundColor = '#fff';
                }
              }}
            >
              {pageNum}
            </button>
          ))}

          {/* Next page button */}
          <button
            style={isLastPage ? buttonDisabledStyle : buttonStyle}
            onClick={actions.goToNextPage}
            disabled={isLastPage}
            onMouseEnter={(e) => {
              if (!isLastPage) {
                e.currentTarget.style.backgroundColor = '#e9ecef';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLastPage) {
                e.currentTarget.style.backgroundColor = '#fff';
              }
            }}
          >
            Next
          </button>

          {/* Last page button */}
          <button
            style={isLastPage ? buttonDisabledStyle : buttonStyle}
            onClick={actions.goToLastPage}
            disabled={isLastPage}
            onMouseEnter={(e) => {
              if (!isLastPage) {
                e.currentTarget.style.backgroundColor = '#e9ecef';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLastPage) {
                e.currentTarget.style.backgroundColor = '#fff';
              }
            }}
          >
            Last
          </button>
        </div>
      )}

      {/* Right side - Page size selector */}
      {config.showPageSizeSelector && config.pageSizeOptions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="pageSize" style={{ fontSize: '14px', color: '#666' }}>
            Items per page:
          </label>
          <select
            id="pageSize"
            style={selectStyle}
            value={state.itemsPerPage}
            onChange={(e) => actions.setItemsPerPage(Number(e.target.value))}
          >
            {config.pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}