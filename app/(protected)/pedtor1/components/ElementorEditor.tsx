'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams, useRouter } from 'next/navigation';

interface GconPiece {
  id: string;
  fk_users_id: string;
  meta_title: string | null;
  h1title: string | null;
  pgb_h1title: string | null;
  corpus1: string | null;
  corpus2: string | null;
  asn_sitespren_base: string | null;
  asn_nwpi_posts_id: string | null;
  asn_imgplanbatch_id: string | null;
  image_pack1: any;
  pelementor_cached: any;
  pelementor_edits: any;
  pub_status: string | null;
  date_time_pub_carry: string | null;
  pageslug: string | null;
  pageurl: string | null;
  response1_model_used: string | null;
  response1_raw: string | null;
  response1_meat_extracted: string | null;
  created_at: string;
  updated_at: string;
}

interface ElementorEditorProps {
  gconPiece: GconPiece;
  userInternalId: string;
  onUpdate: (updatedPiece: GconPiece) => void;
}

export default function ElementorEditor({ gconPiece, userInternalId, onUpdate }: ElementorEditorProps) {
  const [formData, setFormData] = useState({
    pelementor_cached: gconPiece.pelementor_cached ? JSON.stringify(gconPiece.pelementor_cached, null, 2) : '',
    pelementor_edits: gconPiece.pelementor_edits ? JSON.stringify(gconPiece.pelementor_edits, null, 2) : ''
  });
  const [imagePackInput, setImagePackInput] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'cached' | 'edits' | 'talkToAi1' | 'updateEndSite' | 'comparison'>('cached');
  
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle mtab URL parameter on component mount
  useEffect(() => {
    const mtab = searchParams?.get('mtab');
    if (mtab) {
      // Map URL mtab values to actual tab names
      const tabMapping: Record<string, 'cached' | 'edits' | 'talkToAi1' | 'updateEndSite' | 'comparison'> = {
        'cached': 'cached',
        'edits': 'edits', 
        'talk1': 'talkToAi1',
        'talkToAi1': 'talkToAi1',
        'updateEndSite': 'updateEndSite',
        'comparison': 'comparison'
      };
      
      const mappedTab = tabMapping[mtab];
      if (mappedTab) {
        setActiveTab(mappedTab);
      }
    }
  }, [searchParams]);

  // Helper function to update URL with mtab parameter
  const updateTabInUrl = (tab: 'cached' | 'edits' | 'talkToAi1' | 'updateEndSite' | 'comparison') => {
    const current = new URLSearchParams(Array.from(searchParams?.entries() || []));
    
    // Map internal tab names to URL-friendly names
    const urlTabMapping: Record<string, string> = {
      'cached': 'cached',
      'edits': 'edits',
      'talkToAi1': 'talk1',
      'updateEndSite': 'updateEndSite', 
      'comparison': 'comparison'
    };

    current.set('mtab', urlTabMapping[tab]);
    const search = current.toString();
    const query = search ? `?${search}` : '';
    
    // Update URL without triggering navigation
    window.history.replaceState(null, '', `${window.location.pathname}${query}`);
    setActiveTab(tab);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  const validateJsonField = (jsonString: string): boolean => {
    if (!jsonString.trim()) return true; // Empty is valid
    
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const formatJson = (field: 'pelementor_cached' | 'pelementor_edits') => {
    try {
      if (formData[field].trim()) {
        const parsed = JSON.parse(formData[field]);
        const formatted = JSON.stringify(parsed, null, 2);
        setFormData(prev => ({
          ...prev,
          [field]: formatted
        }));
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Invalid JSON in ${field.replace('pelementor_', '')} field`
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification({
      type: 'success',
      message: 'Copied to clipboard!'
    });
    setTimeout(() => setNotification(null), 2000);
  };

  const copyFromCachedToEdits = () => {
    setFormData(prev => ({
      ...prev,
      pelementor_edits: prev.pelementor_cached
    }));
    setHasUnsavedChanges(true);
    setNotification({
      type: 'success',
      message: 'Copied cached data to edits field'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setNotification(null);

    // Validate JSON fields
    if (!validateJsonField(formData.pelementor_cached)) {
      setNotification({
        type: 'error',
        message: 'Invalid JSON format in pelementor_cached field'
      });
      setIsSaving(false);
      return;
    }

    if (!validateJsonField(formData.pelementor_edits)) {
      setNotification({
        type: 'error',
        message: 'Invalid JSON format in pelementor_edits field'
      });
      setIsSaving(false);
      return;
    }

    try {
      // Parse JSON fields or set to null if empty
      let parsedPelementorCached = null;
      if (formData.pelementor_cached.trim()) {
        parsedPelementorCached = JSON.parse(formData.pelementor_cached);
      }

      let parsedPelementorEdits = null;
      if (formData.pelementor_edits.trim()) {
        parsedPelementorEdits = JSON.parse(formData.pelementor_edits);
      }

      // Prepare update data
      const updateData = {
        pelementor_cached: parsedPelementorCached,
        pelementor_edits: parsedPelementorEdits,
        updated_at: new Date().toISOString()
      };

      // Update in database
      const { data: updatedPiece, error } = await supabase
        .from('gcon_pieces')
        .update(updateData)
        .eq('id', gconPiece.id)
        .eq('fk_users_id', userInternalId) // Security check
        .select()
        .single();

      if (error) {
        console.error('Error updating gcon_piece:', error);
        setNotification({
          type: 'error',
          message: 'Failed to save changes'
        });
      } else {
        setNotification({
          type: 'success',
          message: 'Elementor data saved successfully!'
        });
        setHasUnsavedChanges(false);
        onUpdate(updatedPiece);
        
        // Clear success notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Save error:', error);
      setNotification({
        type: 'error',
        message: 'An error occurred while saving'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      pelementor_cached: gconPiece.pelementor_cached ? JSON.stringify(gconPiece.pelementor_cached, null, 2) : '',
      pelementor_edits: gconPiece.pelementor_edits ? JSON.stringify(gconPiece.pelementor_edits, null, 2) : ''
    });
    setHasUnsavedChanges(false);
  };

  const getDataSize = (data: string) => {
    return data ? `${(data.length / 1024).toFixed(1)} KB` : '0 KB';
  };

  const handleF204TellAiToolToKarfi = () => {
    // Placeholder function - no backend functionality yet
    alert('f204_tell_ai_tool_to_karfi function called (not implemented yet)');
  };

  const handleF210UpdateEndSite = () => {
    // Placeholder function - no backend functionality yet
    alert('f210_update_end_site function called (not implemented yet)');
  };

  const handleF211UpdateEndSiteWithPelementor = async () => {
    if (!formData.pelementor_edits.trim()) {
      alert('No pelementor edits data to push');
      return;
    }

    try {
      // Parse the JSON to validate it
      const pelementorData = JSON.parse(formData.pelementor_edits);
      
      setIsSaving(true);
      setNotification(null);

      const response = await fetch('/api/f211-update-end-site-pelementor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gcon_piece_id: gconPiece.id,
          pelementor_data: pelementorData
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Successfully updated live site with pelementor data!'
        });
        console.log('✅ Live site updated:', result);
      } else {
        throw new Error(result.error || 'Failed to update live site');
      }
    } catch (error) {
      console.error('❌ Error updating live site:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update live site'
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const hasElementorData = formData.pelementor_cached.trim() || formData.pelementor_edits.trim();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-md ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Save/Reset Buttons */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-md transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={resetForm}
          disabled={isSaving || !hasUnsavedChanges}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors"
        >
          Reset
        </button>
        {hasUnsavedChanges && (
          <span className="text-orange-600 text-sm self-center">
            * You have unsaved changes
          </span>
        )}
      </div>

      {/* Content Overview */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Content Info</h3>
          <p className="text-sm text-blue-700">
            <strong>Title:</strong> {gconPiece.meta_title || 'Untitled'}
          </p>
          <p className="text-sm text-blue-700">
            <strong>Site:</strong> {gconPiece.asn_sitespren_base || 'Not assigned'}
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-green-900 mb-2">Cached Data</h3>
          <p className="text-sm text-green-700">
            Size: {getDataSize(formData.pelementor_cached)}
          </p>
          <p className="text-sm text-green-700">
            Status: {formData.pelementor_cached.trim() ? 'Has Data' : 'Empty'}
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-purple-900 mb-2">Edit Data</h3>
          <p className="text-sm text-purple-700">
            Size: {getDataSize(formData.pelementor_edits)}
          </p>
          <p className="text-sm text-purple-700">
            Status: {formData.pelementor_edits.trim() ? 'Has Data' : 'Empty'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => updateTabInUrl('cached')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cached'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pelementor Cached
            {formData.pelementor_cached.trim() && (
              <span className="ml-1 px-1 text-xs bg-green-100 text-green-800 rounded">✓</span>
            )}
          </button>
          <button
            onClick={() => updateTabInUrl('edits')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'edits'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pelementor Edits
            {formData.pelementor_edits.trim() && (
              <span className="ml-1 px-1 text-xs bg-purple-100 text-purple-800 rounded">✓</span>
            )}
          </button>
          <button
            onClick={() => updateTabInUrl('talkToAi1')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'talkToAi1'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            talk1
          </button>
          <button
            onClick={() => updateTabInUrl('updateEndSite')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'updateEndSite'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Update End Site
          </button>
          <button
            onClick={() => updateTabInUrl('comparison')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'comparison'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Comparison View
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'cached' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Pelementor Cached Data</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => formatJson('pelementor_cached')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Format JSON
              </button>
              <button
                onClick={() => copyToClipboard(formData.pelementor_cached)}
                className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
          <textarea
            value={formData.pelementor_cached}
            onChange={(e) => handleInputChange('pelementor_cached', e.target.value)}
            rows={20}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm ${
              !validateJsonField(formData.pelementor_cached) 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder='{"elementor_data": "content here"}'
          />
          {!validateJsonField(formData.pelementor_cached) && (
            <p className="text-sm text-red-600">Invalid JSON format</p>
          )}
          <p className="text-sm text-gray-500">
            This field typically contains the original cached Elementor data from WordPress.
          </p>
        </div>
      )}

      {activeTab === 'edits' && (
        <div className="space-y-6">
          {/* Image Pack Input Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              paste your image pack here
            </label>
            <div>
              <textarea
                value={imagePackInput}
                onChange={(e) => setImagePackInput(e.target.value)}
                className="block px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                style={{ width: '500px', height: '200px' }}
                placeholder="Paste your image pack data here..."
              />
            </div>
            <button
              onClick={handleF204TellAiToolToKarfi}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              f204_tell_ai_tool_to_karfi
            </button>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Pelementor Edits Data</h3>
            <div className="flex space-x-2">
              <button
                onClick={copyFromCachedToEdits}
                className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
              >
                Copy from Cached
              </button>
              <button
                onClick={() => formatJson('pelementor_edits')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Format JSON
              </button>
              <button
                onClick={() => copyToClipboard(formData.pelementor_edits)}
                className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
          <textarea
            value={formData.pelementor_edits}
            onChange={(e) => handleInputChange('pelementor_edits', e.target.value)}
            rows={20}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm ${
              !validateJsonField(formData.pelementor_edits) 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder='{"modified_elementor_data": "your edits here"}'
          />
          {!validateJsonField(formData.pelementor_edits) && (
            <p className="text-sm text-red-600">Invalid JSON format</p>
          )}
          <p className="text-sm text-gray-500">
            This field is for your custom modifications to the Elementor data.
          </p>
        </div>
      )}

      {activeTab === 'talkToAi1' && (
        <TalkToAiTab 
          gconPiece={gconPiece}
          userInternalId={userInternalId}
          pelementorEdits={formData.pelementor_edits}
          onUpdate={onUpdate}
        />
      )}

      {activeTab === 'updateEndSite' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={handleF210UpdateEndSite}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md transition-colors"
            >
              f210_update_end_site
            </button>
            <button
              onClick={handleF211UpdateEndSiteWithPelementor}
              disabled={isSaving || !formData.pelementor_edits.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium rounded-md transition-colors"
            >
              {isSaving ? 'Updating...' : 'f211_update_end_site_with_pelementor'}
            </button>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Pelementor Edits Data</h3>
            <textarea
              value={formData.pelementor_edits}
              onChange={(e) => handleInputChange('pelementor_edits', e.target.value)}
              rows={20}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm ${
                !validateJsonField(formData.pelementor_edits) 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300'
              }`}
              placeholder='{"modified_elementor_data": "your edits here"}'
            />
            {!validateJsonField(formData.pelementor_edits) && (
              <p className="text-sm text-red-600">Invalid JSON format</p>
            )}
            <p className="text-sm text-gray-500">
              Review and update your Elementor edits before pushing to the end site.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-3">Cached Data</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <pre className="text-xs text-green-800 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                {formData.pelementor_cached || 'No cached data'}
              </pre>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900 mb-3">Edit Data</h3>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <pre className="text-xs text-purple-800 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                {formData.pelementor_edits || 'No edit data'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!hasElementorData && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Elementor Data</h3>
          <p className="text-gray-500 mb-4">
            This content piece doesn't have any Elementor data yet. You can add some using the tabs above.
          </p>
        </div>
      )}

      {/* Bottom Save Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-md transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={resetForm}
            disabled={isSaving || !hasUnsavedChanges}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// Talk to AI Tab Component
interface TalkToAiTabProps {
  gconPiece: GconPiece;
  userInternalId: string;
  pelementorEdits: string;
  onUpdate: (updatedPiece: GconPiece) => void;
}

function TalkToAiTab({ gconPiece, userInternalId, pelementorEdits, onUpdate }: TalkToAiTabProps) {
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [selectedPromptContent, setSelectedPromptContent] = useState<string>('');
  const [pelementorEditsLocal, setPelementorEditsLocal] = useState<string>(pelementorEdits);
  const [actualPromptSubmission, setActualPromptSubmission] = useState<string>('');
  const [response1Raw, setResponse1Raw] = useState<string>(gconPiece.response1_raw || '');
  const [response1MeatExtracted, setResponse1MeatExtracted] = useState<string>(gconPiece.response1_meat_extracted || '');
  const [utilityPrompts, setUtilityPrompts] = useState<any[]>([]);
  const [apiKeySlots, setApiKeySlots] = useState<any[]>([]);
  const [selectedApiKeySlot, setSelectedApiKeySlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [promptMode, setPromptMode] = useState<'utility' | 'manual'>('utility');
  const [manualPromptText, setManualPromptText] = useState<string>('');

  const supabase = createClientComponentClient();

  // Fetch utility prompts and API key slots on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user's own prompts AND public prompts
        const { data: promptsData, error: promptsError } = await supabase
          .from('utility_prompts')
          .select('*')
          .or(`fk_user_id.eq.${userInternalId},is_special_public_prompt.eq.true`)
          .order('prompt_name', { ascending: true });

        if (!promptsError && promptsData) {
          setUtilityPrompts(promptsData);
        }

        // Get publicly shown API key slots
        const { data: apiKeysData, error: apiKeysError } = await supabase
          .from('api_key_slots')
          .select('*')
          .eq('slot_publicly_shown', true)
          .order('slot_name', { ascending: true });

        if (!apiKeysError && apiKeysData) {
          setApiKeySlots(apiKeysData);
          
          // Load saved API key slot from localStorage after slots are loaded
          const savedApiKeySlot = localStorage.getItem('pedtor1_selected_api_key_slot');
          if (savedApiKeySlot && apiKeysData.find(slot => slot.slot_id === savedApiKeySlot)) {
            setSelectedApiKeySlot(savedApiKeySlot);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    if (userInternalId) {
      fetchData();
    }
  }, [userInternalId, supabase]);

  // Function to construct the full prompt with pelementor_edits data
  const constructFullPrompt = (userPrompt: string) => {
    const baseTemplate = `


==========================================================
Here below is my elementor data for the page I'm working on:
==========================================================
${pelementorEditsLocal}`;

    if (userPrompt.trim()) {
      return `${userPrompt}${baseTemplate}`;
    }
    return baseTemplate;
  };

  // Update local pelementor_edits when prop changes
  useEffect(() => {
    setPelementorEditsLocal(pelementorEdits);
  }, [pelementorEdits]);

  // Update actual_prompt_submission when pelementorEditsLocal changes
  useEffect(() => {
    const currentUserPrompt = promptMode === 'utility' ? selectedPromptContent : manualPromptText;
    setActualPromptSubmission(constructFullPrompt(currentUserPrompt));
  }, [pelementorEditsLocal, promptMode, selectedPromptContent, manualPromptText, constructFullPrompt]);

  // Initialize actual_prompt_submission on component mount
  useEffect(() => {
    setActualPromptSubmission(constructFullPrompt(''));
  }, []);

  // Handle prompt selection
  const handlePromptSelection = (promptId: string) => {
    setSelectedPromptId(promptId);
    const selectedPrompt = utilityPrompts.find(p => p.prompt_id === promptId);
    if (selectedPrompt) {
      setSelectedPromptContent(selectedPrompt.prompt_content || '');
      // Automatically update actual_prompt_submission with constructed prompt
      setActualPromptSubmission(constructFullPrompt(selectedPrompt.prompt_content || ''));
    } else {
      setSelectedPromptContent('');
      setActualPromptSubmission(constructFullPrompt(''));
    }
  };

  // Handle prompt mode change
  const handlePromptModeChange = (mode: 'utility' | 'manual') => {
    setPromptMode(mode);
    if (mode === 'utility') {
      // Clear manual input when switching to utility mode
      setManualPromptText('');
      setActualPromptSubmission(constructFullPrompt(selectedPromptContent));
    } else {
      // Clear utility selection when switching to manual mode
      setSelectedPromptId('');
      setSelectedPromptContent('');
      setActualPromptSubmission(constructFullPrompt(manualPromptText));
    }
  };

  // Handle manual prompt text change
  const handleManualPromptChange = (text: string) => {
    setManualPromptText(text);
    if (promptMode === 'manual') {
      setActualPromptSubmission(constructFullPrompt(text));
    }
  };

  // Handle API key slot selection and save to localStorage
  const handleApiKeySlotChange = (slotId: string) => {
    setSelectedApiKeySlot(slotId);
    // Save to localStorage for persistence
    if (slotId) {
      localStorage.setItem('pedtor1_selected_api_key_slot', slotId);
    } else {
      localStorage.removeItem('pedtor1_selected_api_key_slot');
    }
  };

  // Handle AI submission
  const handleSubmitToAI = async () => {
    if (!selectedApiKeySlot || !actualPromptSubmission.trim()) {
      alert('Please select an AI model and enter a prompt.');
      return;
    }

    setLoading(true);
    
    try {
      // Get the selected API key slot info for the model name
      const selectedSlot = apiKeySlots.find(slot => slot.slot_id === selectedApiKeySlot);
      const modelName = selectedSlot?.slot_name || 'Unknown Model';

      console.log('🤖 Submitting to AI:', {
        model: modelName,
        prompt: actualPromptSubmission.substring(0, 100) + '...'
      });

      // Make API call to submit the prompt
      const response = await fetch('/api/submit-to-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slot_id: selectedApiKeySlot,
          prompt: actualPromptSubmission,
          gcon_piece_id: gconPiece.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update the response fields
        setResponse1Raw(result.ai_response || '');
        
        // Update the gcon_piece with the new data in the database
        const updateData = {
          response1_model_used: modelName,
          response1_raw: result.ai_response || '',
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('gcon_pieces')
          .update(updateData)
          .eq('id', gconPiece.id)
          .eq('fk_users_id', userInternalId);

        if (updateError) {
          console.error('Error updating gcon_piece:', updateError);
          alert('AI response received but failed to save to database.');
        } else {
          // Update the local gconPiece state
          const updatedPiece = {
            ...gconPiece,
            ...updateData
          };
          onUpdate(updatedPiece);
          
          console.log('✅ AI response received and saved successfully');
          alert('AI response received and saved successfully!');
        }
      } else {
        throw new Error(result.error || 'AI submission failed');
      }
    } catch (error) {
      console.error('❌ AI submission error:', error);
      alert(`AI submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select AI model to use
        </label>
        <select
          value={selectedApiKeySlot}
          onChange={(e) => handleApiKeySlotChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ width: '700px' }}
        >
          <option value="">-- Select an AI model --</option>
          {apiKeySlots.map((slot) => (
            <option key={slot.slot_id} value={slot.slot_id}>
              {slot.slot_name || `Slot ${slot.slot_id.slice(0, 8)}`}
            </option>
          ))}
        </select>
      </div>

      {/* API Keys Management Link */}
      <div>
        <a
          href="https://snef.me/clevnar3"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline text-sm"
        >
          Manage API Keys - https://snef.me/clevnar3
        </a>
      </div>

      {/* 10px black HR above utility prompt selection */}
      <hr style={{ height: '10px', backgroundColor: 'black', border: 'none' }} />

      {/* OR Button Selection */}
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={() => handlePromptModeChange('utility')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            promptMode === 'utility'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Select Utility Prompt
        </button>
        <span className="text-gray-500 font-medium">OR</span>
        <button
          onClick={() => handlePromptModeChange('manual')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            promptMode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Manual Prompt Entry
        </button>
      </div>

      {/* Utility Prompt Selection (shown when promptMode is 'utility') */}
      {promptMode === 'utility' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select your utility prompt
          </label>
          <select
            value={selectedPromptId}
            onChange={(e) => handlePromptSelection(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ width: '700px' }}
          >
            <option value="">-- Select a utility prompt --</option>
            {utilityPrompts.map((prompt) => (
              <option key={prompt.prompt_id} value={prompt.prompt_id}>
                {prompt.prompt_name || `Prompt ${prompt.prompt_id.slice(0, 8)}`}
                {prompt.is_special_public_prompt && prompt.fk_user_id !== userInternalId ? ' (Public)' : ''}
              </option>
            ))}
          </select>

          {/* Selected prompt content display */}
          {selectedPromptContent && (
            <div className="mt-4">
              <textarea
                value={selectedPromptContent}
                readOnly
                className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm resize-none"
                style={{ width: '700px', height: '100px' }}
                placeholder="Selected prompt content will appear here..."
              />
            </div>
          )}
        </div>
      )}

      {/* Manual Prompt Entry (shown when promptMode is 'manual') */}
      {promptMode === 'manual' && (
        <div>
          <div className="font-bold text-gray-900 mb-2">place your own manual prompt text</div>
          <textarea
            value={manualPromptText}
            onChange={(e) => handleManualPromptChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
            style={{ width: '700px', height: '100px' }}
            placeholder="Enter your manual prompt here..."
          />
        </div>
      )}

      <hr className="border-gray-300" />

      {/* pelementor_edits section */}
      <div>
        <div className="font-bold text-gray-900 mb-2">pelementor_edits</div>
        <textarea
          value={pelementorEditsLocal}
          onChange={(e) => setPelementorEditsLocal(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
          style={{ width: '700px', height: '100px' }}
          placeholder="Pelementor edits data..."
        />
      </div>

      <hr className="border-gray-300" />

      {/* actual_prompt_submission section */}
      <div>
        <div className="font-bold text-gray-900 mb-2">actual_prompt_submission</div>
        <textarea
          value={actualPromptSubmission}
          onChange={(e) => setActualPromptSubmission(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
          style={{ width: '700px', height: '100px' }}
          placeholder="The actual prompt that will be submitted to AI..."
        />
      </div>

      <hr style={{ height: '10px', backgroundColor: 'black', border: 'none' }} />

      {/* response1_model_used section */}
      <div>
        <div className="font-bold text-gray-900 mb-2">response1_model_used</div>
        <input
          type="text"
          value={gconPiece.response1_model_used || ''}
          readOnly
          className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
          style={{ width: '700px' }}
          placeholder="AI model name will appear here..."
        />
      </div>

      <hr className="border-gray-300" />

      {/* response1_raw section */}
      <div>
        <div className="font-bold text-gray-900 mb-2">response1_raw</div>
        <textarea
          value={response1Raw}
          onChange={(e) => setResponse1Raw(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
          style={{ width: '700px', height: '100px' }}
          placeholder="Raw AI response will appear here..."
        />
      </div>

      <hr className="border-gray-300" />

      {/* response1_meat_extracted section */}
      <div>
        <div className="font-bold text-gray-900 mb-2">response1_meat_extracted</div>
        <textarea
          value={response1MeatExtracted}
          onChange={(e) => setResponse1MeatExtracted(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
          style={{ width: '700px', height: '100px' }}
          placeholder="Extracted meaningful content from AI response..."
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={handleSubmitToAI}
          disabled={!actualPromptSubmission.trim() || !selectedApiKeySlot || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-md transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit to AI'}
        </button>
        
        <button
          onClick={() => {
            setSelectedApiKeySlot('');
            setSelectedPromptId('');
            setSelectedPromptContent('');
            setActualPromptSubmission(constructFullPrompt(''));
            setResponse1Raw('');
            setResponse1MeatExtracted('');
            setManualPromptText('');
            setPromptMode('utility');
            // Clear localStorage as well
            localStorage.removeItem('pedtor1_selected_api_key_slot');
          }}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}