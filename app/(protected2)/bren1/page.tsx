'use client';

import { useEffect, useState } from 'react';
import FavaPageMaster from '../fava/components/favaPageMaster';
import { tableConfig } from '../fava/config/tableConfig';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Bren1Page() {
  const [cricketData, setCricketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCricketMatches();
  }, []);

  const fetchCricketMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('cricket_matches')
        .select('*')
        .order('match_id', { ascending: true });

      if (error) {
        console.error('Error fetching cricket matches:', error);
        return;
      }

      setCricketData(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Convert cricket data to table format
  const data = cricketData.map(row => 
    tableConfig.columns.map(col => {
      const value = row[col.field as keyof typeof row];
      
      // Apply formatting if specified
      if (col.format && typeof col.format === 'function') {
        return col.format(value);
      }
      
      return value;
    })
  );

  // Generate tooltips for cricket data
  const cellTooltips = cricketData.map(() => 
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
    tableClassName: "cricket-matches-table",
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
    return <div>Loading cricket matches...</div>;
  }

  return (
    <FavaPageMaster
      pageTitle="Cricket Matches Database"
      pageDescription={`${cricketData.length} matches • 30 data columns • Live cricket statistics`}
      documentTitle="Cricket Matches - /bren1"
      tableProps={tableProps}
      showTable={true}
      showColumnTemplateControls={true}
      showFilterControls={true}
      showSearchBox={true}
      showPaginationControls={true}
      showBiriDevInfoBox={true}
    >
      {/* Example of additional custom content that could be added */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>
          Fava Template System Demo
        </h3>
        <p style={{ margin: '0', color: '#6c757d', fontSize: '14px' }}>
          This page demonstrates the complete Fava template system using FavaPageMaster. 
          All navigation, controls, and table functionality are automatically included 
          with minimal code. Perfect for rapid page development!
        </p>
      </div>
    </FavaPageMaster>
  );
}