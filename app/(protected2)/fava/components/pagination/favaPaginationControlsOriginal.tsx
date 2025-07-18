'use client';

import React from 'react';
import { useFavaPagination } from './favaPaginationProvider';

export default function FavaPaginationControlsOriginal() {
  const { state, actions, config } = useFavaPagination();

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const maxVisiblePages = config.maxVisiblePages || 5;
    const current = state.currentPage;
    const total = state.totalPages;
    
    if (total <= maxVisiblePages) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  };

  const buttonBarStyle = {
    display: 'flex'
  };

  const qtyButtonStyle = (active: boolean) => ({
    padding: '8px 12px',
    border: '1px solid #ccc',
    background: active ? '#007bff' : '#f8f9fa',
    color: active ? '#fff' : '#000',
    cursor: 'pointer',
    fontSize: '14px'
  });

  const pageButtonStyle = (active: boolean) => ({
    padding: '8px 12px',
    border: '1px solid #ccc',
    background: active ? '#007bff' : '#fff',
    color: active ? '#fff' : '#000',
    cursor: 'pointer',
    fontSize: '14px'
  });

  const navButtonStyle = (disabled: boolean) => ({
    padding: '8px 12px',
    border: '1px solid #ccc',
    background: disabled ? '#f8f9fa' : '#e9ecef',
    color: disabled ? '#999' : '#000',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: 'bold' as const
  });

  // Generate quantity options from config
  const qtyOptions = config.pageSizeOptions || [10, 25, 50, 100, 200];
  const showAll = state.totalItems <= 500; // Only show "All" for reasonable data sizes

  const handleQuantityChange = (qty: number | 'all', event: React.MouseEvent) => {
    event.preventDefault();
    if (qty === 'all') {
      actions.setItemsPerPage(state.totalItems);
    } else {
      actions.setItemsPerPage(qty);
    }
  };

  const visiblePages = getVisiblePages();

  return (
    <div style={wrapperStyle}>
      {/* First button bar - quantity selector */}
      <div style={buttonBarStyle}>
        {qtyOptions.map((qty) => (
          <button
            key={qty}
            style={qtyButtonStyle(state.itemsPerPage === qty)}
            onClick={(event) => handleQuantityChange(qty, event)}
          >
            {qty}
          </button>
        ))}
        {showAll && (
          <button
            style={qtyButtonStyle(state.itemsPerPage === state.totalItems)}
            onClick={(event) => handleQuantityChange('all', event)}
          >
            All
          </button>
        )}
      </div>

      {/* Second button bar - page navigation */}
      <div style={buttonBarStyle}>
        <button
          style={navButtonStyle(!state.hasPreviousPage)}
          onClick={(event) => {
            event.preventDefault();
            actions.goToPreviousPage();
          }}
          disabled={!state.hasPreviousPage}
        >
          «
        </button>
        
        {visiblePages.map((pageNum) => (
          <button
            key={pageNum}
            style={pageButtonStyle(state.currentPage === pageNum)}
            onClick={(event) => {
              event.preventDefault();
              actions.goToPage(pageNum);
            }}
          >
            {pageNum}
          </button>
        ))}
        
        <button
          style={navButtonStyle(!state.hasNextPage)}
          onClick={(event) => {
            event.preventDefault();
            actions.goToNextPage();
          }}
          disabled={!state.hasNextPage}
        >
          »
        </button>
      </div>
    </div>
  );
}