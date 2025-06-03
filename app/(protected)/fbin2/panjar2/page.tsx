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

  useEffect(() => {
    // Set document title
    document.title = 'panjar2 - Snefuru';
  }, []);

  useEffect(() => {
    // Debug: Check auth state
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Page auth state:', { 
        userFromContext: !!user, 
        userFromSession: !!session,
        userId: user?.id,
        sessionUserId: session?.user?.id
      });
    };
    checkAuth();
  }, [user, supabase]);

  const fetchImages = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID in context');
        throw new Error('User not authenticated');
      }

      console.log('Fetching user data for auth_id:', user.id);

      // Get user's ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError) {
        console.error('User lookup error:', userError);
        throw new Error('Failed to fetch user record');
      }

      if (!userData) {
        console.log('No user data found for auth_id:', user.id);
        throw new Error('User record not found');
      }

      console.log('Found user data:', userData);

      // Fetch images for this specific user
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('rel_users_id', userData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error('Error in fetchImages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchImages();
    } else {
      console.log('No user in context, skipping fetch');
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