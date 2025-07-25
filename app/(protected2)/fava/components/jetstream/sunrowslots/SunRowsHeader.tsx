'use client';

import React from 'react';
import { SunRowsConfig, SunRowConfig, SunRowCellConfig } from './sunRowsTypes';

interface SunRowsHeaderProps {
  config: SunRowsConfig;
  loading?: boolean;
}

export default function SunRowsHeader({ config, loading = false }: SunRowsHeaderProps) {
  if (loading) {
    return (
      <thead>
        <tr>
          <th style={{ padding: '8px', textAlign: 'center', color: '#666' }}>
            Loading sun rows...
          </th>
        </tr>
      </thead>
    );
  }

  const renderCell = (cell: SunRowCellConfig, rowIndex: number, cellIndex: number) => {
    const cellStyle: React.CSSProperties = {
      padding: '8px',
      border: '1px solid #ddd',
      backgroundColor: '#f8f9fa',
      fontWeight: 'bold',
      textAlign: cell.align || 'left',
      ...cell.style
    };

    const cellProps = {
      key: cell.id || `${rowIndex}-${cellIndex}`,
      className: cell.className || '',
      style: cellStyle,
      colSpan: cell.colspan || 1,
      rowSpan: cell.rowspan || 1
    };

    return (
      <th {...cellProps}>
        {cell.content}
      </th>
    );
  };

  const renderRow = (row: SunRowConfig, index: number) => {
    const rowStyle: React.CSSProperties = {
      height: row.height || 'auto',
      ...row.style
    };

    return (
      <tr 
        key={row.id || `sun-row-${index}`}
        className={row.className || ''}
        style={rowStyle}
      >
        {row.cells.map((cell, cellIndex) => renderCell(cell, index, cellIndex))}
      </tr>
    );
  };

  const theadStyle: React.CSSProperties = {
    position: config.stickyHeader ? 'sticky' : 'static',
    top: config.stickyHeader ? 0 : 'auto',
    zIndex: config.stickyHeader ? 10 : 'auto',
    ...config.style
  };

  return (
    <thead 
      className={config.className || ''}
      style={theadStyle}
    >
      {config.rows.map((row, index) => renderRow(row, index))}
    </thead>
  );
}