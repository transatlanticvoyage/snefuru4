'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface Subsheet {
  subsheet_id: number;
  rel_release_id: number | null;
  subsheet_name: string | null;
  kw_stub_1: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  result_count?: number;
}

interface Props {
  selectedReleaseId: number | null;
  onSubsheetSelect: (subsheetId: number | null) => void;
  selectXType: 'release' | 'subsheet' | 'subpart' | null;
  selectXId: number | null;
  onSelectX: (type: 'release' | 'subsheet' | 'subpart', id: number) => void;
}

export default function SelectorSubsheetsGrid({ selectedReleaseId, onSubsheetSelect, selectXType, selectXId, onSelectX }: Props) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [subsheets, setSubsheets] = useState<Subsheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubsheetId, setSelectedSubsheetId] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

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
      
      // Fetch counts for each subsheet
      const subsheetsWithCounts = await Promise.all((data || []).map(async (subsheet) => {
        const { count } = await supabase
          .from('leadsmart_zip_based_data')
          .select('*', { count: 'exact', head: true })
          .eq('rel_subsheet_id', subsheet.subsheet_id);
        
        return {
          ...subsheet,
          result_count: count || 0
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

  const handleCheckboxClick = (subsheetId: number) => {
    setSelectedSubsheetId(subsheetId);
    onSubsheetSelect(subsheetId);
  };

  const handleEditStart = (id: number, field: string, value: string) => {
    setEditingCell({ id, field });
    setEditValue(value);
  };

  const handleEditSave = async (subsheetId: number) => {
    if (!editingCell) return;
    
    try {
      const { error } = await supabase
        .from('leadsmart_subsheets')
        .update({ [editingCell.field]: editValue || null })
        .eq('subsheet_id', subsheetId);
      
      if (error) throw error;
      
      // Update local state
      setSubsheets(prev => prev.map(s => 
        s.subsheet_id === subsheetId 
          ? { ...s, [editingCell.field]: editValue || null }
          : s
      ));
    } catch (error) {
      console.error('Error updating subsheet:', error);
    } finally {
      setEditingCell(null);
      setEditValue('');
    }
  };

  return (
    <div className="flex flex-col">
      <hr className="border-gray-300" />
      
      <div className="p-4 border-b bg-gray-50">
        <div className="font-bold text-gray-800 mb-3" style={{ fontSize: '16px' }}>
          leadsmart_subsheets
        </div>
      </div>
      
      {selectedReleaseId && (
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
                    subsheet_id
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                    rel_release_id
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                    subsheet_name
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                    kw_stub_1
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
                {subsheets.map((subsheet) => {
                  const isSelectedX = selectXType === 'subsheet' && selectXId === subsheet.subsheet_id;
                  
                  const rowRef = (el: HTMLTableRowElement | null) => {
                    if (el) {
                      el.style.setProperty('background-color', isSelectedX ? '#d1fae5' : 'white', 'important');
                    }
                  };
                  
                  return (
                    <tr 
                      key={subsheet.subsheet_id}
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
                        {subsheet.result_count || 0}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <div className="flex items-center" style={{ gap: 0 }}>
                          <input
                            type="checkbox"
                            checked={isSelectedX}
                            onChange={() => onSelectX('subsheet', subsheet.subsheet_id)}
                            className="cursor-pointer"
                            style={{ width: '20px', height: '32px', margin: 0, borderRadius: 0 }}
                          />
                          <button
                            onClick={() => onSelectX('subsheet', subsheet.subsheet_id)}
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
                            checked={selectedSubsheetId === subsheet.subsheet_id}
                            onChange={() => handleCheckboxClick(subsheet.subsheet_id)}
                            className="cursor-pointer"
                            style={{ width: '20px', height: '32px', margin: 0, borderRadius: 0 }}
                          />
                          <button
                            onClick={() => handleCheckboxClick(subsheet.subsheet_id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 font-medium transition-colors"
                            style={{ height: '32px', borderRadius: 0 }}
                          >
                            view children
                          </button>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 font-mono">{subsheet.subsheet_id}</td>
                    <td className="border border-gray-300 px-2 py-1">{subsheet.rel_release_id || ''}</td>
                    <td className="border border-gray-300 px-2 py-1">{subsheet.subsheet_name || ''}</td>
                    <td className="border border-gray-300 px-2 py-1" onClick={() => handleEditStart(subsheet.subsheet_id, 'kw_stub_1', subsheet.kw_stub_1 || '')}>
                      {editingCell?.id === subsheet.subsheet_id && editingCell?.field === 'kw_stub_1' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleEditSave(subsheet.subsheet_id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave(subsheet.subsheet_id);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full px-1 py-0 border border-blue-500 rounded"
                          autoFocus
                        />
                      ) : (
                        <span className="cursor-pointer hover:bg-gray-100 block w-full">
                          {subsheet.kw_stub_1 || ''}
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-600 text-xs">
                      {subsheet.created_at ? new Date(subsheet.created_at).toLocaleString() : ''}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-600 text-xs">
                      {subsheet.updated_at ? new Date(subsheet.updated_at).toLocaleString() : ''}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-600 font-mono text-xs">
                      {subsheet.created_by || ''}
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

