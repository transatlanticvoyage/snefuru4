'use client';

import { useEffect, useState } from 'react';
import FavaPageMaster from '../fava/components/favaPageMaster';
import { tableConfig } from './tableConfig';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Torna2Page() {
  const [nemtorData, setNemtorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchNemtorUnits();
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
  
  // Convert nemtor data to table format
  const data = nemtorData.map(row => 
    tableConfig.columns.map(col => {
      const value = row[col.field as keyof typeof row];
      
      // Apply formatting if specified
      if (col.format && typeof col.format === 'function') {
        return col.format(value);
      }
      
      return value;
    })
  );

  // Generate tooltips for nemtor data
  const cellTooltips = nemtorData.map(() => 
    tableConfig.columns.map(col => `${col.header}: ${col.field}`)
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

  // Prepare table props
  const tableProps = {
    headerRows: tableConfig.headerRows,
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
      pageTitle="Nemtor Units Database"
      pageDescription={`${nemtorData.length} units • ${tableConfig.columns.length} data columns • Elementor widget management system`}
      documentTitle="Nemtor Units - /torna2"
      tableProps={tableProps}
      showTable={true}
      showColumnTemplateControls={true}
      showFilterControls={true}
      showSearchBox={true}
      showPaginationControls={true}
      showBiriDevInfoBox={true}
    >
      {/* Custom content specific to Nemtor Units */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f0f9ff', 
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>
          Nemtor Units Management
        </h3>
        <p style={{ margin: '0', color: '#0c4a6e', fontSize: '14px' }}>
          This page displays all Nemtor units from the database. Each unit represents an Elementor widget 
          or component with its associated settings, styles, and metadata. The table shows all fields 
          including JSON data, image configurations, and hierarchical relationships.
        </p>
      </div>
    </FavaPageMaster>
  );
}