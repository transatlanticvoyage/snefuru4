'use client';

import { useState, useEffect } from 'react';

interface ColumnGroup {
  id: string;
  name: string;
  columns: ColumnDefinition[];
}

interface ColumnDefinition {
  key: string;
  label: string;
  description?: string;
}

interface ExportSitesProps {
  selectedSiteIds: string[];
  totalSitesCount: number;
  userId: string;
}

export default function ExportSitesComponent({ selectedSiteIds, totalSitesCount, userId }: ExportSitesProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'sql'>('csv');
  const [exportScope, setExportScope] = useState<'selected' | 'all'>('selected');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set(['core']));
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Load column definitions on mount
  useEffect(() => {
    loadColumnDefinitions();
  }, []);

  // Update selected columns when groups change
  useEffect(() => {
    const newSelectedColumns = columnGroups
      .filter(group => selectedGroups.has(group.id))
      .flatMap(group => group.columns.map(col => col.key));
    setSelectedColumns(newSelectedColumns);
  }, [selectedGroups, columnGroups]);

  // Set default scope based on selection
  useEffect(() => {
    if (selectedSiteIds.length > 0) {
      setExportScope('selected');
    } else {
      setExportScope('all');
    }
  }, [selectedSiteIds.length]);

  const loadColumnDefinitions = async () => {
    try {
      const response = await fetch('/api/export-sites/columns');
      const data = await response.json();
      
      if (response.ok) {
        setColumnGroups(data.columnGroups);
        // Default to core columns
        const coreColumns = data.columnGroups
          .find((group: ColumnGroup) => group.id === 'core')
          ?.columns.map((col: ColumnDefinition) => col.key) || [];
        setSelectedColumns(coreColumns);
      } else {
        setError('Failed to load column definitions');
      }
    } catch (err) {
      setError(`Failed to load columns: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleGroupToggle = (groupId: string) => {
    const newSelectedGroups = new Set(selectedGroups);
    if (newSelectedGroups.has(groupId)) {
      newSelectedGroups.delete(groupId);
    } else {
      newSelectedGroups.add(groupId);
    }
    setSelectedGroups(newSelectedGroups);
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      setError('Please select at least one column group');
      return;
    }

    if (exportScope === 'selected' && selectedSiteIds.length === 0) {
      setError('No sites selected. Please select sites or choose "Export All"');
      return;
    }

    try {
      setIsExporting(true);
      setExportStatus('Preparing export...');
      setError('');

      const exportRequest = {
        format: exportFormat,
        scope: exportScope,
        siteIds: exportScope === 'selected' ? selectedSiteIds.map(id => parseInt(id)) : undefined,
        columns: selectedColumns,
        userId: userId
      };

      console.log('Export request:', exportRequest);

      const response = await fetch('/api/export-sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportRequest)
      });

      if (response.ok) {
        setExportStatus('Generating file...');
        
        // Get filename from response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        const filename = filenameMatch ? filenameMatch[1] : `sites-export.${exportFormat}`;

        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setExportStatus(`✅ Export completed! Downloaded: ${filename}`);
      } else {
        const errorData = await response.json();
        setError(`Export failed: ${errorData.error}`);
        setExportStatus('');
      }
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setExportStatus('');
    } finally {
      setIsExporting(false);
    }
  };

  const formatButtons = [
    { value: 'csv', label: 'CSV', color: 'bg-green-600 hover:bg-green-700' },
    { value: 'xlsx', label: 'Excel', color: 'bg-blue-600 hover:bg-blue-700' },
    { value: 'sql', label: 'SQL', color: 'bg-gray-600 hover:bg-gray-700' }
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Export Sites Data</h3>
        
        {/* Export Format Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="flex gap-2">
            {formatButtons.map(format => (
              <button
                key={format.value}
                onClick={() => setExportFormat(format.value)}
                className={`px-3 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  exportFormat === format.value 
                    ? format.color 
                    : 'bg-gray-400 hover:bg-gray-500'
                }`}
              >
                {format.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Scope Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data to Export
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="scope"
                value="selected"
                checked={exportScope === 'selected'}
                onChange={(e) => setExportScope(e.target.value as 'selected' | 'all')}
                className="text-blue-600 focus:ring-blue-500 border-gray-300 mr-2"
                disabled={selectedSiteIds.length === 0}
              />
              <span className={selectedSiteIds.length === 0 ? 'text-gray-400' : 'text-gray-700'}>
                Export Selected Items ({selectedSiteIds.length} selected)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="scope"
                value="all"
                checked={exportScope === 'all'}
                onChange={(e) => setExportScope(e.target.value as 'selected' | 'all')}
                className="text-blue-600 focus:ring-blue-500 border-gray-300 mr-2"
              />
              <span className="text-gray-700">
                Export All Sites in Account ({totalSitesCount.toLocaleString()} total)
              </span>
            </label>
          </div>
        </div>

        {/* Column Group Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Fields to Include
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50 space-y-2">
            {columnGroups.map(group => (
              <label key={group.id} className="flex items-start">
                <input
                  type="checkbox"
                  checked={selectedGroups.has(group.id)}
                  onChange={() => handleGroupToggle(group.id)}
                  className="text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5 mr-2"
                />
                <div>
                  <div className="font-medium text-gray-800">{group.name}</div>
                  <div className="text-xs text-gray-500">
                    {group.columns.length} fields: {group.columns.slice(0, 3).map(c => c.label).join(', ')}
                    {group.columns.length > 3 && ` +${group.columns.length - 3} more`}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Selected: {selectedColumns.length} field{selectedColumns.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting || selectedColumns.length === 0 || (exportScope === 'selected' && selectedSiteIds.length === 0)}
          className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
        >
          {isExporting ? 'Generating Export...' : `Generate ${exportFormat.toUpperCase()} Export`}
        </button>

        {/* Status Messages */}
        {exportStatus && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800 font-medium">Status:</div>
            <div className="text-sm text-blue-700">{exportStatus}</div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-800 font-medium">Error:</div>
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600">
          <div className="font-medium mb-1">Instructions:</div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Select your preferred export format (CSV, Excel, or SQL)</li>
            <li>Choose whether to export selected sites or all sites in your account</li>
            <li>Select which data fields to include in the export</li>
            <li>Click "Generate Export" to download your file</li>
          </ol>
        </div>
      </div>
    </div>
  );
}