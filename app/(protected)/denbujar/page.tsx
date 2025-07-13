'use client';

import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import DenbuColumnsTable from './components/DenbuColumnsTable';
import { useEffect } from 'react';

export default function DenbujarPage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Denbu Columns Manager - Snefuru";
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
        
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold">Denbu Columns Manager</h1>
          </div>
          <p className="text-gray-600" style={{ fontSize: '16px' }}>
            <span className="font-bold">main db table:</span> denbu_columns
          </p>
        </div>
        
        <DenbuColumnsTable />
      </div>
    </div>
  );
}