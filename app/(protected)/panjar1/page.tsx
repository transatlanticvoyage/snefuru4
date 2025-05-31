'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/app/context/AuthContext';
import OpenAI from 'openai';
import Panjar1UI from './components/panjar1';
import { ImageRecord } from './types';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

      if (!response.data || !response.data[0]?.url) {
        throw new Error('No image URL returned from OpenAI');
      }

      const imageUrl = response.data[0].url;

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
    <Panjar1UI
      prompt={prompt}
      setPrompt={setPrompt}
      isGenerating={isGenerating}
      error={error}
      images={images}
      onGenerateClick={func_fetch_image_2}
    />
  );
} 