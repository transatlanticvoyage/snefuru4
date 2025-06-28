'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface WaterRecord {
  id: string;
  water1: string;
  water2: string;
  water3: string;
  water4: string;
  water5: string;
  water6: string;
  water7: string;
  water8: string;
  water9: string;
  water10: string;
  water11: string;
  water12: string;
  water13: string;
  water14: string;
  water15: string;
}

type ColumnTemplateKey = 'option1' | 'option2' | 'option3' | 'option4' | 'option5';
type StickyColumnKey = 'option1' | 'option2' | 'option3' | 'option4' | 'option5';

const columnTemplates: Record<ColumnTemplateKey, { name: string; range: string; columns: (keyof WaterRecord)[] }> = {
  'option1': {
    name: 'col temp all',
    range: 'columns 1-~',
    columns: ['water1', 'water2', 'water3', 'water4', 'water5', 'water6', 'water7', 'water8', 'water9', 'water10', 'water11', 'water12', 'water13', 'water14', 'water15']
  },
  'option2': {
    name: 'col temp a',
    range: 'columns 1-7',
    columns: ['water1', 'water2', 'water3', 'water4', 'water5', 'water6', 'water7']
  },
  'option3': {
    name: 'col temp b',
    range: 'columns 8-14',
    columns: ['water8', 'water9', 'water10', 'water11', 'water12', 'water13', 'water14']
  },
  'option4': {
    name: 'col temp c',
    range: 'columns 15-21',
    columns: ['water15'] // Only water15 exists, but keeping structure for future expansion
  },
  'option5': {
    name: 'col temp d',
    range: 'columns 22-28',
    columns: [] // No columns in this range currently
  }
};

const stickyOptions: Record<StickyColumnKey, number> = {
  'option1': 1,
  'option2': 2,
  'option3': 3,
  'option4': 4,
  'option5': 5
};

// Generate mock data for now
const generateMockData = (): WaterRecord[] => {
  const data: WaterRecord[] = [];
  for (let i = 1; i <= 100; i++) {
    data.push({
      id: `row-${i}`,
      water1: `Data ${i}-1`,
      water2: `Data ${i}-2`,
      water3: `Data ${i}-3`,
      water4: `Data ${i}-4`,
      water5: `Data ${i}-5`,
      water6: `Data ${i}-6`,
      water7: `Data ${i}-7`,
      water8: `Data ${i}-8`,
      water9: `Data ${i}-9`,
      water10: `Data ${i}-10`,
      water11: `Data ${i}-11`,
      water12: `Data ${i}-12`,
      water13: `Data ${i}-13`,
      water14: `Data ${i}-14`,
      water15: `Data ${i}-15`,
    });
  }
  return data;
};

