'use client';

import { useState, useEffect } from 'react';
import Panjar2UI from './components/panjar2';
import { ImageRecord } from './types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

export default function Panjar2Page() {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  const fetchImages = async () => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Get user's ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError) {
        throw new Error('Failed to fetch user record');
      }

      if (!userData) {
        throw new Error('User record not found');
      }

      // Fetch images for this specific user
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('rel_users_id', userData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchImages();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  if (!user) {
    return <div className="text-red-600 p-4">Please log in to view your images</div>;
  }

  return <Panjar2UI images={images} />;
} 