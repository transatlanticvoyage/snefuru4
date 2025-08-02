'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFavaTaniSafe } from '../fava/components/favaTaniPopup/favaTaniConditionalProvider';
import FavaPageMasterWithPagination from '../fava/components/favaPageMasterWithPagination';
import { torna3TableConfig } from '../fava/config/torna3TableConfig';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createTorna3TaniConfig } from './taniContent';
import Torna3ZarnoAccordion from './components/Torna3ZarnoAccordion';
import './styles/beralis-table-overrides.css';

export default function Torna3Page() {
  const [nemtorData, setNemtorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [utg_id, setUtgId] = useState<string | null>(null);
  const [gconPieceId, setGconPieceId] = useState<string | null>(null);
  const [gconPiece, setGconPiece] = useState<any>(null);
  const [isZarnoOpen, setIsZarnoOpen] = useState<boolean>(false);
  const taniState = useFavaTaniSafe()?.state;
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get gcon_piece_id from URL parameters
    const gconPieceIdParam = searchParams?.get('gcon_piece_id');
    setGconPieceId(gconPieceIdParam);
    
    // Get zarno state from URL parameters
    const zarnoState = searchParams?.get('zarno1');
    setIsZarnoOpen(zarnoState === 'open');
    
    // Load zarno state from localStorage if not in URL
    if (!zarnoState) {
      const savedZarnoState = localStorage.getItem('torna3_zarno1_state');
      setIsZarnoOpen(savedZarnoState === 'open');
    }
    
    fetchNemtorUnits(gconPieceIdParam);
    
    // Fetch gcon_piece data if gconPieceId exists
    if (gconPieceIdParam) {
      fetchGconPiece(gconPieceIdParam);
    }
    
    // Listen for template selection events
    const handleTemplateSelected = async (event: any) => {
      const { templateId } = event.detail;
      await applyTemplate(templateId);
    };
    
    const handleTemplateLoaded = async (event: any) => {
      const { templateId } = event.detail;
      await applyTemplate(templateId);
    };
    
    const handleShowAll = () => {
      // Show all columns from the original config
      setActiveColumns(torna3TableConfig.columns.map(col => col.field));
      setSelectedTemplateId(null);
    };
    
    window.addEventListener('fava-template-selected', handleTemplateSelected);
    window.addEventListener('fava-template-loaded', handleTemplateLoaded);
    window.addEventListener('fava-template-show-all', handleShowAll);
    
    // Check URL for initial template
    const url = new URL(window.location.href);
    const coltempId = url.searchParams.get('coltemp_id');
    if (coltempId) {
      applyTemplate(parseInt(coltempId));
    } else {
      // Load all columns by default
      setActiveColumns(torna3TableConfig.columns.map(col => col.field));
    }
    
    return () => {
      window.removeEventListener('fava-template-selected', handleTemplateSelected);
      window.removeEventListener('fava-template-loaded', handleTemplateLoaded);
      window.removeEventListener('fava-template-show-all', handleShowAll);
    };
  }, [searchParams]);

  // Zarno toggle handler
  const handleZarnoToggle = (open: boolean) => {
    setIsZarnoOpen(open);
    
    // Save to localStorage
    localStorage.setItem('torna3_zarno1_state', open ? 'open' : 'closed');
    
    // Update URL parameter
    const url = new URL(window.location.href);
    url.searchParams.set('zarno1', open ? 'open' : 'closed');
    window.history.replaceState({}, '', url.toString());
  };

  const fetchNemtorUnits = async (gconPieceId?: string | null) => {
    try {
      let query = supabase
        .from('nemtor_units')
        .select('*');
      
      // Filter by gcon_piece_id if provided
      if (gconPieceId) {
        query = query.eq('fk_gcon_piece_id', gconPieceId);
      }
      
      const { data, error } = await query
        .order('sort_index', { ascending: true })
        .order('position_order', { ascending: true });

      if (error) {
        console.error('Error fetching nemtor units:', error);
        return;
      }

      setNemtorData(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchGconPiece = async (gconPieceId: string) => {
    try {
      const { data, error } = await supabase
        .from('gcon_pieces')
        .select('id, asn_sitespren_base, mud_title, h1title, pelementor_cached, pelementor_edits, asn_image_plan_batch_id, post_name, pageslug, pageurl')
        .eq('id', gconPieceId)
        .single();

      if (error) {
        console.error('Error fetching gcon piece:', error);
        return;
      }

      setGconPiece(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Refresh gcon_piece data after F22 completion
  const refreshGconPiece = async () => {
    if (gconPieceId) {
      const { data: refreshedData, error } = await supabase
        .from('gcon_pieces')
        .select('id, asn_sitespren_base, mud_title, h1title, pelementor_cached, pelementor_edits, asn_image_plan_batch_id, post_name, pageslug, pageurl')
        .eq('id', gconPieceId)
        .single();

      if (!error && refreshedData) {
        setGconPiece(refreshedData);
      }
    }
  };
  
  const applyTemplate = async (coltempId: number) => {
    try {
      // Special handling for "all" template
      if (coltempId === -999) {
        // Show all columns from the original config
        setActiveColumns(torna3TableConfig.columns.map(col => col.field));
        setSelectedTemplateId(-999);
        return;
      }
      
      // Fetch columns for this template from junction table
      const { data, error } = await supabase
        .from('coltemp_rackui_relations')
        .select(`
          fk_rackui_column_id,
          rackuic (
            rcolumn_dbcolumn
          )
        `)
        .eq('fk_coltemp_id', coltempId)
        .eq('is_visible', true)
        .order('column_position', { ascending: true });
        
      if (error) {
        console.error('Error fetching template columns:', error);
        return;
      }
      
      // Extract column names
      const columnNames = data?.map(item => 
        (item.rackuic as any)?.rcolumn_dbcolumn
      ).filter(Boolean) || [];
      
      setActiveColumns(columnNames);
      setSelectedTemplateId(coltempId);
    } catch (error) {
      console.error('Error applying template:', error);
    }
  };
  
  // Filter columns based on active template
  const visibleColumns = activeColumns.length > 0 
    ? torna3TableConfig.columns.filter(col => activeColumns.includes(col.field))
    : torna3TableConfig.columns;
    
  // Convert nemtor data to table format with only visible columns
  const data = nemtorData.map(row => 
    visibleColumns.map(col => {
      const value = row[col.field as keyof typeof row];
      
      // Apply formatting if specified
      if (col.format && typeof col.format === 'function') {
        return col.format(value);
      }
      
      return value;
    })
  );

  // Debug logging for pagination issue
  console.log('TORNA3 - activeColumns.length:', activeColumns.length);
  console.log('TORNA3 - visibleColumns.length:', visibleColumns.length);
  console.log('TORNA3 - data.length:', data.length);
  console.log('TORNA3 - data structure:', data.slice(0, 2)); // Show first 2 rows

  // Generate tooltips for visible columns only
  const cellTooltips = nemtorData.map(() => 
    visibleColumns.map(col => `${col.header}: ${col.field}`)
  );

  // Event handlers
  const handleCellClick = (rowIndex: number, colIndex: number, value: any) => {
    console.log(`Cell clicked: Row ${rowIndex}, Col ${colIndex}, Value: ${value}`);
  };

  const handleHeaderClick = (colIndex: number, headerName: string) => {
    console.log(`Header clicked: ${headerName} (Column ${colIndex})`);
  };

  const handleRowClick = (rowIndex: number, rowData: any[]) => {
    console.log(`Row clicked: ${rowIndex}`, rowData);
  };

  // Create header rows for visible columns
  const filteredHeaderRows = [{
    id: 'main-header',
    type: 'label',
    cells: visibleColumns.map(col => ({
      content: col.header,
      alignment: col.field.includes('id') || col.field.includes('_at') || col.field.includes('position') || 
                col.field.includes('level') || col.field.includes('index') || col.field.includes('slot') || 
                col.field.includes('qty') ? 'center' : 'left'
    }))
  }];
  
  // Prepare table props
  const tableProps = {
    headerRows: filteredHeaderRows,
    data: data,
    tableClassName: "nemtor-units-table",
    theadClassName: "table-header",
    tbodyClassName: "table-body",
    thClassName: "header-cell",
    tdClassName: "data-cell",
    headerTrClassName: "header-row",
    bodyTrClassName: "body-row",
    cellTooltips: cellTooltips,
    onCellClick: handleCellClick,
    onHeaderClick: handleHeaderClick,
    onRowClick: handleRowClick
  };

  if (loading) {
    return <div>Loading nemtor units...</div>;
  }


  return (
    <FavaPageMasterWithPagination
      pageTitle={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/images_of_app/tornado-logo-1.jpg" 
            alt="Tornado Logo" 
            style={{ height: '40px', width: 'auto' }}
          />
          <span>Tornado Page Editor System</span>
        </div>
      }
      pageDescription={`${nemtorData.length} units • ${visibleColumns.length} of ${torna3TableConfig.columns.length} columns shown • Elementor widget tracking`}
      documentTitle="Nemtor Units - /torna3"
      tableProps={tableProps}
      showTable={true}
      showColumnTemplateControls={true}
      showShendoBar={true}
      showFilterControls={true}
      showSearchBox={true}
      showPaginationControls={true}
      showBiriDevInfoBox={true}
      showTrelnoColumnsDefBox={true}
      
      // Pagination configuration
      enableURLParams={true}
      paginationPosition="bottom"
      pageKey="torna3"
      paginationConfig={{
        defaultItemsPerPage: 20,
        pageSizeOptions: [10, 20, 50, 100],
        showPageSizeSelector: true,
        showPageInfo: true,
        showNavigationButtons: true
      }}
      
      // FavaTani Popup Configuration
      taniEnabled={true}
      taniPreset="standard"
      taniConfig={createTorna3TaniConfig(
        nemtorData,
        visibleColumns,
        torna3TableConfig.columns.length,
        utg_id || undefined
      )}
      utg_id={utg_id || undefined}
      zarnoContent={
        gconPieceId && gconPiece ? (
          <Torna3ZarnoAccordion 
            gconPiece={gconPiece}
            gconPieceId={gconPieceId}
            isOpen={isZarnoOpen}
            onToggle={handleZarnoToggle}
            onRefreshData={refreshGconPiece}
          />
        ) : undefined
      }
    >
    </FavaPageMasterWithPagination>
  );
}