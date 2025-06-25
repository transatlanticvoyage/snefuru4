'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import UtilityPromptsTable from './components/UtilityPromptsTable';

interface UtilityPrompt {
  prompt_id: string;
  fk_user_id: string;
  is_special_public_prompt: boolean;
  prompt_content: string | null;
  main_model_intended: string | null;
  prompt_name: string | null;
  prompt_desc: string | null;
  created_at: string;
  updated_at: string;
}

export default function UtilPr1Page() {
  const [utilityPrompts, setUtilityPrompts] = useState<UtilityPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);

  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = '/utilpr1 - Snefuru';
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user's internal ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (userError) {
          setError('User not found');
          return;
        }

        setUserInternalId(userData.id);

        // Fetch utility prompts - user's own prompts AND public prompts
        const { data: promptsData, error: promptsError } = await supabase
          .from('utility_prompts')
          .select('*')
          .or(`fk_user_id.eq.${userData.id},is_special_public_prompt.eq.true`)
          .order('created_at', { ascending: false });

        if (promptsError) {
          console.error('Error fetching utility prompts:', promptsError);
          setError('Error fetching utility prompts');
          return;
        }

        setUtilityPrompts(promptsData || []);

      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while loading the page');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, supabase]);

  // Function to refetch data
  const refetchUtilityPrompts = async () => {
    if (!user || !userInternalId) return;

    try {
      const { data: promptsData, error: promptsError } = await supabase
        .from('utility_prompts')
        .select('*')
        .or(`fk_user_id.eq.${userInternalId},is_special_public_prompt.eq.true`)
        .order('created_at', { ascending: false });

      if (!promptsError && promptsData) {
        setUtilityPrompts(promptsData);
      }
    } catch (err) {
      console.error('Error refetching data:', err);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Please sign in to view utility prompts.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading utility prompts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Utility Prompts</h1>
        <p className="mt-2 text-gray-600">
          Manage your utility prompts and view public prompts
        </p>
        <p className="mt-1 text-sm text-gray-500">
          db table: utility_prompts
        </p>
      </div>

      {/* Table */}
      <UtilityPromptsTable 
        data={utilityPrompts}
        userId={user.id}
        userInternalId={userInternalId}
        onUpdate={refetchUtilityPrompts}
      />
    </div>
  );
}