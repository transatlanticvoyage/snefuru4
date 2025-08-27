'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import MenjariButtonBarFileGunLinks from '@/app/components/MenjariButtonBarFileGunLinks';
import PlanchjarTable from './components/PlanchjarTable';

export default function PlanchjarPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Planches</h1>
          <p className="text-gray-600">This page is only available in development mode</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Menjari Button Bar */}
      <div className="px-6 pb-0">
        <MenjariButtonBarFileGunLinks />
      </div>
      
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📋 Planches</h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Environment: Development Only</div>
            <div className="text-xs text-gray-400">Project: Tregnar</div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width PlanchjarTable */}
      <div className="flex-1 overflow-hidden">
        <PlanchjarTable />
      </div>
    </div>
  );
}