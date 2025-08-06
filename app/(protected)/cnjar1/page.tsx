'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
  { ssr: false }
);

const Cnjar1Table = dynamic(
  () => import('./components/Cnjar1Table'),
  { ssr: false }
);

export default function Cnjar1Page() {
  const { user } = useAuth();
  const router = useRouter();
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cnjar1-header-visible');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Save header visibility state to localStorage and update body class
  useEffect(() => {
    localStorage.setItem('cnjar1-header-visible', isHeaderVisible.toString());
    
    // Add/remove class on body to hide main header
    if (isHeaderVisible) {
      document.body.classList.remove('cnjar1-hide-main-header');
    } else {
      document.body.classList.add('cnjar1-hide-main-header');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('cnjar1-hide-main-header');
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
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              CNJar1 Manager
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <DrenjariButtonBarDriggsmanLinks />
            <div className="text-right">
              <div className="text-sm text-gray-500">City-Industry Combinations</div>
              <div className="text-xs text-gray-400">Manage cncglub table</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hide/Show Header Button */}
      <div className="px-6 py-2 bg-gray-50">
        <button
          onClick={() => setIsHeaderVisible(!isHeaderVisible)}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        >
          {isHeaderVisible ? 'Hide Page Header' : 'Show Page Header'}
        </button>
      </div>

      {/* Drenjari Links at Top */}
      <div className="px-6 py-4">
        <DrenjariButtonBarDriggsmanLinks />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Cnjar1Table />
      </div>
    </div>
  );
}