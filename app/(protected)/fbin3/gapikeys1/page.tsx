'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'gapikeys1',
};

export default function GApikeys1Page() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [keyName, setKeyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasActiveKey, setHasActiveKey] = useState(false);
  const [currentKeyName, setCurrentKeyName] = useState('');
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
            .from('tapikeys2')
            .select('key_value, key_name')
            .eq('fk_users_id', existingUser.id)
            .eq('key_type', 'openai')
            .eq('is_active', true)
            .single();

          setHasActiveKey(!!activeKey);
          if (activeKey) {
            setApiKey(activeKey.key_value);
            setCurrentKeyName(activeKey.key_name);
          }
        }
      } catch (error) {
        console.error('Error checking active key:', error);
      }
    };

    checkActiveKey();
  }, [user?.id, supabase]);

  const func_save_api_keys_3 = async (e: React.FormEvent) => {
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

      // Now insert the new API key
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
      setHasActiveKey(true);
      setCurrentKeyName(keyName || 'OpenAI Key');
      setIsEditing(false);
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
        <div className="text-3xl font-bold mb-6">kzelement2</div>
        <h1 className="text-2xl font-semibold text-gray-900">API Keys Management</h1>
        
        <div className="mt-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${hasActiveKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {hasActiveKey ? 'Active API key is stored' : 'No active API key stored'}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={func_save_api_keys_3} className="space-y-4">
              <div>
                <label htmlFor="keyName" className="block text-sm font-medium text-gray-700">
                  Key Name (Optional)
                </label>
                {hasActiveKey && !isEditing && (
                  <div className="mt-1 text-sm text-gray-600">
                    Current key name: {currentKeyName}
                  </div>
                )}
                <input
                  type="text"
                  id="keyName"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., Production OpenAI Key"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    !isEditing ? 'bg-gray-100' : ''
                  }`}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                  OpenAI API Key
                </label>
                <div className="mt-1 relative">
                  <input
                    type={isVisible ? "text" : "password"}
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    required
                    disabled={!isEditing}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                      !isEditing ? 'bg-gray-100' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsVisible(!isVisible)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  >
                    {isVisible ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {message.text && (
                <div className={`rounded-md p-4 ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isEditing ? 'bg-gray-100' : ''
                  }`}
                >
                  {isEditing ? 'Cancel Editing' : 'Edit Fields'}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !isEditing}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    (isLoading || !isEditing) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Saving...' : 'Save Using func_save_api_keys_3'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 