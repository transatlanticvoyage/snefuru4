'use client';

import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

export default function Home() {
  const { user } = useAuth();

  useEffect(() => {
    // Set document title
    document.title = 'home - Snefuru';
  }, []);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Home</h1>
        <div className="mt-6">
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600">
              Welcome to Snefuru! This is a protected page that can only be accessed when logged in.
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