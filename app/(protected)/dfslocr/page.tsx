'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ZhedoriButtonBar from '@/app/components/ZhedoriButtonBar';
import DfsLocationsTable from './components/DfsLocationsTable';

const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
  { ssr: false }
);

export default function DfslocrPage() {
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

  // Set page title
  useEffect(() => {
    document.title = '/dfslocr - Snefuru';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Drenjari Button Bar */}
      <div className="px-6 pb-0">
        <DrenjariButtonBarDriggsmanLinks />
      </div>
      
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-800">🌍 DataForSEO Locations</h1>
            <ZhedoriButtonBar />
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Location Database</div>
            <div className="text-xs text-gray-400">Project: DFS Location Manager</div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width DfsLocationsTable */}
      <div className="flex-1 overflow-hidden">
        <DfsLocationsTable />
      </div>
    </div>
  );
}