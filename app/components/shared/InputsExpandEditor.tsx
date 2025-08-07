'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface InputsExpandEditorProps {
  isOpen: boolean;
  cgigId: number;
  initialTab: 'inputs_v1' | 'inputs_v2' | 'inputs_v3';
  onSave: (field: 'inputs_v1' | 'inputs_v2' | 'inputs_v3', value: string) => Promise<void>;
  onClose: () => void;
}

export default function InputsExpandEditor({
  isOpen,
  cgigId,
  initialTab,
  onSave,
  onClose
}: InputsExpandEditorProps) {
  const [activeTab, setActiveTab] = useState<'inputs_v1' | 'inputs_v2' | 'inputs_v3'>(initialTab);
  const [values, setValues] = useState<{
    inputs_v1: string;
    inputs_v2: string;
    inputs_v3: string;
  }>({
    inputs_v1: '',
    inputs_v2: '',
    inputs_v3: ''
  });
  const [initialValues, setInitialValues] = useState<typeof values>({
    inputs_v1: '',
    inputs_v2: '',
    inputs_v3: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [toastPhase, setToastPhase] = useState<'fadeIn' | 'visible' | 'fadeOut'>('visible');
  const supabase = createClientComponentClient();

  // Fetch data directly from database when opened
  useEffect(() => {
    if (isOpen && cgigId) {
      fetchCitationGigData();
    }
  }, [isOpen, cgigId]);

  // Update active tab when initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchCitationGigData = async () => {
    setIsLoading(true);
    try {
      // Get user data first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) throw new Error('User not found');

      // Fetch citation gig data directly from database
      const { data, error } = await supabase
        .from('citation_gigs')
        .select('inputs_v1, inputs_v2, inputs_v3')
        .eq('cgig_id', cgigId)
        .eq('user_id', userData.id)
        .single();

      if (error) {
        console.error('Error fetching citation gig data:', error);
        throw error;
      }

      const fetchedValues = {
        inputs_v1: data?.inputs_v1 || '',
        inputs_v2: data?.inputs_v2 || '',
        inputs_v3: data?.inputs_v3 || ''
      };

      setValues(fetchedValues);
      setInitialValues(fetchedValues);
      console.log(`Loaded data for cgig ${cgigId}:`, fetchedValues);
    } catch (error) {
      console.error('Error loading citation gig data:', error);
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
      await onSave(activeTab, values[activeTab]);
      
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
      const fieldsToSave: ('inputs_v1' | 'inputs_v2' | 'inputs_v3')[] = [];
      
      if (values.inputs_v1 !== initialValues.inputs_v1) fieldsToSave.push('inputs_v1');
      if (values.inputs_v2 !== initialValues.inputs_v2) fieldsToSave.push('inputs_v2');
      if (values.inputs_v3 !== initialValues.inputs_v3) fieldsToSave.push('inputs_v3');
      
      for (const field of fieldsToSave) {
        await onSave(field, values[field]);
      }
      
      // Update initial values to reflect saved state
      setInitialValues({ ...values });
      
      if (fieldsToSave.length > 0) {
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

  const handleTabChange = (tab: 'inputs_v1' | 'inputs_v2' | 'inputs_v3') => {
    setActiveTab(tab);
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
            Citation Gig Inputs Editor (ID: {cgigId})
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : `Save ${activeTab}`}
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
            {(['inputs_v1', 'inputs_v2', 'inputs_v3'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-blue-900 border-b-2 border-blue-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.toUpperCase()}
                {values[tab] !== initialValues[tab] && (
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
              value={values[activeTab]}
              onChange={(e) => setValues({ ...values, [activeTab]: e.target.value })}
              className="w-full h-full resize-none border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder={`Enter ${activeTab} content...`}
              style={{ minHeight: 'calc(100vh - 200px)' }}
              disabled={isSaving}
            />
          )}
        </div>
        
        {/* Status bar */}
        <div className="px-6 py-2 bg-gray-50 border-t text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Active Tab: <strong>{activeTab}</strong></span>
            <span>
              {values[activeTab].length} characters
              {values[activeTab] !== initialValues[activeTab] && (
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