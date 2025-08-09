'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import SaberTable from './components/SaberTable';

export default function SabjarPage() {
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
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Sabertooth Site Manager
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Advanced table grid with virtual scrolling, GraphQL, and TanStack Table
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Enterprise Data Grid</div>
            <div className="text-xs text-gray-400">Powered by TanStack Table v8</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <SaberTable />
      </div>
    </div>
  );
}