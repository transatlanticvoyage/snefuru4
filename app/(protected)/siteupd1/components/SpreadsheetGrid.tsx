'use client';

import { useState, useRef, useEffect } from 'react';

interface SpreadsheetGridProps {
  data: string[][];
  onDataChange: (data: string[][]) => void;
}

export default function SpreadsheetGrid({ data, onDataChange }: SpreadsheetGridProps) {
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [editValue, setEditValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ROWS = 300;
  const COLS = 6;
  const COLUMN_HEADERS = [
    'columnA-sitespren.sitespren_base',
    'columnB-host_company.name', 
    'columnC-host_account.username',
    'columnD',
    'columnE',
    'columnF'
  ];

  // Initialize empty grid if data is empty
  useEffect(() => {
    if (data.length === 0) {
      const emptyGrid = Array(ROWS).fill(null).map(() => Array(COLS).fill(''));
      onDataChange(emptyGrid);
    }
  }, []);

  const currentData = data.length > 0 ? data : Array(ROWS).fill(null).map(() => Array(COLS).fill(''));

  const updateCell = (row: number, col: number, value: string) => {
    const newData = [...currentData];
    if (!newData[row]) {
      newData[row] = Array(COLS).fill('');
    }
    newData[row][col] = value;
    onDataChange(newData);
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setEditingCell({ row, col });
    setEditValue(currentData[row]?.[col] || '');
  };

  const handleCellChange = (value: string) => {
    setEditValue(value);
    if (editingCell) {
      updateCell(editingCell.row, editingCell.col, value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      setEditingCell(null);
      // Move to next row
      if (selectedCell.row < ROWS - 1) {
        setSelectedCell({ row: selectedCell.row + 1, col: selectedCell.col });
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setEditingCell(null);
      // Move to next column
      if (selectedCell.col < COLS - 1) {
        setSelectedCell({ row: selectedCell.row, col: selectedCell.col + 1 });
      } else if (selectedCell.row < ROWS - 1) {
        // Move to first column of next row
        setSelectedCell({ row: selectedCell.row + 1, col: 0 });
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setSelectedCell(null);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const rows = pastedText.split('\n').filter(row => row.trim() !== '');
    const newData = [...currentData];

    let startRow = selectedCell?.row || 0;
    let startCol = selectedCell?.col || 0;

    rows.forEach((row, rowIndex) => {
      const cells = row.split('\t'); // Handle tab-separated values
      cells.forEach((cell, colIndex) => {
        const targetRow = startRow + rowIndex;
        const targetCol = startCol + colIndex;
        
        if (targetRow < ROWS && targetCol < COLS) {
          if (!newData[targetRow]) {
            newData[targetRow] = Array(COLS).fill('');
          }
          newData[targetRow][targetCol] = cell.trim();
        }
      });
    });

    onDataChange(newData);
  };

  const clearAll = () => {
    const emptyGrid = Array(ROWS).fill(null).map(() => Array(COLS).fill(''));
    onDataChange(emptyGrid);
    setSelectedCell(null);
    setEditingCell(null);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="bg-gray-50 p-2 border-b border-gray-300 flex justify-between items-center">
        <span className="text-sm font-medium">Spreadsheet (300 rows × 6 columns)</span>
        <button
          onClick={clearAll}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
        >
          Clear All
        </button>
      </div>

      {/* Spreadsheet */}
      <div className="overflow-auto max-h-96 relative">
        <table className="w-full border-collapse">
          {/* Header Row */}
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="w-12 border border-gray-300 p-1 text-xs font-medium text-gray-600">#</th>
              {COLUMN_HEADERS.map((header, col) => (
                <th 
                  key={col}
                  className="border border-gray-300 p-2 text-xs font-medium text-gray-700 min-w-32"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }).map((_, row) => (
              <tr key={row}>
                {/* Row number */}
                <td className="border border-gray-300 p-1 text-xs text-gray-500 text-center bg-gray-50">
                  {row + 1}
                </td>
                {/* Data cells */}
                {Array.from({ length: COLS }).map((_, col) => {
                  const isSelected = selectedCell?.row === row && selectedCell?.col === col;
                  const isEditing = editingCell?.row === row && editingCell?.col === col;
                  const cellValue = currentData[row]?.[col] || '';

                  return (
                    <td 
                      key={col}
                      className={`border border-gray-300 p-0 relative ${
                        isSelected ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => handleCellClick(row, col)}
                    >
                      {isEditing ? (
                        <textarea
                          ref={textareaRef}
                          value={editValue}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onPaste={handlePaste}
                          onBlur={() => setEditingCell(null)}
                          className="w-full h-8 p-1 text-sm border-none outline-none resize-none bg-white"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="w-full h-8 p-1 text-sm cursor-text flex items-center"
                          onKeyDown={handleKeyDown}
                          tabIndex={0}
                        >
                          {cellValue}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 p-2 border-t border-gray-300 text-xs text-gray-600">
        <strong>Usage:</strong> Click cells to edit • Press Enter to move down • Press Tab to move right • Paste data from spreadsheets
      </div>
    </div>
  );
}