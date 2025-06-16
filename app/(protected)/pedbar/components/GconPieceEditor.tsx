'use client';

import { useState, useEffect } from 'react';
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

interface ImagePlanBatch {
  id: string;
  name: string | null;
  note1: string | null;
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
    asn_imgplanbatch_id: gconPiece.asn_imgplanbatch_id || '',
    image_pack1: gconPiece.image_pack1 ? JSON.stringify(gconPiece.image_pack1, null, 2) : '',
    pelementor_cached: gconPiece.pelementor_cached ? JSON.stringify(gconPiece.pelementor_cached, null, 2) : '',
    pelementor_edits: gconPiece.pelementor_edits ? JSON.stringify(gconPiece.pelementor_edits, null, 2) : '',
    pub_status: gconPiece.pub_status || '',
    date_time_pub_carry: gconPiece.date_time_pub_carry ? gconPiece.date_time_pub_carry.split('T')[0] : '',
    pageslug: gconPiece.pageslug || '',
    pageurl: gconPiece.pageurl || ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [imagePlanBatches, setImagePlanBatches] = useState<ImagePlanBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchImagePlanBatches = async () => {
      try {
        const { data, error } = await supabase
          .from('images_plans_batches')
          .select('id, name, note1')
          .eq('rel_users_id', userInternalId)
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching image plan batches:', error);
        } else {
          setImagePlanBatches(data || []);
        }
      } catch (err) {
        console.error('Error in fetchImagePlanBatches:', err);
      } finally {
        setBatchesLoading(false);
      }
    };

    fetchImagePlanBatches();
  }, [userInternalId, supabase]);

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

    // Validate JSON fields
    if (!validateJsonField(formData.image_pack1)) {
      setNotification({
        type: 'error',
        message: 'Invalid JSON format in image_pack1 field'
      });
      setIsSaving(false);
      return;
    }

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
      let parsedImagePack1 = null;
      if (formData.image_pack1.trim()) {
        parsedImagePack1 = JSON.parse(formData.image_pack1);
      }

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
        meta_title: formData.meta_title || null,
        h1title: formData.h1title || null,
        pgb_h1title: formData.pgb_h1title || null,
        corpus1: formData.corpus1 || null,
        corpus2: formData.corpus2 || null,
        asn_sitespren_base: formData.asn_sitespren_base || null,
        asn_nwpi_posts_id: formData.asn_nwpi_posts_id || null,
        asn_imgplanbatch_id: formData.asn_imgplanbatch_id || null,
        image_pack1: parsedImagePack1,
        pelementor_cached: parsedPelementorCached,
        pelementor_edits: parsedPelementorEdits,
        pub_status: formData.pub_status || null,
        date_time_pub_carry: formData.date_time_pub_carry ? new Date(formData.date_time_pub_carry).toISOString() : null,
        pageslug: formData.pageslug || null,
        pageurl: formData.pageurl || null,
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
      asn_imgplanbatch_id: gconPiece.asn_imgplanbatch_id || '',
      image_pack1: gconPiece.image_pack1 ? JSON.stringify(gconPiece.image_pack1, null, 2) : '',
      pelementor_cached: gconPiece.pelementor_cached ? JSON.stringify(gconPiece.pelementor_cached, null, 2) : '',
      pelementor_edits: gconPiece.pelementor_edits ? JSON.stringify(gconPiece.pelementor_edits, null, 2) : '',
      pub_status: gconPiece.pub_status || '',
      date_time_pub_carry: gconPiece.date_time_pub_carry ? gconPiece.date_time_pub_carry.split('T')[0] : '',
      pageslug: gconPiece.pageslug || '',
      pageurl: gconPiece.pageurl || ''
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
        <a
          href={`/pedtor1?id=${gconPiece.id}`}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors text-center"
        >
          pedtor1
        </a>
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

        {/* Image Plan Batch Assignment */}
        <div>
          <label htmlFor="asn_imgplanbatch_id" className="block text-sm font-medium text-gray-700 mb-2">
            Image Plan Batch Assignment (asn_imgplanbatch_id)
          </label>
          <select
            id="asn_imgplanbatch_id"
            value={formData.asn_imgplanbatch_id}
            onChange={(e) => handleInputChange('asn_imgplanbatch_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={batchesLoading}
          >
            <option value="" disabled className="text-gray-500 font-medium">
              id - name - note1
            </option>
            <option value="">Select a batch...</option>
            {imagePlanBatches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.id} - {batch.name || 'N/A'} - {batch.note1 || 'N/A'}
              </option>
            ))}
          </select>
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

        {/* Pelementor Cached (JSON) */}
        <div>
          <label htmlFor="pelementor_cached" className="block text-sm font-medium text-gray-700 mb-2">
            Pelementor Cached (JSON)
          </label>
          <textarea
            id="pelementor_cached"
            value={formData.pelementor_cached}
            onChange={(e) => handleInputChange('pelementor_cached', e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
              !validateJsonField(formData.pelementor_cached) 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder='{"key": "value"}'
          />
          {!validateJsonField(formData.pelementor_cached) && (
            <p className="mt-1 text-sm text-red-600">Invalid JSON format</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Cached Elementor data. Enter valid JSON or leave empty.
          </p>
        </div>

        {/* Pelementor Edits (JSON) */}
        <div>
          <label htmlFor="pelementor_edits" className="block text-sm font-medium text-gray-700 mb-2">
            Pelementor Edits (JSON)
          </label>
          <textarea
            id="pelementor_edits"
            value={formData.pelementor_edits}
            onChange={(e) => handleInputChange('pelementor_edits', e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
              !validateJsonField(formData.pelementor_edits) 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder='{"key": "value"}'
          />
          {!validateJsonField(formData.pelementor_edits) && (
            <p className="mt-1 text-sm text-red-600">Invalid JSON format</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Elementor edit data. Enter valid JSON or leave empty.
          </p>
        </div>

        {/* Publishing and URL Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pub_status" className="block text-sm font-medium text-gray-700 mb-2">
              Publication Status
            </label>
            <select
              id="pub_status"
              value={formData.pub_status}
              onChange={(e) => handleInputChange('pub_status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select status...</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="imported_from_nwpi">Imported from NWPI</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label htmlFor="date_time_pub_carry" className="block text-sm font-medium text-gray-700 mb-2">
              Publication Date
            </label>
            <input
              type="date"
              id="date_time_pub_carry"
              value={formData.date_time_pub_carry}
              onChange={(e) => handleInputChange('date_time_pub_carry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Page Slug and URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pageslug" className="block text-sm font-medium text-gray-700 mb-2">
              Page Slug
            </label>
            <input
              type="text"
              id="pageslug"
              value={formData.pageslug}
              onChange={(e) => handleInputChange('pageslug', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., my-page-slug"
            />
          </div>
          <div>
            <label htmlFor="pageurl" className="block text-sm font-medium text-gray-700 mb-2">
              Page URL
            </label>
            <input
              type="url"
              id="pageurl"
              value={formData.pageurl}
              onChange={(e) => handleInputChange('pageurl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/page"
            />
          </div>
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
          <a
            href={`/pedtor1?id=${gconPiece.id}`}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors text-center"
          >
            pedtor1
          </a>
        </div>
      </div>
    </div>
  );
}