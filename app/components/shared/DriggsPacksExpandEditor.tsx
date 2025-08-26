'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface DriggsPacksExpandEditorProps {
  isOpen: boolean;
  initialDpackId: number;
  onSave: (dpackId: number, value: string) => Promise<void>;
  onClose: () => void;
}

export default function DriggsPacksExpandEditor({
  isOpen,
  initialDpackId,
  onSave,
  onClose
}: DriggsPacksExpandEditorProps) {
  const [activeDpackId, setActiveDpackId] = useState<number>(initialDpackId);
  const [values, setValues] = useState<{ [key: number]: string }>({});
  const [initialValues, setInitialValues] = useState<{ [key: number]: string }>({});
  const [availableDpackIds, setAvailableDpackIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [toastPhase, setToastPhase] = useState<'fadeIn' | 'visible' | 'fadeOut'>('visible');
  const supabase = createClientComponentClient();

  // Fetch all driggs_packs data when opened
  useEffect(() => {
    if (isOpen) {
      fetchAllDriggsPacksData();
    }
  }, [isOpen]);

  // Update active tab when initialDpackId changes
  useEffect(() => {
    setActiveDpackId(initialDpackId);
  }, [initialDpackId]);

  const fetchAllDriggsPacksData = async () => {
    setIsLoading(true);
    try {
      // Fetch all driggs_packs data directly from database
      const { data, error } = await supabase
        .from('driggs_packs')
        .select('dpack_id, dpack_datum')
        .order('dpack_id', { ascending: true });

      if (error) {
        console.error('Error fetching driggs_packs data:', error);
        throw error;
      }

      const fetchedValues: { [key: number]: string } = {};
      const dpackIds: number[] = [];

      data?.forEach(record => {
        dpackIds.push(record.dpack_id);
        fetchedValues[record.dpack_id] = record.dpack_datum || '';
      });

      setAvailableDpackIds(dpackIds);
      setValues(fetchedValues);
      setInitialValues(fetchedValues);
      console.log(`Loaded data for all driggs_packs:`, fetchedValues);
    } catch (error) {
      console.error('Error loading driggs_packs data:', error);
      alert('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = () => {
    setToastPhase('fadeIn');
    setShowSavedToast(true);
    
    // Fade in (0.5s) → visible (1s) → fade out (0.5s)
    setTimeout(() => setToastPhase('visible'), 500);
    setTimeout(() => setToastPhase('fadeOut'), 1500);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save the current tab's value
      await onSave(activeDpackId, values[activeDpackId] || '');
      
      // Update initial values to reflect saved state
      setInitialValues({ ...values });
      
      // Show success toast
      showToast();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Save all fields that have changed
      const dpackIdsToSave: number[] = [];
      
      availableDpackIds.forEach(dpackId => {
        if (values[dpackId] !== initialValues[dpackId]) {
          dpackIdsToSave.push(dpackId);
        }
      });
      
      for (const dpackId of dpackIdsToSave) {
        await onSave(dpackId, values[dpackId] || '');
      }
      
      // Update initial values to reflect saved state
      setInitialValues({ ...values });
      
      if (dpackIdsToSave.length > 0) {
        // Show success toast
        showToast();
        // Close after a short delay to let user see the toast
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset to initial values
    setValues(initialValues);
    onClose();
  };

  const handleTabChange = (dpackId: number) => {
    setActiveDpackId(dpackId);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Toast notification for save success */}
      {showSavedToast && (
        <div 
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-green-600 font-bold transition-opacity duration-500 ${
            toastPhase === 'fadeIn' ? 'opacity-0' :
            toastPhase === 'visible' ? 'opacity-100' :
            'opacity-0'
          }`}
          style={{ zIndex: 9999, fontSize: '20px' }}
        >
          Saved
        </div>
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col"
        style={{ width: '900px', height: '100vh' }}
      >
        {/* Header with title and buttons */}
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            Driggs Packs Editor (Active: dpack_id {activeDpackId})
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : `Save dpack_id(${activeDpackId})`}
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving || isLoading}
              className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors font-medium disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save All & Close'}
            </button>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
        
        {/* Tab navigation */}
        <div className="border-b bg-gray-100">
          <div className="flex">
            {availableDpackIds.map((dpackId) => (
              <button
                key={dpackId}
                onClick={() => handleTabChange(dpackId)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeDpackId === dpackId
                    ? 'bg-white text-blue-900 border-b-2 border-blue-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                dpack_id({dpackId})
                {values[dpackId] !== initialValues[dpackId] && (
                  <span className="ml-2 text-xs text-orange-600">●</span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content area */}
        <div className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading data from database...</div>
            </div>
          ) : (
            <textarea
              value={values[activeDpackId] || ''}
              onChange={(e) => setValues({ ...values, [activeDpackId]: e.target.value })}
              className="w-full h-full resize-none border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder={`Enter dpack_id(${activeDpackId}) content...`}
              style={{ minHeight: 'calc(100vh - 200px)' }}
              disabled={isSaving}
            />
          )}
        </div>
        
        {/* Status bar */}
        <div className="px-6 py-2 bg-gray-50 border-t text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Active Tab: <strong>dpack_id({activeDpackId})</strong></span>
            <span>
              {(values[activeDpackId] || '').length} characters
              {values[activeDpackId] !== initialValues[activeDpackId] && (
                <span className="ml-2 text-orange-600">(modified)</span>
              )}
            </span>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}