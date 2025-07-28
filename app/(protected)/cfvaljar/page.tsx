'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function CfvaljarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Set loading to false after initial setup
    setLoading(false);
  }, [user, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Custom Field Values</h1>
      </div>

      {/* Main content area - currently blank as requested */}
      <div className="bg-white p-8 rounded-lg shadow">
        <div className="text-center text-gray-500">
          {/* Content area intentionally left blank */}
        </div>
      </div>
    </div>
  );
}