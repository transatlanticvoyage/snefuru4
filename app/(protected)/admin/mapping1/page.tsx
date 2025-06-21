'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Mapping1Page() {
  const [activeTab, setActiveTab] = useState<'overview' | 'spreadsheet'>('overview');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = '/admin/mapping1 - Snefuru';
  }, []);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user?.id) {
        router.push('/');
        return;
      }

      try {
        // Get user data to check admin status
        const { data: userData, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('auth_id', user.id)
          .single();

        if (error || !userData || userData.is_admin !== true) {
          // Not an admin, redirect to home
          router.push('/');
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error('Error checking admin status:', err);
        router.push('/');
      }
    };

    checkAdminAccess();
  }, [user, router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Main Heading */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        NWPI_TO_GCON_MAPPING
      </h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview 1
          </button>
          <button
            onClick={() => setActiveTab('spreadsheet')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'spreadsheet'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Spreadsheet-Like System
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview</h2>
            <p className="text-gray-600">
              This section provides an overview of the NWPI to GCON mapping system.
            </p>
            {/* Overview content will be added here */}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Spreadsheet-Like System</h2>
            <p className="text-gray-600">
              This section contains the spreadsheet-like interface for managing mappings.
            </p>
            {/* Spreadsheet content will be added here */}
          </div>
        )}
      </div>
    </div>
  );
}