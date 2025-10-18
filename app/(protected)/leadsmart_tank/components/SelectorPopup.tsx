'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import SelectorFileReleasesGrid from './SelectorFileReleasesGrid';
import SelectorSubsheetsGrid from './SelectorSubsheetsGrid';
import SelectorSubpartsGrid from './SelectorSubpartsGrid';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SelectorPopup({ isOpen, onClose }: Props) {
  const supabase = createClientComponentClient();
  
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [selectedSubsheetId, setSelectedSubsheetId] = useState<number | null>(null);
  const [selectedSubpartId, setSelectedSubpartId] = useState<number | null>(null);
  
  // Global select_x state (only one can be selected across all 3 grids)
  const [selectXType, setSelectXType] = useState<'release' | 'subsheet' | 'subpart' | null>(null);
  const [selectXId, setSelectXId] = useState<number | null>(null);
  const [selectXResultCount, setSelectXResultCount] = useState<number>(0);
  
  // Delete confirmation states
  const [showFirstDeleteConfirm, setShowFirstDeleteConfirm] = useState(false);
  const [showSecondDeleteConfirm, setShowSecondDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const handleSelectX = (type: 'release' | 'subsheet' | 'subpart', id: number) => {
    setSelectXType(type);
    setSelectXId(id);
  };
  
  // Fetch result count when select_x changes
  useEffect(() => {
    const fetchResultCount = async () => {
      if (!selectXType || !selectXId) {
        setSelectXResultCount(0);
        return;
      }
      
      try {
        let query = supabase.from('leadsmart_zip_based_data').select('*', { count: 'exact', head: true });
        
        if (selectXType === 'release') {
          query = query.eq('rel_release_id', selectXId);
        } else if (selectXType === 'subsheet') {
          query = query.eq('rel_subsheet_id', selectXId);
        } else if (selectXType === 'subpart') {
          query = query.eq('rel_subpart_id', selectXId);
        }
        
        const { count } = await query;
        setSelectXResultCount(count || 0);
      } catch (error) {
        console.error('Error fetching result count:', error);
        setSelectXResultCount(0);
      }
    };
    
    fetchResultCount();
  }, [selectXType, selectXId, supabase]);
  
  const handleDelete = async () => {
    if (!selectXType || !selectXId) {
      alert('Please select an item first');
      return;
    }
    
    setDeleting(true);
    try {
      let tableName = '';
      let idColumn = '';
      
      if (selectXType === 'release') {
        tableName = 'leadsmart_file_releases';
        idColumn = 'release_id';
      } else if (selectXType === 'subsheet') {
        tableName = 'leadsmart_subsheets';
        idColumn = 'subsheet_id';
      } else if (selectXType === 'subpart') {
        tableName = 'leadsmart_subparts';
        idColumn = 'subpart_id';
      }
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idColumn, selectXId);
      
      if (error) throw error;
      
      alert(`Successfully deleted ${selectXType} #${selectXId}`);
      
      // Clear selection
      setSelectXType(null);
      setSelectXId(null);
      setShowSecondDeleteConfirm(false);
      
      // Refresh the grids
      window.location.reload();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden" style={{ width: '100vw', height: '100vh' }}>
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Selector Popup</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Two Column Layout - Full Height */}
        <div className="flex h-full" style={{ height: 'calc(100vh - 100px)' }}>
          {/* Left Pane - Grids with counts */}
          <div className="flex-1 bg-white flex flex-col overflow-auto border-r border-gray-300">
            <SelectorFileReleasesGrid 
              onReleaseSelect={setSelectedReleaseId}
              selectXType={selectXType}
              selectXId={selectXId}
              onSelectX={handleSelectX}
            />
            <SelectorSubsheetsGrid 
              selectedReleaseId={selectedReleaseId} 
              onSubsheetSelect={setSelectedSubsheetId}
              selectXType={selectXType}
              selectXId={selectXId}
              onSelectX={handleSelectX}
            />
            <SelectorSubpartsGrid 
              selectedSubsheetId={selectedSubsheetId}
              onSubpartSelect={setSelectedSubpartId}
              selectXType={selectXType}
              selectXId={selectXId}
              onSelectX={handleSelectX}
            />
          </div>

          {/* Right Pane - Selection Info and Actions */}
          <div className="flex-1 bg-gray-50">
            <div className="p-6">
              <div className="font-bold text-gray-800 mb-4" style={{ fontSize: '16px' }}>
                from select_x system:
              </div>
              
              {selectXType && selectXId ? (
                <div className="mb-6">
                  <div className="text-lg text-gray-800 mb-2">
                    {selectXType === 'release' && `release_id - ${selectXId} - ${selectXResultCount.toLocaleString()} results`}
                    {selectXType === 'subsheet' && `subsheet_id - ${selectXId} - ${selectXResultCount.toLocaleString()} results`}
                    {selectXType === 'subpart' && `subpart_id - ${selectXId} - ${selectXResultCount.toLocaleString()} results`}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic mb-6">
                  No selection made yet. Click select_x on any item.
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (!selectXType || !selectXId) {
                      alert('Please select an item first');
                      return;
                    }
                    setShowFirstDeleteConfirm(true);
                  }}
                  disabled={!selectXType || !selectXId}
                  className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                    selectXType && selectXId
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  delete
                </button>
                
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-md font-medium cursor-not-allowed"
                >
                  transform
                </button>
                
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-md font-medium cursor-not-allowed"
                >
                  filter main ui table
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* First Delete Confirmation Popup */}
      {showFirstDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 rounded-full p-2 mr-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">⚠️ Warning: Deletion Requested</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  You are about to delete:
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-800 font-medium">
                    {selectXType === 'release' && `Release ID: ${selectXId}`}
                    {selectXType === 'subsheet' && `Subsheet ID: ${selectXId}`}
                    {selectXType === 'subpart' && `Subpart ID: ${selectXId}`}
                  </p>
                  <p className="text-red-700 text-sm mt-2">
                    This item has <strong>{selectXResultCount.toLocaleString()} related results</strong> in leadsmart_zip_based_data
                  </p>
                </div>
                <p className="text-gray-700">
                  This action may affect related records. Are you sure you want to continue?
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowFirstDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowFirstDeleteConfirm(false);
                    setShowSecondDeleteConfirm(true);
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-md transition-colors font-medium"
                >
                  I Understand, Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Second Delete Confirmation Popup */}
      {showSecondDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 rounded-full p-2 mr-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">🚨 Final Confirmation Required</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  <strong>This is your last chance to cancel!</strong>
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-800 font-medium mb-2">Clicking "Yes, Delete Now" will:</p>
                  <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                    <li>Permanently delete {selectXType} #{selectXId}</li>
                    <li>Potentially affect {selectXResultCount.toLocaleString()} related records</li>
                    <li>Cannot be undone once completed</li>
                  </ul>
                </div>
                <p className="text-gray-700 font-medium">
                  Are you absolutely sure you want to proceed?
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSecondDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors font-medium disabled:bg-red-400"
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

