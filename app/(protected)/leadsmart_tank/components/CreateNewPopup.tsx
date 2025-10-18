'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateNewPopup({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [formData, setFormData] = useState({
    leadsmart_file_release: '',
    subsheet: '',
    subpart_of_subsheet: '',
    sheet_row_id: '',
    payout_note: '',
    zip_code: '',
    payout: '',
    city_name: '',
    state_code: ''
  });
  
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    try {
      const dataToInsert = {
        ...formData,
        sheet_row_id: formData.sheet_row_id ? Number(formData.sheet_row_id) : null,
        payout: formData.payout ? Number(formData.payout) : null,
        user_id: user.id
      };
      
      const { error } = await supabase
        .from('leadsmart_zip_based_data')
        .insert([dataToInsert]);
      
      if (error) throw error;
      
      onSuccess();
    } catch (error) {
      console.error('Error creating record:', error);
      alert('Failed to create record');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create New Record</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leadsmart File Release
                </label>
                <input
                  type="text"
                  value={formData.leadsmart_file_release}
                  onChange={(e) => handleChange('leadsmart_file_release', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subsheet
                </label>
                <input
                  type="text"
                  value={formData.subsheet}
                  onChange={(e) => handleChange('subsheet', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subpart of Subsheet
                </label>
                <input
                  type="text"
                  value={formData.subpart_of_subsheet}
                  onChange={(e) => handleChange('subpart_of_subsheet', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sheet Row ID
                </label>
                <input
                  type="number"
                  value={formData.sheet_row_id}
                  onChange={(e) => handleChange('sheet_row_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payout Note
                </label>
                <textarea
                  value={formData.payout_note}
                  onChange={(e) => handleChange('payout_note', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => handleChange('zip_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={10}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payout
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payout}
                    onChange={(e) => handleChange('payout', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City Name
                  </label>
                  <input
                    type="text"
                    value={formData.city_name}
                    onChange={(e) => handleChange('city_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State Code
                  </label>
                  <input
                    type="text"
                    value={formData.state_code}
                    onChange={(e) => handleChange('state_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:bg-blue-400"
                disabled={saving}
              >
                {saving ? 'Creating...' : 'Create Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

