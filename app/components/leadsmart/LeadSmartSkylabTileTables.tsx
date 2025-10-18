'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface FileRelease {
  release_id: number;
  release_date: string | null;
  zip_based_count?: number;
  transformed_count?: number;
  children_count?: number;
}

interface Subsheet {
  subsheet_id: number;
  rel_release_id: number | null;
  subsheet_name: string | null;
  zip_based_count?: number;
  transformed_count?: number;
  children_count?: number;
}

interface Subpart {
  subpart_id: number;
  rel_subsheet_id: number | null;
  payout_note: string | null;
  zip_based_count?: number;
  transformed_count?: number;
}

interface Props {
  pageType: 'tank' | 'morph';
  onFilterApply: (type: 'release' | 'subsheet' | 'subpart' | null, id: number | null) => void;
  currentFilter?: {
    type: 'release' | 'subsheet' | 'subpart' | null;
    id: number | null;
  };
}

export default function LeadSmartSkylabTileTables({ 
  pageType, 
  onFilterApply,
  currentFilter 
}: Props) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  // Data states
  const [releases, setReleases] = useState<FileRelease[]>([]);
  const [subsheets, setSubsheets] = useState<Subsheet[]>([]);
  const [subparts, setSubparts] = useState<Subpart[]>([]);
  
  // Selection states for view children
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [selectedSubsheetId, setSelectedSubsheetId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);

  // Fetch releases
  const fetchReleases = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('leadsmart_file_releases')
        .select('*')
        .order('release_id', { ascending: false });
      
      if (error) throw error;
      
      // Fetch counts for each release
      const releasesWithCounts = await Promise.all((data || []).map(async (release) => {
        const { count: zipBasedCount } = await supabase
          .from('leadsmart_zip_based_data')
          .select('*', { count: 'exact', head: true })
          .eq('rel_release_id', release.release_id);
        
        const { count: transformedCount } = await supabase
          .from('leadsmart_transformed')
          .select('*', { count: 'exact', head: true })
          .eq('jrel_release_id', release.release_id);
        
        const { count: childrenCount } = await supabase
          .from('leadsmart_subsheets')
          .select('*', { count: 'exact', head: true })
          .eq('rel_release_id', release.release_id);
        
        return {
          ...release,
          zip_based_count: zipBasedCount || 0,
          transformed_count: transformedCount || 0,
          children_count: childrenCount || 0
        };
      }));
      
      setReleases(releasesWithCounts);
    } catch (error) {
      console.error('Error fetching releases:', error);
    }
  }, [user, supabase]);

  // Fetch subsheets
  const fetchSubsheets = useCallback(async () => {
    if (!selectedReleaseId) {
      setSubsheets([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('leadsmart_subsheets')
        .select('*')
        .eq('rel_release_id', selectedReleaseId)
        .order('subsheet_id', { ascending: false });
      
      if (error) throw error;
      
      const subsheetsWithCounts = await Promise.all((data || []).map(async (subsheet) => {
        const { count: zipBasedCount } = await supabase
          .from('leadsmart_zip_based_data')
          .select('*', { count: 'exact', head: true })
          .eq('rel_subsheet_id', subsheet.subsheet_id);
        
        const { count: transformedCount } = await supabase
          .from('leadsmart_transformed')
          .select('*', { count: 'exact', head: true })
          .eq('jrel_subsheet_id', subsheet.subsheet_id);
        
        const { count: childrenCount } = await supabase
          .from('leadsmart_subparts')
          .select('*', { count: 'exact', head: true })
          .eq('rel_subsheet_id', subsheet.subsheet_id);
        
        return {
          ...subsheet,
          zip_based_count: zipBasedCount || 0,
          transformed_count: transformedCount || 0,
          children_count: childrenCount || 0
        };
      }));
      
      setSubsheets(subsheetsWithCounts);
    } catch (error) {
      console.error('Error fetching subsheets:', error);
    }
  }, [selectedReleaseId, supabase]);

  // Fetch subparts
  const fetchSubparts = useCallback(async () => {
    if (!selectedSubsheetId) {
      setSubparts([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('leadsmart_subparts')
        .select('*')
        .eq('rel_subsheet_id', selectedSubsheetId)
        .order('subpart_id', { ascending: false });
      
      if (error) throw error;
      
      const subpartsWithCounts = await Promise.all((data || []).map(async (subpart) => {
        const { count: zipBasedCount } = await supabase
          .from('leadsmart_zip_based_data')
          .select('*', { count: 'exact', head: true })
          .eq('rel_subpart_id', subpart.subpart_id);
        
        const { count: transformedCount } = await supabase
          .from('leadsmart_transformed')
          .select('*', { count: 'exact', head: true })
          .eq('jrel_subpart_id', subpart.subpart_id);
        
        return {
          ...subpart,
          zip_based_count: zipBasedCount || 0,
          transformed_count: transformedCount || 0
        };
      }));
      
      setSubparts(subpartsWithCounts);
    } catch (error) {
      console.error('Error fetching subparts:', error);
    }
  }, [selectedSubsheetId, supabase]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  useEffect(() => {
    fetchSubsheets();
  }, [fetchSubsheets]);

  useEffect(() => {
    fetchSubparts();
  }, [fetchSubparts]);

  const handleViewChildren = (
    type: 'release' | 'subsheet' | 'subpart',
    id: number
  ) => {
    if (type === 'release') {
      if (selectedReleaseId === id) {
        setSelectedReleaseId(null);
        setSelectedSubsheetId(null);
      } else {
        setSelectedReleaseId(id);
        setSelectedSubsheetId(null);
      }
    } else if (type === 'subsheet') {
      if (selectedSubsheetId === id) {
        setSelectedSubsheetId(null);
      } else {
        setSelectedSubsheetId(id);
      }
    }
  };

  const handleSelectX = (
    type: 'release' | 'subsheet' | 'subpart',
    id: number
  ) => {
    // Check if clicking the same filter to deselect
    if (currentFilter?.type === type && currentFilter?.id === id) {
      onFilterApply(null, null);
    } else {
      onFilterApply(type, id);
    }
  };

  return (
    <div className="p-4 bg-white border border-gray-300 rounded">
      {/* Single flex container for all labels and tiles */}
      <div className="flex flex-wrap gap-2 items-start">
        
        {/* ========== RELEASES SECTION ========== */}
        {/* Release Label */}
        <div 
          className="border-2 border-gray-600 bg-gray-100 font-bold text-gray-800 flex items-center"
          style={{ 
            padding: '8px 12px',
            fontSize: '14px',
            minHeight: '40px',
            whiteSpace: 'nowrap'
          }}
        >
          leadsmart_file_releases
        </div>
        
        {/* Release Tiles */}
        {releases.map((release) => {
          const isSelectX = currentFilter?.type === 'release' && currentFilter?.id === release.release_id;
          const isViewChildren = selectedReleaseId === release.release_id;
          
          return (
            <table 
              key={release.release_id}
              className="border border-gray-300"
              style={{ 
                fontSize: '16px',
                borderCollapse: 'collapse'
              }}
            >
              <tbody>
                <tr>
                  <td
                    onClick={() => handleSelectX('release', release.release_id)}
                    className={`cursor-pointer text-center transition-colors ${
                      isSelectX 
                        ? 'bg-blue-600 text-white font-bold' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '40px' }}
                    title="Select X - Filter main table"
                  >
                    sx
                  </td>
                  
                  <td
                    onClick={() => handleViewChildren('release', release.release_id)}
                    className={`cursor-pointer text-center transition-colors ${
                      isViewChildren 
                        ? 'bg-green-600 text-white font-bold' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                    title="View Children"
                  >
                    vc - {release.children_count || 0}
                  </td>
                  
                  <td
                    className="text-gray-800 font-bold"
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '100px' }}
                  >
                    {release.release_date || 'No date'}
                  </td>
                  
                  <td
                    className="text-center text-gray-700"
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                    title="Related rows in leadsmart_zip_based_data"
                  >
                    {release.zip_based_count?.toLocaleString()}
                  </td>
                  
                  <td
                    className="text-center text-gray-700"
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                    title="Related rows in leadsmart_transformed"
                  >
                    {release.transformed_count?.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          );
        })}
        
        {/* ========== SUBSHEETS SECTION ========== */}
        {selectedReleaseId && (
          <>
            {/* Subsheet Label */}
            <div 
              className="border-2 border-gray-600 bg-gray-100 font-bold text-gray-800 flex items-center"
              style={{ 
                padding: '8px 12px',
                fontSize: '14px',
                minHeight: '40px',
                whiteSpace: 'nowrap'
              }}
            >
              leadsmart_subsheets
            </div>
            
            {/* Subsheet Tiles */}
            {subsheets.map((subsheet) => {
              const isSelectX = currentFilter?.type === 'subsheet' && currentFilter?.id === subsheet.subsheet_id;
              const isViewChildren = selectedSubsheetId === subsheet.subsheet_id;
              
              return (
                <table 
                  key={subsheet.subsheet_id}
                  className="border border-gray-300"
                  style={{ 
                    fontSize: '16px',
                    borderCollapse: 'collapse'
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        onClick={() => handleSelectX('subsheet', subsheet.subsheet_id)}
                        className={`cursor-pointer text-center transition-colors ${
                          isSelectX 
                            ? 'bg-blue-600 text-white font-bold' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '40px' }}
                        title="Select X - Filter main table"
                      >
                        sx
                      </td>
                      
                      <td
                        onClick={() => handleViewChildren('subsheet', subsheet.subsheet_id)}
                        className={`cursor-pointer text-center transition-colors ${
                          isViewChildren 
                            ? 'bg-green-600 text-white font-bold' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                        title="View Children"
                      >
                        vc - {subsheet.children_count || 0}
                      </td>
                      
                      <td
                        className="text-gray-800 font-bold"
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '120px' }}
                      >
                        {subsheet.subsheet_name || 'No name'}
                      </td>
                      
                      <td
                        className="text-center text-gray-700"
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                        title="Related rows in leadsmart_zip_based_data"
                      >
                        {subsheet.zip_based_count?.toLocaleString()}
                      </td>
                      
                      <td
                        className="text-center text-gray-700"
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                        title="Related rows in leadsmart_transformed"
                      >
                        {subsheet.transformed_count?.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              );
            })}
          </>
        )}
        
        {/* ========== SUBPARTS SECTION ========== */}
        {selectedSubsheetId && (
          <>
            {/* Subpart Label */}
            <div 
              className="border-2 border-gray-600 bg-gray-100 font-bold text-gray-800 flex items-center"
              style={{ 
                padding: '8px 12px',
                fontSize: '14px',
                minHeight: '40px',
                whiteSpace: 'nowrap'
              }}
            >
              leadsmart_subparts
            </div>
            
            {/* Subpart Tiles (no VC column) */}
            {subparts.map((subpart) => {
              const isSelectX = currentFilter?.type === 'subpart' && currentFilter?.id === subpart.subpart_id;
              
              return (
                <table 
                  key={subpart.subpart_id}
                  className="border border-gray-300"
                  style={{ 
                    fontSize: '16px',
                    borderCollapse: 'collapse'
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        onClick={() => handleSelectX('subpart', subpart.subpart_id)}
                        className={`cursor-pointer text-center transition-colors ${
                          isSelectX 
                            ? 'bg-blue-600 text-white font-bold' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '40px' }}
                        title="Select X - Filter main table"
                      >
                        sx
                      </td>
                      
                      <td
                        className="text-gray-800 font-bold"
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '120px' }}
                      >
                        {subpart.payout_note || 'No note'}
                      </td>
                      
                      <td
                        className="text-center text-gray-700"
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                        title="Related rows in leadsmart_zip_based_data"
                      >
                        {subpart.zip_based_count?.toLocaleString()}
                      </td>
                      
                      <td
                        className="text-center text-gray-700"
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                        title="Related rows in leadsmart_transformed"
                      >
                        {subpart.transformed_count?.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              );
            })}
          </>
        )}
        
      </div>
      
      {/* Clear filter button */}
      {currentFilter?.type && currentFilter?.id && (
        <div className="mt-4">
          <button
            onClick={() => onFilterApply(null, null)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );
}

