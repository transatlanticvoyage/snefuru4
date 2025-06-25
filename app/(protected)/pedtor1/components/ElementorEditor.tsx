'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const [activeTab, setActiveTab] = useState<'cached' | 'edits' | 'updateEndSite' | 'comparison'>('cached');
  
  const supabase = createClientComponentClient();

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
            onClick={() => setActiveTab('cached')}
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
            onClick={() => setActiveTab('edits')}
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
            onClick={() => setActiveTab('updateEndSite')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'updateEndSite'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Update End Site
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
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

      {activeTab === 'updateEndSite' && (
        <div className="space-y-4">
          <button
            onClick={handleF210UpdateEndSite}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md transition-colors"
          >
            f210_update_end_site
          </button>
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