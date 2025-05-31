'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/app/context/AuthContext';
import OpenAI from 'openai';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ImageRecord {
  id: string;
  rel_users_id: string;
  created_at: string;
  rel_images_plans_id: string;
  img_file_url1: string;
  img_file_extension: string;
  img_file_size: number;
  width: number;
  height: number;
  prompt1: string;
  status: string;
  function_used_to_fetch_the_image: string;
}

export default function Panjar1Page() {
  const { user } = useAuth();
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const func_fetch_image_2 = async () => {
    if (!user?.id || !prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Get user's OpenAI API key from tapikeys2
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) {
        throw new Error('User not found');
      }

      const { data: apiKeyData } = await supabase
        .from('tapikeys2')
        .select('key_value')
        .eq('fk_users_id', userData.id)
        .eq('key_type', 'openai')
        .eq('is_active', true)
        .single();

      if (!apiKeyData?.key_value) {
        throw new Error('No active OpenAI API key found');
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: apiKeyData.key_value,
        dangerouslyAllowBrowser: true
      });

      // Generate image using OpenAI
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = response.data[0].url;
      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI');
      }

      // Fetch the image data
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();

      // Upload to Supabase Storage
      const fileName = `${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      // Save image record to database
      const { data: newImage, error: dbError } = await supabase
        .from('images')
        .insert({
          rel_users_id: userData.id,
          img_file_url1: publicUrl,
          img_file_extension: 'png',
          img_file_size: imageBuffer.byteLength,
          width: 1024,
          height: 1024,
          prompt1: prompt,
          status: 'completed',
          function_used_to_fetch_the_image: 'func_fetch_image_2'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Refresh the images list
      setImages(prevImages => [newImage, ...prevImages]);
      setPrompt('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const fetchImages = async () => {
      if (!user?.id) return;

      try {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!userData) {
          throw new Error('User not found');
        }

        const { data, error } = await supabase
          .from('images')
          .select('*')
          .eq('rel_users_id', userData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setImages(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Images Database</h1>
      
      {/* Prompt Input and Generate Button */}
      <div className="mb-6 space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your image prompt
          </label>
          <input
            type="text"
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={func_fetch_image_2}
          disabled={isGenerating || !prompt.trim()}
          className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            (isGenerating || !prompt.trim()) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isGenerating ? 'Generating...' : 'Run func_fetch_image_2'}
        </button>
        {error && (
          <div className="text-red-500 mt-2">
            {error}
          </div>
        )}
      </div>

      {/* Images Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 border">Image Preview</th>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">User ID</th>
              <th className="px-4 py-2 border">Created At</th>
              <th className="px-4 py-2 border">Plan ID</th>
              <th className="px-4 py-2 border">File URL</th>
              <th className="px-4 py-2 border">File Extension</th>
              <th className="px-4 py-2 border">File Size</th>
              <th className="px-4 py-2 border">Width</th>
              <th className="px-4 py-2 border">Height</th>
              <th className="px-4 py-2 border">Prompt</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Function Used</th>
            </tr>
          </thead>
          <tbody>
            {images.map((image) => (
              <tr key={image.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">
                  {image.img_file_url1 ? (
                    <img 
                      src={image.img_file_url1} 
                      alt="Preview" 
                      className="w-20 h-20 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/80?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 border">{image.id}</td>
                <td className="px-4 py-2 border">{image.rel_users_id}</td>
                <td className="px-4 py-2 border">{new Date(image.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 border">{image.rel_images_plans_id}</td>
                <td className="px-4 py-2 border">
                  <a 
                    href={image.img_file_url1} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline truncate block max-w-xs"
                  >
                    {image.img_file_url1}
                  </a>
                </td>
                <td className="px-4 py-2 border">{image.img_file_extension}</td>
                <td className="px-4 py-2 border">{image.img_file_size}</td>
                <td className="px-4 py-2 border">{image.width}</td>
                <td className="px-4 py-2 border">{image.height}</td>
                <td className="px-4 py-2 border">
                  <div className="max-w-xs truncate" title={image.prompt1}>
                    {image.prompt1}
                  </div>
                </td>
                <td className="px-4 py-2 border">{image.status}</td>
                <td className="px-4 py-2 border">{image.function_used_to_fetch_the_image}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 