'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FApikeys1Page() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [keyName, setKeyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const func_save_api_keys_2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Current user ID:', user.id);

      // First, get the user's auth_id from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('auth_id')
        .eq('id', user.id);

      if (userError) {
        console.error('Error fetching user:', userError);
        throw userError;
      }

      if (!userData || userData.length === 0) {
        console.error('No user found with ID:', user.id);
        throw new Error('User not found in database');
      }

      if (userData.length > 1) {
        console.error('Multiple users found with ID:', user.id);
        throw new Error('Multiple users found with the same ID');
      }

      const authId = userData[0].auth_id;
      console.log('Found auth_id:', authId);

      // Now insert the API key using the auth_id
      const { error: insertError } = await supabase
        .from('tapikeys2')
        .insert({
          fk_users_id: authId,
          key_type: 'openai',
          key_value: apiKey,
          key_name: keyName || 'OpenAI Key',
          is_active: true
        });

      if (insertError) {
        console.error('Error inserting API key:', insertError);
        throw insertError;
      }

      setMessage({ type: 'success', text: 'API key saved successfully!' });
      setApiKey('');
      setKeyName('');
    } catch (error: any) {
      console.error('Full error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to save API key' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">API Keys Management</h1>
        
        <div className="mt-6">
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={func_save_api_keys_2} className="space-y-4">
              <div>
                <label htmlFor="keyName" className="block text-sm font-medium text-gray-700">
                  Key Name (Optional)
                </label>
                <input
                  type="text"
                  id="keyName"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., Production OpenAI Key"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {message.text && (
                <div className={`rounded-md p-4 ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Saving...' : 'Save API Key'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 