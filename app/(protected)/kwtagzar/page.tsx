'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import ZhedoriButtonBar from '@/app/components/ZhedoriButtonBar';
import KeywordsTagsTable from './components/KeywordsTagsTable';

export default function KwtagzarPage() {
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
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-800">🏷️ Keywords Tags Manager</h1>
            <ZhedoriButtonBar />
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Tag Management System</div>
            <div className="text-xs text-gray-400">Project: Keywords Organization</div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width KeywordsTagsTable */}
      <div className="flex-1 overflow-hidden">
        <KeywordsTagsTable />
      </div>
    </div>
  );
}