'use client';

// @xpage-metadata
// URL: /
// Title: Snefuru - Home
// Last Sync: 2024-01-10T10:30:00Z
export const XPAGE_ID = 11;

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import xpageCache from '@/app/metadata/xpage-cache.json';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Get static metadata from cache
  const staticMetadata = xpageCache[XPAGE_ID.toString()];

  useEffect(() => {
    // Use static title from cache, fallback to hardcoded
    const staticTitle = staticMetadata?.title || 'Snefuru - Home';
    document.title = staticTitle;
    
    if (!loading) {
      if (user) {
        router.push('/home');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router, staticMetadata?.title]);

  // Show loading spinner while checking auth state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
} 