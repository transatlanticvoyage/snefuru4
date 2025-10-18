'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface Subpart {
  subpart_id: number;
  rel_subsheet_id: number | null;
  subpart_name: string | null;
  payout_note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  result_count?: number;
}

interface Props {
  selectedSubsheetId: number | null;
  onSubpartSelect: (subpartId: number | null) => void;
  selectXType: 'release' | 'subsheet' | 'subpart' | null;
  selectXId: number | null;
  onSelectX: (type: 'release' | 'subsheet' | 'subpart', id: number) => void;
}

export default function SelectorSubpartsGrid({ selectedSubsheetId, onSubpartSelect, selectXType, selectXId, onSelectX }: Props) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [subparts, setSubparts] = useState<Subpart[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubpartId, setSelectedSubpartId] = useState<number | null>(null);

  const fetchSubparts = useCallback(async () => {
    if (!selectedSubsheetId) {
      setSubparts([]);
      setSelectedSubpartId(null);
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
      
      // Fetch counts for each subpart
      const subpartsWithCounts = await Promise.all((data || []).map(async (subpart) => {
        const { count } = await supabase
          .from('leadsmart_zip_based_data')
          .select('*', { count: 'exact', head: true })
          .eq('rel_subpart_id', subpart.subpart_id);
        
        return {
          ...subpart,
          result_count: count || 0
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

  const handleCheckboxClick = (subpartId: number) => {
    setSelectedSubpartId(subpartId);
    onSubpartSelect(subpartId);
  };

  return (
    <div className="flex flex-col">
      <hr className="border-gray-300" />
      
      <div className="p-4 border-b bg-gray-50">
        <div className="font-bold text-gray-800 mb-3" style={{ fontSize: '16px' }}>
          leadsmart_subparts
        </div>
      </div>
      
      {selectedSubsheetId && (
        <div className="overflow-auto p-4">
          {loading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-200 sticky top-0 z-10">
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase', width: '100px' }}>
                    # results
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', width: '150px' }}>
                    select_x
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', width: '150px' }}>
                    view children
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                    subpart_id
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                    rel_subsheet_id
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                    subpart_name
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                    payout_note
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                    created_at
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                    updated_at
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                    created_by
                  </th>
                </tr>
              </thead>
              <tbody>
                {subparts.map((subpart) => {
                  const isSelectedX = selectXType === 'subpart' && selectXId === subpart.subpart_id;
                  
                  const rowRef = (el: HTMLTableRowElement | null) => {
                    if (el) {
                      el.style.setProperty('background-color', isSelectedX ? '#d1fae5' : 'white', 'important');
                    }
                  };
                  
                  return (
                    <tr 
                      key={subpart.subpart_id}
                      ref={rowRef}
                      onMouseEnter={(e) => {
                        if (!isSelectedX) {
                          e.currentTarget.style.setProperty('background-color', '#f9fafb', 'important');
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelectedX) {
                          e.currentTarget.style.setProperty('background-color', 'white', 'important');
                        }
                      }}
                    >
                      <td className="border border-gray-300 px-2 py-1 text-center font-bold text-blue-600">
                        {subpart.result_count || 0}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <div className="flex items-center" style={{ gap: 0 }}>
                          <input
                            type="checkbox"
                            checked={isSelectedX}
                            onChange={() => onSelectX('subpart', subpart.subpart_id)}
                            className="cursor-pointer"
                            style={{ width: '20px', height: '32px', margin: 0, borderRadius: 0 }}
                          />
                          <button
                            onClick={() => onSelectX('subpart', subpart.subpart_id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 font-medium transition-colors"
                            style={{ height: '32px', borderRadius: 0 }}
                          >
                            select_x
                          </button>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <div className="flex items-center" style={{ gap: 0 }}>
                          <input
                            type="checkbox"
                            disabled
                            className="cursor-not-allowed"
                            style={{ width: '20px', height: '32px', margin: 0, borderRadius: 0, opacity: 0.5 }}
                          />
                          <button
                            disabled
                            className="bg-gray-400 text-gray-200 px-3 font-medium cursor-not-allowed"
                            style={{ height: '32px', borderRadius: 0 }}
                          >
                            view children
                          </button>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 font-mono">{subpart.subpart_id}</td>
                    <td className="border border-gray-300 px-2 py-1">{subpart.rel_subsheet_id || ''}</td>
                    <td className="border border-gray-300 px-2 py-1">{subpart.subpart_name || ''}</td>
                    <td className="border border-gray-300 px-2 py-1">{subpart.payout_note || ''}</td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-600 text-xs">
                      {subpart.created_at ? new Date(subpart.created_at).toLocaleString() : ''}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-600 text-xs">
                      {subpart.updated_at ? new Date(subpart.updated_at).toLocaleString() : ''}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-600 font-mono text-xs">
                      {subpart.created_by || ''}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

