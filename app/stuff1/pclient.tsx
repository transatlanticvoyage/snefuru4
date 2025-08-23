'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Stuff1Client() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/home');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Stuff 1</h1>
        <div className="mt-6">
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600">
              Welcome to Stuff 1! This is a protected page that can only be accessed when logged in.
            </p>
            <p className="mt-4 text-gray-600">
              You are currently logged in as: {user?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}