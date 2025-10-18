'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface Subpart {
  subpart_id: number;
  rel_subsheet_id: number | null;
  payout_note: string | null;
  zip_based_count?: number;
  transformed_count?: number;
}

interface Props {
  selectedSubsheetId: number | null;
  onSubpartSelect: (subpartId: number | null) => void;
  selectXType: 'release' | 'subsheet' | 'subpart' | null;
  selectXId: number | null;
  onSelectX: (type: 'release' | 'subsheet' | 'subpart', id: number) => void;
}

export default function TileSubpartsView({ selectedSubsheetId, onSubpartSelect, selectXType, selectXId, onSelectX }: Props) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [subparts, setSubparts] = useState<Subpart[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubparts = useCallback(async () => {
    if (!selectedSubsheetId) {
      setSubparts([]);
      onSubpartSelect(null);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leadsmart_subparts')
        .select('*')
        .eq('rel_subsheet_id', selectedSubsheetId)
        .order('subpart_id', { ascending: false });
      
      if (error) throw error;
      
      // Fetch counts for each subpart from both tables
      const subpartsWithCounts = await Promise.all((data || []).map(async (subpart) => {
        // Count from leadsmart_zip_based_data
        const { count: zipBasedCount } = await supabase
          .from('leadsmart_zip_based_data')
          .select('*', { count: 'exact', head: true })
          .eq('rel_subpart_id', subpart.subpart_id);
        
        // Count from leadsmart_transformed
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
    } finally {
      setLoading(false);
    }
  }, [selectedSubsheetId, supabase, onSubpartSelect]);

  useEffect(() => {
    fetchSubparts();
  }, [fetchSubparts]);

  if (!selectedSubsheetId) {
    return (
      <div className="p-4">
        <div className="font-bold text-gray-700 mb-3">leadsmart_subparts</div>
        <div className="text-gray-400 text-sm italic">Select a subsheet to view subparts</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="font-bold text-gray-700 mb-3">leadsmart_subparts</div>
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="font-bold text-gray-700 mb-3">leadsmart_subparts</div>
      
      {subparts.length === 0 ? (
        <div className="text-gray-400 text-sm italic">No subparts found</div>
      ) : (
        /* Tile Grid - wraps left to right */
        <div className="flex flex-wrap gap-2">
          {subparts.map((subpart) => {
            const isSelectX = selectXType === 'subpart' && selectXId === subpart.subpart_id;
            
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
                    {/* SX Button */}
                    <td
                      onClick={() => onSelectX('subpart', subpart.subpart_id)}
                      className={`cursor-pointer font-bold text-center transition-colors ${
                        isSelectX 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      style={{ padding: '5px', border: '1px solid #ccc', minWidth: '40px' }}
                      title="Select X"
                    >
                      sx
                    </td>
                    
                    {/* Payout Note */}
                    <td
                      className="text-gray-800"
                      style={{ padding: '5px', border: '1px solid #ccc', minWidth: '120px' }}
                    >
                      {subpart.payout_note || 'No note'}
                    </td>
                    
                    {/* Zip Based Count */}
                    <td
                      className="text-center text-gray-700"
                      style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                      title="Related rows in leadsmart_zip_based_data"
                    >
                      {subpart.zip_based_count?.toLocaleString()}
                    </td>
                    
                    {/* Transformed Count */}
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
        </div>
      )}
    </div>
  );
}

