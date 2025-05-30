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

      console.log('Current user auth_id:', user.id);

      // First, check if user exists in the users table and get their id
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      let userId;

      if (userError) {
        if (userError.code === 'PGRST116') {
          // User doesn't exist, create them
          console.log('User not found, creating new user record...');
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              auth_id: user.id,
              email: user.email
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Error creating user:', createError);
            throw createError;
          }

          userId = newUser.id;
          console.log('Created new user with ID:', userId);
        } else {
          throw userError;
        }
      } else {
        userId = existingUser.id;
        console.log('Found existing user with ID:', userId);
      }

      // First, deactivate any existing keys of the same type
      const { error: deactivateError } = await supabase
        .from('tapikeys2')
        .update({ is_active: false })
        .eq('fk_users_id', userId)
        .eq('key_type', 'openai');

      if (deactivateError) {
        console.error('Error deactivating existing keys:', deactivateError);
        throw deactivateError;
      }

      // Now insert the API key
      const { error: insertError } = await supabase
        .from('tapikeys2')
        .insert({
          fk_users_id: userId,
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