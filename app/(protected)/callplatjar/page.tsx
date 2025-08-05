'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import CallPlatjarTable from './components/CallPlatjarTable';

export default function CallPlatjarPage() {
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
            <h1 className="text-2xl font-bold text-gray-800">Call Platforms</h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Platform Management</div>
            <div className="text-xs text-gray-400">Manage call tracking platforms</div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width CallPlatjarTable */}
      <div className="flex-1 overflow-hidden">
        <CallPlatjarTable />
      </div>
    </div>
  );
}