'use client';

import { useEffect, useState } from 'react';
import AzMinimalTable from './components/azMinimalTable'
import AzColumnTemplateControls from './components/azColumnTemplateControls'
import AzFilterControls from './components/azFilterControls'
import AzSearchBox from './components/azSearchBox'
import AzPaginationControls from './components/azPaginationControls'
import AzHeader from './components/AzHeader'
import AzSidebar from './components/AzSidebar'
import AzNavToggle from './components/AzNavToggle'
import { tableConfig } from './config/tableConfig'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import './styles/az-table-template.css'
import './styles/az-navigation.css'

export default function Azulp1Page() {
  const [cricketData, setCricketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'Cricket Matches - /azulp1';
    fetchCricketMatches();
    
    // Check navigation visibility from localStorage
    const savedVisibility = localStorage.getItem('az-nav-visible');
    if (savedVisibility !== null) {
      setNavVisible(JSON.parse(savedVisibility));
    }
    
    // Listen for navigation visibility changes
    const handleStorageChange = () => {
      const visibility = localStorage.getItem('az-nav-visible');
      if (visibility !== null) {
        setNavVisible(JSON.parse(visibility));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
      <AzNavToggle />
      <AzHeader />
      <AzSidebar />
      <div className="az-page-content" style={{ 
        paddingTop: navVisible ? '60px' : '0', 
        paddingLeft: navVisible ? '250px' : '0',
        transition: 'padding 0.3s ease'
      }}>
        <h1>Cricket Matches Database</h1>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          {cricketData.length} matches • 30 data columns • Live cricket statistics
        </p>
        
        <AzColumnTemplateControls />
        <AzFilterControls />
        <AzSearchBox />
        <AzPaginationControls />
        
        <AzMinimalTable 
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