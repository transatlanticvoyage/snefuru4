'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ApiKey {
  id: string;
  user_id: string;
  openai_key: string;
  created_at: string;
  updated_at: string;
}

export default function Papikeys3Page() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Set document title
    document.title = 'papikeys3 - Snefuru';
  }, []);

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: apiKeys, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      setApiKeys(apiKeys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      // First, ensure the user exists in the users table
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError) {
        console.error('User lookup error:', userError);
        throw new Error('Failed to find user record');
      }

      if (!userData) {
        // Create the user record if it doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth_id: user.id,
            email: user.email
          })
          .select()
          .single();

        if (createError || !newUser) {
          console.error('User creation error:', createError);
          throw new Error('Failed to create user record');
        }

        userData = newUser;
      }

      if (!userData) {
        throw new Error('Failed to get or create user record');
      }

      // First, delete any existing keys
      const { error: deleteError } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', userData.id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(`Failed to delete existing key: ${deleteError.message}`);
      }

      // Then create the new key
      const { error: insertError } = await supabase
        .from('api_keys')
        .insert({
          user_id: userData.id,
          openai_key: newKey
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to save API key: ${insertError.message}`);
      }

      setSuccess('API key saved successfully');
      setNewKey('');
      fetchApiKeys();
    } catch (err) {
      console.error('Full error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while saving the API key');
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      // Get the user's ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('Failed to find user record');
      }

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', userData.id);

      if (error) {
        throw error;
      }

      setSuccess('API key deleted successfully');
      fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return <div className="p-4">Loading API keys...</div>;
  }

  return (
    <div className="p-4">
      <div className="text-2xl font-bold mb-4">kzelement1</div>
      <h1 className="text-2xl font-bold mb-4">API Keys</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Add New API Key</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
              OpenAI API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter your OpenAI API key"
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Save API Key
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Your API Keys</h2>
        {apiKeys.length === 0 ? (
          <p className="text-gray-500">No API keys configured</p>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
              >
                <div>
                  <p className="font-medium">OpenAI API Key</p>
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(key.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 