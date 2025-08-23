'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CustomColor {
  color_id: string;
  color_name: string;
  color_ref_code: string;
  hex_value: string;
  created_at: string;
  updated_at: string;
}

export default function Colors1Client() {
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [colorName, setColorName] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [customColors, setCustomColors] = useState<CustomColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{[key: string]: CustomColor}>({});
  
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (user) {
      fetchCustomColors();
    }
  }, [user]);

  const fetchCustomColors = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: colors, error: colorsError } = await supabase
        .from('custom_colors')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (colorsError) throw colorsError;
      setCustomColors(colors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch custom colors');
      setCustomColors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveColor = async () => {
    if (!colorName.trim() || !colorCode.trim()) {
      setError('Color name and code are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const colorData = {
        color_name: colorName.trim(),
        color_ref_code: colorCode.trim(),
        hex_value: selectedColor
      };

      const { error: insertError } = await supabase
        .from('custom_colors')
        .insert([colorData]);

      if (insertError) throw insertError;

      // Reset form
      setColorName('');
      setColorCode('');
      setSelectedColor('#3b82f6');
      setShowAddForm(false);
      
      // Refresh list
      await fetchCustomColors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save custom color');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteColor = async (colorId: string) => {
    if (!confirm('Are you sure you want to delete this custom color?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('custom_colors')
        .delete()
        .eq('color_id', colorId);

      if (deleteError) throw deleteError;
      
      // Refresh list
      await fetchCustomColors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete custom color');
    }
  };

  const handleEditStart = (color: CustomColor) => {
    setEditingColor(color.color_id);
    setEditValues({
      ...editValues,
      [color.color_id]: { ...color }
    });
  };

  const handleEditCancel = (colorId: string) => {
    setEditingColor(null);
    const newEditValues = { ...editValues };
    delete newEditValues[colorId];
    setEditValues(newEditValues);
  };

  const handleEditChange = (colorId: string, field: keyof CustomColor, value: string) => {
    setEditValues({
      ...editValues,
      [colorId]: {
        ...editValues[colorId],
        [field]: value
      }
    });
  };

  const handleEditSave = async (colorId: string) => {
    const editedColor = editValues[colorId];
    if (!editedColor || !editedColor.color_name.trim() || !editedColor.color_ref_code.trim()) {
      setError('Color name and code are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('custom_colors')
        .update({
          color_name: editedColor.color_name.trim(),
          color_ref_code: editedColor.color_ref_code.trim(),
          hex_value: editedColor.hex_value
        })
        .eq('color_id', colorId);

      if (updateError) throw updateError;

      // Clear editing state
      setEditingColor(null);
      const newEditValues = { ...editValues };
      delete newEditValues[colorId];
      setEditValues(newEditValues);
      
      // Refresh list
      await fetchCustomColors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update custom color');
    } finally {
      setSaving(false);
    }
  };


  if (loading) return <div className="p-6">Loading custom colors...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Custom Color Management</h1>
      <p className="text-sm text-gray-600 mb-6">
        <span className="font-bold">Admin Custom Styling System</span> - Create custom colors and codes for app-wide styling
      </p>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}


      {/* Add New Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New
        </button>
      </div>

      {/* Color Creation Form - Conditional */}
      {showAddForm && (
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Create New Custom Color</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Color Picker */}
            <div>
              <label htmlFor="colorPicker" className="block text-sm font-medium text-gray-700 mb-2">
                Select Color
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  id="colorPicker"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="h-12 w-20 rounded-md border border-gray-300 cursor-pointer"
                />
                <div 
                  className="h-12 w-32 rounded-md border border-gray-300 shadow-sm"
                  style={{ backgroundColor: selectedColor }}
                ></div>
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            {/* Color Name */}
            <div>
              <label htmlFor="colorName" className="block text-sm font-medium text-gray-700 mb-2">
                Color Name
              </label>
              <input
                type="text"
                id="colorName"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g. Primary Blue"
                required
              />
            </div>

            {/* Color Code */}
            <div>
              <label htmlFor="colorCode" className="block text-sm font-medium text-gray-700 mb-2">
                color_ref_code
              </label>
              <input
                type="text"
                id="colorCode"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g. primary-blue"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Use lowercase letters, numbers, and hyphens only
              </p>
            </div>
          </div>

          {/* Save and Cancel Buttons */}
          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleSaveColor}
              disabled={saving || !colorName.trim() || !colorCode.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Custom Color'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setColorName('');
                setColorCode('');
                setSelectedColor('#3b82f6');
                setError(null);
              }}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Custom Colors List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Existing Custom Colors</h2>
          <p className="text-sm text-gray-600 mt-1">
            {customColors.length} custom color{customColors.length !== 1 ? 's' : ''} defined
          </p>
        </div>

        {customColors.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-400">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-5L9 9a2 2 0 00-2 2v10z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No custom colors created</h3>
            <p className="text-sm text-gray-500">Create your first custom color using the form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    color_ref_code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hex Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customColors.map((color, index) => {
                  const isEditing = editingColor === color.color_id;
                  const editValue = editValues[color.color_id] || color;
                  
                  return (
                    <tr key={color.color_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="h-8 w-8 rounded-full border border-gray-300 shadow-sm"
                            style={{ backgroundColor: isEditing ? editValue.hex_value : color.hex_value }}
                          ></div>
                          <div 
                            className="h-6 w-16 rounded border border-gray-300"
                            style={{ backgroundColor: isEditing ? editValue.hex_value : color.hex_value }}
                          ></div>
                          {isEditing && (
                            <input
                              type="color"
                              value={editValue.hex_value}
                              onChange={(e) => handleEditChange(color.color_id, 'hex_value', e.target.value)}
                              className="h-8 w-12 rounded border border-gray-300 cursor-pointer"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue.color_name}
                            onChange={(e) => handleEditChange(color.color_id, 'color_name', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        ) : (
                          color.color_name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue.color_ref_code}
                            onChange={(e) => handleEditChange(color.color_id, 'color_ref_code', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                          />
                        ) : (
                          color.color_ref_code
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue.hex_value}
                            onChange={(e) => handleEditChange(color.color_id, 'hex_value', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                            placeholder="#000000"
                          />
                        ) : (
                          color.hex_value
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(color.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleEditSave(color.color_id)}
                                disabled={saving}
                                className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50"
                              >
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => handleEditCancel(color.color_id)}
                                disabled={saving}
                                className="text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditStart(color)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteColor(color.color_id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">How to Use Custom Colors</h3>
        <div className="text-sm text-blue-700">
          <p className="mb-2">
            Colors are applied automatically when you create them with the correct reference codes:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Native tier colors:</strong> <code>nativetier_nwjar_bgcolor1</code>, <code>nativetier_gconjar_bgcolor1</code></li>
            <li><strong>Header colors:</strong> <code>headerbg1_nwjar1</code>, <code>headerbg1_gconjar1</code>, <code>headerbg_pedbar</code>, <code>headerbg1_pedtor</code></li>
            <li><strong>Changes apply immediately</strong> - no regeneration needed</li>
            <li>Colors are fetched directly from the database in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}