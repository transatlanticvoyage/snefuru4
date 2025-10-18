'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const ZhedoriButtonBar = dynamic(
  () => import('@/app/components/ZhedoriButtonBar'),
  { ssr: false }
);

export default function LeadsmartMorphClient() {
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
    <div className="min-h-screen bg-gray-50 p-6">
      <ZhedoriButtonBar />
      <h1 className="text-3xl font-bold text-gray-800 mt-6">Leadsmart Morph</h1>
    </div>
  );
}

