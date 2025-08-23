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

export default function UtilPr1Client() {
  const [utilityPrompts, setUtilityPrompts] = useState<UtilityPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<UtilityPrompt | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { user } = useAuth();
  const supabase = createClientComponentClient();

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

  // Handle create new prompt
  const handleCreatePrompt = async (formData: {
    prompt_name: string;
    prompt_desc: string;
    prompt_content: string;
    main_model_intended: string;
    is_special_public_prompt: boolean;
  }) => {
    if (!userInternalId) return;

    setIsCreating(true);
    setNotification(null);

    try {
      const { error } = await supabase
        .from('utility_prompts')
        .insert({
          fk_user_id: userInternalId,
          prompt_name: formData.prompt_name || null,
          prompt_desc: formData.prompt_desc || null,
          prompt_content: formData.prompt_content || null,
          main_model_intended: formData.main_model_intended || null,
          is_special_public_prompt: formData.is_special_public_prompt,
        });

      if (error) {
        console.error('Error creating prompt:', error);
        setNotification({
          type: 'error',
          message: 'Failed to create prompt'
        });
      } else {
        setNotification({
          type: 'success',
          message: 'Prompt created successfully!'
        });
        setShowCreateModal(false);
        await refetchUtilityPrompts();
      }
    } catch (error) {
      console.error('Error creating prompt:', error);
      setNotification({
        type: 'error',
        message: 'An error occurred while creating the prompt'
      });
    } finally {
      setIsCreating(false);
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Handle edit prompt
  const handleEditPrompt = (prompt: UtilityPrompt) => {
    setEditingPrompt(prompt);
    setShowEditModal(true);
  };

  // Handle update prompt
  const handleUpdatePrompt = async (formData: {
    prompt_name: string;
    prompt_desc: string;
    prompt_content: string;
    main_model_intended: string;
    is_special_public_prompt: boolean;
  }) => {
    if (!editingPrompt) return;

    setIsUpdating(true);
    setNotification(null);

    try {
      const { error } = await supabase
        .from('utility_prompts')
        .update({
          prompt_name: formData.prompt_name || null,
          prompt_desc: formData.prompt_desc || null,
          prompt_content: formData.prompt_content || null,
          main_model_intended: formData.main_model_intended || null,
          is_special_public_prompt: formData.is_special_public_prompt,
          updated_at: new Date().toISOString(),
        })
        .eq('prompt_id', editingPrompt.prompt_id)
        .eq('fk_user_id', userInternalId); // Security check

      if (error) {
        console.error('Error updating prompt:', error);
        setNotification({
          type: 'error',
          message: 'Failed to update prompt'
        });
      } else {
        setNotification({
          type: 'success',
          message: 'Prompt updated successfully!'
        });
        setShowEditModal(false);
        setEditingPrompt(null);
        await refetchUtilityPrompts();
      }
    } catch (error) {
      console.error('Error updating prompt:', error);
      setNotification({
        type: 'error',
        message: 'An error occurred while updating the prompt'
      });
    } finally {
      setIsUpdating(false);
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
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
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-md ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Utility Prompts</h1>
            <p className="mt-2 text-gray-600">
              Manage your utility prompts and view public prompts
            </p>
            <p className="mt-1 text-sm text-gray-500">
              db table: utility_prompts
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Create New Prompt
          </button>
        </div>
      </div>

      {/* Table */}
      <UtilityPromptsTable 
        data={utilityPrompts}
        userId={user.id}
        userInternalId={userInternalId}
        onUpdate={refetchUtilityPrompts}
        onEdit={handleEditPrompt}
      />

      {/* Create Prompt Modal */}
      {showCreateModal && (
        <CreatePromptModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePrompt}
          isLoading={isCreating}
        />
      )}

      {/* Edit Prompt Modal */}
      {showEditModal && editingPrompt && (
        <EditPromptModal
          prompt={editingPrompt}
          onClose={() => {
            setShowEditModal(false);
            setEditingPrompt(null);
          }}
          onSubmit={handleUpdatePrompt}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}

// Create Prompt Modal Component
interface CreatePromptModalProps {
  onClose: () => void;
  onSubmit: (formData: {
    prompt_name: string;
    prompt_desc: string;
    prompt_content: string;
    main_model_intended: string;
    is_special_public_prompt: boolean;
  }) => void;
  isLoading: boolean;
}

function CreatePromptModal({ onClose, onSubmit, isLoading }: CreatePromptModalProps) {
  const [formData, setFormData] = useState({
    prompt_name: '',
    prompt_desc: '',
    prompt_content: '',
    main_model_intended: '',
    is_special_public_prompt: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Prompt</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Name
            </label>
            <input
              type="text"
              value={formData.prompt_name}
              onChange={(e) => handleInputChange('prompt_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter a name for your prompt..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Description
            </label>
            <textarea
              value={formData.prompt_desc}
              onChange={(e) => handleInputChange('prompt_desc', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what this prompt does..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Model Intended
            </label>
            <input
              type="text"
              value={formData.main_model_intended}
              onChange={(e) => handleInputChange('main_model_intended', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., GPT-4, Claude, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Content *
            </label>
            <textarea
              value={formData.prompt_content}
              onChange={(e) => handleInputChange('prompt_content', e.target.value)}
              rows={8}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter your prompt content here..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_special_public_prompt}
              onChange={(e) => handleInputChange('is_special_public_prompt', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
              Make this prompt public (visible to all users)
            </label>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.prompt_content.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Prompt Modal Component
interface EditPromptModalProps {
  prompt: UtilityPrompt;
  onClose: () => void;
  onSubmit: (formData: {
    prompt_name: string;
    prompt_desc: string;
    prompt_content: string;
    main_model_intended: string;
    is_special_public_prompt: boolean;
  }) => void;
  isLoading: boolean;
}

function EditPromptModal({ prompt, onClose, onSubmit, isLoading }: EditPromptModalProps) {
  const [formData, setFormData] = useState({
    prompt_name: prompt.prompt_name || '',
    prompt_desc: prompt.prompt_desc || '',
    prompt_content: prompt.prompt_content || '',
    main_model_intended: prompt.main_model_intended || '',
    is_special_public_prompt: prompt.is_special_public_prompt,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Prompt</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Name
            </label>
            <input
              type="text"
              value={formData.prompt_name}
              onChange={(e) => handleInputChange('prompt_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter a name for your prompt..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Description
            </label>
            <textarea
              value={formData.prompt_desc}
              onChange={(e) => handleInputChange('prompt_desc', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what this prompt does..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Model Intended
            </label>
            <input
              type="text"
              value={formData.main_model_intended}
              onChange={(e) => handleInputChange('main_model_intended', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., GPT-4, Claude, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Content *
            </label>
            <textarea
              value={formData.prompt_content}
              onChange={(e) => handleInputChange('prompt_content', e.target.value)}
              rows={8}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter your prompt content here..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="edit_is_public"
              checked={formData.is_special_public_prompt}
              onChange={(e) => handleInputChange('is_special_public_prompt', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="edit_is_public" className="ml-2 block text-sm text-gray-700">
              Make this prompt public (visible to all users)
            </label>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.prompt_content.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}