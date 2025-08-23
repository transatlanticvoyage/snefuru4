'use client';

import { useAuth } from '@/app/context/AuthContext';

export default function Panjar1Client() {
  const { user } = useAuth();

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Panjar1</h1>
        <div className="mt-6">
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600">
              Welcome to Panjar1! This is a protected page that can only be accessed when logged in.
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