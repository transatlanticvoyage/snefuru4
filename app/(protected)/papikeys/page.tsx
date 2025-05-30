'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '@/lib/supabase';

type ApiKeys = {
  id: string;
  user_id: string;
  dropbox_key: string;
  openai_key: string;
  updated_at: string;
};

export default function ApiKeysPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKeys | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for each API key
  const [dropboxKey, setDropboxKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  
  // State for edit mode
  const [isEditingDropbox, setIsEditingDropbox] = useState(false);
  const [isEditingOpenai, setIsEditingOpenai] = useState(false);
  
  // State for saving
  const [isSavingDropbox, setIsSavingDropbox] = useState(false);
  const [isSavingOpenai, setIsSavingOpenai] = useState(false);

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        if (!user) return;

        // First get the user's ID from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (userError) throw userError;
        if (!userData) throw new Error('User record not found');

        // Then fetch the API keys
        const { data, error } = await supabase
          .from('api_keys')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
        
        setApiKeys(data);
        setDropboxKey(data?.dropbox_key || '');
        setOpenaiKey(data?.openai_key || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchApiKeys();
  }, [user]);

  const handleSaveDropboxKey = async () => {
    if (!user) return;
    setIsSavingDropbox(true);
    setError(null);

    try {
      // First get the user's ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User record not found');

      const { error } = await supabase
        .from('api_keys')
        .upsert({
          user_id: userData.id,
          dropbox_key: dropboxKey,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      setApiKeys(prev => prev ? { ...prev, dropbox_key: dropboxKey } : null);
      setIsEditingDropbox(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSavingDropbox(false);
    }
  };

  const handleSaveOpenaiKey = async () => {
    if (!user) return;
    setIsSavingOpenai(true);
    setError(null);

    try {
      // First get the user's ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User record not found');

      const { error } = await supabase
        .from('api_keys')
        .upsert({
          user_id: userData.id,
          openai_key: openaiKey,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      setApiKeys(prev => prev ? { ...prev, openai_key: openaiKey } : null);
      setIsEditingOpenai(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSavingOpenai(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">API Keys</h1>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            <div className="space-y-6">
              {/* Dropbox API Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="dropboxKey" className="block text-sm font-medium text-gray-700">
                    Dropbox API Key
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${apiKeys?.dropbox_key ? 'text-green-600' : 'text-gray-500'}`}>
                      {apiKeys?.dropbox_key ? 'Active' : 'Not Set'}
                    </span>
                    {!isEditingDropbox ? (
                      <button
                        onClick={() => setIsEditingDropbox(true)}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsEditingDropbox(false);
                          setDropboxKey(apiKeys?.dropbox_key || '');
                        }}
                        className="text-sm text-gray-600 hover:text-gray-500"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-1 flex space-x-2">
                  <input
                    type="password"
                    name="dropboxKey"
                    id="dropboxKey"
                    value={dropboxKey}
                    onChange={(e) => setDropboxKey(e.target.value)}
                    disabled={!isEditingDropbox}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder={isEditingDropbox ? "Enter your Dropbox API key" : "••••••••••••••••"}
                  />
                  {isEditingDropbox && (
                    <button
                      onClick={handleSaveDropboxKey}
                      disabled={isSavingDropbox}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isSavingDropbox ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </div>
              </div>

              {/* OpenAI API Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="openaiKey" className="block text-sm font-medium text-gray-700">
                    OpenAI API Key
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${apiKeys?.openai_key ? 'text-green-600' : 'text-gray-500'}`}>
                      {apiKeys?.openai_key ? 'Active' : 'Not Set'}
                    </span>
                    {!isEditingOpenai ? (
                      <button
                        onClick={() => setIsEditingOpenai(true)}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsEditingOpenai(false);
                          setOpenaiKey(apiKeys?.openai_key || '');
                        }}
                        className="text-sm text-gray-600 hover:text-gray-500"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-1 flex space-x-2">
                  <input
                    type="password"
                    name="openaiKey"
                    id="openaiKey"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    disabled={!isEditingOpenai}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder={isEditingOpenai ? "Enter your OpenAI API key" : "••••••••••••••••"}
                  />
                  {isEditingOpenai && (
                    <button
                      onClick={handleSaveOpenaiKey}
                      disabled={isSavingOpenai}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isSavingOpenai ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 