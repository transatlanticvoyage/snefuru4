'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface FileRelease {
  release_id: number;
  release_date: string | null;
  sheet_link: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface Props {
  onReleaseSelect: (releaseId: number | null) => void;
}

export default function FileReleasesGrid({ onReleaseSelect }: Props) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [releases, setReleases] = useState<FileRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ releaseId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newRelease, setNewRelease] = useState<Partial<FileRelease> | null>(null);
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  
  // Delete confirmation states
  const [deleteConfirmStep1, setDeleteConfirmStep1] = useState<number | null>(null);
  const [deleteConfirmStep2, setDeleteConfirmStep2] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReleases = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leadsmart_file_releases')
        .select('*')
        .order('release_id', { ascending: false });
      
      if (error) throw error;
      setReleases(data || []);
      
      // Auto-select the entry with the most recent release_date
      if (data && data.length > 0) {
        // Filter out entries without release_date
        const releasesWithDates = data.filter(r => r.release_date);
        
        if (releasesWithDates.length > 0) {
          // Sort by release_date (format: yyyy/mm/dd) to find most recent
          const mostRecent = releasesWithDates.reduce((latest, current) => {
            if (!latest.release_date) return current;
            if (!current.release_date) return latest;
            
            // Compare dates as strings (yyyy/mm/dd format sorts correctly)
            return current.release_date > latest.release_date ? current : latest;
          });
          
          setSelectedReleaseId(mostRecent.release_id);
        } else {
          // If no dates, select the first one
          setSelectedReleaseId(data[0].release_id);
        }
      }
    } catch (error) {
      console.error('Error fetching releases:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const handleCreateInline = () => {
    setNewRelease({
      release_date: '',
      sheet_link: '',
      created_by: user?.id || null
    });
  };

  const handleSaveNew = async () => {
    if (!newRelease || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('leadsmart_file_releases')
        .insert([{ ...newRelease, created_by: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      
      setReleases(prev => [data, ...prev]);
      setNewRelease(null);
      
      // Auto-select the newly created release
      setSelectedReleaseId(data.release_id);
    } catch (error) {
      console.error('Error creating release:', error);
      alert('Failed to create release');
    }
  };

  const handleCancelNew = () => {
    setNewRelease(null);
  };

  const updateNewField = (field: string, value: any) => {
    setNewRelease(prev => prev ? { ...prev, [field]: value } : null);
  };

  const startEditing = (releaseId: number, field: string, currentValue: any) => {
    setEditingCell({ releaseId, field });
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '');
  };

  const saveEdit = async (releaseId: number, field: string) => {
    try {
      const { error } = await supabase
        .from('leadsmart_file_releases')
        .update({ [field]: editValue })
        .eq('release_id', releaseId);
      
      if (error) throw error;
      
      setReleases(prev => prev.map(rel => 
        rel.release_id === releaseId ? { ...rel, [field]: editValue } : rel
      ));
      
      setEditingCell(null);
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save edit');
    }
  };

  const handleCheckboxClick = (releaseId: number) => {
    // Only one can be selected at a time (radio button behavior)
    setSelectedReleaseId(releaseId);
    onReleaseSelect(releaseId);
  };
  
  // Notify parent when auto-selected on load
  useEffect(() => {
    if (selectedReleaseId !== null) {
      onReleaseSelect(selectedReleaseId);
    }
  }, [selectedReleaseId, onReleaseSelect]);

  const handleDeleteClick = (releaseId: number) => {
    setDeleteConfirmStep1(releaseId);
  };

  const handleDeleteConfirm = async (releaseId: number) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('leadsmart_file_releases')
        .delete()
        .eq('release_id', releaseId);
      
      if (error) throw error;
      
      // Remove from local state
      setReleases(prev => prev.filter(r => r.release_id !== releaseId));
      
      // Clear selection if this was the selected one
      if (selectedReleaseId === releaseId) {
        setSelectedReleaseId(null);
        onReleaseSelect(null);
      }
      
      setDeleteConfirmStep1(null);
      setDeleteConfirmStep2(null);
      
      alert(`Successfully deleted release #${releaseId}`);
    } catch (error) {
      console.error('Error deleting release:', error);
      alert('Failed to delete release. It may have associated data.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-gray-50">
        <div className="font-bold text-gray-800 mb-3" style={{ fontSize: '16px' }}>
          leadsmart_file_releases
        </div>
        <button
          onClick={handleCreateInline}
          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Create New (inline)
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-200 sticky top-0 z-10">
              <th className="border border-gray-300 px-2 py-2" style={{ width: '40px' }}>
                {/* No checkbox in header */}
              </th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                release_id
              </th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                release_date
              </th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                sheet_link
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
              <th className="border border-gray-300 px-2 py-2 text-center" style={{ fontWeight: 'bold', fontSize: '14px', width: '80px' }}>
                delete
              </th>
            </tr>
          </thead>
          <tbody>
            {/* New row */}
            {newRelease && (
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
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={(newRelease as any).release_date || ''}
                    onChange={(e) => updateNewField('release_date', e.target.value)}
                    className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                    placeholder="yyyy/mm/dd"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={(newRelease as any).sheet_link || ''}
                    onChange={(e) => updateNewField('sheet_link', e.target.value)}
                    className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1 text-gray-400">Auto</td>
                <td className="border border-gray-300 px-2 py-1 text-gray-400">Auto</td>
                <td className="border border-gray-300 px-2 py-1 text-gray-400">Auto</td>
                <td className="border border-gray-300 px-2 py-1 text-gray-400 text-center">N/A</td>
              </tr>
            )}
            
            {/* Existing rows */}
            {releases.map((release) => (
              <tr key={release.release_id} className="hover:bg-gray-50">
                <td 
                  className="border border-gray-300 px-2 py-1 text-center cursor-pointer"
                  onClick={() => handleCheckboxClick(release.release_id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedReleaseId === release.release_id}
                    onChange={() => handleCheckboxClick(release.release_id)}
                    className="cursor-pointer"
                    style={{ width: '16px', height: '16px' }}
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1 font-mono">{release.release_id}</td>
                <td className="border border-gray-300 px-2 py-1">
                  {editingCell?.releaseId === release.release_id && editingCell?.field === 'release_date' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(release.release_id, 'release_date')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(release.release_id, 'release_date');
                        if (e.key === 'Escape') setEditingCell(null);
                      }}
                      autoFocus
                      className="w-full px-1 py-1 border border-blue-500 rounded text-xs"
                      placeholder="yyyy/mm/dd"
                    />
                  ) : (
                    <div
                      onClick={() => startEditing(release.release_id, 'release_date', release.release_date)}
                      className="cursor-pointer hover:bg-gray-100 px-1 py-1 min-h-[24px]"
                    >
                      {release.release_date || ''}
                    </div>
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {editingCell?.releaseId === release.release_id && editingCell?.field === 'sheet_link' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(release.release_id, 'sheet_link')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(release.release_id, 'sheet_link');
                        if (e.key === 'Escape') setEditingCell(null);
                      }}
                      autoFocus
                      className="w-full px-1 py-1 border border-blue-500 rounded text-xs"
                    />
                  ) : (
                    <div
                      onClick={() => startEditing(release.release_id, 'sheet_link', release.sheet_link)}
                      className="cursor-pointer hover:bg-gray-100 px-1 py-1 min-h-[24px]"
                    >
                      {release.sheet_link || ''}
                    </div>
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-gray-600 text-xs">
                  {release.created_at ? new Date(release.created_at).toLocaleString() : ''}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-gray-600 text-xs">
                  {release.updated_at ? new Date(release.updated_at).toLocaleString() : ''}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-gray-600 font-mono text-xs">
                  {release.created_by || ''}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <button
                    onClick={() => handleDeleteClick(release.release_id)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                  >
                    delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* First Delete Confirmation */}
      {deleteConfirmStep1 !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Confirm Delete</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>Release #{deleteConfirmStep1}</strong>?
              </p>
              <p className="text-sm text-gray-600 mb-6">
                This will only delete the release entity. Any associated data in leadsmart_zip_based_data will remain.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmStep1(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirmStep2(deleteConfirmStep1);
                    setDeleteConfirmStep1(null);
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-md transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Second Delete Confirmation */}
      {deleteConfirmStep2 !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-red-700 mb-4">🚨 Final Confirmation</h3>
              <p className="text-gray-700 mb-4">
                <strong>This is your last chance!</strong>
              </p>
              <p className="text-gray-700 mb-6">
                Click "Yes, Delete Now" to permanently delete <strong>Release #{deleteConfirmStep2}</strong>.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmStep2(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteConfirm(deleteConfirmStep2)}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors disabled:bg-red-400"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

