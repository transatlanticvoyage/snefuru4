'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DriggsmanTable from './components/DriggsmanTable';
import dynamic from 'next/dynamic';


const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
  { ssr: false }
);

export default function DriggsmanClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(() => {
    // Initialize from localStorage with default as false (hidden)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('driggsman-header-visible');
      return saved === null ? false : saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Save header visibility state to localStorage and update body class
  useEffect(() => {
    localStorage.setItem('driggsman-header-visible', isHeaderVisible.toString());
    
    // Add/remove class on body to hide main header
    if (isHeaderVisible) {
      document.body.classList.remove('driggsman-hide-main-header');
    } else {
      document.body.classList.add('driggsman-hide-main-header');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('driggsman-hide-main-header');
    };
  }, [isHeaderVisible]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hide/Show Header Button */}
      <div className="px-6 py-2 bg-gray-50">
        <button
          onClick={() => setIsHeaderVisible(!isHeaderVisible)}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        >
          {isHeaderVisible ? 'Hide Page Header' : 'Show Page Header'}
        </button>
      </div>

      {/* Navigation Components */}
      <div className="px-6 py-2">
        {/* Drenjari Navigation Links */}
        <div className="mb-4">
          <DrenjariButtonBarDriggsmanLinks />
        </div>
      </div>

      {/* Main Content - Full Width DriggsmanTable */}
      <div className="flex-1 overflow-hidden">
        <DriggsmanTable />
      </div>
    </div>
  );
}