'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LeadSmartJettisonTable from '@/app/components/LeadSmartJettisonTable';
import SelectorPopup from '../leadsmart_tank/components/SelectorPopup';
import dynamic from 'next/dynamic';

const ZhedoriButtonBar = dynamic(
  () => import('@/app/components/ZhedoriButtonBar'),
  { ssr: false }
);

interface LeadsmartTransformed {
  mundial_id: number;
  jrel_release_id: number | null;
  jrel_subsheet_id: number | null;
  jrel_subpart_id: number | null;
  city_name: string | null;
  state_code: string | null;
  payout: number | null;
  aggregated_zip_codes_jsonb: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function LeadsmartMorphClient() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Data state
  const [data, setData] = useState<LeadsmartTransformed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [currentRowPage, setCurrentRowPage] = useState(1);
  const [colsPerPage, setColsPerPage] = useState(10);
  const [currentColPage, setCurrentColPage] = useState(1);

  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Editing state
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupData, setPopupData] = useState<Partial<LeadsmartTransformed>>({});
  const [isSelectorPopupOpen, setIsSelectorPopupOpen] = useState(false);
  
  // Zip codes popup state
  const [zipCodesPopupOpen, setZipCodesPopupOpen] = useState(false);
  const [zipCodesPopupData, setZipCodesPopupData] = useState<string[]>([]);

  // Chamber visibility state (integrated with bezel system)
  const [mandibleChamberVisible, setMandibleChamberVisible] = useState(true);
  const [sinusChamberVisible, setSinusChamberVisible] = useState(true);
  const [cardioChamberVisible, setCardioChamberVisible] = useState(true);
  const [pecChamberVisible, setPecChamberVisible] = useState(true);
  
  // Filter state for jettison table
  const [jettisonFilter, setJettisonFilter] = useState<{
    type: 'release' | 'subsheet' | 'subpart' | null;
    id: number | null;
  }>({ type: null, id: null });

  // Define all columns
  const allColumns = [
    'mundial_id',
    'jrel_release_id',
    'jrel_subsheet_id',
    'jrel_subpart_id',
    'city_name',
    'state_code',
    'payout',
    'aggregated_zip_codes_jsonb',
    'created_at',
    'updated_at'
  ];

  // Initialize chamber visibility from localStorage
  useEffect(() => {
    const savedMandible = localStorage.getItem('leadsmartMorph_mandibleChamberVisible');
    if (savedMandible !== null) {
      setMandibleChamberVisible(JSON.parse(savedMandible));
    }
    
    const savedSinus = localStorage.getItem('leadsmartMorph_sinusChamberVisible');
    if (savedSinus !== null) {
      setSinusChamberVisible(JSON.parse(savedSinus));
    }
    
    const savedCardio = localStorage.getItem('leadsmartMorph_cardioChamberVisible');
    if (savedCardio !== null) {
      setCardioChamberVisible(JSON.parse(savedCardio));
    }
    
    const savedPec = localStorage.getItem('leadsmartMorph_pecChamberVisible');
    if (savedPec !== null) {
      setPecChamberVisible(JSON.parse(savedPec));
    }
  }, []);

  // Listen for chamber visibility changes from bezel system
  useEffect(() => {
    const handleChamberToggle = (event: CustomEvent) => {
      const { chamber, visible } = event.detail;
      
      switch (chamber) {
        case 'mandible_chamber':
          setMandibleChamberVisible(visible);
          break;
        case 'sinus_chamber':
          setSinusChamberVisible(visible);
          break;
        case 'cardio_chamber':
          setCardioChamberVisible(visible);
          break;
        case 'pec_chamber':
          setPecChamberVisible(visible);
          break;
      }
    };

    window.addEventListener('leadsmartMorph-chamber-toggle', handleChamberToggle as EventListener);

    return () => {
      window.removeEventListener('leadsmartMorph-chamber-toggle', handleChamberToggle as EventListener);
    };
  }, []);

  // Fetch data from database
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user, router]);
  
  // Refetch when jettison filter changes
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [jettisonFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('leadsmart_transformed')
        .select('*');
      
      // Apply jettison filter if active
      if (jettisonFilter && jettisonFilter.type && jettisonFilter.id) {
        if (jettisonFilter.type === 'release') {
          query = query.eq('jrel_release_id', jettisonFilter.id);
        } else if (jettisonFilter.type === 'subsheet') {
          query = query.eq('jrel_subsheet_id', jettisonFilter.id);
        } else if (jettisonFilter.type === 'subpart') {
          query = query.eq('jrel_subpart_id', jettisonFilter.id);
        }
      }
      
      query = query.order('mundial_id', { ascending: false });
      
      const { data: fetchedData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setData(fetchedData || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleJettisonFilterChange = (filterType: 'release' | 'subsheet' | 'subpart' | null, filterId: number | null) => {
    setJettisonFilter({ type: filterType, id: filterId });
  };

  // Filter data based on search
  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      row.city_name?.toLowerCase().includes(searchLower) ||
      row.state_code?.toLowerCase().includes(searchLower) ||
      row.aggregated_zip_codes_jsonb?.some(zip => zip.toLowerCase().includes(searchLower)) ||
      row.payout?.toString().includes(searchLower)
    );
  });

  // Paginate rows
  const totalRowPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentRowPage - 1) * rowsPerPage,
    currentRowPage * rowsPerPage
  );

  // Paginate columns (exclude checkbox column)
  const totalColPages = Math.ceil(allColumns.length / colsPerPage);
  const paginatedColumns = allColumns.slice(
    (currentColPage - 1) * colsPerPage,
    currentColPage * colsPerPage
  );

  // Handle row page navigation with infinite cycling
  const handleRowPagePrev = () => {
    setCurrentRowPage(prev => prev === 1 ? totalRowPages : prev - 1);
  };

  const handleRowPageNext = () => {
    setCurrentRowPage(prev => prev === totalRowPages ? 1 : prev + 1);
  };

  // Handle column page navigation with infinite cycling
  const handleColPagePrev = () => {
    setCurrentColPage(prev => prev === 1 ? totalColPages : prev - 1);
  };

  const handleColPageNext = () => {
    setCurrentColPage(prev => prev === totalColPages ? 1 : prev + 1);
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(row => row.mundial_id)));
    }
  };

  // Handle individual row selection
  const handleRowSelect = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Row Pagination Components (matching sitejar4 style)
  // Bar 1: Items per page selector
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

  // Bar 2: Page navigation
  const RowPaginationBar2 = () => {
    if (filteredData.length === 0) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Row page:</span>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Previous button - Circular refresh wheel */}
            <button
              onClick={handleRowPagePrev}
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
              onClick={handleRowPageNext}
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

  // Column Pagination Components (matching sitejar4 style)
  // Bar 1: Columns per page quantity selector
  const ColumnPaginationBar1 = () => {
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Cols/page:</span>
          <button
            onClick={() => {
              setColsPerPage(6);
              setCurrentColPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-l -mr-px cursor-pointer ${
              colsPerPage === 6 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: colsPerPage === 6 ? '#f8f782' : undefined
            }}
          >
            6
          </button>
          <button
            onClick={() => {
              setColsPerPage(8);
              setCurrentColPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              colsPerPage === 8 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: colsPerPage === 8 ? '#f8f782' : undefined
            }}
          >
            8
          </button>
          <button
            onClick={() => {
              setColsPerPage(10);
              setCurrentColPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              colsPerPage === 10 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: colsPerPage === 10 ? '#f8f782' : undefined
            }}
          >
            10
          </button>
          <button
            onClick={() => {
              setColsPerPage(12);
              setCurrentColPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              colsPerPage === 12 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: colsPerPage === 12 ? '#f8f782' : undefined
            }}
          >
            12
          </button>
          <button
            onClick={() => {
              setColsPerPage(15);
              setCurrentColPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              colsPerPage === 15 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: colsPerPage === 15 ? '#f8f782' : undefined
            }}
          >
            15
          </button>
          <button
            onClick={() => {
              setColsPerPage(allColumns.length);
              setCurrentColPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-r cursor-pointer ${
              colsPerPage === allColumns.length ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: colsPerPage === allColumns.length ? '#f8f782' : undefined
            }}
          >
            ALL
          </button>
        </div>
      </div>
    );
  };

  // Bar 2: Current column page selector
  const ColumnPaginationBar2 = () => {
    if (totalColPages <= 1) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Col page:</span>
          <button
            onClick={() => setCurrentColPage(1)}
            disabled={currentColPage === 1}
            className="px-2 py-2.5 text-sm border rounded-l -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ≪
          </button>
          <button
            onClick={handleColPagePrev}
            className="px-2 py-2.5 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          
          {Array.from({ length: Math.min(5, totalColPages) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(totalColPages - 4, currentColPage - 2)) + i;
            if (pageNum > totalColPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentColPage(pageNum)}
                className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
                  currentColPage === pageNum 
                    ? 'text-black border-black' 
                    : 'bg-white hover:bg-gray-200'
                }`}
                style={{ 
                  fontSize: '14px', 
                  paddingTop: '10px', 
                  paddingBottom: '10px',
                  backgroundColor: currentColPage === pageNum ? '#f8f782' : undefined
                }}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={handleColPageNext}
            className="px-2 py-2.5 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentColPage(totalColPages)}
            disabled={currentColPage === totalColPages}
            className="px-2 py-2.5 text-sm border rounded-r disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ≫
          </button>
        </div>
      </div>
    );
  };

  // Handle inline editing
  const startEditing = (id: number, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    // For JSONB arrays, display as newline-separated values
    if (field === 'aggregated_zip_codes_jsonb' && Array.isArray(currentValue)) {
      setEditValue(currentValue.join('\n'));
    } else {
      setEditValue(currentValue?.toString() || '');
    }
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    try {
      // Convert editValue to appropriate format based on field
      let valueToSave: any = editValue;
      if (editingCell.field === 'aggregated_zip_codes_jsonb') {
        // Convert newline-separated text to array
        valueToSave = editValue.split('\n').filter(z => z.trim());
      }

      const { error: updateError } = await supabase
        .from('leadsmart_transformed')
        .update({ [editingCell.field]: valueToSave })
        .eq('mundial_id', editingCell.id);

      if (updateError) throw updateError;

      // Update local state
      setData(prevData =>
        prevData.map(row =>
          row.mundial_id === editingCell.id
            ? { ...row, [editingCell.field]: valueToSave }
            : row
        )
      );

      setEditingCell(null);
      setEditValue('');
    } catch (err: any) {
      console.error('Error updating:', err);
      alert('Error updating: ' + err.message);
    }
  };

  // Handle create new inline
  const handleCreateNewInline = async () => {
    try {
      const { data: newRow, error: insertError } = await supabase
        .from('leadsmart_transformed')
        .insert([{ city_name: '', state_code: '', payout: null, aggregated_zip_codes_jsonb: [] }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to top of data array
      setData([newRow, ...data]);
      
      // Navigate to first page to see new row
      setCurrentRowPage(1);
    } catch (err: any) {
      console.error('Error creating new row:', err);
      alert('Error creating new row: ' + err.message);
    }
  };

  // Handle create new popup
  const handleCreateNewPopup = () => {
    setPopupData({});
    setIsPopupOpen(true);
  };

  // Handle popup save
  const handlePopupSave = async () => {
    try {
      const { data: newRow, error: insertError } = await supabase
        .from('leadsmart_transformed')
        .insert([popupData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to top of data array
      setData([newRow, ...data]);
      
      // Close popup and navigate to first page
      setIsPopupOpen(false);
      setPopupData({});
      setCurrentRowPage(1);
    } catch (err: any) {
      console.error('Error creating new row:', err);
      alert('Error creating new row: ' + err.message);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading data...</div>
      </div>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="/app/styles/shenfur_th_cells_db_table_row.css" />
      
      <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
        {/* Mandible Chamber */}
        {mandibleChamberVisible && (
          <div 
            className="mandible_chamber chamber_div" 
            style={{ 
              border: '1px solid black', 
              padding: '10px',
              marginBottom: '0px'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'black', marginBottom: '12px' }}>
              mandible_chamber
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <ZhedoriButtonBar />
            </div>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">Leadsmart Morph</h1>
              <button
                onClick={() => setIsSelectorPopupOpen(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                selector popup
              </button>
            </div>
          </div>
        )}

        {/* Sinus Chamber */}
        {sinusChamberVisible && (
          <div 
            className="sinus_chamber chamber_div" 
            style={{ 
              border: '1px solid black', 
              padding: '10px',
              marginBottom: '0px'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'black', marginBottom: '12px' }}>
              sinus_chamber
            </div>
            
            {/* Create new buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                onClick={handleCreateNewInline}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-colors text-sm"
              >
                create new (inline)
              </button>
              <button
                onClick={handleCreateNewPopup}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors text-sm"
              >
                create new (popup)
              </button>
            </div>
          </div>
        )}

        {/* Cardio Chamber */}
        {cardioChamberVisible && (
          <div 
            className="cardio_chamber chamber_div" 
            style={{ 
              border: '1px solid black', 
              padding: '10px',
              marginBottom: '0px'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'black' }}>
              cardio_chamber
            </div>
            
            <div style={{ marginTop: '12px' }}>
              <LeadSmartJettisonTable 
                config={{
                  targetTable: 'leadsmart_transformed',
                  relColumnPrefix: 'jrel_'
                }}
                onFilterChange={handleJettisonFilterChange}
              />
            </div>
          </div>
        )}

        {/* Pec Chamber */}
        {pecChamberVisible && (
          <div 
            className="pec_chamber chamber_div" 
            style={{ 
              border: '1px solid black', 
              padding: '10px',
              marginBottom: '0px'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'black' }}>
              pec_chamber
            </div>
          </div>
        )}

        {/* Rocket Chamber */}
        <div 
          className="rocket_chamber_div" 
          style={{ 
            border: '1px solid black', 
            padding: 0,
            margin: 0,
            position: 'relative',
            marginBottom: '0px'
          }}
        >
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
              {/* Rocket body */}
              <ellipse cx="12" cy="8" rx="3" ry="6" fill="black"/>
              {/* Rocket nose cone */}
              <path d="M12 2 L15 8 L9 8 Z" fill="black"/>
              {/* Left fin */}
              <path d="M9 12 L7 14 L9 16 Z" fill="black"/>
              {/* Right fin */}
              <path d="M15 12 L17 14 L15 16 Z" fill="black"/>
              {/* Exhaust flames */}
              <path d="M10 14 L9 18 L10.5 16 L12 20 L13.5 16 L15 18 L14 14 Z" fill="black"/>
              {/* Window */}
              <circle cx="12" cy="6" r="1" fill="white"/>
            </svg>
            rocket_chamber
          </div>
          
          <div style={{ marginTop: '24px', paddingTop: '4px', paddingBottom: 0, paddingLeft: '8px', paddingRight: '8px' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '30%' }}>
                    <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>row pagination</span>
                      <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                        Showing <span style={{ fontWeight: 'bold' }}>{paginatedData.length}</span> of <span style={{ fontWeight: 'bold' }}>{filteredData.length}</span> results
                      </span>
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '20%' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      search box 2
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '15%' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      wolf sticky columns exclusion band
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '15%' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      pillarshift column templates
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '30%' }}>
                    <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>column pagination</span>
                      <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                        Showing <span style={{ fontWeight: 'bold' }}>{paginatedColumns.length}</span> non-sticky(non wolf band) columns of <span style={{ fontWeight: 'bold' }}>{allColumns.length}</span> sourcedef columns
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <div className="flex items-end space-x-4">
                      <RowPaginationBar1 />
                      <RowPaginationBar2 />
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <div className="flex items-end">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentRowPage(1);
                        }}
                        placeholder="Search..."
                        className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        style={{ width: '200px', marginBottom: '3px' }}
                      />
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
                      <ColumnPaginationBar1 />
                      <ColumnPaginationBar2 />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Main UI Table Grid */}
        <div style={{ marginTop: '0px' }}>
          <table 
            style={{ 
              borderCollapse: 'collapse', 
              width: 'auto',
              border: '1px solid gray'
            }}
          >
            <thead>
              {/* Database table name row */}
              <tr className="shenfur_db_table_name_tr">
                <th 
                  className="for_db_table_leadsmart_transformed for_db_column__abstract_checkbox"
                  style={{ 
                    padding: '0px',
                    border: '1px solid gray',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={handleSelectAll}
                >
                  <div className="cell_inner_wrapper_div" style={{ minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'lowercase' }}>leadsmart_transformed</span>
                  </div>
                </th>
                {paginatedColumns.map(col => (
                  <th 
                    key={`table-${col}`}
                    className={`for_db_table_leadsmart_transformed for_db_column_${col}`}
                    style={{ 
                      padding: '0px',
                      border: '1px solid gray'
                    }}
                  >
                    <div className="cell_inner_wrapper_div">
                      <span style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'lowercase' }}>leadsmart_transformed</span>
                    </div>
                  </th>
                ))}
              </tr>
              
              {/* Database column name row */}
              <tr className="shenfur_db_column_name_tr">
                <th 
                  className="for_db_table_leadsmart_transformed for_db_column__abstract_checkbox"
                  style={{ 
                    padding: '0px',
                    border: '1px solid gray',
                    textAlign: 'center',
                    cursor: 'pointer',
                    width: '60px'
                  }}
                  onClick={handleSelectAll}
                >
                  <div className="cell_inner_wrapper_div" style={{ minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={handleSelectAll}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </th>
                {paginatedColumns.map(col => (
                  <th 
                    key={`col-${col}`}
                    className={`for_db_table_leadsmart_transformed for_db_column_${col}`}
                    style={{ 
                      padding: '0px',
                      border: '1px solid gray'
                    }}
                  >
                    <div className="cell_inner_wrapper_div">
                      <span style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'lowercase' }}>{col}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {paginatedData.map(row => (
                <tr key={row.mundial_id}>
                  <td 
                    className="for_db_table_leadsmart_transformed for_db_column__abstract_checkbox"
                    style={{ 
                      padding: '0px',
                      border: '1px solid gray',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleRowSelect(row.mundial_id)}
                  >
                    <div className="cell_inner_wrapper_div" style={{ minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.mundial_id)}
                        onChange={() => handleRowSelect(row.mundial_id)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </td>
                  {paginatedColumns.map(col => {
                    const isEditing = editingCell?.id === row.mundial_id && editingCell?.field === col;
                    const value = row[col as keyof LeadsmartTransformed];
                    const isReadOnly = col === 'mundial_id' || col === 'created_at' || col === 'updated_at';
                    
                    return (
                      <td 
                        key={`${row.mundial_id}-${col}`}
                        className={`for_db_table_leadsmart_transformed for_db_column_${col}`}
                        style={{ 
                          padding: '0px',
                          border: '1px solid gray'
                        }}
                        onClick={() => !isReadOnly && !isEditing && startEditing(row.mundial_id, col, value)}
                      >
                        <div className="cell_inner_wrapper_div" style={{ minHeight: '40px', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}>
                          {isEditing ? (
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) saveEdit();
                                if (e.key === 'Escape') {
                                  setEditingCell(null);
                                  setEditValue('');
                                }
                              }}
                              autoFocus
                              className="w-full px-2 py-1 border border-blue-500 focus:outline-none"
                              rows={3}
                            />
                          ) : col === 'aggregated_zip_codes_jsonb' && Array.isArray(value) ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setZipCodesPopupData(value);
                                  setZipCodesPopupOpen(true);
                                }}
                                style={{
                                  border: '1px solid #666',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  background: '#f0f0f0',
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  fontSize: '12px',
                                  minWidth: '30px',
                                  textAlign: 'center'
                                }}
                                title="Click to view all zip codes"
                              >
                                {value.length}
                              </button>
                              <span 
                                style={{ 
                                  cursor: 'pointer',
                                  color: 'inherit',
                                  flex: 1
                                }}
                              >
                                {value.slice(0, 2).join(' / ')}
                                {value.length > 2 ? ' ...' : ''}
                              </span>
                            </>
                          ) : (
                            <span 
                              style={{ 
                                cursor: isReadOnly ? 'default' : 'pointer',
                                color: isReadOnly ? '#888' : 'inherit'
                              }}
                            >
                              {value?.toString() || ''}
                            </span>
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

      {/* Create New Popup */}
      {isPopupOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setIsPopupOpen(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
              Create New Record
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  city_name
                </label>
                <input
                  type="text"
                  value={popupData.city_name || ''}
                  onChange={(e) => setPopupData({ ...popupData, city_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  state_code
                </label>
                <input
                  type="text"
                  value={popupData.state_code || ''}
                  onChange={(e) => setPopupData({ ...popupData, state_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  maxLength={2}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  payout
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={popupData.payout || ''}
                  onChange={(e) => setPopupData({ ...popupData, payout: parseFloat(e.target.value) || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  aggregated_zip_codes_jsonb (one per line)
                </label>
                <textarea
                  value={popupData.aggregated_zip_codes_jsonb?.join('\n') || ''}
                  onChange={(e) => setPopupData({ 
                    ...popupData, 
                    aggregated_zip_codes_jsonb: e.target.value.split('\n').filter(z => z.trim())
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                  placeholder="Enter zip codes, one per line"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsPopupOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black font-medium px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePopupSave}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Selector Popup */}
      {isSelectorPopupOpen && (
        <SelectorPopup
          isOpen={isSelectorPopupOpen}
          onClose={() => setIsSelectorPopupOpen(false)}
        />
      )}
      
      {/* Zip Codes Popup */}
      {zipCodesPopupOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setZipCodesPopupOpen(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              All Zip Codes ({zipCodesPopupData.length})
            </h3>
            
            <textarea
              value={zipCodesPopupData.join('\n')}
              readOnly
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px',
                resize: 'vertical'
              }}
              onClick={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.select();
              }}
            />
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(zipCodesPopupData.join('\n'));
                  alert('Zip codes copied to clipboard!');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded transition-colors"
              >
                Copy All
              </button>
              <button
                onClick={() => setZipCodesPopupOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black font-medium px-4 py-2 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
