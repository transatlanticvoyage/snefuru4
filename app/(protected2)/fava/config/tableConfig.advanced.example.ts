/**
 * Advanced Table Configuration Example
 * 
 * Demonstrates using the favaHeaderRows system for complex header configurations
 */

import { TableConfig } from './tableConfig.sample';
import { HeaderRowGenerators, HeaderRowUtils } from '../components/favaHeaderRows';

// Example 1: Financial Report Table with Multiple Header Rows
export const financialTableConfig: TableConfig = {
  tableName: 'financial_reports',
  
  columns: [
    { field: 'company', header: 'Company', width: '150px', sortable: true },
    { field: 'q1_revenue', header: 'Q1 Revenue', width: '100px', type: 'number' },
    { field: 'q1_profit', header: 'Q1 Profit', width: '100px', type: 'number' },
    { field: 'q2_revenue', header: 'Q2 Revenue', width: '100px', type: 'number' },
    { field: 'q2_profit', header: 'Q2 Profit', width: '100px', type: 'number' },
    { field: 'total_revenue', header: 'Total Revenue', width: '120px', type: 'number' },
    { field: 'total_profit', header: 'Total Profit', width: '120px', type: 'number' }
  ],
  
  // Complex header configuration using generators
  headerRows: [
    // Top level grouping
    HeaderRowGenerators.groupedHeaders([
      { label: 'Company Info', span: 1 },
      { label: 'Q1 2024', span: 2, className: 'bg-blue-50 font-bold' },
      { label: 'Q2 2024', span: 2, className: 'bg-green-50 font-bold' },
      { label: 'Year Total', span: 2, className: 'bg-gray-50 font-bold' }
    ]),
    
    // Column labels
    HeaderRowGenerators.simpleLabels([
      { header: 'Company', alignment: 'left' },
      { header: 'Revenue', alignment: 'right' },
      { header: 'Profit', alignment: 'right' },
      { header: 'Revenue', alignment: 'right' },
      { header: 'Profit', alignment: 'right' },
      { header: 'Revenue', alignment: 'right' },
      { header: 'Profit', alignment: 'right' }
    ]),
    
    // Filter row
    HeaderRowGenerators.filterRow([
      { type: 'text' },      // Company search
      { type: 'none' },      // Q1 Revenue
      { type: 'none' },      // Q1 Profit
      { type: 'none' },      // Q2 Revenue
      { type: 'none' },      // Q2 Profit
      { type: 'dropdown' },  // Total Revenue range
      { type: 'dropdown' }   // Total Profit range
    ])
  ]
};

// Example 2: Data Grid with Toolbar
export const dataGridConfig: TableConfig = {
  tableName: 'inventory_items',
  
  columns: [
    { field: 'id', header: 'ID', width: '60px' },
    { field: 'sku', header: 'SKU', width: '100px' },
    { field: 'name', header: 'Product Name', width: '200px' },
    { field: 'category', header: 'Category', width: '120px' },
    { field: 'stock', header: 'Stock', width: '80px', type: 'number' },
    { field: 'price', header: 'Price', width: '100px', type: 'number' }
  ],
  
  // Using merge utility to combine different header row types
  headerRows: HeaderRowUtils.mergeHeaderRows(
    // Toolbar with actions
    [HeaderRowGenerators.toolbarRow([
      { label: 'Export', onClick: () => console.log('Export clicked') },
      { label: 'Import', onClick: () => console.log('Import clicked') },
      { label: 'Refresh', onClick: () => console.log('Refresh clicked') }
    ])],
    
    // Standard column headers
    [HeaderRowGenerators.simpleLabels([
      { header: 'ID', alignment: 'center' },
      { header: 'SKU', alignment: 'left' },
      { header: 'Product Name', alignment: 'left' },
      { header: 'Category', alignment: 'center' },
      { header: 'Stock', alignment: 'right' },
      { header: 'Price', alignment: 'right' }
    ])]
  )
};

// Example 3: Dynamic Header with Sorting
export const createSortableTableConfig = (
  sortField: string | null,
  sortOrder: 'asc' | 'desc'
): TableConfig => {
  const baseHeaders = [
    HeaderRowGenerators.simpleLabels([
      { header: 'Name', alignment: 'left' },
      { header: 'Email', alignment: 'left' },
      { header: 'Role', alignment: 'center' },
      { header: 'Created', alignment: 'center' }
    ])
  ];
  
  // Add sorting indicators dynamically
  const headersWithSorting = HeaderRowUtils.addSortingIndicators(
    baseHeaders,
    sortField,
    sortOrder
  );
  
  return {
    tableName: 'users',
    columns: [
      { field: 'name', header: 'Name' },
      { field: 'email', header: 'Email' },
      { field: 'role', header: 'Role' },
      { field: 'created_at', header: 'Created', type: 'date' }
    ],
    headerRows: headersWithSorting
  };
};

// Example 4: Custom Header Row Function
export const createCustomHeaderRows = (columnCount: number) => {
  // Get total columns from existing configuration
  const totalColumns = HeaderRowUtils.getColumnCount([
    HeaderRowGenerators.simpleLabels(
      Array(columnCount).fill(null).map((_, i) => ({
        header: `Column ${i + 1}`,
        alignment: 'center' as const
      }))
    )
  ]);
  
  console.log(`Table has ${totalColumns} total columns`);
  
  return [
    // Custom header with metadata
    {
      id: 'metadata-row',
      type: 'custom' as const,
      height: '30px',
      className: 'bg-yellow-50',
      cells: [{
        content: `${totalColumns} columns • Last updated: ${new Date().toLocaleString()}`,
        colSpan: totalColumns,
        alignment: 'center' as const,
        style: { fontSize: '12px', color: '#666' }
      }]
    },
    // Standard headers
    HeaderRowGenerators.simpleLabels(
      Array(columnCount).fill(null).map((_, i) => ({
        header: `Column ${i + 1}`,
        alignment: 'center' as const
      }))
    )
  ];
};