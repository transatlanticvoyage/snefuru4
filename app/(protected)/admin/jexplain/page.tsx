'use client';

import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import JexplanationsTable from './components/JexplanationsTable';
import { useEffect } from 'react';

export default function JexplainPage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Jexplain - Snefuru Admin";
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
          <Link href="/admin" className="text-blue-600 hover:text-blue-800">
            ← Back to Admin
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-6">Jexplain Manager</h1>
        <p className="text-gray-600 mb-6">Internal note storage system for admin use</p>
      </div>
      
      <JexplanationsTable />
    </div>
  );
}