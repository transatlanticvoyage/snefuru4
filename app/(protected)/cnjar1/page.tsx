'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
  { ssr: false }
);

export default function Cnjar1Page() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

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
              <div className="text-sm text-gray-500">CNJar1 Management System</div>
              <div className="text-xs text-gray-400">Coming soon</div>
            </div>
          </div>
        </div>
      </div>

      {/* Drenjari Links at Top */}
      <div className="px-6 py-4">
        <DrenjariButtonBarDriggsmanLinks />
      </div>

      {/* Main Content - Blank for now */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">CNJar1 interface coming soon...</p>
        </div>
      </div>
    </div>
  );
}