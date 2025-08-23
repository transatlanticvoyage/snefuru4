'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DriggsmanTable from './components/DriggsmanTable';
import dynamic from 'next/dynamic';

const SitedoriButtonBar = dynamic(
  () => import('@/app/components/SitedoriButtonBar'),
  { ssr: false }
);

const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
  { ssr: false }
);

export default function DriggsmanClient() {
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
              Driggs Manager 
              <span className="text-xl font-normal text-gray-600 ml-3">Phone Numbers, Addresses, and Citations</span>
            </h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Site Field Management</div>
            <div className="text-xs text-gray-400">Cross-reference all site fields</div>
          </div>
        </div>
      </div>

      {/* Navigation Components */}
      <div className="px-6 py-2">
        {/* Sitedori Navigation Links */}
        <div className="mb-4">
          <SitedoriButtonBar />
        </div>

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