'use client';

import { useState } from 'react';

interface ExportButtonProps {
  allFilteredData: any[];
  selectedData: any[];
  starredData: any[];
  chosenData: any[];
  columns: any[];
}

export default function ExportButton({ 
  allFilteredData, 
  selectedData, 
  starredData,
  chosenData,
  columns 
}: ExportButtonProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xls'>('csv');

  const exportToCSV = (data: any[], filename: string) => {
    // Get visible columns
    const visibleColumns = columns.filter(col => 
      col.key !== 'serp_tool' && 
      col.key !== 'tags'
    );

    // Create header rows
    const headerRow1 = visibleColumns.map(col => 
      (col.headerRow1Text || 'keywordshub').toLowerCase()
    );
    const headerRow2 = visibleColumns.map(col => 
      (col.headerRow2Text || col.label).toLowerCase()
    );

    // Create data rows
    const dataRows = data.map(item => 
      visibleColumns.map(col => {
        let value = item[col.key];
        
        // Handle nested properties (e.g., exact_city.city_name)
        if (col.key.includes('.')) {
          const [table, field] = col.key.split('.');
          value = item[table]?.[field];
        }
        
        // Format value for CSV
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains comma or newline
          const escaped = value.replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('\n') 
            ? `"${escaped}"` 
            : escaped;
        }
        return value.toString();
      })
    );

    // Combine all rows
    const csvContent = [
      headerRow1.join(','),
      headerRow2.join(','),
      ...dataRows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToXLS = (data: any[], filename: string) => {
    // For XLS, we'll create an HTML table that Excel can read
    const visibleColumns = columns.filter(col => 
      col.key !== 'serp_tool' && 
      col.key !== 'tags'
    );

    // Create HTML table
    let html = '<table border="1">';
    
    // Header row 1
    html += '<tr>';
    visibleColumns.forEach(col => {
      html += `<th>${(col.headerRow1Text || 'keywordshub').toLowerCase()}</th>`;
    });
    html += '</tr>';
    
    // Header row 2
    html += '<tr>';
    visibleColumns.forEach(col => {
      html += `<th>${(col.headerRow2Text || col.label).toLowerCase()}</th>`;
    });
    html += '</tr>';
    
    // Data rows
    data.forEach(item => {
      html += '<tr>';
      visibleColumns.forEach(col => {
        let value = item[col.key];
        
        // Handle nested properties
        if (col.key.includes('.')) {
          const [table, field] = col.key.split('.');
          value = item[table]?.[field];
        }
        
        // Format value for HTML
        if (value === null || value === undefined) value = '';
        else if (typeof value === 'boolean') value = value ? 'true' : 'false';
        
        html += `<td>${value}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</table>';

    // Create blob and download with .xls extension
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (type: 'all' | 'selected' | 'starred') => {
    let dataToExport: any[] = [];
    let filename = '';
    
    switch (type) {
      case 'all':
        dataToExport = allFilteredData;
        filename = `keywords_all_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'selected':
        dataToExport = selectedData;
        filename = `keywords_selected_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'starred':
        dataToExport = starredData;
        filename = `keywords_starred_${new Date().toISOString().split('T')[0]}`;
        break;
    }
    
    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }
    
    if (exportFormat === 'csv') {
      exportToCSV(dataToExport, `${filename}.csv`);
    } else {
      exportToXLS(dataToExport, `${filename}.xls`);
    }
    
    setShowPopup(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowPopup(!showPopup)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
      >
        Export
      </button>
      {showPopup && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded shadow-lg p-4 z-50" style={{ minWidth: '250px' }}>
          {/* Export Format Selection */}
          <div className="mb-4">
            <div className="flex items-center gap-4 mb-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv')}
                  className="mr-2"
                />
                <span className="text-sm">CSV</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportFormat"
                  value="xls"
                  checked={exportFormat === 'xls'}
                  onChange={(e) => setExportFormat(e.target.value as 'xls')}
                  className="mr-2"
                />
                <span className="text-sm">XLS</span>
              </label>
            </div>
          </div>
          
          {/* Export Options */}
          <div className="space-y-2">
            <button
              onClick={() => handleExport('all')}
              className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded transition-colors"
            >
              Export all in current filters
            </button>
            <button
              onClick={() => handleExport('selected')}
              className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded transition-colors"
            >
              Export all selected
            </button>
            <button
              onClick={() => handleExport('starred')}
              className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded transition-colors"
            >
              Export all starred
            </button>
          </div>
        </div>
      )}
    </div>
  );
}