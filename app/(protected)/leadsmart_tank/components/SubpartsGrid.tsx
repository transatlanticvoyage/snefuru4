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
}

interface Props {
  selectedSubsheetId: number | null;
  onSubpartSelect: (subpartId: number | null) => void;
}

export default function SubpartsGrid({ selectedSubsheetId, onSubpartSelect }: Props) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [subparts, setSubparts] = useState<Subpart[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<{ subpartId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newSubpart, setNewSubpart] = useState<Partial<Subpart> | null>(null);
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
      setSubparts(data || []);
    } catch (error) {
      console.error('Error fetching subparts:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSubsheetId, supabase, onSubpartSelect]);

  useEffect(() => {
    fetchSubparts();
  }, [fetchSubparts]);

  const handleCreateInline = () => {
    if (!selectedSubsheetId) {
      alert('Please select a subsheet first');
      return;
    }
    
    setNewSubpart({
      rel_subsheet_id: selectedSubsheetId,
      subpart_name: '',
      payout_note: '',
      created_by: user?.id || null
    });
  };

  const handleSaveNew = async () => {
    if (!newSubpart || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('leadsmart_subparts')
        .insert([{ ...newSubpart, created_by: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      
      setSubparts(prev => [data, ...prev]);
      setNewSubpart(null);
      setSelectedSubpartId(data.subpart_id);
      onSubpartSelect(data.subpart_id);
    } catch (error) {
      console.error('Error creating subpart:', error);
      alert('Failed to create subpart');
    }
  };

  const handleCancelNew = () => {
    setNewSubpart(null);
  };

  const updateNewField = (field: string, value: any) => {
    setNewSubpart(prev => prev ? { ...prev, [field]: value } : null);
  };

  const startEditing = (subpartId: number, field: string, currentValue: any) => {
    setEditingCell({ subpartId, field });
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '');
  };

  const saveEdit = async (subpartId: number, field: string) => {
    try {
      const { error } = await supabase
        .from('leadsmart_subparts')
        .update({ [field]: editValue })
        .eq('subpart_id', subpartId);
      
      if (error) throw error;
      
      setSubparts(prev => prev.map(sub => 
        sub.subpart_id === subpartId ? { ...sub, [field]: editValue } : sub
      ));
      
      setEditingCell(null);
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save edit');
    }
  };

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
        <button
          onClick={handleCreateInline}
          disabled={!selectedSubsheetId}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedSubsheetId
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Create New (inline)
        </button>
      </div>
      
      {selectedSubsheetId && (
        <div className="overflow-auto p-4">
          {loading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-200 sticky top-0 z-10">
                  <th className="border border-gray-300 px-2 py-2" style={{ width: '40px' }}>
                    {/* No checkbox in header */}
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
                {/* New row */}
                {newSubpart && (
                  <tr className="bg-yellow-50">
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      <div className="flex space-x-1">
                        <button
                          onClick={handleSaveNew}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelNew}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-400">Auto</td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-400">
                      {selectedSubsheetId}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="text"
                        value={(newSubpart as any).subpart_name || ''}
                        onChange={(e) => updateNewField('subpart_name', e.target.value)}
                        className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="text"
                        value={(newSubpart as any).payout_note || ''}
                        onChange={(e) => updateNewField('payout_note', e.target.value)}
                        className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-400">Auto</td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-400">Auto</td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-400">Auto</td>
                  </tr>
                )}
                
                {/* Existing rows */}
                {subparts.map((subpart) => (
                  <tr key={subpart.subpart_id} className="hover:bg-gray-50">
                    <td 
                      className="border border-gray-300 px-2 py-1 text-center cursor-pointer"
                      onClick={() => handleCheckboxClick(subpart.subpart_id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubpartId === subpart.subpart_id}
                        onChange={() => handleCheckboxClick(subpart.subpart_id)}
                        className="cursor-pointer"
                        style={{ width: '16px', height: '16px' }}
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1 font-mono">{subpart.subpart_id}</td>
                    <td className="border border-gray-300 px-2 py-1">{subpart.rel_subsheet_id || ''}</td>
                    <td className="border border-gray-300 px-2 py-1">
                      {editingCell?.subpartId === subpart.subpart_id && editingCell?.field === 'subpart_name' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(subpart.subpart_id, 'subpart_name')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(subpart.subpart_id, 'subpart_name');
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full px-1 py-1 border border-blue-500 rounded text-xs"
                        />
                      ) : (
                        <div
                          onClick={() => startEditing(subpart.subpart_id, 'subpart_name', subpart.subpart_name)}
                          className="cursor-pointer hover:bg-gray-100 px-1 py-1 min-h-[24px]"
                        >
                          {subpart.subpart_name || ''}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {editingCell?.subpartId === subpart.subpart_id && editingCell?.field === 'payout_note' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(subpart.subpart_id, 'payout_note')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(subpart.subpart_id, 'payout_note');
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full px-1 py-1 border border-blue-500 rounded text-xs"
                        />
                      ) : (
                        <div
                          onClick={() => startEditing(subpart.subpart_id, 'payout_note', subpart.payout_note)}
                          className="cursor-pointer hover:bg-gray-100 px-1 py-1 min-h-[24px]"
                        >
                          {subpart.payout_note || ''}
                        </div>
                      )}
                    </td>
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

