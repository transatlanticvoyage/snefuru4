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
  image_pack1: any;
  created_at: string;
  updated_at: string;
}

interface GconPieceEditorProps {
  gconPiece: GconPiece;
  userInternalId: string;
  onUpdate: (updatedPiece: GconPiece) => void;
}

export default function GconPieceEditor({ gconPiece, userInternalId, onUpdate }: GconPieceEditorProps) {
  const [formData, setFormData] = useState({
    meta_title: gconPiece.meta_title || '',
    h1title: gconPiece.h1title || '',
    pgb_h1title: gconPiece.pgb_h1title || '',
    corpus1: gconPiece.corpus1 || '',
    corpus2: gconPiece.corpus2 || '',
    asn_sitespren_base: gconPiece.asn_sitespren_base || '',
    asn_nwpi_posts_id: gconPiece.asn_nwpi_posts_id || '',
    image_pack1: gconPiece.image_pack1 ? JSON.stringify(gconPiece.image_pack1, null, 2) : ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
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

  const handleSave = async () => {
    setIsSaving(true);
    setNotification(null);

    // Validate JSON field
    if (!validateJsonField(formData.image_pack1)) {
      setNotification({
        type: 'error',
        message: 'Invalid JSON format in image_pack1 field'
      });
      setIsSaving(false);
      return;
    }

    try {
      // Parse image_pack1 JSON or set to null if empty
      let parsedImagePack1 = null;
      if (formData.image_pack1.trim()) {
        parsedImagePack1 = JSON.parse(formData.image_pack1);
      }

      // Prepare update data
      const updateData = {
        meta_title: formData.meta_title || null,
        h1title: formData.h1title || null,
        pgb_h1title: formData.pgb_h1title || null,
        corpus1: formData.corpus1 || null,
        corpus2: formData.corpus2 || null,
        asn_sitespren_base: formData.asn_sitespren_base || null,
        asn_nwpi_posts_id: formData.asn_nwpi_posts_id || null,
        image_pack1: parsedImagePack1,
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
          message: 'Changes saved successfully!'
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
      meta_title: gconPiece.meta_title || '',
      h1title: gconPiece.h1title || '',
      pgb_h1title: gconPiece.pgb_h1title || '',
      corpus1: gconPiece.corpus1 || '',
      corpus2: gconPiece.corpus2 || '',
      asn_sitespren_base: gconPiece.asn_sitespren_base || '',
      asn_nwpi_posts_id: gconPiece.asn_nwpi_posts_id || '',
      image_pack1: gconPiece.image_pack1 ? JSON.stringify(gconPiece.image_pack1, null, 2) : ''
    });
    setHasUnsavedChanges(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
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

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Site Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="asn_sitespren_base" className="block text-sm font-medium text-gray-700 mb-2">
              Site Assignment (asn_sitespren_base)
            </label>
            <input
              type="text"
              id="asn_sitespren_base"
              value={formData.asn_sitespren_base}
              onChange={(e) => handleInputChange('asn_sitespren_base', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., rnr1.ksit.me"
            />
          </div>
          <div>
            <label htmlFor="asn_nwpi_posts_id" className="block text-sm font-medium text-gray-700 mb-2">
              Page Assignment (asn_nwpi_posts_id)
            </label>
            <input
              type="text"
              id="asn_nwpi_posts_id"
              value={formData.asn_nwpi_posts_id}
              onChange={(e) => handleInputChange('asn_nwpi_posts_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., example.com->postid562"
            />
          </div>
        </div>

        {/* Meta Title */}
        <div>
          <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 mb-2">
            Meta Title
          </label>
          <input
            type="text"
            id="meta_title"
            value={formData.meta_title}
            onChange={(e) => handleInputChange('meta_title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter meta title..."
          />
        </div>

        {/* H1 Title */}
        <div>
          <label htmlFor="h1title" className="block text-sm font-medium text-gray-700 mb-2">
            H1 Title
          </label>
          <input
            type="text"
            id="h1title"
            value={formData.h1title}
            onChange={(e) => handleInputChange('h1title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter H1 title..."
          />
        </div>

        {/* PGB H1 Title */}
        <div>
          <label htmlFor="pgb_h1title" className="block text-sm font-medium text-gray-700 mb-2">
            PGB H1 Title
          </label>
          <input
            type="text"
            id="pgb_h1title"
            value={formData.pgb_h1title}
            onChange={(e) => handleInputChange('pgb_h1title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter PGB H1 title..."
          />
        </div>

        {/* Corpus 1 */}
        <div>
          <label htmlFor="corpus1" className="block text-sm font-medium text-gray-700 mb-2">
            Corpus 1
          </label>
          <textarea
            id="corpus1"
            value={formData.corpus1}
            onChange={(e) => handleInputChange('corpus1', e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter main content..."
          />
        </div>

        {/* Corpus 2 */}
        <div>
          <label htmlFor="corpus2" className="block text-sm font-medium text-gray-700 mb-2">
            Corpus 2
          </label>
          <textarea
            id="corpus2"
            value={formData.corpus2}
            onChange={(e) => handleInputChange('corpus2', e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter additional content..."
          />
        </div>

        {/* Image Pack 1 (JSON) */}
        <div>
          <label htmlFor="image_pack1" className="block text-sm font-medium text-gray-700 mb-2">
            Image Pack 1 (JSON)
          </label>
          <textarea
            id="image_pack1"
            value={formData.image_pack1}
            onChange={(e) => handleInputChange('image_pack1', e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
              !validateJsonField(formData.image_pack1) 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder='{"key": "value"}'
          />
          {!validateJsonField(formData.image_pack1) && (
            <p className="mt-1 text-sm text-red-600">Invalid JSON format</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Enter valid JSON or leave empty. Format will be validated before saving.
          </p>
        </div>
      </div>

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