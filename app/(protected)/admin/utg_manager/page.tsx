'use client';

// @xpage-metadata
// URL: /admin/utg_manager
// Title: UTG Manager - Snefuru
// Last Sync: 2024-01-10T10:30:00Z
export const XPAGE_ID = 13;

import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import UiTableGridsTable from './components/UiTableGridsTable';
import { useEffect } from 'react';
import xpageCache from '@/app/metadata/xpage-cache.json';

export default function UtgManagerPage() {
  const { user } = useAuth();
  
  // Get static metadata from cache
  const staticMetadata = xpageCache[XPAGE_ID.toString()];

  useEffect(() => {
    // Use static title from cache, fallback to hardcoded
    const staticTitle = staticMetadata?.title || 'UTG Manager - Snefuru';
    document.title = staticTitle;
  }, [staticMetadata?.title]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4">
        <div className="mb-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-6">UTG Manager</h1>
        <p className="text-gray-600 mb-6">main db table: utgs</p>
      </div>
      
      <UiTableGridsTable />
    </div>
  );
}