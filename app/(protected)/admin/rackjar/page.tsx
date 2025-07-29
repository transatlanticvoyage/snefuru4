'use client';

import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import RackuiColumnsTable from './components/RackuiColumnsTable';
import { useEffect } from 'react';

export default function RackuijarPage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Rackui Columns Manager - Snefuru";
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
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold">Rackui Columns Manager</h1>
          </div>
          <p className="text-gray-600" style={{ fontSize: '16px' }}>
            <span className="font-bold">main db table:</span> rackui_columns
          </p>
        </div>
        
        <RackuiColumnsTable />
      </div>
    </div>
  );
}