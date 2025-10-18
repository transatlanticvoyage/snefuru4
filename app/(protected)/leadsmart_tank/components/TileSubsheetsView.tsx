'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface Subsheet {
  subsheet_id: number;
  rel_release_id: number | null;
  subsheet_name: string | null;
  zip_based_count?: number;
  transformed_count?: number;
  children_count?: number;
}

interface Props {
  selectedReleaseId: number | null;
  onSubsheetSelect: (subsheetId: number | null) => void;
  selectXType: 'release' | 'subsheet' | 'subpart' | null;
  selectXId: number | null;
  onSelectX: (type: 'release' | 'subsheet' | 'subpart', id: number) => void;
}

export default function TileSubsheetsView({ selectedReleaseId, onSubsheetSelect, selectXType, selectXId, onSelectX }: Props) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [subsheets, setSubsheets] = useState<Subsheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubsheetId, setSelectedSubsheetId] = useState<number | null>(null);

  const fetchSubsheets = useCallback(async () => {
    if (!selectedReleaseId) {
      setSubsheets([]);
      setSelectedSubsheetId(null);
      onSubsheetSelect(null);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leadsmart_subsheets')
        .select('*')
        .eq('rel_release_id', selectedReleaseId)
        .order('subsheet_id', { ascending: false });
      
      if (error) throw error;
      
      // Fetch counts for each subsheet from both tables
      const subsheetsWithCounts = await Promise.all((data || []).map(async (subsheet) => {
        // Count from leadsmart_zip_based_data
        const { count: zipBasedCount } = await supabase
          .from('leadsmart_zip_based_data')
          .select('*', { count: 'exact', head: true })
          .eq('rel_subsheet_id', subsheet.subsheet_id);
        
        // Count from leadsmart_transformed
        const { count: transformedCount } = await supabase
          .from('leadsmart_transformed')
          .select('*', { count: 'exact', head: true })
          .eq('jrel_subsheet_id', subsheet.subsheet_id);
        
        // Count children (subparts)
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
    } finally {
      setLoading(false);
    }
  }, [selectedReleaseId, supabase, onSubsheetSelect]);

  useEffect(() => {
    fetchSubsheets();
  }, [fetchSubsheets]);

  const handleViewChildren = (subsheetId: number) => {
    if (selectedSubsheetId === subsheetId) {
      setSelectedSubsheetId(null);
      onSubsheetSelect(null);
    } else {
      setSelectedSubsheetId(subsheetId);
      onSubsheetSelect(subsheetId);
    }
  };

  if (!selectedReleaseId) {
    return (
      <div className="p-4">
        <div className="font-bold text-gray-700 mb-3">leadsmart_subsheets</div>
        <div className="text-gray-400 text-sm italic">Select a release to view subsheets</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="font-bold text-gray-700 mb-3">leadsmart_subsheets</div>
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="font-bold text-gray-700 mb-3">leadsmart_subsheets</div>
      
      {subsheets.length === 0 ? (
        <div className="text-gray-400 text-sm italic">No subsheets found</div>
      ) : (
        /* Tile Grid - wraps left to right */
        <div className="flex flex-wrap gap-2">
          {subsheets.map((subsheet) => {
            const isSelectX = selectXType === 'subsheet' && selectXId === subsheet.subsheet_id;
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
                    {/* SX Button */}
                    <td
                      onClick={() => onSelectX('subsheet', subsheet.subsheet_id)}
                      className={`cursor-pointer text-center transition-colors ${
                        isSelectX 
                          ? 'bg-blue-600 text-white font-bold' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      style={{ padding: '5px', border: '1px solid #ccc', minWidth: '40px' }}
                      title="Select X"
                    >
                      sx
                    </td>
                    
                    {/* VC Button */}
                    <td
                      onClick={() => handleViewChildren(subsheet.subsheet_id)}
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
                    
                    {/* Subsheet Name */}
                    <td
                      className="text-gray-800 font-bold"
                      style={{ padding: '5px', border: '1px solid #ccc', minWidth: '120px' }}
                    >
                      {subsheet.subsheet_name || 'No name'}
                    </td>
                    
                    {/* Zip Based Count */}
                    <td
                      className="text-center text-gray-700"
                      style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                      title="Related rows in leadsmart_zip_based_data"
                    >
                      {subsheet.zip_based_count?.toLocaleString()}
                    </td>
                    
                    {/* Transformed Count */}
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
        </div>
      )}
    </div>
  );
}

