'use client';

import { Metadata } from 'next'
import MinimalTable from '@/app/components/MinimalTable'

export const metadata: Metadata = {
  title: '/chanbri_filter_controls_2',
}

export default function ChanbriFilterControls2Page() {
  // Sample data for demonstration
  const headers = ['ID', 'Name', 'Category', 'Display Name', 'Is Default'];
  
  const data = [
    [1, 'header_basic', 'layout', 'Basic Header', 'true'],
    [2, 'nav_sidebar', 'navigation', 'Side Navigation', 'false'],
    [3, 'footer_simple', 'layout', 'Simple Footer', 'true'],
    [4, 'table_grid', 'content', 'Data Table', 'false'],
    [5, 'form_basic', 'forms', 'Basic Form', 'true']
  ];

  // Sample tooltips (optional)
  const cellTooltips = [
    ['Unique ID', 'Template name', 'Category type', 'Display label', 'Default status'],
    ['Unique ID', 'Template name', 'Category type', 'Display label', 'Default status'],
    ['Unique ID', 'Template name', 'Category type', 'Display label', 'Default status'],
    ['Unique ID', 'Template name', 'Category type', 'Display label', 'Default status'],
    ['Unique ID', 'Template name', 'Category type', 'Display label', 'Default status']
  ];

  // Event handlers
  const handleCellClick = (rowIndex: number, colIndex: number, value: any) => {
    console.log(`Cell clicked: Row ${rowIndex}, Col ${colIndex}, Value: ${value}`);
  };

  const handleHeaderClick = (colIndex: number, headerName: string) => {
    console.log(`Header clicked: ${headerName} (Column ${colIndex})`);
  };

  const handleRowClick = (rowIndex: number, rowData: any[]) => {
    console.log(`Row clicked: ${rowIndex}`, rowData);
  };

  return (
    <>
      <h1>Minimalistic Table Template System</h1>
      
      <MinimalTable 
        headers={headers}
        data={data}
        tableClassName="custom-table"
        theadClassName="table-header"
        tbodyClassName="table-body"
        thClassName="header-cell"
        tdClassName="data-cell"
        headerTrClassName="header-row"
        bodyTrClassName="body-row"
        cellTooltips={cellTooltips}
        onCellClick={handleCellClick}
        onHeaderClick={handleHeaderClick}
        onRowClick={handleRowClick}
      />
    </>
  )
}