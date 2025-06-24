'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function RuplinApiKeysPage() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'API Keys - Ruplin WP Plugin - Snefuru';
  }, []);

  useEffect(() => {
    const fetchApiKey = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('ruplin_api_key_1')
          .eq('auth_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching API key:', error);
        } else {
          setApiKey(data?.ruplin_api_key_1 || '');
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, [user?.id, supabase]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      // Show success feedback
      const button = document.getElementById('copy-button');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.className = button.className.replace('bg-gray-600 hover:bg-gray-700', 'bg-green-600 hover:bg-green-700');
        setTimeout(() => {
          button.textContent = originalText;
          button.className = button.className.replace('bg-green-600 hover:bg-green-700', 'bg-gray-600 hover:bg-gray-700');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy to clipboard. Please manually select and copy the key.');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            API Keys - Ruplin WP Plugin
          </h1>
          <div className="bg-white shadow rounded-lg p-6">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

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
              ruplin_api_key_1
            </label>
            <div className="flex gap-2">
              <input
                id="api-key"
                type="text"
                value={apiKey}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                id="copy-button"
                onClick={handleCopy}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Copy
              </button>
            </div>
            {!apiKey && (
              <p className="mt-2 text-sm text-gray-500">
                No API key found. This may be an existing account that needs key generation.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}