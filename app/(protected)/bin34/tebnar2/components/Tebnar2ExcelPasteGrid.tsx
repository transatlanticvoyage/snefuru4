'use client';

import { useEffect, useState, useRef } from 'react';

const gridCols = 9; // A-I
const gridRows = 11;
const colHeaders = Array.from({ length: gridCols }, (_, i) => String.fromCharCode(65 + i)); // ['A',...,'I']

interface Tebnar2ExcelPasteGridProps {
  onGridDataChange?: (grid: string[][]) => void;
  presetData?: string[][] | null;
  gridData?: string[][];
}

export default function Tebnar2ExcelPasteGrid({ onGridDataChange, presetData, gridData }: Tebnar2ExcelPasteGridProps) {
  const [grid, setGrid] = useState<string[][]>(Array.from({ length: gridRows }, () => Array(gridCols).fill('')));
  const [selected, setSelected] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const gridRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (onGridDataChange) onGridDataChange(grid);
  }, [grid, onGridDataChange]);

  // Handle preset data when it changes
  useEffect(() => {
    if (presetData && presetData.length > 0) {
      // Create a new grid with preset data
      const newGrid = Array.from({ length: gridRows }, () => Array(gridCols).fill(''));
      
      // Fill the grid with preset data
      presetData.forEach((row, rowIndex) => {
        if (rowIndex < gridRows) {
          row.forEach((cell, colIndex) => {
            if (colIndex < gridCols) {
              newGrid[rowIndex][colIndex] = cell;
            }
          });
        }
      });
      
      setGrid(newGrid);
    }
  }, [presetData]);

  // Handle external grid data changes (for clear button, etc.)
  useEffect(() => {
    if (gridData !== undefined && Array.isArray(gridData)) {
      // If it's an empty grid (for clearing), set it directly
      if (gridData.length === 0 || (gridData.length > 0 && gridData.every(row => Array.isArray(row) && row.every(cell => cell === '')))) {
        const emptyGrid = Array.from({ length: gridRows }, () => Array(gridCols).fill(''));
        setGrid(emptyGrid);
      } else {
        // Otherwise, use the provided grid data
        const newGrid = Array.from({ length: gridRows }, () => Array(gridCols).fill(''));
        gridData.forEach((row, rowIndex) => {
          if (rowIndex < gridRows && Array.isArray(row)) {
            row.forEach((cell, colIndex) => {
              if (colIndex < gridCols) {
                newGrid[rowIndex][colIndex] = cell || '';
              }
            });
          }
        });
        setGrid(newGrid);
      }
    }
  }, [gridData]);

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    setSelected({ row, col });
  };

  // Handle cell change
  const handleCellChange = (row: number, col: number, value: string) => {
    setGrid(prev => {
      const newGrid = prev.map(rowArr => [...rowArr]);
      newGrid[row][col] = value;
      return newGrid;
    });
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const rows = text.split(/\r?\n/).filter(Boolean);
    const newGrid = grid.map(row => [...row]);
    rows.forEach((rowStr, i) => {
      const cells = rowStr.split(/\t/);
      cells.forEach((cell, j) => {
        const r = selected.row + i;
        const c = selected.col + j;
        if (r < gridRows && c < gridCols) {
          newGrid[r][c] = cell;
        }
      });
    });
    setGrid(newGrid);
  };

  return (
    <div className="mb-8 w-full">
      <div className="font-bold mb-2">kzelement6</div>
      <div className="w-full">
        <table
          ref={gridRef}
          className="border border-gray-300 w-full"
          tabIndex={0}
          onPaste={handlePaste}
        >
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 w-12 text-center">carrot row</th>
              <th className="border border-gray-300 bg-gray-100 min-w-[120px] text-center"><strong>e_prompt1</strong></th>
              <th className="border border-gray-300 bg-gray-100 min-w-[120px] text-center"><strong>e_zpf_img_code</strong></th>
              <th className="border border-gray-300 bg-gray-100 min-w-[120px] text-center"><strong>e_width</strong></th>
              <th className="border border-gray-300 bg-gray-100 min-w-[120px] text-center"><strong>e_height</strong></th>
              <th className="border border-gray-300 bg-gray-100 min-w-[120px] text-center"><strong>e_associated_content1</strong></th>
              <th className="border border-gray-300 bg-gray-100 min-w-[120px] text-center"><strong>e_file_name1</strong></th>
              <th className="border border-gray-300 bg-gray-100 min-w-[120px] text-center"><strong>e_more_instructions1</strong></th>
              <th className="border border-gray-300 bg-gray-100 min-w-[120px] text-center"><strong>e_ai_tool1</strong></th>
              <th className="border border-gray-300 bg-gray-100 min-w-[120px] text-center"><strong>-</strong></th>
            </tr>
            <tr>
              <th className="border border-gray-300 bg-gray-100 w-12 text-center">potato row</th>
              {colHeaders.map((col, idx) => (
                <th key={col} className="border border-gray-300 bg-gray-100 min-w-[120px] text-center">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: gridRows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                <th className="border border-gray-300 bg-gray-100 text-center w-12">{rowIdx + 1}</th>
                {Array.from({ length: gridCols }).map((_, colIdx) => (
                  <td
                    key={colIdx}
                    className={`border border-gray-300 min-w-[120px] h-10 cursor-pointer ${selected.row === rowIdx && selected.col === colIdx ? 'bg-blue-100' : ''}`}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                  >
                    <input
                      type="text"
                      value={grid[rowIdx][colIdx]}
                      onChange={e => handleCellChange(rowIdx, colIdx, e.target.value)}
                      className="w-full h-full px-2 bg-transparent outline-none border-none"
                      onFocus={() => handleCellClick(rowIdx, colIdx)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}