'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface NemtorUnit {
  unit_id: string;
  fk_gcon_piece_id: string;
  unit_marker: string;
  el_id: string;
  el_type: string;
  widget_type: string | null;
  parent_el_id: string | null;
  position_order: number;
  depth_level: number;
  sort_index: number;
  summary_text: string | null;
  full_text_cached: string | null;
  full_text_edits: string | null;
  has_img_slot: boolean | null;
  img_slot_qty: number | null;
  image_type: string | null;
  image_id: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_size: string | null;
  image_source: string | null;
  carousel_position: number | null;
  image_context: string | null;
  unit_label: string | null;
  settings_json: any;
  style_json: any;
  globals_json: any;
  raw_json: any;
  created_at: string;
  updated_at: string;
}

type ColumnTemplateKey = 'option1' | 'option2' | 'option3' | 'option4' | 'option5';
type StickyColumnKey = 'option1' | 'option2' | 'option3' | 'option4' | 'option5';

const columnTemplates: Record<ColumnTemplateKey, { name: string; range: string; columns: (keyof NemtorUnit)[] }> = {
  'option1': {
    name: 'col temp all',
    range: 'all fields',
    columns: ['unit_id', 'unit_marker', 'el_id', 'el_type', 'widget_type', 'full_text_cached', 'full_text_edits', 'has_img_slot', 'img_slot_qty', 'image_type', 'image_id', 'image_url', 'image_alt', 'image_size', 'image_source', 'carousel_position', 'image_context', 'parent_el_id', 'position_order', 'depth_level', 'sort_index', 'summary_text', 'unit_label', 'settings_json', 'style_json', 'globals_json', 'raw_json', 'created_at', 'updated_at']
  },
  'option2': {
    name: 'col temp core',
    range: 'core fields',
    columns: ['unit_marker', 'el_id', 'el_type', 'widget_type', 'full_text_cached', 'full_text_edits', 'has_img_slot', 'img_slot_qty', 'image_type', 'image_url', 'summary_text']
  },
  'option3': {
    name: 'col temp hierarchy',
    range: 'hierarchy',
    columns: ['unit_marker', 'parent_el_id', 'depth_level', 'sort_index', 'position_order']
  },
  'option4': {
    name: 'col temp json',
    range: 'json fields',
    columns: ['el_id', 'settings_json', 'style_json', 'globals_json', 'raw_json']
  },
  'option5': {
    name: 'col temp summary',
    range: 'summary',
    columns: ['unit_marker', 'el_type', 'widget_type', 'full_text_cached', 'full_text_edits', 'has_img_slot', 'img_slot_qty', 'image_type', 'image_url', 'summary_text', 'unit_label']
  }
};

const stickyOptions: Record<StickyColumnKey, number> = {
  'option1': 1,
  'option2': 2,
  'option3': 3,
  'option4': 4,
  'option5': 5
};

// No mock data - we'll fetch real nemtor_units data from database

interface WaterTableProps {
  gconPieceId?: string | null;
  isTopAreaOpen?: boolean;
  handleAccordionToggle?: (open: boolean) => void;
  gconPiece?: any;
  isRunningF22?: boolean;
  f22Report?: string;
  handleRunF22?: () => void;
  handleCopyPelementorCached?: () => void;
  handleCopyPelementorEdits?: () => void;
  handleCopyF22Report?: () => void;
}

