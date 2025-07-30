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
            <h1 className="text-2xl font-bold flex items-center">
              <svg 
                className="w-8 h-8 mr-3 text-gray-700" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                style={{ width: '30px', height: '30px' }}
              >
                <path d="M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zm0 2v4h16V4H4zm0 6v4h16v-4H4zm0 6v4h16v-4H4z" />
              </svg>
              Rackui Columns Manager
            </h1>
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