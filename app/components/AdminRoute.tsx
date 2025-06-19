'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, checkAdminStatus } = useAuth();
  const router = useRouter();
  const [adminChecking, setAdminChecking] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      // Not logged in, redirect to login
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Check admin status when component mounts and user is loaded
    if (user && !loading && isAdmin === null) {
      setAdminChecking(true);
      checkAdminStatus().then((adminStatus) => {
        setIsAdmin(adminStatus);
        setAdminChecking(false);
      });
    }
  }, [user, loading, checkAdminStatus, isAdmin]);

  if (loading || adminChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You do not have permission to access this page.
            </p>
            <p className="mt-4 text-xs text-gray-500">
              This area is restricted to administrators only.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/home')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}