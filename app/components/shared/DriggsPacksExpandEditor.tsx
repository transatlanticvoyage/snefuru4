'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface DriggsPacksExpandEditorProps {
  isOpen: boolean;
  initialDpackId: number;
  onSave: (dpackId: number, field: keyof FieldValues, value: string) => Promise<void>;
  onClose: () => void;
}

interface DriggsPacksRecord {
  dpack_id: number;
  dpack_datum: string | null;
  dpack_note: string | null;
  dpack_realm: string | null;
  dpack_name: string | null;
  dpack_description: string | null;
  user_id_created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

interface FieldValues {
  dpack_datum: string;
  dpack_note: string;
  dpack_realm: string;
  dpack_name: string;
  dpack_description: string;
}

export default function DriggsPacksExpandEditor({
  isOpen,
  initialDpackId,
  onSave,
  onClose
}: DriggsPacksExpandEditorProps) {
  const [activeDpackId, setActiveDpackId] = useState<number>(initialDpackId);
  const [activeField, setActiveField] = useState<keyof FieldValues>('dpack_datum');
  const [values, setValues] = useState<{ [key: number]: FieldValues }>({});
  const [initialValues, setInitialValues] = useState<{ [key: number]: FieldValues }>({});
  const [availableDpackIds, setAvailableDpackIds] = useState<number[]>([]);
  const [records, setRecords] = useState<{ [key: number]: DriggsPacksRecord }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [toastPhase, setToastPhase] = useState<'fadeIn' | 'visible' | 'fadeOut'>('visible');
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  // Permission check function
  const canEditRecord = (record: DriggsPacksRecord): boolean => {
    // Admin users can edit everything
    if (user?.is_admin) return true;
    
    // Non-admin users can only edit "personal" realm records they created
    return record.dpack_realm === 'personal' && record.user_id_created_by === user?.id;
  };

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
        .select('dpack_id, dpack_datum, dpack_note, dpack_realm, dpack_name, dpack_description, user_id_created_by, created_at, updated_at')
        .order('dpack_id', { ascending: true });

      if (error) {
        console.error('Error fetching driggs_packs data:', error);
        throw error;
      }

      const fetchedValues: { [key: number]: FieldValues } = {};
      const recordsData: { [key: number]: DriggsPacksRecord } = {};
      const dpackIds: number[] = [];

      data?.forEach(record => {
        dpackIds.push(record.dpack_id);
        fetchedValues[record.dpack_id] = {
          dpack_datum: record.dpack_datum || '',
          dpack_note: record.dpack_note || '',
          dpack_realm: record.dpack_realm || '',
          dpack_name: record.dpack_name || '',
          dpack_description: record.dpack_description || ''
        };
        recordsData[record.dpack_id] = record;
      });

      setAvailableDpackIds(dpackIds);
      setValues(fetchedValues);
      setInitialValues(fetchedValues);
      setRecords(recordsData);
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
      // Save the current field's value
      await onSave(activeDpackId, activeField, values[activeDpackId]?.[activeField] || '');
      
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
      const changesFound: { dpackId: number, field: keyof FieldValues }[] = [];
      
      availableDpackIds.forEach(dpackId => {
        const currentValues = values[dpackId];
        const originalValues = initialValues[dpackId];
        
        if (currentValues && originalValues) {
          (Object.keys(currentValues) as Array<keyof FieldValues>).forEach(field => {
            if (currentValues[field] !== originalValues[field]) {
              changesFound.push({ dpackId, field });
            }
          });
        }
      });
      
      for (const change of changesFound) {
        await onSave(change.dpackId, change.field, values[change.dpackId]?.[change.field] || '');
      }
      
      // Update initial values to reflect saved state
      setInitialValues({ ...values });
      
      if (changesFound.length > 0) {
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

  const handleFieldChange = (field: keyof FieldValues) => {
    setActiveField(field);
  };

  const getFieldDisplayName = (field: keyof FieldValues): string => {
    const displayNames = {
      dpack_datum: 'Datum',
      dpack_note: 'Note',
      dpack_realm: 'Realm',
      dpack_name: 'Name',
      dpack_description: 'Description'
    };
    return displayNames[field];
  };

  const hasChanges = (dpackId: number, field?: keyof FieldValues): boolean => {
    const currentValues = values[dpackId];
    const originalValues = initialValues[dpackId];
    
    if (!currentValues || !originalValues) return false;
    
    if (field) {
      return currentValues[field] !== originalValues[field];
    }
    
    // Check if any field has changes for this dpack_id
    return (Object.keys(currentValues) as Array<keyof FieldValues>).some(
      key => currentValues[key] !== originalValues[key]
    );
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
            Driggs Packs Editor (dpack_id {activeDpackId} - {getFieldDisplayName(activeField)})
            {records[activeDpackId] && !canEditRecord(records[activeDpackId]) && (
              <span className="ml-2 text-sm text-red-600 font-normal">[Read-only]</span>
            )}
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading || (records[activeDpackId] && !canEditRecord(records[activeDpackId]))}
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : `Save ${getFieldDisplayName(activeField)}`}
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
          {/* DPack ID tabs */}
          <div className="flex border-b">
            {availableDpackIds.map((dpackId) => (
              <button
                key={dpackId}
                onClick={() => handleTabChange(dpackId)}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeDpackId === dpackId
                    ? 'bg-blue-100 text-blue-900 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                dpack_id({dpackId})
                {hasChanges(dpackId) && (
                  <span className="ml-2 text-xs text-orange-600">●</span>
                )}
                {records[dpackId] && !canEditRecord(records[dpackId]) && (
                  <span className="ml-2 text-xs text-red-600">🔒</span>
                )}
              </button>
            ))}
          </div>
          
          {/* Field tabs */}
          <div className="flex">
            {(Object.keys({
              dpack_datum: '',
              dpack_note: '',
              dpack_realm: '',
              dpack_name: '',
              dpack_description: ''
            }) as Array<keyof FieldValues>).map((field) => (
              <button
                key={field}
                onClick={() => handleFieldChange(field)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeField === field
                    ? 'bg-white text-blue-900 border-b-2 border-blue-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {getFieldDisplayName(field)}
                {hasChanges(activeDpackId, field) && (
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
              value={values[activeDpackId]?.[activeField] || ''}
              onChange={(e) => setValues({
                ...values,
                [activeDpackId]: {
                  ...values[activeDpackId],
                  [activeField]: e.target.value
                }
              })}
              className={`w-full h-full resize-none border rounded-md px-3 py-2 font-mono text-sm ${
                records[activeDpackId] && !canEditRecord(records[activeDpackId])
                  ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                  : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              }`}
              placeholder={
                records[activeDpackId] && !canEditRecord(records[activeDpackId])
                  ? `Read-only: ${getFieldDisplayName(activeField)} for dpack_id(${activeDpackId})`
                  : `Enter ${getFieldDisplayName(activeField)} for dpack_id(${activeDpackId})...`
              }
              style={{ minHeight: 'calc(100vh - 250px)' }}
              disabled={isSaving || (records[activeDpackId] && !canEditRecord(records[activeDpackId]))}
              readOnly={records[activeDpackId] && !canEditRecord(records[activeDpackId])}
            />
          )}
        </div>
        
        {/* Status bar */}
        <div className="px-6 py-2 bg-gray-50 border-t text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Active: <strong>dpack_id({activeDpackId})</strong> - <strong>{getFieldDisplayName(activeField)}</strong></span>
            <span>
              {(values[activeDpackId]?.[activeField] || '').length} characters
              {hasChanges(activeDpackId, activeField) && (
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