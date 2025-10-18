'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface Subsheet {
  subsheet_id: number;
  rel_release_id: number | null;
  subsheet_name: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface Props {
  selectedReleaseId: number | null;
  onSubsheetSelect: (subsheetId: number | null) => void;
}

export default function SubsheetsGrid({ selectedReleaseId, onSubsheetSelect }: Props) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [subsheets, setSubsheets] = useState<Subsheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<{ subsheetId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newSubsheet, setNewSubsheet] = useState<Partial<Subsheet> | null>(null);
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
      setSubsheets(data || []);
    } catch (error) {
      console.error('Error fetching subsheets:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedReleaseId, supabase, onSubsheetSelect]);

  useEffect(() => {
    fetchSubsheets();
  }, [fetchSubsheets]);

  const handleCreateInline = () => {
    if (!selectedReleaseId) {
      alert('Please select a release first');
      return;
    }
    
    setNewSubsheet({
      rel_release_id: selectedReleaseId,
      subsheet_name: '',
      created_by: user?.id || null
    });
  };

  const handleSaveNew = async () => {
    if (!newSubsheet || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('leadsmart_subsheets')
        .insert([{ ...newSubsheet, created_by: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      
      setSubsheets(prev => [data, ...prev]);
      setNewSubsheet(null);
      setSelectedSubsheetId(data.subsheet_id);
      onSubsheetSelect(data.subsheet_id);
    } catch (error) {
      console.error('Error creating subsheet:', error);
      alert('Failed to create subsheet');
    }
  };

  const handleCancelNew = () => {
    setNewSubsheet(null);
  };

  const updateNewField = (field: string, value: any) => {
    setNewSubsheet(prev => prev ? { ...prev, [field]: value } : null);
  };

  const startEditing = (subsheetId: number, field: string, currentValue: any) => {
    setEditingCell({ subsheetId, field });
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '');
  };

  const saveEdit = async (subsheetId: number, field: string) => {
    try {
      const { error } = await supabase
        .from('leadsmart_subsheets')
        .update({ [field]: editValue })
        .eq('subsheet_id', subsheetId);
      
      if (error) throw error;
      
      setSubsheets(prev => prev.map(sub => 
        sub.subsheet_id === subsheetId ? { ...sub, [field]: editValue } : sub
      ));
      
      setEditingCell(null);
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save edit');
    }
  };

  const handleCheckboxClick = (subsheetId: number) => {
    setSelectedSubsheetId(subsheetId);
    onSubsheetSelect(subsheetId);
  };

  return (
    <div className="flex flex-col">
      <hr className="border-gray-300" />
      
      <div className="p-4 border-b bg-gray-50">
        <div className="font-bold text-gray-800 mb-3" style={{ fontSize: '16px' }}>
          leadsmart_subsheets
        </div>
        <button
          onClick={handleCreateInline}
          disabled={!selectedReleaseId}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedReleaseId
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Create New (inline)
        </button>
      </div>
      
      {selectedReleaseId && (
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
                    subsheet_id
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                    rel_release_id
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                    subsheet_name
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
                {newSubsheet && (
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
                      {selectedReleaseId}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="text"
                        value={(newSubsheet as any).subsheet_name || ''}
                        onChange={(e) => updateNewField('subsheet_name', e.target.value)}
                        className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-400">Auto</td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-400">Auto</td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-400">Auto</td>
                  </tr>
                )}
                
                {/* Existing rows */}
                {subsheets.map((subsheet) => (
                  <tr key={subsheet.subsheet_id} className="hover:bg-gray-50">
                    <td 
                      className="border border-gray-300 px-2 py-1 text-center cursor-pointer"
                      onClick={() => handleCheckboxClick(subsheet.subsheet_id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubsheetId === subsheet.subsheet_id}
                        onChange={() => handleCheckboxClick(subsheet.subsheet_id)}
                        className="cursor-pointer"
                        style={{ width: '16px', height: '16px' }}
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1 font-mono">{subsheet.subsheet_id}</td>
                    <td className="border border-gray-300 px-2 py-1">{subsheet.rel_release_id || ''}</td>
                    <td className="border border-gray-300 px-2 py-1">
                      {editingCell?.subsheetId === subsheet.subsheet_id && editingCell?.field === 'subsheet_name' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(subsheet.subsheet_id, 'subsheet_name')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(subsheet.subsheet_id, 'subsheet_name');
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full px-1 py-1 border border-blue-500 rounded text-xs"
                        />
                      ) : (
                        <div
                          onClick={() => startEditing(subsheet.subsheet_id, 'subsheet_name', subsheet.subsheet_name)}
                          className="cursor-pointer hover:bg-gray-100 px-1 py-1 min-h-[24px]"
                        >
                          {subsheet.subsheet_name || ''}
                        </div>
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

