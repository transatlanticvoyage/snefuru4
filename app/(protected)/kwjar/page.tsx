'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">🔍 Keywords Hub</h1>
            
            {/* Navigation buttons moved here */}
            <div className="flex space-x-2">
              <Link
                href="/dfslocr"
                className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/dfslocr</span>
              </Link>
              
              <Link
                href="/kwtagzar"
                className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/kwtagzar</span>
              </Link>
              
              <Link
                href="/serpjar"
                className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/serpjar</span>
              </Link>
              
              <Link
                href="/zhefetchjar"
                className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/zhefetchjar</span>
              </Link>
            </div>
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