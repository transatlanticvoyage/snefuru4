'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import ReddjarTable from './components/ReddjarTable';

export default function ReddjarPage() {
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
            <h1 className="text-2xl font-bold text-gray-800">Reddit URLs Jar</h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Table: redditurlsvat</div>
            <div className="text-xs text-gray-400">Reddit SEO Tracking</div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width ReddjarTable */}
      <div className="flex-1 overflow-hidden">
        <ReddjarTable />
      </div>
    </div>
  );
}