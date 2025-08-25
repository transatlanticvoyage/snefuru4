'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import ZhedoriButtonBar from '@/app/components/ZhedoriButtonBar';

export default function RankjarClient() {
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
            <h1 className="text-2xl font-bold text-gray-800">📊 Rank Jar</h1>
            <ZhedoriButtonBar />
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">SEO Ranking Tracker</div>
            <div className="text-xs text-gray-400">Track & Monitor Site Rankings</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">📈</div>
            <p className="text-lg">RankJar Interface</p>
            <p className="text-sm mt-2">SEO ranking tracking system coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}