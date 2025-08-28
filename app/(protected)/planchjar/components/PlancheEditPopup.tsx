'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface PlancheEditPopupProps {
  isOpen: boolean;
  plancheId?: number; // undefined for new records
  onSave: () => void;
  onClose: () => void;
}

interface PlancheFormData {
  planch_name: string;
  planch_desc: string;
  planch_datum: string;
}

export default function PlancheEditPopup({
  isOpen,
  plancheId,
  onSave,
  onClose
}: PlancheEditPopupProps) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [formData, setFormData] = useState<PlancheFormData>({
    planch_name: '',
    planch_desc: '',
    planch_datum: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing data if editing
  useEffect(() => {
    if (isOpen && plancheId) {
      loadPlancheData();
    } else if (isOpen && !plancheId) {
      // Reset form for new record
      setFormData({
        planch_name: '',
        planch_desc: '',
        planch_datum: ''
      });
    }
  }, [isOpen, plancheId]);

  const loadPlancheData = async () => {
    if (!plancheId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('planches')
        .select('planch_name, planch_desc, planch_datum')
        .eq('planch_id', plancheId)
        .single();

      if (error) throw error;
      
      setFormData({
        planch_name: data.planch_name || '',
        planch_desc: data.planch_desc || '',
        planch_datum: data.planch_datum || ''
      });
    } catch (err) {
      console.error('Error loading planche:', err);
      alert('Failed to load planche data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      if (plancheId) {
        // Update existing record
        const { error } = await supabase
          .from('planches')
          .update({
            planch_name: formData.planch_name || null,
            planch_desc: formData.planch_desc || null,
            planch_datum: formData.planch_datum || null,
            updated_at: new Date().toISOString()
          })
          .eq('planch_id', plancheId);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('planches')
          .insert({
            planch_name: formData.planch_name || null,
            planch_desc: formData.planch_desc || null,
            planch_datum: formData.planch_datum || null,
            user_id: user.id
          });

        if (error) throw error;
      }
      
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving planche:', err);
      alert('Failed to save planche');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      planch_name: '',
      planch_desc: '',
      planch_datum: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            {plancheId ? 'Edit Planche' : 'Create New Planche'}
          </h2>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Planche Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planche Name
                </label>
                <input
                  type="text"
                  value={formData.planch_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, planch_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter planche name..."
                />
              </div>

              {/* Planche Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.planch_desc}
                  onChange={(e) => setFormData(prev => ({ ...prev, planch_desc: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description..."
                />
              </div>

              {/* Planche Datum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum
                </label>
                <textarea
                  value={formData.planch_datum}
                  onChange={(e) => setFormData(prev => ({ ...prev, planch_datum: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Enter datum content..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : (plancheId ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}