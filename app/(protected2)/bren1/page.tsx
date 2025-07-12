'use client';

import { useEffect, useState } from 'react';
import FavaMinimalTable from '../fava/components/favaMinimalTable'
import FavaColumnTemplateControls from '../fava/components/favaColumnTemplateControls'
import FavaFilterControls from '../fava/components/favaFilterControls'
import FavaSearchBox from '../fava/components/favaSearchBox'
import FavaPaginationControls from '../fava/components/favaPaginationControls'
import FavaBiriDevInfoBox from '../fava/components/favaBiriDevInfoBox'
import FavaHeader from '../fava/components/favaHeader'
import FavaSidebar from '../fava/components/favaSidebar'
import FavaNavToggle from '../fava/components/favaNavToggle'
import { tableConfig } from '../fava/config/tableConfig'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import '../fava/styles/fava-table-template.css'
import '../fava/styles/fava-navigation.css'

export default function Bren1Page() {
  const [cricketData, setCricketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'Cricket Matches - /bren1';
    fetchCricketMatches();
    
    // Check navigation visibility from localStorage
    const savedVisibility = localStorage.getItem('fava-nav-visible');
    if (savedVisibility !== null) {
      setNavVisible(JSON.parse(savedVisibility));
    }
    
    // Listen for navigation visibility changes
    const handleVisibilityChange = () => {
      const visibility = localStorage.getItem('fava-nav-visible');
      if (visibility !== null) {
        setNavVisible(JSON.parse(visibility));
      }
    };
    
    // Listen for both storage changes (cross-tab) and custom events (same page)
    window.addEventListener('storage', handleVisibilityChange);
    window.addEventListener('fava-nav-toggle', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleVisibilityChange);
      window.removeEventListener('fava-nav-toggle', handleVisibilityChange);
    };
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
  
  // Convert config columns to headers (for backward compatibility)
  const headers = tableConfig.columns.map(col => col.header);
  
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

  if (loading) {
    return <div>Loading cricket matches...</div>;
  }

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

  return (
    <>
      <FavaNavToggle />
      <FavaHeader />
      <FavaSidebar />
      <div className="fava-page-content" style={{ 
        paddingTop: navVisible ? '60px' : '20px', 
        paddingLeft: navVisible ? '250px' : '20px',
        paddingRight: '20px',
        paddingBottom: '20px',
        transition: 'all 0.3s ease',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}>
        <h1>Cricket Matches Database</h1>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          {cricketData.length} matches • 30 data columns • Live cricket statistics
        </p>
        
        <FavaColumnTemplateControls />
        <FavaFilterControls />
        <FavaSearchBox />
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <FavaPaginationControls />
          <FavaBiriDevInfoBox />
        </div>
        
        <FavaMinimalTable 
          headerRows={tableConfig.headerRows}
          data={data}
          tableClassName="cricket-matches-table"
          theadClassName="table-header"
          tbodyClassName="table-body"
          thClassName="header-cell"
          tdClassName="data-cell"
          headerTrClassName="header-row"
          bodyTrClassName="body-row"
          cellTooltips={cellTooltips}
          onCellClick={handleCellClick}
          onHeaderClick={handleHeaderClick}
          onRowClick={handleRowClick}
        />
      </div>
    </>
  )
}