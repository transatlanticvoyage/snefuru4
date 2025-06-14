'use client';

import { useState } from 'react';

interface SitesprenRecord {
  id: string;
  created_at: string;
  sitespren_base: string | null;
  true_root_domain: string | null;
  full_subdomain: string | null;
  webproperty_type: string | null;
  fk_users_id: string;
  updated_at: string | null;
  wpuser1: string | null;
  wppass1: string | null;
  wp_plugin_installed1: boolean | null;
  wp_plugin_connected2: boolean | null;
  fk_domreg_hostaccount: string | null;
  is_wp_site: boolean | null;
}

interface SitesprenEditorProps {
  sitesprenRecord: SitesprenRecord;
  userInternalId: string;
  onUpdate: (updatedRecord: SitesprenRecord) => void;
}

export default function SitesprenEditor({ sitesprenRecord, userInternalId, onUpdate }: SitesprenEditorProps) {
  const [formData, setFormData] = useState({
    sitespren_base: sitesprenRecord.sitespren_base || '',
    true_root_domain: sitesprenRecord.true_root_domain || '',
    full_subdomain: sitesprenRecord.full_subdomain || '',
    webproperty_type: sitesprenRecord.webproperty_type || '',
    wpuser1: sitesprenRecord.wpuser1 || '',
    wppass1: sitesprenRecord.wppass1 || '',
    wp_plugin_installed1: sitesprenRecord.wp_plugin_installed1 || false,
    wp_plugin_connected2: sitesprenRecord.wp_plugin_connected2 || false,
    fk_domreg_hostaccount: sitesprenRecord.fk_domreg_hostaccount || '',
    is_wp_site: sitesprenRecord.is_wp_site || false
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setNotification(null);

    try {
      const response = await fetch('/api/update_sitespren', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_id: sitesprenRecord.id,
          user_internal_id: userInternalId,
          updates: {
            true_root_domain: formData.true_root_domain || null,
            full_subdomain: formData.full_subdomain || null,
            webproperty_type: formData.webproperty_type || null,
            wpuser1: formData.wpuser1 || null,
            wppass1: formData.wppass1 || null,
            wp_plugin_installed1: formData.wp_plugin_installed1,
            wp_plugin_connected2: formData.wp_plugin_connected2,
            fk_domreg_hostaccount: formData.fk_domreg_hostaccount || null,
            is_wp_site: formData.is_wp_site
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Site details updated successfully!'
        });
        setHasUnsavedChanges(false);
        onUpdate(result.data);
        
        // Clear success notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to update site details'
        });
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
      sitespren_base: sitesprenRecord.sitespren_base || '',
      true_root_domain: sitesprenRecord.true_root_domain || '',
      full_subdomain: sitesprenRecord.full_subdomain || '',
      webproperty_type: sitesprenRecord.webproperty_type || '',
      wpuser1: sitesprenRecord.wpuser1 || '',
      wppass1: sitesprenRecord.wppass1 || '',
      wp_plugin_installed1: sitesprenRecord.wp_plugin_installed1 || false,
      wp_plugin_connected2: sitesprenRecord.wp_plugin_connected2 || false,
      fk_domreg_hostaccount: sitesprenRecord.fk_domreg_hostaccount || '',
      is_wp_site: sitesprenRecord.is_wp_site || false
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
        {/* Site Base (Read Only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Site Base (Read Only)
          </label>
          <input
            type="text"
            value={formData.sitespren_base}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <p className="mt-1 text-sm text-gray-500">
            The site base cannot be changed after creation
          </p>
        </div>

        {/* Domain Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="true_root_domain" className="block text-sm font-medium text-gray-700 mb-2">
              True Root Domain
            </label>
            <input
              type="text"
              id="true_root_domain"
              value={formData.true_root_domain}
              onChange={(e) => handleInputChange('true_root_domain', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example.com"
            />
          </div>
          <div>
            <label htmlFor="full_subdomain" className="block text-sm font-medium text-gray-700 mb-2">
              Full Subdomain
            </label>
            <input
              type="text"
              id="full_subdomain"
              value={formData.full_subdomain}
              onChange={(e) => handleInputChange('full_subdomain', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="www.example.com"
            />
          </div>
        </div>

        {/* Web Property Type */}
        <div>
          <label htmlFor="webproperty_type" className="block text-sm font-medium text-gray-700 mb-2">
            Web Property Type
          </label>
          <select
            id="webproperty_type"
            value={formData.webproperty_type}
            onChange={(e) => handleInputChange('webproperty_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select type...</option>
            <option value="website">Website</option>
            <option value="social">Social Media</option>
            <option value="ecommerce">E-commerce</option>
            <option value="blog">Blog</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* WordPress Credentials */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">WordPress Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="wpuser1" className="block text-sm font-medium text-gray-700 mb-2">
                WordPress Username
              </label>
              <input
                type="text"
                id="wpuser1"
                value={formData.wpuser1}
                onChange={(e) => handleInputChange('wpuser1', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="WordPress username"
              />
            </div>
            <div>
              <label htmlFor="wppass1" className="block text-sm font-medium text-gray-700 mb-2">
                WordPress Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="wppass1"
                  value={formData.wppass1}
                  onChange={(e) => handleInputChange('wppass1', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="WordPress password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          </div>

          {/* WordPress Plugin Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="wp_plugin_installed1"
                checked={formData.wp_plugin_installed1}
                onChange={(e) => handleInputChange('wp_plugin_installed1', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="wp_plugin_installed1" className="ml-2 block text-sm text-gray-900">
                WordPress Plugin Installed
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="wp_plugin_connected2"
                checked={formData.wp_plugin_connected2}
                onChange={(e) => handleInputChange('wp_plugin_connected2', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="wp_plugin_connected2" className="ml-2 block text-sm text-gray-900">
                WordPress Plugin Connected
              </label>
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fk_domreg_hostaccount" className="block text-sm font-medium text-gray-700 mb-2">
              Domain Registration/Host Account ID
            </label>
            <input
              type="text"
              id="fk_domreg_hostaccount"
              value={formData.fk_domreg_hostaccount}
              onChange={(e) => handleInputChange('fk_domreg_hostaccount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Host account UUID"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_wp_site"
              checked={formData.is_wp_site}
              onChange={(e) => handleInputChange('is_wp_site', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_wp_site" className="ml-2 block text-sm text-gray-900">
              Is WordPress Site
            </label>
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
        </div>
      </div>
    </div>
  );
}