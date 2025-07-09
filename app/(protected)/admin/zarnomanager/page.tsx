'use client';

import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import ZarnosTable from './components/ZarnosTable';
import { useEffect } from 'react';

export default function ZarnoManagerPage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Zarno Manager - Snefuru Admin";
  }, []);

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
        
        <h1 className="text-2xl font-bold mb-6">Zarno Manager</h1>
        <p className="text-gray-600 mb-6">main db table: zarnos</p>
      </div>
      
      <ZarnosTable />
    </div>
  );
}