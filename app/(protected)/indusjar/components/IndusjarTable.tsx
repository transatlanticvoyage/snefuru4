'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import { useSymbolDefinitions } from '../hooks/useSymbolDefinitions';
import { useIndustryMetadata } from '../hooks/useIndustryMetadata';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

const IndustryEntitiesRocketChamber = dynamic(
  () => import('./IndustryEntitiesRocketChamber'),
  { ssr: false }
);

interface Industry {
  industry_id: number;
  industry_name: string | null;
  emd_stamp_slug: string | null;
  industry_description: string | null;
  taurus_prompt_1_datum: string | null;
  taurus_prompt_1_main_ai_model_note: string | null;
  taurus_prompt_2_datum: string | null;
  taurus_prompt_2_main_ai_model_note: string | null;
  created_at: string;
  updated_at: string | null;
}

export default function IndusjarTable() {
  const [data, setData] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof Industry>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Column pagination control state
  const [columnPaginationControls, setColumnPaginationControls] = useState<{
    ColumnPaginationBar1: () => JSX.Element | null;
    ColumnPaginationBar2: () => JSX.Element | null;
  } | null>(null);
  
  // Pagination states for rocket chamber  
  const [columnsPerPage, setColumnsPerPage] = useState(6);
  const [currentColumnPage, setCurrentColumnPage] = useState(1);
  
  // Search state for rocket chamber (using existing searchTerm)
  const handleRocketChamberSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Symbol meaning editing states
  const [editingSymbolMeaning, setEditingSymbolMeaning] = useState<string | null>(null);
  const [symbolMeaningValues, setSymbolMeaningValues] = useState<{ [key: string]: string }>({});
  
  // Form data for creating
  const [formData, setFormData] = useState({
    industry_name: '',
    emd_stamp_slug: '',
    industry_description: '',
    taurus_prompt_1_datum: '',
    taurus_prompt_1_main_ai_model_note: '',
    taurus_prompt_2_datum: '',
    taurus_prompt_2_main_ai_model_note: ''
  });

  const supabase = createClientComponentClient();

  // Symbol hooks
  const { hasSymbol, toggleSymbol } = useIndustryMetadata();
  const { getDefinition, updateDefinition, definitions } = useSymbolDefinitions();

  // Define columns
  const columns = [
    { key: 'industry_id' as keyof Industry, label: 'industry_id', type: 'number', readOnly: true },
    { key: 'industry_name' as keyof Industry, label: 'industry_name', type: 'text' },
    { key: 'emd_stamp_slug' as keyof Industry, label: 'emd_stamp_slug', type: 'text' },
    { key: 'industry_description' as keyof Industry, label: 'industry_description', type: 'text' },
    // Symbol columns
    { key: 'org_is_starred' as keyof any, label: 'star', type: 'org_symbol', width: '25px' },
    { key: 'org_is_flagged' as keyof any, label: 'flag', type: 'org_symbol', width: '25px' },
    { key: 'org_is_squared' as keyof any, label: 'square', type: 'org_symbol', width: '25px' },
    { key: 'org_is_circled' as keyof any, label: 'circle', type: 'org_symbol', width: '25px' },
    { key: 'org_is_triangled' as keyof any, label: 'triangle', type: 'org_symbol', width: '25px' },
    // Taurus columns
    { key: 'taurus_prompt_1_datum' as keyof Industry, label: 'taurus_prompt_1_datum', type: 'text' },
    { key: 'taurus_prompt_1_main_ai_model_note' as keyof Industry, label: 'taurus_prompt_1_main_ai_model_note', type: 'text' },
    { key: 'taurus_prompt_2_datum' as keyof Industry, label: 'taurus_prompt_2_datum', type: 'text' },
    { key: 'taurus_prompt_2_main_ai_model_note' as keyof Industry, label: 'taurus_prompt_2_main_ai_model_note', type: 'text' },
    { key: 'created_at' as keyof Industry, label: 'created_at', type: 'datetime', readOnly: true },
    { key: 'updated_at' as keyof Industry, label: 'updated_at', type: 'datetime', readOnly: true }
  ];
  
  // Wolf exclusion band columns (always shown leftmost like sitejar4)
  const wolfExclusionBandColumns = [
    'industry_id', 
    'org_is_starred', 
    'org_is_flagged', 
    'org_is_squared', 
    'org_is_circled', 
    'org_is_triangled'
  ];
  
  // All columns for pagination
  const allColumns = useMemo(() => columns.map(col => col.key as string), [columns]);
  
  // Paginated columns (exclude wolf band)
  const paginatedColumns = useMemo(() => allColumns.filter(column => 
    !wolfExclusionBandColumns.includes(column)
  ), [allColumns]);
  
  const totalColumnPages = useMemo(() => Math.ceil(paginatedColumns.length / columnsPerPage), [paginatedColumns, columnsPerPage]);
  
  // Visible columns calculation
  const visibleColumns = useMemo(() => {
    const startColumnIndex = (currentColumnPage - 1) * columnsPerPage;
    const visiblePaginatedColumns = paginatedColumns.slice(startColumnIndex, startColumnIndex + columnsPerPage);
    return [...wolfExclusionBandColumns, ...visiblePaginatedColumns];
  }, [wolfExclusionBandColumns, paginatedColumns, currentColumnPage, columnsPerPage]);

  // Fetch data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: industriesData, error } = await supabase
        .from('industries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(industriesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Load initial symbol meanings
  useEffect(() => {
    if (definitions) {
      const meanings: { [key: string]: string } = {};
      Object.entries(definitions).forEach(([symbolType, definition]) => {
        meanings[symbolType] = definition.symbol_meaning || '';
      });
      setSymbolMeaningValues(meanings);
    }
  }, [definitions]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;
    
    if (searchTerm) {
      filtered = data.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === null) return sortOrder === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage));
  const startIndex = (currentPage - 1) * (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage);
  const paginatedData = itemsPerPage === -1 ? filteredAndSortedData : filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof Industry) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle cell editing
  const handleCellClick = (id: number, field: string, value: any) => {
    const column = columns.find(col => col.key === field);
    if (column?.readOnly || column?.type === 'boolean') return;
    
    setEditingCell({ id, field });
    setEditingValue(value?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      let processedValue: any = editingValue;

      // Process value based on type
      const column = columns.find(col => col.key === editingCell.field);
      if (column?.type === 'number') {
        processedValue = editingValue === '' ? null : Number(editingValue);
      } else if (column?.type === 'datetime') {
        processedValue = editingValue === '' ? null : editingValue;
      } else {
        processedValue = editingValue === '' ? null : editingValue;
      }

      const { error } = await supabase
        .from('industries')
        .update({ [editingCell.field]: processedValue })
        .eq('industry_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.industry_id === editingCell.id 
          ? { ...item, [editingCell.field]: processedValue }
          : item
      ));

      setEditingCell(null);
      setEditingValue('');
    } catch (err) {
      console.error('Error updating cell:', err);
      alert('Failed to update cell');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Handle boolean toggle
  const handleBooleanToggle = async (id: number, field: keyof Industry, currentValue: boolean | null) => {
    const newValue = currentValue === null ? true : !currentValue;
    
    try {
      const { error } = await supabase
        .from('industries')
        .update({ [field]: newValue })
        .eq('industry_id', id);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.industry_id === id ? { ...item, [field]: newValue } : item
      ));
    } catch (err) {
      console.error('Error toggling boolean:', err);
      alert('Failed to update field');
    }
  };

  // Create new record inline
  const createNewRecordInline = async () => {
    try {
      const newRecord = {
        industry_name: 'New Industry',
        emd_stamp_slug: '',
        industry_description: 'Industry description here',
        taurus_prompt_1_datum: '',
        taurus_prompt_1_main_ai_model_note: '',
        taurus_prompt_2_datum: '',
        taurus_prompt_2_main_ai_model_note: ''
      };

      const { data: insertedData, error } = await supabase
        .from('industries')
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;

      // Add to local data at the beginning
      setData([insertedData, ...data]);
      
      // Set first editable cell to editing mode
      setEditingCell({ id: insertedData.industry_id, field: 'industry_name' });
      setEditingValue('New Industry');
    } catch (err) {
      console.error('Error creating record:', err);
      alert('Failed to create record');
    }
  };

  // Handle popup form submission
  const handleCreateSubmit = async () => {
    try {
      const insertData = {
        industry_name: formData.industry_name?.trim() || null,
        emd_stamp_slug: formData.emd_stamp_slug?.trim() || null,
        industry_description: formData.industry_description?.trim() || null,
        taurus_prompt_1_datum: formData.taurus_prompt_1_datum?.trim() || null,
        taurus_prompt_1_main_ai_model_note: formData.taurus_prompt_1_main_ai_model_note?.trim() || null,
        taurus_prompt_2_datum: formData.taurus_prompt_2_datum?.trim() || null,
        taurus_prompt_2_main_ai_model_note: formData.taurus_prompt_2_main_ai_model_note?.trim() || null
      };
      
      const { data: insertedData, error } = await supabase
        .from('industries')
        .insert([insertData])
        .select()
        .single();
        
      if (error) throw error;
      
      setIsCreateModalOpen(false);
      resetForm();
      setData([insertedData, ...data]);
    } catch (err) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      industry_name: '',
      emd_stamp_slug: '',
      industry_description: '',
      taurus_prompt_1_datum: '',
      taurus_prompt_1_main_ai_model_note: '',
      taurus_prompt_2_datum: '',
      taurus_prompt_2_main_ai_model_note: ''
    });
  };

  // Handle symbol meaning editing
  const handleSymbolMeaningClick = (symbolType: string) => {
    setEditingSymbolMeaning(symbolType);
  };

  const handleSymbolMeaningChange = (symbolType: string, value: string) => {
    setSymbolMeaningValues(prev => ({
      ...prev,
      [symbolType]: value
    }));
  };

  const handleSymbolMeaningSave = async (symbolType: string) => {
    try {
      const meaning = symbolMeaningValues[symbolType] || '';
      await updateDefinition(symbolType, { symbol_meaning: meaning });
      setEditingSymbolMeaning(null);
    } catch (error) {
      console.error('Error saving symbol meaning:', error);
      alert('Failed to save symbol meaning');
    }
  };

  const handleSymbolMeaningCancel = (symbolType: string) => {
    // Reset to original value
    const originalMeaning = definitions[symbolType]?.symbol_meaning || '';
    setSymbolMeaningValues(prev => ({
      ...prev,
      [symbolType]: originalMeaning
    }));
    setEditingSymbolMeaning(null);
  };

  // Render cell content
  const renderCell = (item: Industry, column: typeof columns[0]) => {
    const value = item[column.key];
    const isEditing = editingCell?.id === item.industry_id && editingCell?.field === column.key;
    const isReadOnly = column.readOnly;

    // Handle organization symbols
    if (column.type === 'org_symbol') {
      const symbolType = column.key.replace('org_is_', '') as 'starred' | 'flagged' | 'squared' | 'circled' | 'triangled';
      const isActive = hasSymbol(item.industry_id, `is_${symbolType}` as any);
      const definition = getDefinition(symbolType === 'starred' ? 'star' : symbolType === 'flagged' ? 'flag' : symbolType);
      
      return (
        <div 
          className="flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded"
          onClick={() => toggleSymbol(item.industry_id, `is_${symbolType}` as any)}
          title={definition?.symbol_meaning || `Toggle ${symbolType}`}
          style={{ width: '25px', height: '25px' }}
        >
          <span 
            className={`text-lg transition-all duration-200 ${
              isActive ? 'opacity-100 scale-110' : 'opacity-30 hover:opacity-60'
            }`}
          >
            {definition?.symbol_emoji || (
              symbolType === 'starred' ? '⭐' :
              symbolType === 'flagged' ? '🚩' :
              symbolType === 'squared' ? '⬜' :
              symbolType === 'circled' ? '⭕' :
              symbolType === 'triangled' ? '🔺' : ''
            )}
          </span>
        </div>
      );
    }

    if (column.type === 'boolean' && !isReadOnly) {
      return (
        <button
          onClick={() => handleBooleanToggle(item.industry_id, column.key, value as boolean | null)}
          className={`w-12 h-6 rounded-full transition-colors ${
            value === true ? 'bg-green-500' : 
            value === false ? 'bg-gray-300' : 'bg-yellow-300'
          }`}
        >
          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
            value === true ? 'translate-x-6' : 
            value === false ? 'translate-x-1' : 'translate-x-3'
          }`} />
        </button>
      );
    }

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          {(column.key === 'industry_description' || column.key === 'taurus_prompt_1_datum' || column.key === 'taurus_prompt_1_main_ai_model_note' || column.key === 'taurus_prompt_2_datum' || column.key === 'taurus_prompt_2_main_ai_model_note') ? (
            <textarea
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCellSave();
                }
                if (e.key === 'Escape') handleCellCancel();
              }}
              className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none resize-none"
              autoFocus
              rows={3}
            />
          ) : (
            <input
              type={column.type === 'number' ? 'number' : 'text'}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCellSave();
                if (e.key === 'Escape') handleCellCancel();
              }}
              className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none"
              autoFocus
            />
          )}
          <button onClick={handleCellSave} className="text-green-600 hover:text-green-800">
            ✓
          </button>
          <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">
            ✗
          </button>
        </div>
      );
    }

    return (
      <div
        onClick={() => handleCellClick(item.industry_id, column.key, value)}
        className={`cursor-pointer hover:bg-gray-100 px-2 py-1 ${!isReadOnly ? 'cursor-text' : 'cursor-default'} ${
          (column.key === 'industry_description' || column.key === 'taurus_prompt_1_datum' || column.key === 'taurus_prompt_1_main_ai_model_note' || column.key === 'taurus_prompt_2_datum' || column.key === 'taurus_prompt_2_main_ai_model_note') ? 'min-h-[60px] whitespace-pre-wrap' : ''
        }`}
      >
        {column.type === 'datetime' && value ? 
          new Date(value).toLocaleString() : 
          value?.toString() || ''
        }
      </div>
    );
  };

  // Pagination Controls Component
  const PaginationControls = () => (
    <div className="flex items-center space-x-4">
      {/* Items per page */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Per page:</span>
        <div className="inline-flex" role="group">
          {[10, 20, 50, 100, 200, 500, -1].map((value, index) => (
            <button
              key={value}
              onClick={() => {
                setItemsPerPage(value === -1 ? filteredAndSortedData.length : value);
                setCurrentPage(1);
              }}
              className={`
                px-3 py-2 text-sm font-medium border border-gray-300
                ${itemsPerPage === (value === -1 ? filteredAndSortedData.length : value) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                ${index === 0 ? 'rounded-l-md' : ''}
                ${index === 6 ? 'rounded-r-md' : ''}
                ${index > 0 ? 'border-l-0' : ''}
                transition-colors duration-150 cursor-pointer
              `}
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              {value === -1 ? 'All' : value}
            </button>
          ))}
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Page:</span>
        <div className="inline-flex" role="group">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-md
              ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`
                  px-3 py-2 text-sm font-medium border border-gray-300 border-l-0
                  ${currentPage === pageNum ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                  transition-colors duration-150 cursor-pointer
                `}
                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 border-l-0 rounded-r-md
              ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading industries...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Handle pillar shift click
  const handlePillarShiftClick = () => {
    console.log('PillarShift clicked from rocket chamber - not implemented yet');
  };
  
  // Handle industry options click
  const handleIndustryOptionsClick = () => {
    console.log('Industry options clicked from rocket chamber - not implemented yet');
  };

  return (
    <div className="w-full">
      {/* Rocket Chamber */}
      <IndustryEntitiesRocketChamber
        data={data}
        onPaginationRender={setColumnPaginationControls}
        searchValue={searchTerm}
        onSearchChange={handleRocketChamberSearchChange}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value) => {
          setItemsPerPage(value);
          setCurrentPage(1);
        }}
        columnsPerPage={columnsPerPage}
        currentColumnPage={currentColumnPage}
        onColumnPageChange={setCurrentColumnPage}
        onColumnsPerPageChange={(value) => {
          setColumnsPerPage(value);
          setCurrentColumnPage(1);
        }}
        onPillarShiftClick={handlePillarShiftClick}
        onIndustryOptionsClick={handleIndustryOptionsClick}
      />
      
      {/* Top Header Area - Simplified */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 border-t-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <NubraTablefaceKite tableType="industries-grid" />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={createNewRecordInline}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors"
            >
              Create New (Inline)
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors"
            >
              Create New (Popup)
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="border-collapse border border-gray-200" style={{ width: 'auto' }}>
            <thead className="bg-gray-50">
              {/* Symbol meanings header row */}
              <tr>
                <th className="px-2 py-1 text-left border border-gray-200" style={{ width: 'auto', minWidth: '50px' }}>
                  <span className="font-bold text-xs">-</span>
                </th>
                {columns.filter(column => visibleColumns.includes(column.key as string)).map((column) => {
                  // Check if this is a symbol column
                  if (column.type === 'org_symbol') {
                    const symbolType = column.key.replace('org_is_', '') as 'starred' | 'flagged' | 'squared' | 'circled' | 'triangled';
                    const mappedType = symbolType === 'starred' ? 'star' : symbolType === 'flagged' ? 'flag' : symbolType;
                    const isEditing = editingSymbolMeaning === mappedType;
                    const currentValue = symbolMeaningValues[mappedType] || '';
                    
                    return (
                      <th
                        key={`symbol-meaning-${column.key}`}
                        className="text-left border border-gray-200 px-1 py-1 relative"
                        style={{ width: '24px', maxWidth: '24px', minWidth: '24px' }}
                      >
                        {isEditing ? (
                          <div className="absolute top-0 left-0 z-50 bg-white border-2 border-blue-500 shadow-lg" style={{ width: '200px' }}>
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => handleSymbolMeaningChange(mappedType, e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSymbolMeaningSave(mappedType);
                                if (e.key === 'Escape') handleSymbolMeaningCancel(mappedType);
                              }}
                              onBlur={() => handleSymbolMeaningSave(mappedType)}
                              className="w-full px-2 py-1 text-xs focus:outline-none"
                              autoFocus
                              placeholder="Symbol meaning..."
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => handleSymbolMeaningClick(mappedType)}
                            className="cursor-pointer text-xs truncate hover:bg-gray-100 px-1"
                            style={{ width: '22px', fontSize: '10px' }}
                            title={currentValue || 'Click to edit symbol meaning'}
                          >
                            {currentValue ? currentValue.substring(0, 3) : '...'}
                          </div>
                        )}
                      </th>
                    );
                  } else {
                    // Non-symbol columns get hyphen
                    return (
                      <th
                        key={`meaning-${column.key}`}
                        className="text-left border border-gray-200 px-2 py-1"
                        style={{ 
                          width: 'auto', 
                          whiteSpace: (column.key === 'industry_description' || column.key === 'taurus_prompt_1_datum' || column.key === 'taurus_prompt_1_main_ai_model_note' || column.key === 'taurus_prompt_2_datum' || column.key === 'taurus_prompt_2_main_ai_model_note') ? 'normal' : 'nowrap',
                          minWidth: (column.key === 'industry_description' || column.key === 'taurus_prompt_1_datum' || column.key === 'taurus_prompt_1_main_ai_model_note' || column.key === 'taurus_prompt_2_datum' || column.key === 'taurus_prompt_2_main_ai_model_note') ? '200px' : 'auto'
                        }}
                      >
                        <span className="font-bold text-xs">-</span>
                      </th>
                    );
                  }
                })}
              </tr>
              {/* New table name header row */}
              <tr className="shenfur_db_table_name_tr">
                <th className="px-2 py-1 text-left border border-gray-200" style={{ width: 'auto', minWidth: '50px' }}>
                  <span className="font-bold text-xs">-</span>
                </th>
                {columns.filter(column => visibleColumns.includes(column.key as string)).map((column) => (
                  <th
                    key={`table-name-${column.key}`}
                    className="text-left border border-gray-200 px-2 py-1 for_db_table_industries"
                    style={{ 
                      width: column.type === 'org_symbol' ? '25px' : 'auto', 
                      whiteSpace: (column.key === 'industry_description' || column.key === 'taurus_prompt_1_datum' || column.key === 'taurus_prompt_1_main_ai_model_note' || column.key === 'taurus_prompt_2_datum' || column.key === 'taurus_prompt_2_main_ai_model_note') ? 'normal' : 'nowrap',
                      minWidth: column.type === 'org_symbol' ? '25px' : (column.key === 'industry_description' || column.key === 'taurus_prompt_1_datum' || column.key === 'taurus_prompt_1_main_ai_model_note' || column.key === 'taurus_prompt_2_datum' || column.key === 'taurus_prompt_2_main_ai_model_note') ? '200px' : 'auto'
                    }}
                  >
                    <span className="font-bold text-xs lowercase">industries</span>
                  </th>
                ))}
              </tr>
              {/* Existing header row */}
              <tr>
                <th className="px-2 py-3 text-left border border-gray-200" style={{ width: 'auto', minWidth: '50px' }}>
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      if (selectedRows.size === paginatedData.length && paginatedData.length > 0) {
                        setSelectedRows(new Set());
                      } else {
                        setSelectedRows(new Set(paginatedData.map(item => item.industry_id)));
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ width: '20px', height: '20px' }}
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={() => {}} // Handled by div onClick
                    />
                  </div>
                </th>
                {columns.filter(column => visibleColumns.includes(column.key as string)).map((column) => (
                  <th
                    key={column.key}
                    className="text-left cursor-pointer hover:bg-gray-100 border border-gray-200 px-2 py-1"
                    onClick={() => handleSort(column.key)}
                    style={{ 
                      width: column.type === 'org_symbol' ? '25px' : 'auto', 
                      whiteSpace: (column.key === 'industry_description' || column.key === 'taurus_prompt_1_datum' || column.key === 'taurus_prompt_1_main_ai_model_note' || column.key === 'taurus_prompt_2_datum' || column.key === 'taurus_prompt_2_main_ai_model_note') ? 'normal' : 'nowrap',
                      minWidth: column.type === 'org_symbol' ? '25px' : (column.key === 'industry_description' || column.key === 'taurus_prompt_1_datum' || column.key === 'taurus_prompt_1_main_ai_model_note' || column.key === 'taurus_prompt_2_datum' || column.key === 'taurus_prompt_2_main_ai_model_note') ? '200px' : 'auto'
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-xs lowercase">{column.label}</span>
                      {sortField === column.key && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedData.map((item) => (
                <tr key={item.industry_id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 border border-gray-200" style={{ width: 'auto', minWidth: '50px' }}>
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        const newSelected = new Set(selectedRows);
                        if (newSelected.has(item.industry_id)) {
                          newSelected.delete(item.industry_id);
                        } else {
                          newSelected.add(item.industry_id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ width: '20px', height: '20px' }}
                        checked={selectedRows.has(item.industry_id)}
                        onChange={() => {}} // Handled by div onClick
                      />
                    </div>
                  </td>
                  {columns.filter(column => visibleColumns.includes(column.key as string)).map((column) => (
                    <td key={column.key} className="border border-gray-200" style={{ 
                      width: column.type === 'org_symbol' ? '25px' : 'auto', 
                      whiteSpace: (column.key === 'industry_description' || column.key === 'taurus_prompt_1_datum' || column.key === 'taurus_prompt_1_main_ai_model_note' || column.key === 'taurus_prompt_2_datum' || column.key === 'taurus_prompt_2_main_ai_model_note') ? 'normal' : 'nowrap',
                      minWidth: column.type === 'org_symbol' ? '25px' : (column.key === 'industry_description' || column.key === 'taurus_prompt_1_datum' || column.key === 'taurus_prompt_1_main_ai_model_note' || column.key === 'taurus_prompt_2_datum' || column.key === 'taurus_prompt_2_main_ai_model_note') ? '200px' : 'auto'
                    }}>
                      {renderCell(item, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Industry</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry Name</label>
                <input
                  type="text"
                  value={formData.industry_name}
                  onChange={(e) => setFormData({ ...formData, industry_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter industry name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EMD Stamp Slug</label>
                <input
                  type="text"
                  value={formData.emd_stamp_slug}
                  onChange={(e) => setFormData({ ...formData, emd_stamp_slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter EMD stamp slug"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry Description</label>
                <textarea
                  value={formData.industry_description}
                  onChange={(e) => setFormData({ ...formData, industry_description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={4}
                  placeholder="Enter industry description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taurus Prompt 1 Datum</label>
                <textarea
                  value={formData.taurus_prompt_1_datum}
                  onChange={(e) => setFormData({ ...formData, taurus_prompt_1_datum: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter taurus prompt 1 datum"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taurus Prompt 1 Main AI Model Note</label>
                <textarea
                  value={formData.taurus_prompt_1_main_ai_model_note}
                  onChange={(e) => setFormData({ ...formData, taurus_prompt_1_main_ai_model_note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter taurus prompt 1 main AI model note"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taurus Prompt 2 Datum</label>
                <textarea
                  value={formData.taurus_prompt_2_datum}
                  onChange={(e) => setFormData({ ...formData, taurus_prompt_2_datum: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter taurus prompt 2 datum"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taurus Prompt 2 Main AI Model Note</label>
                <textarea
                  value={formData.taurus_prompt_2_main_ai_model_note}
                  onChange={(e) => setFormData({ ...formData, taurus_prompt_2_main_ai_model_note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter taurus prompt 2 main AI model note"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create Industry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}