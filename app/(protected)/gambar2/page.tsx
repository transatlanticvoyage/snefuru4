'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';

type Image = {
  id: string;
  created_at: string;
  rel_users_id: string;
  prompt1: string;
  img_file_url1: string;
  status: string;
};

export default function Gambar2Page() {
  const { user } = useAuth();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch images when component mounts and user is available
  useEffect(() => {
    if (user) {
      fetchImages();
    }
  }, [user]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    
    try {
      // Get user's ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw new Error('Failed to fetch user record');
      if (!userData) throw new Error('User record not found');

      // Create image record
      const { data: imageData, error: insertError } = await supabase
        .from('images')
        .insert({
          rel_users_id: userData.id,
          prompt1: prompt.trim(),
          status: 'generating'
        })
        .select()
        .single();

      if (insertError) throw new Error(`Failed to create image record: ${insertError.message}`);
      if (!imageData) throw new Error('No image data returned from database');

      // Generate image
      const response = await fetch(`${window.location.origin}/api/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageId: imageData.id
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate image');
      }

      // Refresh images list
      await fetchImages();
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
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
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Images Database</h1>
        
        {/* Image Generation Form */}
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleGenerateImage} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                  Enter your image prompt
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="prompt"
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Describe the image you want to generate..."
                    required
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isGenerating || !prompt.trim()}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate Image And Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Images Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {images.map((image) => (
                  <tr key={image.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{image.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(image.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{image.rel_users_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{image.prompt1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{image.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {image.img_file_url1 && (
                        <img
                          src={image.img_file_url1}
                          alt={image.prompt1}
                          className="h-20 w-20 object-cover rounded"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 