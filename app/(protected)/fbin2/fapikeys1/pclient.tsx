'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Fapikeys1Client() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  // Check for active API key on component mount
  useEffect(() => {
    const checkActiveKey = async () => {
      if (!user?.id) return;

      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (existingUser) {
          const { data: activeKey } = await supabase
            .from('api_keys_t1')
            .select('key_value, key_name')
            .eq('fk_users_id', existingUser.id)
            .eq('key_type', 'openai')
            .eq('is_active', true)
            .single();

          if (activeKey) {
            setApiKeys([activeKey]);
            setNewKey(activeKey.key_value);
          }
        }
      } catch (error) {
        console.error('Error checking active key:', error);
      }
    };

    checkActiveKey();
  }, [user?.id, supabase]);

  const func_save_api_keys_2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

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
        .from('api_keys_t1')
        .update({ is_active: false })
        .eq('fk_users_id', userId)
        .eq('key_type', 'openai');

      if (deactivateError) {
        console.error('Error deactivating existing keys:', deactivateError);
        throw deactivateError;
      }

      // Now insert the new API key
      const { error: insertError } = await supabase
        .from('api_keys_t1')
        .insert({
          fk_users_id: userId,
          key_type: 'openai',
          key_value: newKey,
          key_name: 'OpenAI Key',
          is_active: true
        });

      if (insertError) {
        console.error('Error inserting API key:', insertError);
        throw insertError;
      }

      setSuccess('API key saved successfully!');
      setApiKeys([{ key_value: newKey, key_name: 'OpenAI Key' }]);
      setNewKey('');
    } catch (error: any) {
      console.error('Full error:', error);
      setError(error.message || 'Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-3xl font-bold mb-6">kzelement2</div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">API Keys Management</h1>
        <p className="text-sm text-gray-600 mb-6"><span className="font-bold">db table:</span> api_keys_t1</p>
        
        <div className="mt-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${apiKeys.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {apiKeys.length > 0 ? 'Active API key is stored' : 'No active API key stored'}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={func_save_api_keys_2} className="space-y-4">
              <div>
                <label htmlFor="keyName" className="block text-sm font-medium text-gray-700">
                  Key Name (Optional)
                </label>
                {apiKeys.length > 0 && (
                  <div className="mt-1 text-sm text-gray-600">
                    Current key name: {apiKeys[0].key_name}
                  </div>
                )}
                <input
                  type="text"
                  id="keyName"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g., Production OpenAI Key"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    apiKeys.length === 0 ? 'bg-gray-100' : ''
                  }`}
                  disabled={apiKeys.length > 0}
                />
              </div>

              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                  OpenAI API Key
                </label>
                <div className="mt-1 relative">
                  <input
                    type="password"
                    id="apiKey"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="sk-..."
                    required
                    disabled={apiKeys.length > 0}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                      apiKeys.length === 0 ? 'bg-gray-100' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // Implement the logic to show/hide the API key
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  >
                    {/* Implement the logic to show/hide the API key */}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md p-4 bg-red-50 text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-md p-4 bg-green-50 text-green-700">
                  {success}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading || apiKeys.length > 0}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    (loading || apiKeys.length > 0) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Saving...' : 'Save Using func_save_api_keys_2'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}