export default function WaterTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data] = useState<WaterRecord[]>(generateMockData());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<keyof WaterRecord | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Column template and sticky column state
  const [selectedColumnTemplate, setSelectedColumnTemplate] = useState<ColumnTemplateKey>('option1');
  const [selectedStickyOption, setSelectedStickyOption] = useState<StickyColumnKey>('option1');

  // Initialize from URL parameters
  useEffect(() => {
    const coltemp = searchParams.get('coltemp') as ColumnTemplateKey;
    const stickycol = searchParams.get('stickycol') as StickyColumnKey;
    
    if (coltemp && columnTemplates[coltemp]) {
      setSelectedColumnTemplate(coltemp);
    }
    if (stickycol && stickyOptions[stickycol]) {
      setSelectedStickyOption(stickycol);
    }
  }, [searchParams]);

  // Update URL when selections change
  const updateUrl = (colTemplate: ColumnTemplateKey, stickyCol: StickyColumnKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('coltemp', colTemplate);
    params.set('stickycol', stickyCol);
    router.push(`?${params.toString()}`);
  };

  const handleColumnTemplateChange = (option: ColumnTemplateKey) => {
    setSelectedColumnTemplate(option);
    updateUrl(option, selectedStickyOption);
  };

  const handleStickyOptionChange = (option: StickyColumnKey) => {
    setSelectedStickyOption(option);
    updateUrl(selectedColumnTemplate, option);
  };

  // Get visible columns based on template
  const visibleColumns = useMemo(() => {
    return columnTemplates[selectedColumnTemplate].columns;
  }, [selectedColumnTemplate]);

  // Get sticky columns
  const stickyColumnCount = stickyOptions[selectedStickyOption];
  const allColumns: (keyof WaterRecord)[] = ['water1', 'water2', 'water3', 'water4', 'water5', 'water6', 'water7', 'water8', 'water9', 'water10', 'water11', 'water12', 'water13', 'water14', 'water15'];
  const stickyColumns = allColumns.slice(0, stickyColumnCount);
  const nonStickyVisibleColumns = visibleColumns.filter(col => !stickyColumns.includes(col));

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => {
      return Object.values(row).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredData, sortField, sortOrder]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof WaterRecord) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Column Template Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* SQL View Info */}
        <div className="border border-gray-300 rounded p-2" style={{ maxWidth: '130px', maxHeight: '75px' }}>
          <div className="text-xs">
            <div className="font-bold">SQL View Info</div>
            <div>view name: water_view</div>
            <div># columns: 15</div>
          </div>
        </div>

        {/* Column Templates */}
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm">Column Templates (Show/Hide)</div>
          <div className="flex" style={{ maxWidth: '600px', maxHeight: '75px' }}>
            {Object.entries(columnTemplates).map(([key, template]) => (
              <button
                key={key}
                onClick={() => handleColumnTemplateChange(key as ColumnTemplateKey)}
                className={`border text-xs leading-tight ${
                  selectedColumnTemplate === key 
                    ? 'bg-navy-900 text-white border-navy-900' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                style={{ 
                  width: '120px', 
                  backgroundColor: selectedColumnTemplate === key ? '#1e3a8a' : undefined,
                  padding: '8px'
                }}
              >
                <div>{key.toUpperCase()}</div>
                <div>{template.name}</div>
                <div>{template.range}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sticky Columns */}
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm">Sticky Columns At Left Side Of UI Grid Table</div>
          <div className="flex" style={{ maxHeight: '75px' }}>
            {Object.entries(stickyOptions).map(([key, count]) => (
              <button
                key={key}
                onClick={() => handleStickyOptionChange(key as StickyColumnKey)}
                className={`border text-xs leading-tight px-3 py-2 ${
                  selectedStickyOption === key 
                    ? 'bg-navy-900 text-white border-navy-900' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                style={{ 
                  minWidth: '80px',
                  backgroundColor: selectedStickyOption === key ? '#1e3a8a' : undefined 
                }}
              >
                <div>{key.toUpperCase()}</div>
                <div>{count} left-most</div>
                <div>column{count > 1 ? 's' : ''}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search all columns..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Showing {paginatedData.length} of {sortedData.length} records
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Sticky columns */}
              {stickyColumns.map((col, index) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className={`px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100 sticky bg-gray-50 z-10 ${
                    index === stickyColumns.length - 1 ? 'border-r-4 border-black' : ''
                  }`}
                  style={{ left: `${index * 150}px` }}
                >
                  <div className="flex items-center gap-1">
                    <span>{col}</span>
                    {sortField === col && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {/* Non-sticky visible columns */}
              {nonStickyVisibleColumns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    <span>{col}</span>
                    {sortField === col && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {/* Sticky columns */}
                {stickyColumns.map((col, index) => (
                  <td 
                    key={col} 
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky bg-white ${
                      index === stickyColumns.length - 1 ? 'border-r-4 border-black' : ''
                    }`}
                    style={{ left: `${index * 150}px` }}
                  >
                    {row[col]}
                  </td>
                ))}
                {/* Non-sticky visible columns */}
                {nonStickyVisibleColumns.map((col) => (
                  <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}