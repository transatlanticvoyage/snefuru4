'use client';

import { useState, useEffect } from 'react';

export default function RuplinApiKeysPage() {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    document.title = 'API Keys - Ruplin WP Plugin - Snefuru';
  }, []);

  const handleSave = () => {
    // Backend functionality will be implemented later
    console.log('Save API Key:', apiKey);
    alert('Save functionality will be implemented later');
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          API Keys - Ruplin WP Plugin
        </h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <label 
              htmlFor="api-key" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Ruplin API Key
            </label>
            <input
              id="api-key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Ruplin API key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}