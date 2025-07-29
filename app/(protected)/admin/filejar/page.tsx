'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function FilejarPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">FileGun Files</h1>
          <p className="text-gray-600">This page is only available in development mode</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📄 FileGun Files</h1>
            <p className="text-sm text-gray-600">Database File Management</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Environment: Development Only</div>
            <div className="text-xs text-gray-400">Project: Snefuru4</div>
          </div>
        </div>
      </div>

      {/* Main Content - Blank for now */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">📄</div>
            <div className="text-lg">FileGun Files</div>
            <div className="text-sm">UI coming soon...</div>
          </div>
        </div>
      </div>
    </div>
  );
}