export default function WaterTable({ 
  gconPieceId, 
  isTopAreaOpen, 
  handleAccordionToggle,
  gconPiece,
  isRunningF22,
  f22Report,
  handleRunF22,
  handleCopyPelementorCached,
  handleCopyPelementorEdits,
  handleCopyF22Report
}: WaterTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  const [data, setData] = useState<NemtorUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<keyof NemtorUnit | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // Column template and sticky column state
  const [selectedColumnTemplate, setSelectedColumnTemplate] = useState<ColumnTemplateKey>('option1');
  const [selectedStickyOption, setSelectedStickyOption] = useState<StickyColumnKey>('option1');
  
  // Unit marker filter state
  const [unitMarkerFilter, setUnitMarkerFilter] = useState<string>('all');
  
  // Save full_text_edits state
  const [isSavingFullTextEdits, setIsSavingFullTextEdits] = useState(false);
  const [fullTextEditsChanges, setFullTextEditsChanges] = useState<Map<string, string>>(new Map());

  // Initialize from URL parameters
  useEffect(() => {
    if (!searchParams) return;
    
    const coltemp = searchParams.get('coltemp') as ColumnTemplateKey;
    const stickycol = searchParams.get('stickycol') as StickyColumnKey;
    const unitMarker = searchParams.get('unit_marker');
    
    if (coltemp && columnTemplates[coltemp]) {
      setSelectedColumnTemplate(coltemp);
    }
    if (stickycol && stickyOptions[stickycol]) {
      setSelectedStickyOption(stickycol);
    }
    if (unitMarker) {
      setUnitMarkerFilter(unitMarker);
    }
  }, [searchParams]);

  // Update URL when selections change
  const updateUrl = (colTemplate: ColumnTemplateKey, stickyCol: StickyColumnKey, unitMarker?: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('coltemp', colTemplate);
    params.set('stickycol', stickyCol);
    
    // Handle unit_marker
    if (unitMarker !== undefined) {
      if (unitMarker === 'all') {
        params.delete('unit_marker');
      } else {
        params.set('unit_marker', unitMarker);
      }
    }
    
    // Preserve gcon_piece_id if it exists
    if (gconPieceId) {
      params.set('gcon_piece_id', gconPieceId);
    }
    
    router.push(`?${params.toString()}`);
  };

  // Fetch nemtor_units data
  useEffect(() => {
    const fetchNemtorUnits = async () => {
      if (!gconPieceId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: nemtorData, error: fetchError } = await supabase
          .from('nemtor_units')
          .select('*')
          .eq('fk_gcon_piece_id', gconPieceId)
          .order('sort_index', { ascending: true });

        if (fetchError) {
          console.error('Error fetching nemtor_units:', fetchError);
          setError('Failed to fetch nemtor_units data');
          setData([]);
        } else {
          setData(nemtorData || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while fetching data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNemtorUnits();
  }, [gconPieceId, supabase]);

  // Log when gconPieceId changes
  useEffect(() => {
    if (gconPieceId) {
      console.log('WaterTable: Operating with gcon_piece_id:', gconPieceId);
    }
  }, [gconPieceId]);

  const handleColumnTemplateChange = (option: ColumnTemplateKey) => {
    setSelectedColumnTemplate(option);
    updateUrl(option, selectedStickyOption);
  };

  const handleStickyOptionChange = (option: StickyColumnKey) => {
    setSelectedStickyOption(option);
    updateUrl(selectedColumnTemplate, option);
  };

  const handleUnitMarkerFilterChange = (unitMarker: string) => {
    setUnitMarkerFilter(unitMarker);
    setCurrentPage(1); // Reset to first page when filtering
    updateUrl(selectedColumnTemplate, selectedStickyOption, unitMarker);
  };

  // Get visible columns based on template
  const visibleColumns = useMemo(() => {
    return columnTemplates[selectedColumnTemplate].columns;
  }, [selectedColumnTemplate]);

  // Get sticky columns
  const stickyColumnCount = stickyOptions[selectedStickyOption];
  const allColumns: (keyof NemtorUnit | 'select' | 'prisomi')[] = ['prisomi', 'select', 'unit_id', 'unit_marker', 'el_id', 'el_type', 'widget_type', 'full_text_cached', 'full_text_edits', 'image_type', 'image_id', 'image_url', 'image_alt', 'image_size', 'image_source', 'carousel_position', 'image_context', 'parent_el_id', 'position_order', 'depth_level', 'sort_index', 'summary_text', 'unit_label', 'settings_json', 'style_json', 'globals_json', 'raw_json', 'created_at', 'updated_at'];
  const stickyColumns = allColumns.slice(0, stickyColumnCount + 2); // +2 to include prisomi and select columns
  const nonStickyVisibleColumns = visibleColumns.filter(col => !stickyColumns.includes(col));

  // Get unique unit_marker values for dropdown
  const uniqueUnitMarkers = useMemo(() => {
    const markers = Array.from(new Set(data.map(row => row.unit_marker))).sort();
    return ['all', 'widget_core + img_slot containing units', ...markers];
  }, [data]);

  // Filter data based on search term and unit_marker
  const filteredData = useMemo(() => {
    let filtered = data;
    
    // Filter by unit_marker first
    if (unitMarkerFilter !== 'all') {
      if (unitMarkerFilter === 'widget_core + img_slot containing units') {
        // Special filter: widget_core units OR any unit with has_img_slot = true
        filtered = filtered.filter(row => 
          row.unit_marker === 'widget_core' || row.has_img_slot === true
        );
      } else {
        filtered = filtered.filter(row => row.unit_marker === unitMarkerFilter);
      }
    }
    
    // Then filter by search term
    if (searchTerm) {
      filtered = filtered.filter(row => {
        return Object.values(row).some(value => 
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    return filtered;
  }, [data, searchTerm, unitMarkerFilter]);

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
  const handleSort = (field: keyof NemtorUnit) => {
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

  // Handle row selection
  const handleRowSelect = (rowId: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    setSelectedRows(newSelection);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length && paginatedData.length > 0) {
      // Deselect all
      setSelectedRows(new Set());
    } else {
      // Select all visible rows
      const allRowIds = new Set(paginatedData.map(row => row.unit_id));
      setSelectedRows(allRowIds);
    }
  };

  // Handle full_text_edits change
  const handleFullTextEditsChange = (unitId: string, newValue: string) => {
    const newChanges = new Map(fullTextEditsChanges);
    newChanges.set(unitId, newValue);
    setFullTextEditsChanges(newChanges);
    
    // Update local data immediately for UI responsiveness
    setData(prevData => 
      prevData.map(item => 
        item.unit_id === unitId 
          ? { ...item, full_text_edits: newValue }
          : item
      )
    );
  };

  // Save all full_text_edits changes
  const handleSaveFullTextEdits = async () => {
    if (fullTextEditsChanges.size === 0) {
      alert('No changes to save');
      return;
    }

    setIsSavingFullTextEdits(true);

    try {
      const updates = Array.from(fullTextEditsChanges.entries()).map(([unitId, fullTextEdits]) => ({
        unit_id: unitId,
        full_text_edits: fullTextEdits || null
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('nemtor_units')
          .update({ full_text_edits: update.full_text_edits })
          .eq('unit_id', update.unit_id);

        if (error) {
          console.error(`Error updating unit ${update.unit_id}:`, error);
          throw error;
        }
      }

      // Clear changes after successful save
      setFullTextEditsChanges(new Map());
      alert(`Successfully saved ${updates.length} full_text_edits changes!`);
    } catch (error) {
      console.error('Error saving full_text_edits:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSavingFullTextEdits(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Area Manager - Accordion Wrapper (zarno1) */}
      <div className="mb-4">
        <div 
          className="rounded-lg border border-gray-200 overflow-hidden transition-all duration-300"
          style={{ backgroundColor: '#fefef8' }} // Very soft light yellow
        >
          {!isTopAreaOpen ? (
            // Collapsed State - Compact View
            <div 
              className="flex items-center justify-between px-4 hover:bg-yellow-50 transition-colors"
              style={{ width: '200px', height: '60px' }}
            >
              <span 
                className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                onClick={() => handleAccordionToggle?.(true)}
              >
                📂 Open Top Area Manager
              </span>
              <span className="text-xs text-gray-500 ml-2">zarno1</span>
            </div>
          ) : (
            // Expanded State - Full Content
            <div>
              {/* Top bar with Compact Button and zarno1 label */}
              <div 
                className="flex items-center justify-between px-4 border-b border-gray-200"
                style={{ height: '60px', backgroundColor: '#fefef8' }}
              >
                <button
                  onClick={() => handleAccordionToggle?.(false)}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  📁 Compact
                </button>
                <span className="text-xs text-gray-500">zarno1</span>
              </div>
              
              {/* Content area */}
              <div className="p-4">
                {/* Original Content */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-6">
                    {/* pelementor_cached Display Section */}
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-700 mb-2">gcon_pieces.<span className="font-bold">pelementor_cached</span></label>
                      <div className="flex gap-2">
                        <textarea
                          value={(() => {
                            if (!gconPiece?.pelementor_cached) return '';
                            if (typeof gconPiece.pelementor_cached === 'string') {
                              return gconPiece.pelementor_cached;
                            }
                            return JSON.stringify(gconPiece.pelementor_cached, null, 2);
                          })()}
                          readOnly
                          placeholder="pelementor_cached field value will appear here..."
                          className="resize-none border border-gray-300 rounded p-3 text-sm font-mono bg-white"
                          style={{ width: '500px', height: '300px' }}
                        />
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={handleCopyPelementorCached}
                            disabled={!gconPiece?.pelementor_cached}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                              !gconPiece?.pelementor_cached
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            📋 Copy
                          </button>
                          <button
                            disabled={!gconPiece?.pelementor_cached}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                              !gconPiece?.pelementor_cached
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            🔍 Expand
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* pelementor_edits Display Section */}
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-700 mb-2">gcon_pieces.<span className="font-bold">pelementor_edits</span></label>
                      <div className="flex gap-2">
                        <textarea
                          value={(() => {
                            if (!gconPiece?.pelementor_edits) return '';
                            if (typeof gconPiece.pelementor_edits === 'string') {
                              return gconPiece.pelementor_edits;
                            }
                            return JSON.stringify(gconPiece.pelementor_edits, null, 2);
                          })()}
                          readOnly
                          placeholder="pelementor_edits field value will appear here..."
                          className="resize-none border border-gray-300 rounded p-3 text-sm font-mono bg-white"
                          style={{ width: '500px', height: '300px' }}
                        />
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={handleCopyPelementorEdits}
                            disabled={!gconPiece?.pelementor_edits}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                              !gconPiece?.pelementor_edits
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            📋 Copy
                          </button>
                          <button
                            disabled={!gconPiece?.pelementor_edits}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                              !gconPiece?.pelementor_edits
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            🔍 Expand
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* F22 Section */}
                    <div className="flex flex-col items-end gap-3">
                      <button
                        onClick={handleRunF22}
                        disabled={isRunningF22}
                        className={`px-4 py-2 rounded font-medium transition-colors ${
                          isRunningF22
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {isRunningF22 ? 'Running f22...' : 'Run f22 on this gcon_pieces row'}
                      </button>
                      
                      {/* F22 Report Text Box */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">F22 Function Report:</label>
                          <button
                            onClick={handleCopyF22Report}
                            disabled={!f22Report}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              !f22Report
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            📋 Copy Report
                          </button>
                          <button
                            onClick={() => {
                              const detailedReport = {
                                timestamp: new Date().toISOString(),
                                pageType: 'torya',
                                gconPieceId: gconPieceId,
                                f22Report: f22Report,
                                userAgent: navigator.userAgent,
                                url: window.location.href,
                                instructions: 'Check browser console (F12) for 🔍 DEBUG messages about mud_title and mud_content'
                              };
                              navigator.clipboard.writeText(JSON.stringify(detailedReport, null, 2));
                              alert('Complete diagnostic report copied to clipboard!');
                            }}
                            disabled={!f22Report}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              !f22Report
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            🔍 Full Diagnostic
                          </button>
                        </div>
                        <textarea
                          value={f22Report || ''}
                          readOnly
                          placeholder="F22 function reports will appear here after execution...\n\nLook for:\n- TontoNormalizationProcess1 results\n- mud_title and mud_content processing\n- Database verification results\n- Any error messages\n\nCheck browser console (F12) for detailed debug logs."
                          className="resize-none border border-gray-300 rounded p-3 text-sm font-mono bg-white"
                          style={{ width: '500px', height: '200px' }}
                        />
                        {f22Report && (
                          <div className="text-xs text-gray-600 mt-1">
                            💡 Tip: Check browser console (F12) for detailed 🔍 DEBUG messages about mud_title and mud_content processing
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Column Template Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* SQL View Info */}
        <div className="border border-gray-300 rounded p-2" style={{ maxWidth: '150px', maxHeight: '75px' }}>
          <div className="text-xs">
            <div className="font-bold">SQL Table Info</div>
            <div>table: nemtor_units</div>
            <div># columns: 17</div>
            <div># rows: {data.length}</div>
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
        <div className="flex items-center gap-4">
          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search all columns..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="font-bold text-sm whitespace-nowrap">unit_marker</label>
            <select
              value={unitMarkerFilter}
              onChange={(e) => handleUnitMarkerFilterChange(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                unitMarkerFilter !== 'all' 
                  ? 'bg-blue-900 text-white' 
                  : 'bg-white text-gray-900'
              }`}
            >
              {uniqueUnitMarkers.map((marker) => (
                <option key={marker} value={marker}>
                  {marker === 'all' ? 'All' : 
                   marker === 'widget_core + img_slot containing units' ? 'widget_core + img_slot containing units' : 
                   marker}
                </option>
              ))}
            </select>
            
            <button
              onClick={handleSaveFullTextEdits}
              disabled={isSavingFullTextEdits || fullTextEditsChanges.size === 0}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isSavingFullTextEdits || fullTextEditsChanges.size === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isSavingFullTextEdits ? 'Saving...' : `Save${fullTextEditsChanges.size > 0 ? ` (${fullTextEditsChanges.size})` : ''}`}
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Showing {paginatedData.length} of {sortedData.length} records
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg" style={{ height: '750px', overflowY: 'auto' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-20">
            {/* Horizomi Row - Column Numbering */}
            <tr>
              {/* Horizomi header column numbering */}
              {(() => {
                let visibleColumnNumber = 1;
                return allColumns.map((col, index) => {
                  const isLastStickyCol = index === stickyColumns.length - 1;
                  const isPrisomiCol = col === 'prisomi';
                  const isSelectCol = col === 'select';
                  const isVisible = isPrisomiCol || isSelectCol || visibleColumns.includes(col as keyof NemtorUnit);
                  
                  if (!isVisible) return null;
                  
                  const currentColumnNumber = visibleColumnNumber++;
                  
                  const isSticky = stickyColumns.includes(col);
                  let leftPosition = '0px';
                  
                  if (isSticky) {
                    if (isPrisomiCol) {
                      leftPosition = '0px';
                    } else if (isSelectCol) {
                      leftPosition = '20px'; // After prisomi (20px width)
                    } else {
                      // Other sticky columns
                      const stickyIndex = stickyColumns.indexOf(col);
                      leftPosition = `${20 + 60 + (stickyIndex - 2) * 150}px`; // 20px (prisomi) + 60px (select) + others
                    }
                  }
                  
                  return (
                    <th
                      key={`horizomi-${col}`}
                      className={`border border-gray-300 bg-purple-50 p-0 text-center ${
                        isSticky ? 'sticky z-10' : ''
                      } ${isLastStickyCol ? 'border-r-4 border-black' : ''}`}
                      style={{ 
                        width: isPrisomiCol ? '20px' : isSelectCol ? '60px' : '150px',
                        maxWidth: isPrisomiCol ? '20px' : isSelectCol ? '60px' : '150px',
                        minWidth: isPrisomiCol ? '20px' : isSelectCol ? '60px' : '150px',
                        left: isSticky ? leftPosition : undefined
                      }}
                    >
                      <div className="relative group">
                        <div className="text-center text-xs font-normal text-gray-600">
                          {currentColumnNumber}
                        </div>
                      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                        <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                          <div className="mb-2">
                            {isPrisomiCol ? (
                              <>
                                <div>intersection cell</div>
                                <div>horizomi row 1</div>
                                <div>prisomi column 1</div>
                              </>
                            ) : (
                              <span className="font-bold">horizomi row</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const textToCopy = isPrisomiCol 
                                ? 'intersection cell\nhorizomi row 1\nprisomi column 1'
                                : 'horizomi row';
                              navigator.clipboard.writeText(textToCopy);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                        </div>
                      </div>
                    </div>
                  </th>
                );
                });
              })()}
            </tr>
            
            {/* Main Header Row */}
            <tr>
              {/* Sticky columns */}
              {stickyColumns.map((col, index) => {
                const isLastStickyCol = index === stickyColumns.length - 1;
                const isPrisomiCol = col === 'prisomi';
                const isSelectCol = col === 'select';
                
                if (isPrisomiCol) {
                  return (
                    <th
                      key={col}
                      className={`border border-gray-300 bg-purple-50 p-0 sticky bg-gray-50 z-10 ${
                        isLastStickyCol ? 'border-r-4 border-black' : ''
                      }`}
                      style={{ 
                        left: '0px',
                        width: '20px',
                        maxWidth: '20px',
                        minWidth: '20px'
                      }}
                    >
                      <div className="relative group">
                        <div className="text-center text-xs font-normal text-gray-600">
                          2
                        </div>
                        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                          <div className="bg-gray-800 text-white text-xs rounded py-3 px-4 whitespace-pre-line">
                            <div className="mb-2">
                              <div>row number: 2</div>
                              <div>prisomi column</div>
                              <div>table header row</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const textToCopy = `row number: 2\nprisomi column\ntable header row`;
                                navigator.clipboard.writeText(textToCopy);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                          </div>
                        </div>
                      </div>
                    </th>
                  );
                }
                
                if (isSelectCol) {
                  return (
                    <th
                      key={col}
                      className={`text-left sticky bg-gray-50 z-10 ${
                        isLastStickyCol ? 'border-r-4 border-black' : ''
                      }`}
                      style={{ 
                        left: '20px', // After prisomi column (20px width)
                        width: '60px',
                        padding: '6px 10px !important',
                        paddingTop: '6px !important',
                        paddingBottom: '6px !important',
                        paddingLeft: '10px !important',
                        paddingRight: '10px !important'
                      }}
                    >
                      <div 
                        className="cursor-pointer flex items-center justify-center w-full h-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAll();
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                          onChange={() => {}} // Handled by div click
                          className="cursor-pointer"
                          style={{ width: '26px', height: '26px' }}
                        />
                      </div>
                    </th>
                  );
                }
                
                return (
                  <th
                    key={col}
                    onClick={() => handleSort(col as keyof NemtorUnit)}
                    className={`px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100 sticky bg-gray-50 z-10 border border-gray-200 ${
                      isLastStickyCol ? 'border-r-4 border-black' : ''
                    }`}
                    style={{ 
                      left: `${20 + 60 + (index - 2) * 150}px`, // 20px (prisomi) + 60px (select) + column positions
                      width: col === 'full_text_edits' ? '600px' : undefined,
                      minWidth: col === 'full_text_edits' ? '600px' : undefined,
                      maxWidth: col === 'full_text_edits' ? '600px' : undefined
                    }}
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
                );
              })}
              {/* Non-sticky visible columns */}
              {nonStickyVisibleColumns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className={`px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100 border border-gray-200 ${
                    col === 'full_text_edits' ? 'border-l-[3px] border-r-[3px] border-l-black border-r-black' : ''
                  } ${col === 'img_slot_qty' ? 'border-r-[3px] border-r-black' : ''} ${col === 'image_context' ? 'border-r-[3px] border-r-black' : ''}`}
                  style={{
                    width: col === 'full_text_edits' ? '600px' : undefined,
                    minWidth: col === 'full_text_edits' ? '600px' : undefined,
                    maxWidth: col === 'full_text_edits' ? '600px' : undefined
                  }}
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
            {paginatedData.map((row, rowIndex) => (
              <tr key={row.unit_id} className="hover:bg-gray-50">
                {/* Sticky columns */}
                {stickyColumns.map((col, index) => {
                  const isLastStickyCol = index === stickyColumns.length - 1;
                  const isPrisomiCol = col === 'prisomi';
                  const isSelectCol = col === 'select';
                  
                  if (isPrisomiCol) {
                    const prisomiNumber = (currentPage - 1) * itemsPerPage + rowIndex + 3; // +3 to account for horizomi row (1) and header row (2)
                    return (
                      <td 
                        key={col} 
                        className={`border border-gray-300 bg-purple-50 p-0 sticky bg-white z-10 ${
                          isLastStickyCol ? 'border-r-4 border-black' : ''
                        }`}
                        style={{ 
                          left: '0px',
                          width: '20px',
                          maxWidth: '20px',
                          minWidth: '20px'
                        }}
                      >
                        <div className="relative group">
                          <div className="text-center text-xs font-normal text-gray-600">
                            {prisomiNumber}
                          </div>
                          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                            <div className="bg-gray-800 text-white text-xs rounded py-3 px-4 whitespace-pre-line">
                              <div className="mb-2">
                                <div>row number: {prisomiNumber}</div>
                                <div>prisomi column</div>
                                <div>absolute row positioning</div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const textToCopy = `row number: ${prisomiNumber}\nprisomi column\nabsolute row positioning`;
                                  navigator.clipboard.writeText(textToCopy);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                              >
                                Copy
                              </button>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                              <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    );
                  }
                  
                  if (isSelectCol) {
                    return (
                      <td 
                        key={col} 
                        className={`whitespace-nowrap text-sm text-gray-900 sticky bg-white ${
                          isLastStickyCol ? 'border-r-4 border-black' : ''
                        }`}
                        style={{ 
                          left: '20px', // After prisomi column (20px width)
                          width: '60px',
                          padding: '6px 10px !important',
                          paddingTop: '6px !important',
                          paddingBottom: '6px !important',
                          paddingLeft: '10px !important',
                          paddingRight: '10px !important'
                        }}
                        onClick={() => handleRowSelect(row.unit_id)}
                      >
                        <div 
                          className="cursor-pointer flex items-center justify-center w-full h-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowSelect(row.unit_id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.unit_id)}
                            onChange={() => {}} // Handled by div click
                            className="cursor-pointer"
                            style={{ width: '26px', height: '26px' }}
                          />
                        </div>
                      </td>
                    );
                  }
                  
                  return (
                    <td 
                      key={col} 
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky bg-white border border-gray-200 ${
                        col === 'full_text_edits' ? 'border-l-[3px] border-r-[3px] border-l-black border-r-black' : ''
                      } ${col === 'img_slot_qty' ? 'border-r-[3px] border-r-black' : ''} ${col === 'image_context' ? 'border-r-[3px] border-r-black' : ''} ${isLastStickyCol ? 'border-r-4 border-black' : ''}`}
                      style={{ 
                        left: `${20 + 60 + (index - 2) * 150}px`, // 20px (prisomi) + 60px (select) + column positions
                        width: col === 'full_text_edits' ? '600px' : undefined,
                        minWidth: col === 'full_text_edits' ? '600px' : undefined,
                        maxWidth: col === 'full_text_edits' ? '600px' : undefined
                      }}
                    >
                      {(() => {
                        const value = row[col as keyof NemtorUnit];
                        
                        // Special handling for full_text_edits - use textarea for code editing
                        if (col === 'full_text_edits') {
                          return (
                            <textarea
                              className="kz_torya_fulltextedits_box1 w-full h-20 p-2 text-xs font-mono border border-gray-300 rounded resize-none"
                              value={value?.toString() || ''}
                              onChange={(e) => {
                                handleFullTextEditsChange(row.unit_id, e.target.value);
                              }}
                            />
                          );
                        }
                        
                        // Special handling for has_img_slot - show green dot for true with checkbox
                        if (col === 'has_img_slot' && value === true) {
                          return (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>true</span>
                              <input
                                type="checkbox"
                                className="ml-1"
                                style={{ width: '26px', height: '26px' }}
                              />
                            </div>
                          );
                        }
                        
                        // Special handling for has_img_slot - show only false text for false values
                        if (col === 'has_img_slot' && value === false) {
                          return <span>false</span>;
                        }
                        
                        // Special handling for unit_id - truncate and make clickable
                        if (col === 'unit_id' && value) {
                          const fullValue = value.toString();
                          const truncatedValue = fullValue.substring(0, 2) + '.';
                          return (
                            <div 
                              className="cursor-pointer hover:bg-blue-50"
                              title={fullValue}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(fullValue);
                              }}
                            >
                              {truncatedValue}
                            </div>
                          );
                        }
                        
                        if (col.includes('_json') && value) {
                          const isRawJson = col === 'raw_json';
                          return (
                            <div 
                              className={`truncate max-w-xs ${isRawJson ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                              title={JSON.stringify(value, null, 2)}
                              onClick={isRawJson ? (e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(JSON.stringify(value, null, 2));
                              } : undefined}
                            >
                              {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : value}
                            </div>
                          );
                        }
                        return value?.toString() || '-';
                      })()}
                    </td>
                  );
                })}
                {/* Non-sticky visible columns */}
                {nonStickyVisibleColumns.map((col) => (
                  <td 
                    key={col} 
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 ${
                      col === 'full_text_edits' ? 'border-l-[3px] border-r-[3px] border-l-black border-r-black' : ''
                    } ${col === 'img_slot_qty' ? 'border-r-[3px] border-r-black' : ''} ${col === 'image_context' ? 'border-r-[3px] border-r-black' : ''}`}
                    style={{
                      width: col === 'full_text_edits' ? '600px' : undefined,
                      minWidth: col === 'full_text_edits' ? '600px' : undefined,
                      maxWidth: col === 'full_text_edits' ? '600px' : undefined
                    }}
                  >
                    {(() => {
                      const value = row[col as keyof NemtorUnit];
                      
                      // Special handling for full_text_edits - use textarea for code editing
                      if (col === 'full_text_edits') {
                        return (
                          <textarea
                            className="kz_torya_fulltextedits_box1 w-full h-20 p-2 text-xs font-mono border border-gray-300 rounded resize-none"
                            value={value?.toString() || ''}
                            onChange={(e) => {
                              handleFullTextEditsChange(row.unit_id, e.target.value);
                            }}
                          />
                        );
                      }
                      
                      // Special handling for has_img_slot - show green dot for true with checkbox
                      if (col === 'has_img_slot' && value === true) {
                        return (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>true</span>
                            <input
                              type="checkbox"
                              className="ml-1"
                              style={{ width: '26px', height: '26px' }}
                            />
                          </div>
                        );
                      }
                      
                      // Special handling for has_img_slot - show only false text for false values
                      if (col === 'has_img_slot' && value === false) {
                        return <span>false</span>;
                      }
                      
                      // Special handling for unit_id - truncate and make clickable
                      if (col === 'unit_id' && value) {
                        const fullValue = value.toString();
                        const truncatedValue = fullValue.substring(0, 2) + '.';
                        return (
                          <div 
                            className="cursor-pointer hover:bg-blue-50"
                            title={fullValue}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(fullValue);
                            }}
                          >
                            {truncatedValue}
                          </div>
                        );
                      }
                      
                      if (col.includes('_json') && value) {
                        const isRawJson = col === 'raw_json';
                        return (
                          <div 
                            className={`truncate max-w-xs ${isRawJson ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                            title={JSON.stringify(value, null, 2)}
                            onClick={isRawJson ? (e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(JSON.stringify(value, null, 2));
                            } : undefined}
                          >
                            {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : value}
                          </div>
                        );
                      }
                      return value?.toString() || '-';
                    })()}
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