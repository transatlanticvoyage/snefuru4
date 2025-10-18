'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface LeadsmartData {
  global_row_id: number;
  sheet_row_id: number | null;
  zip_code: string | null;
  payout: number | null;
  city_name: string | null;
  state_code: string | null;
  rel_release_id: number | null;
  rel_subsheet_id: number | null;
  rel_subpart_id: number | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  payout_note?: string | null; // From join with leadsmart_subparts
}

interface Props {
  refreshTrigger: number;
  jettisonFilter?: {
    type: 'release' | 'subsheet' | 'subpart' | null;
    id: number | null;
  };
}

export default function LeadsmartTankTable({ refreshTrigger, jettisonFilter }: Props) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  // Data states
  const [data, setData] = useState<LeadsmartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Pagination states
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [currentRowPage, setCurrentRowPage] = useState(1);
  const [columnsPerPage, setColumnsPerPage] = useState(10);
  const [currentColumnPage, setCurrentColumnPage] = useState(1);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Editing state
  const [editingCell, setEditingCell] = useState<{ rowId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // New row state
  const [newRow, setNewRow] = useState<Partial<LeadsmartData> | null>(null);

  // All columns (including static UI-only columns)
  const allColumns = [
    'global_row_id',
    'rel_release_id',
    'rel_subsheet_id',
    'rel_subpart_id',
    'payout_note',
    'zip_code',
    'payout',
    'city_name',
    'state_code',
    'user_id',
    'created_at',
    'updated_at'
  ];
  
  // Static columns (no direct database column, but joined data)
  const staticColumns: string[] = [];
  
  // Columns that come from joined tables
  const joinedColumns = ['payout_note'];

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('leadsmart_zip_based_data')
        .select(`
          *,
          leadsmart_subparts!rel_subpart_id (
            payout_note
          )
        `);
      
      // Apply jettison filter if active
      if (jettisonFilter && jettisonFilter.type && jettisonFilter.id) {
        if (jettisonFilter.type === 'release') {
          query = query.eq('rel_release_id', jettisonFilter.id);
        } else if (jettisonFilter.type === 'subsheet') {
          query = query.eq('rel_subsheet_id', jettisonFilter.id);
        } else if (jettisonFilter.type === 'subpart') {
          query = query.eq('rel_subpart_id', jettisonFilter.id);
        }
      }
      
      query = query.order('global_row_id', { ascending: false });
      
      const { data: fetchedData, error } = await query;
      
      if (error) throw error;
      
      // Flatten the joined data
      const flattenedData = fetchedData?.map(row => ({
        ...row,
        payout_note: row.leadsmart_subparts?.payout_note || null
      })) || [];
      
      setData(flattenedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase, jettisonFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // Listen for inline create event
  useEffect(() => {
    const handleCreateInline = () => {
      const newRowData: Partial<LeadsmartData> = {
        zip_code: '',
        payout: null,
        city_name: '',
        state_code: '',
        rel_release_id: null,
        rel_subsheet_id: null,
        rel_subpart_id: null,
        user_id: user?.id || null
      };
      setNewRow(newRowData);
    };

    window.addEventListener('leadsmart-create-inline', handleCreateInline);
    return () => window.removeEventListener('leadsmart-create-inline', handleCreateInline);
  }, [user]);

  // Filter data based on search
  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return Object.values(row).some(val => 
      val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
    );
  });

  // Row pagination
  const totalRows = filteredData.length + (newRow ? 1 : 0);
  const totalRowPages = Math.ceil(totalRows / rowsPerPage);
  const startRowIndex = (currentRowPage - 1) * rowsPerPage;
  const endRowIndex = startRowIndex + rowsPerPage;
  
  let paginatedData = filteredData.slice(startRowIndex, endRowIndex);
  
  // Add new row at the top of current page if on page 1
  if (newRow && currentRowPage === 1) {
    paginatedData = [newRow as LeadsmartData, ...paginatedData.slice(0, rowsPerPage - 1)];
  }

  // Column pagination
  const totalColumns = allColumns.length;
  const totalColumnPages = Math.ceil(totalColumns / columnsPerPage);
  const startColumnIndex = (currentColumnPage - 1) * columnsPerPage;
  const endColumnIndex = startColumnIndex + columnsPerPage;
  const paginatedColumns = allColumns.slice(startColumnIndex, endColumnIndex);

  // Select all handler
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedData.filter(r => r.global_row_id).length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.filter(r => r.global_row_id).map(r => r.global_row_id));
    }
  };

  // Toggle row selection
  const toggleRowSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Start editing
  const startEditing = (rowId: number, field: string, currentValue: any) => {
    setEditingCell({ rowId, field });
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '');
  };

  // Save edit
  const saveEdit = async (rowId: number, field: string) => {
    try {
      let valueToSave: any = editValue;
      
      // Type conversion based on field
      if (field === 'payout' || field === 'rel_release_id' || field === 'rel_subsheet_id' || field === 'rel_subpart_id') {
        valueToSave = editValue === '' ? null : Number(editValue);
      }
      
      const { error } = await supabase
        .from('leadsmart_zip_based_data')
        .update({ [field]: valueToSave })
        .eq('global_row_id', rowId);
      
      if (error) throw error;
      
      // Update local state
      setData(prev => prev.map(row => 
        row.global_row_id === rowId ? { ...row, [field]: valueToSave } : row
      ));
      
      setEditingCell(null);
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save edit');
    }
  };

  // Save new row
  const saveNewRow = async () => {
    if (!newRow || !user) return;
    
    try {
      // Convert numeric fields before inserting
      const dataToInsert = {
        ...newRow,
        payout: newRow.payout ? Number(newRow.payout) : null,
        rel_release_id: newRow.rel_release_id ? Number(newRow.rel_release_id) : null,
        rel_subsheet_id: newRow.rel_subsheet_id ? Number(newRow.rel_subsheet_id) : null,
        rel_subpart_id: newRow.rel_subpart_id ? Number(newRow.rel_subpart_id) : null,
        user_id: user.id
      };
      
      const { data: insertedData, error } = await supabase
        .from('leadsmart_zip_based_data')
        .insert([dataToInsert])
        .select()
        .single();
      
      if (error) throw error;
      
      setData(prev => [insertedData, ...prev]);
      setNewRow(null);
    } catch (error) {
      console.error('Error creating row:', error);
      alert('Failed to create row');
    }
  };

  // Cancel new row
  const cancelNewRow = () => {
    setNewRow(null);
  };

  // Update new row field
  const updateNewRowField = (field: string, value: any) => {
    setNewRow(prev => prev ? { ...prev, [field]: value } : null);
  };

  // Row Pagination Bar 1
  const RowPaginationBar1 = () => {
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Rows/page:</span>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            {[10, 25, 50, 100, 200, 'All'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  if (value === 'All') {
                    setRowsPerPage(filteredData.length || 1000);
                  } else {
                    setRowsPerPage(value as number);
                  }
                  setCurrentRowPage(1);
                }}
                className={`
                  px-2 py-2.5 text-sm font-medium border -mr-px cursor-pointer
                  ${value === 10 ? 'rounded-l' : ''}
                  ${value === 'All' ? 'rounded-r' : ''}
                  ${(value === 'All' && rowsPerPage >= filteredData.length) || rowsPerPage === value
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:bg-blue-700 focus:text-white'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                  focus:z-10 focus:ring-2 focus:ring-blue-500
                `}
                style={{ 
                  fontSize: '14px', 
                  paddingTop: '10px', 
                  paddingBottom: '10px'
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Row Pagination Bar 2
  const RowPaginationBar2 = () => {
    if (filteredData.length === 0) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Row page:</span>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Previous button - Circular refresh wheel */}
            <button
              onClick={() => setCurrentRowPage(currentRowPage === 1 ? totalRowPages : currentRowPage - 1)}
              className="relative inline-flex items-center rounded-l-md px-2 py-2.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer"
              style={{ 
                fontSize: '14px', 
                paddingTop: '10px', 
                paddingBottom: '10px'
              }}
            >
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
            
            {/* Page numbers */}
            {(() => {
              const pageNumbers = [];
              const maxVisiblePages = 5;
              let startPage = Math.max(1, currentRowPage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalRowPages, startPage + maxVisiblePages - 1);
              
              if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }
              
              for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(
                  <button
                    key={i}
                    onClick={() => setCurrentRowPage(i)}
                    className={`
                      relative inline-flex items-center px-2 py-2.5 text-sm font-semibold
                      ${currentRowPage === i
                        ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }
                    `}
                    style={{ 
                      fontSize: '14px', 
                      paddingTop: '10px', 
                      paddingBottom: '10px'
                    }}
                  >
                    {i}
                  </button>
                );
              }
              
              return pageNumbers;
            })()}
            
            {/* Next button - Circular refresh wheel */}
            <button
              onClick={() => setCurrentRowPage(currentRowPage === totalRowPages ? 1 : currentRowPage + 1)}
              className="relative inline-flex items-center rounded-r-md px-2 py-2.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer"
              style={{ 
                fontSize: '14px', 
                paddingTop: '10px', 
                paddingBottom: '10px'
              }}
            >
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M23 4v6h-6" />
                <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    );
  };

  // Column Pagination Bar 1
  const ColumnPaginationBar1 = () => {
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Cols/page:</span>
          <button
            onClick={() => {
              setColumnsPerPage(6);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-l -mr-px cursor-pointer ${
              columnsPerPage === 6 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 6 ? '#f8f782' : undefined
            }}
          >
            6
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(8);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 8 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 8 ? '#f8f782' : undefined
            }}
          >
            8
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(10);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 10 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 10 ? '#f8f782' : undefined
            }}
          >
            10
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(12);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 12 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 12 ? '#f8f782' : undefined
            }}
          >
            12
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(15);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 15 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 15 ? '#f8f782' : undefined
            }}
          >
            15
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(allColumns.length);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-r cursor-pointer ${
              columnsPerPage === allColumns.length ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === allColumns.length ? '#f8f782' : undefined
            }}
          >
            ALL
          </button>
        </div>
      </div>
    );
  };

  // Column Pagination Bar 2
  const ColumnPaginationBar2 = () => {
    if (totalColumnPages <= 1) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Col page:</span>
          <button
            onClick={() => setCurrentColumnPage(1)}
            disabled={currentColumnPage === 1}
            className="px-2 py-2.5 text-sm border rounded-l -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ≪
          </button>
          <button
            onClick={() => setCurrentColumnPage(currentColumnPage === 1 ? totalColumnPages : currentColumnPage - 1)}
            className="px-2 py-2.5 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          
          {Array.from({ length: Math.min(5, totalColumnPages) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(totalColumnPages - 4, currentColumnPage - 2)) + i;
            if (pageNum > totalColumnPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentColumnPage(pageNum)}
                className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
                  currentColumnPage === pageNum 
                    ? 'text-black border-black' 
                    : 'bg-white hover:bg-gray-200'
                }`}
                style={{ 
                  fontSize: '14px', 
                  paddingTop: '10px', 
                  paddingBottom: '10px',
                  backgroundColor: currentColumnPage === pageNum ? '#f8f782' : undefined
                }}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentColumnPage(currentColumnPage === totalColumnPages ? 1 : currentColumnPage + 1)}
            className="px-2 py-2.5 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentColumnPage(totalColumnPages)}
            disabled={currentColumnPage === totalColumnPages}
            className="px-2 py-2.5 text-sm border rounded-r disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ≫
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <>
      {/* Rocket Chamber */}
      <div className="rocket_chamber_div" style={{ 
        border: '1px solid black', 
        padding: 0,
        margin: 0,
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '0px',
        position: 'relative'
      }}>
        <div style={{ 
          position: 'absolute', 
          top: '4px', 
          left: '4px', 
          fontSize: '16px', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <svg 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            fill="black"
            style={{ transform: 'rotate(15deg)' }}
          >
            <ellipse cx="12" cy="8" rx="3" ry="6" fill="black"/>
            <path d="M12 2 L15 8 L9 8 Z" fill="black"/>
            <path d="M9 12 L7 14 L9 16 Z" fill="black"/>
            <path d="M15 12 L17 14 L15 16 Z" fill="black"/>
            <path d="M10 14 L9 18 L10.5 16 L12 20 L13.5 16 L15 18 L14 14 Z" fill="black"/>
            <circle cx="12" cy="6" r="1" fill="white"/>
          </svg>
          rocket_chamber
        </div>
        <div style={{ marginTop: '24px', paddingTop: '4px', paddingBottom: 0, paddingLeft: '8px', paddingRight: '8px' }}>
          <div className="flex items-end justify-between">
            <div className="flex items-end space-x-8">
              <table style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>row pagination</span>
                        <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                          Showing <span style={{ fontWeight: 'bold' }}>{paginatedData.length}</span> of <span style={{ fontWeight: 'bold' }}>{totalRows}</span> results
                        </span>
                      </div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        search box 2
                      </div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        wolf sticky columns exclusion band
                      </div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        pillarshift column templates
                      </div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>column pagination</span>
                        <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                          Showing <span style={{ fontWeight: 'bold' }}>{paginatedColumns.length}</span> non-sticky(non wolf band) columns of <span style={{ fontWeight: 'bold' }}>{totalColumns}</span> sourcedef columns
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '4px' }}>
                      <div className="flex items-end space-x-4">
                        {RowPaginationBar1()}
                        {RowPaginationBar2()}
                      </div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px' }}>
                      <div className="flex items-end">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search..."
                          className="px-3 py-2 border border-gray-300 rounded-l text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          style={{ width: '200px', marginBottom: '3px', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                        />
                        <button
                          onClick={() => setSearchTerm('')}
                          className="px-2 py-2 bg-yellow-200 hover:bg-yellow-300 text-gray-800 text-sm font-medium transition-colors"
                          style={{ 
                            marginBottom: '3px', 
                            height: '42px',
                            borderTopRightRadius: '4px',
                            borderBottomRightRadius: '4px',
                            borderLeft: 'none'
                          }}
                        >
                          CL
                        </button>
                      </div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px' }}>
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                      >
                        wolf options
                      </button>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px' }}>
                      <button
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                      >
                        use the pillarshift coltemp system
                      </button>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px' }}>
                      <div className="flex items-end space-x-4">
                        {ColumnPaginationBar1()}
                        {ColumnPaginationBar2()}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden" style={{ 
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: 0,
        marginBottom: '16px'
      }}>
        <div className="overflow-x-auto">
          <table className="text-sm" style={{ borderCollapse: 'collapse', width: 'auto' }}>
            <thead>
              {/* Database table name row */}
              <tr className="shenfur_db_table_name_tr">
                <th className="for_db_table__abstract_checkbox for_db_column__abstract_checkbox" style={{ padding: 0, border: '1px solid gray' }}>
                  <div className="cell_inner_wrapper_div">
                    <div
                      onClick={handleSelectAll}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        cursor: 'pointer',
                        minHeight: '40px'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedData.filter(r => r.global_row_id).length && selectedIds.length > 0}
                        readOnly
                        style={{ width: '20px', height: '20px', pointerEvents: 'none' }}
                      />
                    </div>
                  </div>
                </th>
                {paginatedColumns.map(col => {
                  // Determine table name for this column
                  const tableName = col === 'payout_note' ? 'leadsmart_subparts' : 'leadsmart_zip_based_data';
                  const tableClass = col === 'payout_note' ? 'for_db_table_leadsmart_subparts' : 'for_db_table_leadsmart_zip_based_data';
                  
                  return (
                    <th 
                      key={`table-${col}`}
                      className={`${tableClass} for_db_column_${col}`}
                      style={{ padding: 0, border: '1px solid gray' }}
                    >
                      <div className="cell_inner_wrapper_div" style={{ padding: '8px' }}>
                        <span style={{ fontWeight: 'bold', textTransform: 'lowercase' }}>{tableName}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
              {/* Database column name row */}
              <tr className="shenfur_db_column_name_tr">
                <th className="for_db_table__abstract_checkbox for_db_column__abstract_checkbox" style={{ padding: 0, border: '1px solid gray' }}>
                  <div className="cell_inner_wrapper_div" style={{ padding: '8px' }}>
                    <span style={{ fontWeight: 'bold', textTransform: 'lowercase' }}>select</span>
                  </div>
                </th>
                {paginatedColumns.map(col => {
                  // Determine table class for this column
                  const tableClass = col === 'payout_note' ? 'for_db_table_leadsmart_subparts' : 'for_db_table_leadsmart_zip_based_data';
                  
                  // Determine symbol and display name
                  let symbol = null;
                  let displayName = col;
                  
                  if (col === 'payout_note') {
                    symbol = <span style={{ color: 'black', marginRight: '4px' }}>•</span>;
                  } else if (col === 'rel_release_id') {
                    symbol = <span style={{ color: 'navy', marginRight: '4px' }}>★</span>;
                  } else if (col === 'rel_subsheet_id') {
                    symbol = <span style={{ color: 'navy', marginRight: '4px' }}>★</span>;
                  } else if (col === 'rel_subpart_id') {
                    symbol = <span style={{ color: 'navy', marginRight: '4px' }}>★</span>;
                  }
                  
                  // Determine if this column is the active filter
                  const isActiveFilterColumn = jettisonFilter && jettisonFilter.type && (
                    (jettisonFilter.type === 'release' && col === 'rel_release_id') ||
                    (jettisonFilter.type === 'subsheet' && col === 'rel_subsheet_id') ||
                    (jettisonFilter.type === 'subpart' && col === 'rel_subpart_id')
                  );
                  
                  return (
                    <th 
                      key={`column-${col}`}
                      className={`${tableClass} for_db_column_${col}`}
                      style={{ 
                        padding: 0, 
                        border: '1px solid gray',
                        backgroundColor: isActiveFilterColumn ? '#ffff99' : undefined
                      }}
                    >
                      <div className="cell_inner_wrapper_div" style={{ padding: '8px' }}>
                        {symbol}
                        <span style={{ fontWeight: 'bold', textTransform: 'lowercase' }}>{displayName}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* New row (if being created) */}
              {newRow && currentRowPage === 1 && (
                <tr style={{ backgroundColor: '#fffbeb' }}>
                  <td className="for_db_table__abstract_checkbox for_db_column__abstract_checkbox" style={{ padding: 0, border: '1px solid gray' }}>
                    <div className="cell_inner_wrapper_div" style={{ padding: '8px' }}>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={saveNewRow}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelNewRow}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                  {paginatedColumns.map(col => {
                    const tableClass = col === 'payout_note' ? 'for_db_table_leadsmart_subparts' : 'for_db_table_leadsmart_zip_based_data';
                    
                    return (
                      <td 
                        key={`new-${col}`}
                        className={`${tableClass} for_db_column_${col}`}
                        style={{ padding: 0, border: '1px solid gray' }}
                      >
                        <div className="cell_inner_wrapper_div" style={{ padding: '4px' }}>
                          {col === 'global_row_id' || col === 'created_at' || col === 'updated_at' || col === 'user_id' ? (
                            <span className="text-gray-400 text-xs">Auto</span>
                          ) : joinedColumns.includes(col) ? (
                            <span className="text-gray-400 text-xs italic">Joined</span>
                          ) : (
                            <input
                              type="text"
                              value={(newRow as any)[col] || ''}
                              onChange={(e) => updateNewRowField(col, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              )}
              
              {/* Data rows */}
              {paginatedData.filter(r => r.global_row_id).map((row) => (
                <tr key={row.global_row_id}>
                  <td className="for_db_table__abstract_checkbox for_db_column__abstract_checkbox" style={{ padding: 0, border: '1px solid gray' }}>
                    <div className="cell_inner_wrapper_div">
                      <div
                        onClick={() => toggleRowSelection(row.global_row_id)}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          cursor: 'pointer',
                          minHeight: '40px'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.global_row_id)}
                          readOnly
                          style={{ width: '20px', height: '20px', pointerEvents: 'none' }}
                        />
                      </div>
                    </div>
                  </td>
                  {paginatedColumns.map(col => {
                    const tableClass = col === 'payout_note' ? 'for_db_table_leadsmart_subparts' : 'for_db_table_leadsmart_zip_based_data';
                    
                    return (
                      <td 
                        key={`${row.global_row_id}-${col}`}
                        className={`${tableClass} for_db_column_${col}`}
                        style={{ padding: 0, border: '1px solid gray' }}
                      >
                        <div className="cell_inner_wrapper_div" style={{ padding: '4px' }}>
                          {joinedColumns.includes(col) ? (
                            <div
                              className="text-gray-600 italic"
                              style={{ minHeight: '24px', padding: '4px' }}
                            >
                              {(row as any)[col] || ''}
                            </div>
                          ) : editingCell?.rowId === row.global_row_id && editingCell?.field === col ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => saveEdit(row.global_row_id, col)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit(row.global_row_id, col);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                autoFocus
                                className="w-full px-2 py-1 border border-blue-500 rounded text-xs"
                              />
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                if (col !== 'global_row_id' && col !== 'created_at' && col !== 'updated_at' && !joinedColumns.includes(col)) {
                                  startEditing(row.global_row_id, col, (row as any)[col]);
                                }
                              }}
                              className={col !== 'global_row_id' && col !== 'created_at' && col !== 'updated_at' && !joinedColumns.includes(col) ? 'cursor-pointer hover:bg-gray-50' : ''}
                              style={{ minHeight: '24px', padding: '4px' }}
                            >
                              {(row as any)[col] !== null && (row as any)[col] !== undefined ? String((row as any)[col]) : ''}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

