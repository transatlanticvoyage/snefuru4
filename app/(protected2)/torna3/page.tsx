'use client';

import { useEffect, useState } from 'react';
import FavaPageMaster from '../fava/components/favaPageMaster';
import { torna3TableConfig } from '../fava/config/torna3TableConfig';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Torna3Page() {
  const [nemtorData, setNemtorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchNemtorUnits();
    
    // Listen for template selection events
    const handleTemplateSelected = async (event: any) => {
      const { coltemp_id } = event.detail;
      await applyTemplate(coltemp_id);
    };
    
    const handleTemplateLoaded = async (event: any) => {
      const { coltemp_id } = event.detail;
      await applyTemplate(coltemp_id);
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
  }, []);

  const fetchNemtorUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('nemtor_units')
        .select('*')
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
  
  const applyTemplate = async (coltempId: number) => {
    try {
      // Fetch columns for this template from junction table
      const { data, error } = await supabase
        .from('coltemp_denbu_relations')
        .select(`
          fk_denbu_column_id,
          denbu_columns (
            column_name
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
        (item.denbu_columns as any)?.column_name
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
    <FavaPageMaster
      pageTitle="Nemtor Units Management System"
      pageDescription={`${nemtorData.length} units • ${visibleColumns.length} of ${torna3TableConfig.columns.length} columns shown • Elementor widget tracking`}
      documentTitle="Nemtor Units - /torna3"
      tableProps={tableProps}
      showTable={true}
      showColumnTemplateControls={true}
      showFilterControls={true}
      showSearchBox={true}
      showPaginationControls={true}
      showBiriDevInfoBox={true}
      showTrelnoColumnsDefBox={true}
    >
      {/* Custom content specific to Nemtor Units */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#e6f3ff', 
        borderRadius: '8px',
        border: '1px solid #b3d9ff'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>
          Nemtor Units Database Overview
        </h3>
        <p style={{ margin: '0 0 10px 0', color: '#004080', fontSize: '14px' }}>
          This page displays all Nemtor units using the Fava template system. Each unit represents 
          an Elementor widget or component with comprehensive metadata including settings, styles, 
          and hierarchical relationships.
        </p>
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#003366' }}>
          <div>
            <strong>Key Features:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>Complete field visibility (32 columns)</li>
              <li>Grouped header organization</li>
              <li>JSON field previews</li>
              <li>Timestamp formatting</li>
            </ul>
          </div>
          <div>
            <strong>Data Categories:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>Identifiers & Element Properties</li>
              <li>Text Content & JSON Data</li>
              <li>Image Properties & Slots</li>
              <li>TAR Content Management</li>
            </ul>
          </div>
        </div>
      </div>
    </FavaPageMaster>
  );
}