'use client';

import { useAuth } from '@/app/context/AuthContext';

export default function ZenriverPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="pr-4">
        <div className="text-center">
          <p>Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pr-4">
      <h1 className="text-2xl font-bold mb-6">Zen Pusher - Push and Pull Data</h1>
      
      {/* UI content will be added here later */}
    </div>
  );
}