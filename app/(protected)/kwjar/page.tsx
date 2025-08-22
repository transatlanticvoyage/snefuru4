'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import ZhedoriButtonBar from '@/app/components/ZhedoriButtonBar';
import KeywordsHubTable from './components/KeywordsHubTable';

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

  // Set page title
  useEffect(() => {
    document.title = '/kwjar - Snefuru';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-800">🔍 Keywords Hub</h1>
            <ZhedoriButtonBar />
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">DataForSEO Integration</div>
            <div className="text-xs text-gray-400">Project: Keywords Research</div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width KeywordsHubTable */}
      <div className="flex-1 overflow-hidden">
        <KeywordsHubTable />
      </div>
    </div>
  );
}