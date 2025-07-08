'use client';

import { useEffect } from 'react';
import AzMinimalTable from './components/azMinimalTable'
import AzColumnTemplateControls from './components/azColumnTemplateControls'
import AzFilterControls from './components/azFilterControls'
import AzSearchBox from './components/azSearchBox'
import AzPaginationControls from './components/azPaginationControls'
import { tableConfig } from './config/tableConfig'
import artichokeExportData from './data/artichokeData'
import './styles/az-table-template.css'

export default function Azulp1Page() {
  useEffect(() => {
    document.title = 'Artichoke Exports - /azulp1';
  }, []);
  
  // Convert config columns to headers (for backward compatibility)
  const headers = tableConfig.columns.map(col => col.header);
  
  // Convert artichoke data to table format
  const data = artichokeExportData.map(row => 
    tableConfig.columns.map(col => {
      const value = row[col.field as keyof typeof row];
      
      // Apply formatting if specified
      if (col.format && typeof col.format === 'function') {
        return col.format(value);
      }
      
      return value;
    })
  );

  // Generate tooltips for artichoke data
  const cellTooltips = artichokeExportData.map(() => 
    tableConfig.columns.map(col => `${col.header}: ${col.field}`)
  );

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
      <h1>Global Artichoke Exports by Country</h1>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        30 countries • 30 data columns • Real-time export statistics
      </p>
      
      <AzColumnTemplateControls />
      <AzFilterControls />
      <AzSearchBox />
      <AzPaginationControls />
      
      <AzMinimalTable 
        headerRows={tableConfig.headerRows}
        data={data}
        tableClassName="artichoke-export-table"
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