// Default configuration for Sun Row Slots system
// This provides the standard 10-row header configuration used by all pages unless overridden

import { SunRowsConfig } from './sunRowsTypes';

export const DEFAULT_SUN_ROWS_CONFIG: SunRowsConfig = {
  rows: [
    // Row 1
    {
      id: 'sun-row-1',
      cells: [
        { id: 'cell-1-1', content: 'Row 1 Cell 1', colspan: 1 },
        { id: 'cell-1-2', content: 'Row 1 Cell 2', colspan: 1 },
        { id: 'cell-1-3', content: 'Row 1 Cell 3', colspan: 1 }
      ]
    },
    // Row 2
    {
      id: 'sun-row-2',
      cells: [
        { id: 'cell-2-1', content: 'Row 2 Cell 1', colspan: 2 },
        { id: 'cell-2-2', content: 'Row 2 Cell 2', colspan: 1 }
      ]
    },
    // Row 3
    {
      id: 'sun-row-3',
      cells: [
        { id: 'cell-3-1', content: 'Row 3 Cell 1', colspan: 1 },
        { id: 'cell-3-2', content: 'Row 3 Cell 2', colspan: 1 },
        { id: 'cell-3-3', content: 'Row 3 Cell 3', colspan: 1 }
      ]
    },
    // Row 4
    {
      id: 'sun-row-4',
      cells: [
        { id: 'cell-4-1', content: 'Row 4 Cell 1', colspan: 3 }
      ]
    },
    // Row 5
    {
      id: 'sun-row-5',
      cells: [
        { id: 'cell-5-1', content: 'Row 5 Cell 1', colspan: 1 },
        { id: 'cell-5-2', content: 'Row 5 Cell 2', colspan: 1 },
        { id: 'cell-5-3', content: 'Row 5 Cell 3', colspan: 1 }
      ]
    },
    // Row 6
    {
      id: 'sun-row-6',
      cells: [
        { id: 'cell-6-1', content: 'Row 6 Cell 1', colspan: 1 },
        { id: 'cell-6-2', content: 'Row 6 Cell 2', colspan: 2 }
      ]
    },
    // Row 7
    {
      id: 'sun-row-7',
      cells: [
        { id: 'cell-7-1', content: 'Row 7 Cell 1', colspan: 2 },
        { id: 'cell-7-2', content: 'Row 7 Cell 2', colspan: 1 }
      ]
    },
    // Row 8
    {
      id: 'sun-row-8',
      cells: [
        { id: 'cell-8-1', content: 'Row 8 Cell 1', colspan: 1 },
        { id: 'cell-8-2', content: 'Row 8 Cell 2', colspan: 1 },
        { id: 'cell-8-3', content: 'Row 8 Cell 3', colspan: 1 }
      ]
    },
    // Row 9
    {
      id: 'sun-row-9',
      cells: [
        { id: 'cell-9-1', content: 'Row 9 Cell 1', colspan: 3 }
      ]
    },
    // Row 10
    {
      id: 'sun-row-10',
      cells: [
        { id: 'cell-10-1', content: 'Row 10 Cell 1', colspan: 1 },
        { id: 'cell-10-2', content: 'Row 10 Cell 2', colspan: 1 },
        { id: 'cell-10-3', content: 'Row 10 Cell 3', colspan: 1 }
      ]
    }
  ],
  defaultRowCount: 10,
  stickyHeader: true
};