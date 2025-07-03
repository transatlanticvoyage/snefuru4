'use client';

import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import KetchSettingsTable from './components/KetchSettingsTable';
import { useEffect } from 'react';

export default function KetchManagerPage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Ketch Manager - Snefuru";
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="mb-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-6">Ketch Manager</h1>
        
        <KetchSettingsTable />
      </div>
    </div>
  );
}