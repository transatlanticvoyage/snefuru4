'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useEffect } from 'react';
import YoshidexSessionsTable from './components/YoshidexSessionsTable';

export default function YoshidexManagerPage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Yoshidex Manager - Snefuru";
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
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Yoshidex Manager
            </h1>
          </div>
          <p className="text-gray-600" style={{ fontSize: '16px' }}>
            <span className="font-bold">Claude Code Chat Integration:</span> Sessions, Messages & File Operations
          </p>
        </div>
        
        <YoshidexSessionsTable />
      </div>
    </div>
  );
}