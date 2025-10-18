'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface JettisonConfig {
  targetTable: 'leadsmart_zip_based_data' | 'leadsmart_transformed';
  relColumnPrefix: 'rel_' | 'jrel_'; // rel_ for zip_based, jrel_ for transformed
}

interface JettisonData {
  release?: {
    release_id: number;
    release_date: string | null;
    sheet_link: string | null;
    total_rows: number;
    qty_children: number;
  };
  subsheet?: {
    subsheet_id: number;
    subsheet_name: string | null;
    total_rows: number;
    qty_children: number;
  };
  subpart?: {
    subpart_id: number;
    payout_note: string | null;
    subpart_name: string | null;
    total_rows: number;
  };
}

interface Props {
  config: JettisonConfig;
  onFilterChange?: (filterType: 'release' | 'subsheet' | 'subpart' | null, filterId: number | null) => void;
}

export default function LeadSmartJettisonTable({ config, onFilterChange }: Props) {
  const supabase = createClientComponentClient();
  
  const [jettisonData, setJettisonData] = useState<JettisonData>({});
  const [activeFilter, setActiveFilter] = useState<{
    type: 'release' | 'subsheet' | 'subpart' | null;
    id: number | null;
  }>({ type: null, id: null });
  
  // Listen for filter events from selector popup
  useEffect(() => {
    const handleFilterFromSelector = async (event: CustomEvent) => {
      const { type, id } = event.detail;
      
      try {
        // Fetch data for the selected entity and its children
        const newData: JettisonData = {};
        
        if (type === 'release') {
          // Fetch release data
          const { data: releaseData } = await supabase
            .from('leadsmart_file_releases')
            .select('*')
            .eq('release_id', id)
            .single();
          
          if (releaseData) {
            // Get total rows count
            const relColumn = config.relColumnPrefix + 'release_id';
            const { count } = await supabase
              .from(config.targetTable)
              .select('*', { count: 'exact', head: true })
              .eq(relColumn, id);
            
            // Get children count
            const { count: childrenCount } = await supabase
              .from('leadsmart_subsheets')
              .select('*', { count: 'exact', head: true })
              .eq('rel_release_id', id);
            
            newData.release = {
              release_id: releaseData.release_id,
              release_date: releaseData.release_date,
              sheet_link: releaseData.sheet_link,
              total_rows: count || 0,
              qty_children: childrenCount || 0
            };
            
            // Auto-populate first child subsheet
            const { data: firstSubsheet } = await supabase
              .from('leadsmart_subsheets')
              .select('*')
              .eq('rel_release_id', id)
              .order('subsheet_id', { ascending: true })
              .limit(1)
              .maybeSingle();
            
            if (firstSubsheet) {
              const subsheetRelColumn = config.relColumnPrefix + 'subsheet_id';
              const { count: subsheetRowCount } = await supabase
                .from(config.targetTable)
                .select('*', { count: 'exact', head: true })
                .eq(subsheetRelColumn, firstSubsheet.subsheet_id);
              
              const { count: subsheetChildrenCount } = await supabase
                .from('leadsmart_subparts')
                .select('*', { count: 'exact', head: true })
                .eq('rel_subsheet_id', firstSubsheet.subsheet_id);
              
              newData.subsheet = {
                subsheet_id: firstSubsheet.subsheet_id,
                subsheet_name: firstSubsheet.subsheet_name,
                total_rows: subsheetRowCount || 0,
                qty_children: subsheetChildrenCount || 0
              };
              
              // Auto-populate first child subpart
              const { data: firstSubpart } = await supabase
                .from('leadsmart_subparts')
                .select('*')
                .eq('rel_subsheet_id', firstSubsheet.subsheet_id)
                .order('subpart_id', { ascending: true })
                .limit(1)
                .maybeSingle();
              
              if (firstSubpart) {
                const subpartRelColumn = config.relColumnPrefix + 'subpart_id';
                const { count: subpartRowCount } = await supabase
                  .from(config.targetTable)
                  .select('*', { count: 'exact', head: true })
                  .eq(subpartRelColumn, firstSubpart.subpart_id);
                
                newData.subpart = {
                  subpart_id: firstSubpart.subpart_id,
                  payout_note: firstSubpart.payout_note,
                  subpart_name: firstSubpart.subpart_name,
                  total_rows: subpartRowCount || 0
                };
              }
            }
          }
        } else if (type === 'subsheet') {
          // Fetch subsheet data and parent release
          const { data: subsheetData } = await supabase
            .from('leadsmart_subsheets')
            .select('*')
            .eq('subsheet_id', id)
            .single();
          
          if (subsheetData) {
            // Get parent release
            if (subsheetData.rel_release_id) {
              const { data: releaseData } = await supabase
                .from('leadsmart_file_releases')
                .select('*')
                .eq('release_id', subsheetData.rel_release_id)
                .single();
              
              if (releaseData) {
                const relColumn = config.relColumnPrefix + 'release_id';
                const { count } = await supabase
                  .from(config.targetTable)
                  .select('*', { count: 'exact', head: true })
                  .eq(relColumn, releaseData.release_id);
                
                const { count: childrenCount } = await supabase
                  .from('leadsmart_subsheets')
                  .select('*', { count: 'exact', head: true })
                  .eq('rel_release_id', releaseData.release_id);
                
                newData.release = {
                  release_id: releaseData.release_id,
                  release_date: releaseData.release_date,
                  sheet_link: releaseData.sheet_link,
                  total_rows: count || 0,
                  qty_children: childrenCount || 0
                };
              }
            }
            
            // Get subsheet data
            const subsheetRelColumn = config.relColumnPrefix + 'subsheet_id';
            const { count: subsheetRowCount } = await supabase
              .from(config.targetTable)
              .select('*', { count: 'exact', head: true })
              .eq(subsheetRelColumn, id);
            
            const { count: subsheetChildrenCount } = await supabase
              .from('leadsmart_subparts')
              .select('*', { count: 'exact', head: true })
              .eq('rel_subsheet_id', id);
            
            newData.subsheet = {
              subsheet_id: subsheetData.subsheet_id,
              subsheet_name: subsheetData.subsheet_name,
              total_rows: subsheetRowCount || 0,
              qty_children: subsheetChildrenCount || 0
            };
            
            // Auto-populate first child subpart
            const { data: firstSubpart } = await supabase
              .from('leadsmart_subparts')
              .select('*')
              .eq('rel_subsheet_id', id)
              .order('subpart_id', { ascending: true })
              .limit(1)
              .maybeSingle();
            
            if (firstSubpart) {
              const subpartRelColumn = config.relColumnPrefix + 'subpart_id';
              const { count: subpartRowCount } = await supabase
                .from(config.targetTable)
                .select('*', { count: 'exact', head: true })
                .eq(subpartRelColumn, firstSubpart.subpart_id);
              
              newData.subpart = {
                subpart_id: firstSubpart.subpart_id,
                payout_note: firstSubpart.payout_note,
                subpart_name: firstSubpart.subpart_name,
                total_rows: subpartRowCount || 0
              };
            }
          }
        } else if (type === 'subpart') {
          // Fetch subpart data and parents
          const { data: subpartData } = await supabase
            .from('leadsmart_subparts')
            .select('*')
            .eq('subpart_id', id)
            .single();
          
          if (subpartData) {
            // Get parent subsheet
            if (subpartData.rel_subsheet_id) {
              const { data: subsheetData } = await supabase
                .from('leadsmart_subsheets')
                .select('*')
                .eq('subsheet_id', subpartData.rel_subsheet_id)
                .single();
              
              if (subsheetData) {
                const subsheetRelColumn = config.relColumnPrefix + 'subsheet_id';
                const { count: subsheetRowCount } = await supabase
                  .from(config.targetTable)
                  .select('*', { count: 'exact', head: true })
                  .eq(subsheetRelColumn, subsheetData.subsheet_id);
                
                const { count: subsheetChildrenCount } = await supabase
                  .from('leadsmart_subparts')
                  .select('*', { count: 'exact', head: true })
                  .eq('rel_subsheet_id', subsheetData.subsheet_id);
                
                newData.subsheet = {
                  subsheet_id: subsheetData.subsheet_id,
                  subsheet_name: subsheetData.subsheet_name,
                  total_rows: subsheetRowCount || 0,
                  qty_children: subsheetChildrenCount || 0
                };
                
                // Get grandparent release
                if (subsheetData.rel_release_id) {
                  const { data: releaseData } = await supabase
                    .from('leadsmart_file_releases')
                    .select('*')
                    .eq('release_id', subsheetData.rel_release_id)
                    .single();
                  
                  if (releaseData) {
                    const relColumn = config.relColumnPrefix + 'release_id';
                    const { count } = await supabase
                      .from(config.targetTable)
                      .select('*', { count: 'exact', head: true })
                      .eq(relColumn, releaseData.release_id);
                    
                    const { count: childrenCount } = await supabase
                      .from('leadsmart_subsheets')
                      .select('*', { count: 'exact', head: true })
                      .eq('rel_release_id', releaseData.release_id);
                    
                    newData.release = {
                      release_id: releaseData.release_id,
                      release_date: releaseData.release_date,
                      sheet_link: releaseData.sheet_link,
                      total_rows: count || 0,
                      qty_children: childrenCount || 0
                    };
                  }
                }
              }
            }
            
            // Get subpart data
            const subpartRelColumn = config.relColumnPrefix + 'subpart_id';
            const { count: subpartRowCount } = await supabase
              .from(config.targetTable)
              .select('*', { count: 'exact', head: true })
              .eq(subpartRelColumn, id);
            
            newData.subpart = {
              subpart_id: subpartData.subpart_id,
              payout_note: subpartData.payout_note,
              subpart_name: subpartData.subpart_name,
              total_rows: subpartRowCount || 0
            };
          }
        }
        
        setJettisonData(newData);
        setActiveFilter({ type, id });
        
        // Notify parent component
        if (onFilterChange) {
          onFilterChange(type, id);
        }
        
      } catch (error) {
        console.error('Error loading jettison data:', error);
      }
    };
    
    window.addEventListener('jettison-filter-apply' as any, handleFilterFromSelector);
    return () => window.removeEventListener('jettison-filter-apply' as any, handleFilterFromSelector);
  }, [config, supabase, onFilterChange]);
  
  const handleFilterClick = (type: 'release' | 'subsheet' | 'subpart', id: number) => {
    setActiveFilter({ type, id });
    if (onFilterChange) {
      onFilterChange(type, id);
    }
  };
  
  const isActiveFilter = (type: 'release' | 'subsheet' | 'subpart', id: number) => {
    return activeFilter.type === type && activeFilter.id === id;
  };
  
  return (
    <div>
      <div className="font-bold text-black mb-3" style={{ fontSize: '16px' }}>
        jettison_table
      </div>
      
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
        <thead>
          {/* Row 1: Table names */}
          <tr>
            {/* Separator */}
            <th style={{ width: '4px', backgroundColor: 'black', padding: 0 }} rowSpan={2}></th>
            
            {/* Releases section */}
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>leadsmart_releases</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>leadsmart_releases</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>leadsmart_releases</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>total</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>qty</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>filter</th>
            
            {/* Separator */}
            <th style={{ width: '4px', backgroundColor: 'black', padding: 0 }} rowSpan={2}></th>
            
            {/* Subsheets section */}
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>leadsmart_subsheets</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>leadsmart_subsheets</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>total</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>qty</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>filter</th>
            
            {/* Separator */}
            <th style={{ width: '4px', backgroundColor: 'black', padding: 0 }} rowSpan={2}></th>
            
            {/* Subparts section */}
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>leadsmart_subparts</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>leadsmart_subparts</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>leadsmart_subparts</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>total</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>filter</th>
            
            {/* Separator */}
            <th style={{ width: '4px', backgroundColor: 'black', padding: 0 }} rowSpan={2}></th>
          </tr>
          
          {/* Row 2: Column names */}
          <tr>
            {/* Releases section */}
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>release_id</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>release_date</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>sheet_link</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>rows</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>children</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>button</th>
            
            {/* Subsheets section */}
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>subsheet_id</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>subsheet_name</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>rows</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>children</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>button</th>
            
            {/* Subparts section */}
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>subpart_id</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>payout_note</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>subpart_name</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>rows</th>
            <th style={{ border: '1px solid gray', padding: '8px', fontWeight: 'bold', textTransform: 'lowercase' }}>button</th>
          </tr>
        </thead>
        
        <tbody>
          <tr>
            {/* Separator */}
            <td style={{ width: '4px', backgroundColor: 'black', padding: 0 }}></td>
            
            {/* Releases section */}
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px'
              }}
            >
              {jettisonData.release?.release_id || '-'}
            </td>
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px'
              }}
            >
              {jettisonData.release?.release_date || '-'}
            </td>
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {jettisonData.release?.sheet_link || '-'}
            </td>
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px',
                fontWeight: 'bold',
                color: '#2563eb'
              }}
            >
              {jettisonData.release ? jettisonData.release.total_rows.toLocaleString() : '-'}
            </td>
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px',
                fontWeight: 'bold',
                color: '#059669'
              }}
            >
              {jettisonData.release ? jettisonData.release.qty_children.toLocaleString() : '-'}
            </td>
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px'
              }}
            >
              {jettisonData.release ? (
                <div className="flex items-center" style={{ gap: 0 }}>
                  <input
                    type="checkbox"
                    checked={isActiveFilter('release', jettisonData.release.release_id)}
                    onChange={() => handleFilterClick('release', jettisonData.release!.release_id)}
                    className="cursor-pointer"
                    style={{ width: '20px', height: '32px', margin: 0, borderRadius: 0 }}
                  />
                  <button
                    onClick={() => handleFilterClick('release', jettisonData.release!.release_id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 font-medium transition-colors"
                    style={{ height: '32px', borderRadius: 0 }}
                  >
                    filter
                  </button>
                </div>
              ) : '-'}
            </td>
            
            {/* Separator */}
            <td style={{ width: '4px', backgroundColor: 'black', padding: 0 }}></td>
            
            {/* Subsheets section */}
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px'
              }}
            >
              {jettisonData.subsheet?.subsheet_id || '-'}
            </td>
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px'
              }}
            >
              {jettisonData.subsheet?.subsheet_name || '-'}
            </td>
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px',
                fontWeight: 'bold',
                color: '#2563eb'
              }}
            >
              {jettisonData.subsheet ? jettisonData.subsheet.total_rows.toLocaleString() : '-'}
            </td>
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px',
                fontWeight: 'bold',
                color: '#059669'
              }}
            >
              {jettisonData.subsheet ? jettisonData.subsheet.qty_children.toLocaleString() : '-'}
            </td>
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px'
              }}
            >
              {jettisonData.subsheet ? (
                <div className="flex items-center" style={{ gap: 0 }}>
                  <input
                    type="checkbox"
                    checked={isActiveFilter('subsheet', jettisonData.subsheet.subsheet_id)}
                    onChange={() => handleFilterClick('subsheet', jettisonData.subsheet!.subsheet_id)}
                    className="cursor-pointer"
                    style={{ width: '20px', height: '32px', margin: 0, borderRadius: 0 }}
                  />
                  <button
                    onClick={() => handleFilterClick('subsheet', jettisonData.subsheet!.subsheet_id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 font-medium transition-colors"
                    style={{ height: '32px', borderRadius: 0 }}
                  >
                    filter
                  </button>
                </div>
              ) : '-'}
            </td>
            
            {/* Separator */}
            <td style={{ width: '4px', backgroundColor: 'black', padding: 0 }}></td>
            
            {/* Subparts section */}
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px'
              }}
            >
              {jettisonData.subpart?.subpart_id || '-'}
            </td>
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px'
              }}
            >
              {jettisonData.subpart?.payout_note || '-'}
            </td>
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px'
              }}
            >
              {jettisonData.subpart?.subpart_name || '-'}
            </td>
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px',
                fontWeight: 'bold',
                color: '#2563eb'
              }}
            >
              {jettisonData.subpart ? jettisonData.subpart.total_rows.toLocaleString() : '-'}
            </td>
            <td 
              style={{ 
                border: '1px solid gray', 
                padding: '8px'
              }}
            >
              {jettisonData.subpart ? (
                <div className="flex items-center" style={{ gap: 0 }}>
                  <input
                    type="checkbox"
                    checked={isActiveFilter('subpart', jettisonData.subpart.subpart_id)}
                    onChange={() => handleFilterClick('subpart', jettisonData.subpart!.subpart_id)}
                    className="cursor-pointer"
                    style={{ width: '20px', height: '32px', margin: 0, borderRadius: 0 }}
                  />
                  <button
                    onClick={() => handleFilterClick('subpart', jettisonData.subpart!.subpart_id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 font-medium transition-colors"
                    style={{ height: '32px', borderRadius: 0 }}
                  >
                    filter
                  </button>
                </div>
              ) : '-'}
            </td>
            
            {/* Separator */}
            <td style={{ width: '4px', backgroundColor: 'black', padding: 0 }}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

