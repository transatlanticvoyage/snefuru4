'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface KetchWidthSetting {
  setting_id: string;
  rel_ui_table_grid: string;
  rel_db_table: string;
  rel_db_field: string;
  width_pon: number;
  is_kustom_col: boolean;
  kustom_col_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function Ketch1AdminPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<KetchWidthSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGrid, setSelectedGrid] = useState<string>('all');
  
  // Form state for adding/editing
  const [formData, setFormData] = useState({
    rel_ui_table_grid: '',
    rel_db_table: '',
    rel_db_field: '',
    width_pon: 150,
    is_kustom_col: false,
    kustom_col_id: ''
  });

  const supabase = createClientComponentClient();

  // Fetch settings from Supabase
  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('ketch_width_settings')
        .select('*')
        .order('rel_ui_table_grid')
        .order('rel_db_field');
      
      if (selectedGrid !== 'all') {
        query = query.eq('rel_ui_table_grid', selectedGrid);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setSettings(data || []);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Trigger CSS regeneration
  const triggerCSSUpdate = async () => {
    try {
      const response = await fetch('https://valueoffershq.com/wp-json/snefuru/v1/ketch/trigger-css-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`CSS updated successfully! Generated CSS for ${result.data?.settings_count || 0} settings.`);
      } else {
        throw new Error('Failed to trigger CSS update');
      }
    } catch (err) {
      console.error('Error triggering CSS update:', err);
      alert('Failed to trigger CSS update. Check console for details.');
    }
  };

  // Add new setting
  const addSetting = async () => {
    try {
      const { error } = await supabase
        .from('ketch_width_settings')
        .insert([{
          ...formData,
          kustom_col_id: formData.is_kustom_col ? formData.kustom_col_id : null
        }]);

      if (error) throw error;

      setShowAddForm(false);
      setFormData({
        rel_ui_table_grid: '',
        rel_db_table: '',
        rel_db_field: '',
        width_pon: 150,
        is_kustom_col: false,
        kustom_col_id: ''
      });
      
      await fetchSettings();
    } catch (err) {
      console.error('Error adding setting:', err);
      alert('Error adding setting: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Update setting
  const updateSetting = async (id: string, updates: Partial<KetchWidthSetting>) => {
    try {
      const { error } = await supabase
        .from('ketch_width_settings')
        .update(updates)
        .eq('setting_id', id);

      if (error) throw error;

      setEditingId(null);
      await fetchSettings();
    } catch (err) {
      console.error('Error updating setting:', err);
      alert('Error updating setting: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Delete setting
  const deleteSetting = async (id: string) => {
    if (!confirm('Are you sure you want to delete this setting?')) return;

    try {
      const { error } = await supabase
        .from('ketch_width_settings')
        .delete()
        .eq('setting_id', id);

      if (error) throw error;

      await fetchSettings();
    } catch (err) {
      console.error('Error deleting setting:', err);
      alert('Error deleting setting: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user, selectedGrid]);

  // Get unique grid names for filter
  const uniqueGrids = Array.from(new Set(settings.map(s => s.rel_ui_table_grid))).sort();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ketch Width Manager</h1>
            <p className="text-gray-600 mt-2">Direct database management for UI table column widths</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              ← Back to Admin
            </Link>
            <button
              onClick={triggerCSSUpdate}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              🔄 Regenerate CSS
            </button>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by UI Grid:</label>
              <select
                value={selectedGrid}
                onChange={(e) => setSelectedGrid(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Grids</option>
                {uniqueGrids.map(grid => (
                  <option key={grid} value={grid}>{grid}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              ➕ Add New Setting
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-2xl font-bold text-blue-600">{settings.length}</div>
              <div className="text-sm text-blue-800">Total Settings</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-2xl font-bold text-green-600">{uniqueGrids.length}</div>
              <div className="text-sm text-green-800">UI Table Grids</div>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {settings.filter(s => s.is_kustom_col).length}
              </div>
              <div className="text-sm text-purple-800">Custom Columns</div>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(settings.reduce((sum, s) => sum + s.width_pon, 0) / settings.length) || 0}px
              </div>
              <div className="text-sm text-orange-800">Average Width</div>
            </div>
          </div>
        </div>

        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4">Add New Width Setting</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UI Table Grid</label>
                  <input
                    type="text"
                    value={formData.rel_ui_table_grid}
                    onChange={(e) => setFormData({...formData, rel_ui_table_grid: e.target.value})}
                    placeholder="e.g., mesagen, nwpi_content"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Database Table</label>
                  <input
                    type="text"
                    value={formData.rel_db_table}
                    onChange={(e) => setFormData({...formData, rel_db_table: e.target.value})}
                    placeholder="e.g., gcon_pieces, nwpi_content"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Database Field</label>
                  <input
                    type="text"
                    value={formData.rel_db_field}
                    onChange={(e) => setFormData({...formData, rel_db_field: e.target.value})}
                    placeholder="e.g., mud_title, post_title"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width (pixels)</label>
                  <input
                    type="number"
                    value={formData.width_pon}
                    onChange={(e) => setFormData({...formData, width_pon: parseInt(e.target.value) || 150})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_kustom_col}
                    onChange={(e) => setFormData({...formData, is_kustom_col: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Custom Column</label>
                </div>
                
                {formData.is_kustom_col && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Column ID</label>
                    <input
                      type="text"
                      value={formData.kustom_col_id}
                      onChange={(e) => setFormData({...formData, kustom_col_id: e.target.value})}
                      placeholder="e.g., actions_col"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addSetting}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add Setting
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Width Settings</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">Loading settings...</div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600">Error: {error}</div>
              <button
                onClick={fetchSettings}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Try Again
              </button>
            </div>
          ) : settings.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">No settings found for the selected filter.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UI Grid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DB Table
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Field
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Width
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {settings.map((setting) => (
                    <tr key={setting.setting_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {setting.rel_ui_table_grid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {setting.rel_db_table}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {setting.rel_db_field}
                        {setting.is_kustom_col && (
                          <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                            Custom: {setting.kustom_col_id}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingId === setting.setting_id ? (
                          <input
                            type="number"
                            defaultValue={setting.width_pon}
                            onBlur={(e) => {
                              const newWidth = parseInt(e.target.value) || setting.width_pon;
                              updateSetting(setting.setting_id, { width_pon: newWidth });
                            }}
                            className="w-20 border border-gray-300 rounded px-2 py-1"
                          />
                        ) : (
                          <span className="font-medium">{setting.width_pon}px</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {setting.is_kustom_col ? (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Custom</span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Database</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingId(editingId === setting.setting_id ? null : setting.setting_id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {editingId === setting.setting_id ? 'Cancel' : 'Edit'}
                          </button>
                          <button
                            onClick={() => deleteSetting(setting.setting_id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CSS Preview */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Generated CSS Preview</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
            <div className="text-gray-400">/* Preview of generated CSS classes */</div>
            {uniqueGrids.map(grid => {
              const gridSettings = settings.filter(s => s.rel_ui_table_grid === grid);
              return (
                <div key={grid} className="mt-2">
                  <div className="text-blue-400">/* {grid} UI Table Grid */</div>
                  {gridSettings.slice(0, 3).map(setting => (
                    <div key={setting.setting_id} className="text-green-400">
                      .ketch-{grid} .ketch-col-{setting.is_kustom_col ? setting.kustom_col_id : setting.rel_db_field} {'{'}
                      <div className="ml-4">width: {setting.width_pon}px;</div>
                      {'}'}
                    </div>
                  ))}
                  {gridSettings.length > 3 && (
                    <div className="text-gray-500">... and {gridSettings.length - 3} more</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}