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
  const [dropboxKey, setDropboxKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        if (!user) return;

        const { data, error } = await supabase
          .from('api_keys')
          .select('*')
          .eq('user_id', user.id)
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

  const handleSaveApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('api_keys')
        .upsert({
          user_id: user.id,
          dropbox_key: dropboxKey,
          openai_key: openaiKey,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      setApiKeys(prev => prev ? { ...prev, dropbox_key: dropboxKey, openai_key: openaiKey } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
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
            <form onSubmit={handleSaveApiKeys}>
              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="dropboxKey" className="block text-sm font-medium text-gray-700">
                    Dropbox API Key
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      name="dropboxKey"
                      id="dropboxKey"
                      value={dropboxKey}
                      onChange={(e) => setDropboxKey(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter your Dropbox API key"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="openaiKey" className="block text-sm font-medium text-gray-700">
                    OpenAI API Key
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      name="openaiKey"
                      id="openaiKey"
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter your OpenAI API key"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {isSaving ? 'Saving...' : 'Save API Keys'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 