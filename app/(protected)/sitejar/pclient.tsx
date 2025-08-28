'use client';

import { useAuth } from '@/app/context/AuthContext';

export default function SitejarClient() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="w-full p-4">
        <div className="text-center">
          <p>Please sign in to access Site Voyager.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ fontSize: '20px' }}>Site Voyager Table</h1>
      </div>
    </div>
  );
}