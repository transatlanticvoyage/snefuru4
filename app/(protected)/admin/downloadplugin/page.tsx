'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function DownloadPluginPage() {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    document.title = '/admin/downloadplugin - Snefuru';
  }, []);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user?.id) {
        router.push('/login');
        return;
      }

      try {
        // Check if user has is_admin = true
        const { data: userData, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('auth_id', user.id)
          .single();

        if (error || !userData) {
          console.error('Error checking admin status:', error);
          router.push('/');
          return;
        }

        if (userData.is_admin !== true) {
          // Not an admin, redirect to home
          router.push('/');
          return;
        }

        // User is admin, allow access
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Download Plugin</h1>
          <p className="mt-2 text-gray-600">
            Admin area for downloading plugins
          </p>
        </div>

        {/* Main content area */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700">
            Plugin download functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}