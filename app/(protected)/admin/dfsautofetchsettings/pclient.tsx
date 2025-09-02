'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface DFSAutofetchSetting {
  id: number;
  column_name: string;
  display_name: string;
  category: string;
  description: string;
  is_enabled: boolean;
  sort_order: number;
}

interface CategoryGroup {
  category: string;
  settings: DFSAutofetchSetting[];
}

export default function DFSAutofetchSettingsClient() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [settings, setSettings] = useState<DFSAutofetchSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Load settings on component mount
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadSettings();
  }, [user, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dfs_autofetch_settings')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      setSettings(data || []);
    } catch (err) {
      console.error('Error loading DFS autofetch settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (settingId: number, currentValue: boolean) => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('dfs_autofetch_settings')
        .update({ is_enabled: !currentValue })
        .eq('id', settingId);

      if (error) {
        throw error;
      }

      // Update local state
      setSettings(prev => prev.map(setting => 
        setting.id === settingId 
          ? { ...setting, is_enabled: !currentValue }
          : setting
      ));

      setNotification({
        type: 'success',
        message: `Setting ${!currentValue ? 'enabled' : 'disabled'} successfully`
      });

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);

    } catch (err) {
      console.error('Error updating setting:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update setting'
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const bulkToggleCategory = async (category: string, enable: boolean) => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('dfs_autofetch_settings')
        .update({ is_enabled: enable })
        .eq('category', category);

      if (error) {
        throw error;
      }

      // Update local state
      setSettings(prev => prev.map(setting => 
        setting.category === category 
          ? { ...setting, is_enabled: enable }
          : setting
      ));

      setNotification({
        type: 'success',
        message: `All ${category} fields ${enable ? 'enabled' : 'disabled'} successfully`
      });

      setTimeout(() => setNotification(null), 3000);

    } catch (err) {
      console.error('Error bulk updating category:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to bulk update category'
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Group settings by category
  const groupedSettings: CategoryGroup[] = settings.reduce((groups, setting) => {
    const existingGroup = groups.find(g => g.category === setting.category);
    if (existingGroup) {
      existingGroup.settings.push(setting);
    } else {
      groups.push({
        category: setting.category,
        settings: [setting]
      });
    }
    return groups;
  }, [] as CategoryGroup[]);

  // Category display names
  const categoryDisplayNames: { [key: string]: string } = {
    domain: 'Domain Information',
    organic: 'Organic Search Metrics',
    paid: 'Paid Search Metrics', 
    backlinks: 'Backlinks Data',
    metadata: 'Metadata & Technical'
  };

  // Category colors (similar to /drom page styling)
  const categoryColors: { [key: string]: string } = {
    domain: 'bg-blue-50 border-blue-200',
    organic: 'bg-green-50 border-green-200',
    paid: 'bg-yellow-50 border-yellow-200',
    backlinks: 'bg-purple-50 border-purple-200',
    metadata: 'bg-gray-50 border-gray-200'
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading DFS autofetch settings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const totalSettings = settings.length;
  const enabledSettings = settings.filter(s => s.is_enabled).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">DataForSEO Autofetch Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure which fields are automatically fetched when new sites are added to the system.
          </p>
          <div className="mt-2 text-sm text-gray-500">
            {enabledSettings} of {totalSettings} fields enabled
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mx-6 mt-4 max-w-7xl mx-auto px-4 py-3 rounded-md ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Settings Grid */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-8">
          {groupedSettings.map((group) => (
            <div key={group.category} className={`border rounded-lg ${categoryColors[group.category] || 'bg-white border-gray-200'}`}>
              {/* Category Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {categoryDisplayNames[group.category] || group.category}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {group.settings.filter(s => s.is_enabled).length} of {group.settings.length} enabled
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => bulkToggleCategory(group.category, true)}
                      disabled={saving}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Enable All
                    </button>
                    <button
                      onClick={() => bulkToggleCategory(group.category, false)}
                      disabled={saving}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Disable All
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings Table */}
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        Enabled
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Field Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Database Column
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {group.settings.map((setting) => (
                      <tr key={setting.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={setting.is_enabled}
                              onChange={() => toggleSetting(setting.id, setting.is_enabled)}
                              disabled={saving}
                              className="form-checkbox h-5 w-5 text-blue-600 rounded disabled:opacity-50"
                            />
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {setting.display_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 font-mono">
                            {setting.column_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {setting.description}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">How It Works</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• When users add new sites via f71_createsite, the system automatically creates sitesdfs records</li>
            <li>• Only enabled fields above will be fetched from the DataForSEO API</li>
            <li>• This saves API costs by only fetching the data you actually need</li>
            <li>• Changes take effect immediately for new sites added</li>
            <li>• Raw API responses are always stored for future data extraction</li>
          </ul>
        </div>
      </div>
    </div>
  );
}