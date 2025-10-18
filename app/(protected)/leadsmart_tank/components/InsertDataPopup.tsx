'use client';

import { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import FileReleasesGrid from './FileReleasesGrid';
import SubsheetsGrid from './SubsheetsGrid';
import SubpartsGrid from './SubpartsGrid';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InsertDataPopup({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [gridData, setGridData] = useState<string[][]>([]);
  const [fullDataset, setFullDataset] = useState<string[][]>([]);
  const [inserting, setInserting] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null);
  const maxPreviewRows = 100; // Only show first 100 rows in grid for performance
  
  // Selection states for the three grids
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [selectedSubsheetId, setSelectedSubsheetId] = useState<number | null>(null);
  const [selectedSubpartId, setSelectedSubpartId] = useState<number | null>(null);

  const columnHeaders = [
    'zip_code',
    'payout',
    'city_name',
    'state_code',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-'
  ];

  // Initialize with empty grid
  useEffect(() => {
    if (isOpen && gridData.length === 0) {
      // Start with 20 empty rows
      const emptyGrid = Array(20).fill(null).map(() => Array(10).fill(''));
      setGridData(emptyGrid);
    }
  }, [isOpen, gridData.length]);

  // Auto-focus paste area when it opens
  useEffect(() => {
    if (showPasteArea && pasteAreaRef.current) {
      pasteAreaRef.current.focus();
    }
  }, [showPasteArea]);

  if (!isOpen) return null;

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Parse the pasted data (assuming TSV format from spreadsheet)
    const rows = pastedText.split('\n').map(row => {
      // Split by tab, but also handle cases where there might be fewer than 10 columns
      const cols = row.split('\t');
      // Pad with empty strings if fewer than 10 columns
      while (cols.length < 10) {
        cols.push('');
      }
      // Take only first 10 columns if more than 10
      return cols.slice(0, 10);
    });

    // Filter out completely empty rows
    const filteredRows = rows.filter(row => row.some(cell => cell.trim() !== ''));
    
    // Limit to 12,000 rows
    const limitedRows = filteredRows.slice(0, 12000);
    
    // Store full dataset
    setFullDataset(limitedRows);
    
    // Only show preview in grid (first 100 rows for performance)
    const previewRows = limitedRows.slice(0, maxPreviewRows);
    
    // Add more empty rows if we have less than 20 total preview rows
    while (previewRows.length < Math.min(20, limitedRows.length)) {
      previewRows.push(Array(10).fill(''));
    }

    setGridData(previewRows);
    
    // Show confirmation if many rows
    if (limitedRows.length > maxPreviewRows) {
      setTimeout(() => {
        alert(`Successfully loaded ${limitedRows.length} rows. Showing preview of first ${maxPreviewRows} rows for performance.`);
      }, 100);
    }
  };

  const handlePasteFromArea = () => {
    if (!pasteAreaRef.current) return;
    
    const pastedText = pasteAreaRef.current.value;
    
    if (!pastedText.trim()) {
      alert('Please paste data into the text area first');
      return;
    }
    
    // Parse the pasted data (assuming TSV format from spreadsheet)
    const rows = pastedText.split('\n').map(row => {
      // Split by tab, but also handle cases where there might be fewer than 10 columns
      const cols = row.split('\t');
      // Pad with empty strings if fewer than 10 columns
      while (cols.length < 10) {
        cols.push('');
      }
      // Take only first 10 columns if more than 10
      return cols.slice(0, 10);
    });

    // Filter out completely empty rows
    const filteredRows = rows.filter(row => row.some(cell => cell.trim() !== ''));
    
    // Limit to 12,000 rows
    const limitedRows = filteredRows.slice(0, 12000);
    
    // Store full dataset
    setFullDataset(limitedRows);
    
    // Only show preview in grid (first 100 rows for performance)
    const previewRows = limitedRows.slice(0, maxPreviewRows);
    
    // Add more empty rows if we have less than 20 total preview rows
    while (previewRows.length < Math.min(20, limitedRows.length)) {
      previewRows.push(Array(10).fill(''));
    }

    setGridData(previewRows);
    
    // Clear the paste area
    pasteAreaRef.current.value = '';
    setShowPasteArea(false);
    
    // Show confirmation message
    alert(`Successfully loaded ${limitedRows.length} rows. Showing preview of first ${previewRows.length} rows for performance.`);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...gridData];
    newData[rowIndex][colIndex] = value;
    setGridData(newData);
  };

  const handleInsertData = async () => {
    if (!user) {
      alert('You must be logged in to insert data');
      return;
    }

    // Check that all three grids have selections
    if (!selectedReleaseId || !selectedSubsheetId || !selectedSubpartId) {
      alert('Please make selections in all three grids (Release, Subsheet, and Subpart) before inserting data.');
      return;
    }

    // Use fullDataset if available, otherwise use gridData
    const sourceData = fullDataset.length > 0 ? fullDataset : gridData;
    
    // Filter out empty rows
    const dataToInsert = sourceData.filter(row => 
      row.some(cell => cell.trim() !== '')
    );

    if (dataToInsert.length === 0) {
      alert('No data to insert. Please paste data into the grid.');
      return;
    }

    setInserting(true);
    
    try {
      // TODO: Implement database insertion logic here
      // This is where you'll map the columns to the database fields
      // and insert the data into leadsmart_zip_based_data table
      
      console.log('Data to insert:', dataToInsert);
      console.log('Total rows:', dataToInsert.length);
      
      // For now, just show a message
      alert(`Ready to insert ${dataToInsert.length} rows. Database insertion functionality will be implemented next.`);
      
      // When ready, this would be something like:
      // const records = dataToInsert.map(row => ({
      //   zip_code: row[0] || null,
      //   payout: row[1] ? Number(row[1]) : null,
      //   city_name: row[2] || null,
      //   state_code: row[3] || null,
      //   user_id: user.id,
      //   // Columns 4-9 are placeholder columns and not inserted
      //   // Other fields can be set to null or default values as needed:
      //   leadsmart_file_release: null,
      //   subsheet: null,
      //   subpart_of_subsheet: null,
      //   sheet_row_id: null,
      //   payout_note: null
      // }));
      // 
      // const { error } = await supabase
      //   .from('leadsmart_zip_based_data')
      //   .insert(records);
      // 
      // if (error) throw error;
      // onSuccess();
      
    } catch (error) {
      console.error('Error inserting data:', error);
      alert('Failed to insert data');
    } finally {
      setInserting(false);
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      const emptyGrid = Array(20).fill(null).map(() => Array(10).fill(''));
      setGridData(emptyGrid);
      setFullDataset([]);
    }
  };
  
  // Calculate total rows with data
  const totalRowsWithData = fullDataset.length > 0 
    ? fullDataset.filter(row => row.some(cell => cell.trim() !== '')).length
    : gridData.filter(row => row.some(cell => cell.trim() !== '')).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden" style={{ width: '1800px', height: '100vh', maxHeight: '100vh' }}>
        {/* Two Column Layout - Full Height */}
        <div className="flex h-full">
          {/* Left Side - ALL Existing Content */}
          <div className="flex-1 flex flex-col border-r border-gray-300">
            {/* Header */}
            <div className="p-6 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Insert New Data</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Paste your spreadsheet data below (up to 12,000 rows). First 4 columns will be mapped to: <span className="font-semibold">zip_code, payout, city_name, state_code</span>. Columns 5-10 are placeholders (not inserted into database).
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-3 mb-4">
                <button
                  onClick={handleInsertData}
                  disabled={inserting || !selectedReleaseId || !selectedSubsheetId || !selectedSubpartId}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    inserting || !selectedReleaseId || !selectedSubsheetId || !selectedSubpartId
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title={!selectedReleaseId || !selectedSubsheetId || !selectedSubpartId ? 'Please make selections in all three grids on the right' : ''}
                >
                  {inserting ? 'Inserting...' : 'insert data'}
                </button>
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md font-medium transition-colors"
                >
                  Clear All
                </button>
                <div className="text-sm text-gray-600">
                  Total rows with data: <span className="font-bold">{totalRowsWithData}</span>
                  {fullDataset.length > 0 && fullDataset.length > maxPreviewRows && (
                    <span className="ml-2 text-blue-600">(Showing preview of first {maxPreviewRows} rows)</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 ml-4 flex items-center space-x-3">
                  <span>Selections:</span>
                  <span className={selectedReleaseId ? 'text-green-600 font-semibold' : 'text-red-600'}>
                    Release: {selectedReleaseId ? '✓' : '✗'}
                  </span>
                  <span className={selectedSubsheetId ? 'text-green-600 font-semibold' : 'text-red-600'}>
                    Subsheet: {selectedSubsheetId ? '✓' : '✗'}
                  </span>
                  <span className={selectedSubpartId ? 'text-green-600 font-semibold' : 'text-red-600'}>
                    Subpart: {selectedSubpartId ? '✓' : '✗'}
                  </span>
                </div>
              </div>
              
              {/* Paste Columns Button and Area */}
              <div className="border-t pt-4">
                <div className="flex items-start space-x-3">
                  <div className="font-bold text-gray-800" style={{ fontSize: '16px', paddingTop: '8px' }}>
                    paste option 1
                  </div>
                  <button
                    onClick={() => setShowPasteArea(!showPasteArea)}
                    className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-md font-medium transition-colors"
                  >
                    {showPasteArea ? 'Hide Paste Area' : 'paste columns'}
                  </button>
                  
                  {showPasteArea && (
                    <div className="flex-1">
                      <div className="flex items-start space-x-2">
                        <div className="flex-1">
                          <textarea
                            ref={pasteAreaRef}
                            placeholder="Paste your column data here (Ctrl+V or Cmd+V)..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                            rows={4}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Copy 4 columns from Google Sheets (zip_code, payout, city_name, state_code), then paste here. Additional columns can be included but will not be inserted.
                          </div>
                        </div>
                        <button
                          onClick={handlePasteFromArea}
                          className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium transition-colors whitespace-nowrap"
                        >
                          Load Data
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Spreadsheet Area */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              <div className="bg-white border border-gray-300 rounded">
                <table className="w-full border-collapse" style={{ fontSize: '12px' }}>
                <thead>
                  <tr className="bg-gray-200 sticky top-0 z-20">
                    <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-xs" style={{ minWidth: '40px', width: '40px' }}>
                      #
                    </th>
                    {columnHeaders.map((header, idx) => (
                      <th 
                        key={idx}
                        className="border border-gray-300 px-2 py-2 text-left font-semibold text-xs"
                        style={{ minWidth: '100px' }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridData.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-2 py-1 text-center text-gray-500 font-mono text-xs">
                        {rowIndex + 1}
                      </td>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} className="border border-gray-300 p-0">
                          {rowIndex === 0 && colIndex === 0 ? (
                            // First cell gets the textarea for paste handling
                            <textarea
                              ref={textareaRef}
                              value={cell}
                              onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                              onPaste={handlePaste}
                              className="w-full h-full px-2 py-1 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              style={{ minHeight: '28px' }}
                              placeholder="Paste here..."
                            />
                          ) : (
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                              className="w-full px-2 py-1 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{ minHeight: '28px' }}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800 mb-1">Column Mapping:</div>
                  <div>
                    <span className="font-medium">Columns 1-4:</span> zip_code, payout, city_name, state_code <span className="text-green-600">(will be inserted into database)</span>
                  </div>
                  <div>
                    <span className="font-medium">Columns 5-10:</span> Placeholder columns <span className="text-gray-500">(not mapped to database)</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          {/* End of Left Side */}

          {/* Right Side - File Releases Grid */}
          <div className="flex-1 bg-white flex flex-col overflow-auto">
            <FileReleasesGrid onReleaseSelect={setSelectedReleaseId} />
            <SubsheetsGrid 
              selectedReleaseId={selectedReleaseId} 
              onSubsheetSelect={setSelectedSubsheetId}
            />
            <SubpartsGrid 
              selectedSubsheetId={selectedSubsheetId}
              onSubpartSelect={setSelectedSubpartId}
            />
          </div>
          {/* End of Right Side */}
        </div>
        {/* End of Two Column Layout */}
      </div>
    </div>
  );
}

