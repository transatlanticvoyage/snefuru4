'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
  { ssr: false }
);

export default function KwjarPage() {
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
              Kwjar
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <DrenjariButtonBarDriggsmanLinks />
            <div className="text-right">
              <div className="text-sm text-gray-500">Kwjar Manager</div>
              <div className="text-xs text-gray-400">Ready for configuration</div>
            </div>
          </div>
        </div>
      </div>

      {/* Drenjari Links at Top */}
      <div className="px-6 py-4">
        <DrenjariButtonBarDriggsmanLinks />
      </div>

      {/* Main Content - Currently Blank */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <p className="text-lg">Kwjar page is ready.</p>
            <p className="text-sm mt-2">Main UI content will be added here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}