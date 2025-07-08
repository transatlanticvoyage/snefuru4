import React from 'react';
import { HeaderRowDefinition, HeaderCellDefinition } from '../config/tableConfig.sample';

/**
 * Azul Plantilla Header Rows System
 * 
 * Centralized header row processing and rendering logic for the template system.
 * This module handles all header row transformations and behaviors.
 */

export interface HeaderRowRenderOptions {
  onHeaderClick?: (colIndex: number, content: string) => void;
  defaultThClassName?: string;
  defaultTrClassName?: string;
  enableSorting?: boolean;
  sortField?: string | null;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Process header row definitions and return props for rendering
 */
export function processHeaderRows(
  headerRows: HeaderRowDefinition[],
  options: HeaderRowRenderOptions = {}
): ProcessedHeaderRow[] {
  return headerRows.map(row => ({
    ...row,
    processedCells: row.cells.map((cell, index) => 
      processHeaderCell(cell, index, row.type, options)
    )
  }));
}

/**
 * Process individual header cell with type-specific logic
 */
function processHeaderCell(
  cell: HeaderCellDefinition,
  index: number,
  rowType: string,
  options: HeaderRowRenderOptions
): ProcessedHeaderCell {
  const baseProps: ProcessedHeaderCell = {
    ...cell,
    key: `header-cell-${index}`,
    onClick: undefined,
    style: {
      textAlign: cell.alignment || 'left',
      cursor: 'default',
      ...cell.style
    }
  };

  // Add type-specific behaviors
  switch (rowType) {
    case 'label':
      if (options.onHeaderClick && options.enableSorting !== false) {
        baseProps.onClick = () => options.onHeaderClick?.(index, String(cell.content));
        baseProps.style.cursor = 'pointer';
      }
      break;
      
    case 'filter':
      baseProps.style.padding = '4px';
      baseProps.style.verticalAlign = 'middle';
      break;
      
    case 'toolbar':
      baseProps.style.padding = '8px';
      break;
  }

  return baseProps;
}

/**
 * Generate standard header row configurations
 */
export const HeaderRowGenerators = {
  /**
   * Create a simple label header row from column definitions
   */
  simpleLabels: (columns: Array<{ header: string; alignment?: 'left' | 'center' | 'right' }>): HeaderRowDefinition => ({
    id: 'main-header',
    type: 'label',
    cells: columns.map(col => ({
      content: col.header,
      alignment: col.alignment || 'left'
    }))
  }),

  /**
   * Create a grouped header row with category spans
   */
  groupedHeaders: (groups: Array<{ label: string; span: number; className?: string }>): HeaderRowDefinition => ({
    id: 'group-header',
    type: 'label',
    height: '50px',
    cells: groups.map(group => ({
      content: group.label,
      colSpan: group.span,
      alignment: 'center',
      className: group.className || 'font-bold',
      style: { borderRight: '2px solid #ddd' }
    }))
  }),

  /**
   * Create a filter row with standard filter icons
   */
  filterRow: (columns: Array<{ type: 'text' | 'dropdown' | 'date' | 'none' }>): HeaderRowDefinition => ({
    id: 'filter-row',
    type: 'filter',
    height: '40px',
    cells: columns.map(col => {
      switch (col.type) {
        case 'text':
          return { content: '🔍', alignment: 'center' as const };
        case 'dropdown':
          return { content: '▼', alignment: 'center' as const };
        case 'date':
          return { content: '📅', alignment: 'center' as const };
        default:
          return { content: '', alignment: 'center' as const };
      }
    })
  }),

  /**
   * Create a toolbar row with action buttons
   */
  toolbarRow: (actions: Array<{ label: string; onClick: () => void }>): HeaderRowDefinition => ({
    id: 'toolbar-row',
    type: 'toolbar',
    height: '48px',
    cells: [{
      content: React.createElement('div', {
        style: { display: 'flex', gap: '8px', padding: '8px' }
      }, actions.map((action, i) => 
        React.createElement('button', {
          key: i,
          onClick: action.onClick,
          style: {
            padding: '4px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: '#fff',
            cursor: 'pointer'
          }
        }, action.label)
      )),
      colSpan: 999, // Large number to span all columns
      alignment: 'left'
    }]
  })
};

/**
 * Utility functions for header row manipulation
 */
export const HeaderRowUtils = {
  /**
   * Add sorting indicators to header cells
   */
  addSortingIndicators: (
    rows: HeaderRowDefinition[],
    sortField: string | null,
    sortOrder: 'asc' | 'desc'
  ): HeaderRowDefinition[] => {
    return rows.map(row => {
      if (row.type !== 'label') return row;
      
      return {
        ...row,
        cells: row.cells.map((cell, index) => {
          const content = String(cell.content);
          const isSorted = sortField === content.toLowerCase().replace(/\s+/g, '_');
          
          if (!isSorted) return cell;
          
          return {
            ...cell,
            content: `${content} ${sortOrder === 'asc' ? '↑' : '↓'}`,
            style: {
              ...cell.style,
              fontWeight: 'bold'
            }
          };
        })
      };
    });
  },

  /**
   * Merge multiple header row sets
   */
  mergeHeaderRows: (...rowSets: HeaderRowDefinition[][]): HeaderRowDefinition[] => {
    return rowSets.flat().map((row, index) => ({
      ...row,
      id: `${row.id}-${index}` // Ensure unique IDs
    }));
  },

  /**
   * Find header row by type
   */
  findRowByType: (rows: HeaderRowDefinition[], type: string): HeaderRowDefinition | undefined => {
    return rows.find(row => row.type === type);
  },

  /**
   * Count total columns from first label row
   */
  getColumnCount: (rows: HeaderRowDefinition[]): number => {
    const labelRow = rows.find(row => row.type === 'label');
    if (!labelRow) return 0;
    
    return labelRow.cells.reduce((total, cell) => total + (cell.colSpan || 1), 0);
  }
};

// Type definitions for processed header data
interface ProcessedHeaderCell extends HeaderCellDefinition {
  key: string;
  onClick?: () => void;
  style: React.CSSProperties;
}

interface ProcessedHeaderRow extends HeaderRowDefinition {
  processedCells: ProcessedHeaderCell[];
}

export type { ProcessedHeaderRow, ProcessedHeaderCell };