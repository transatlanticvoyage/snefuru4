'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="w-full h-10 bg-black z-30 flex items-center px-4 text-white space-x-4">
          <span>rel_images_plans_batches_id</span>
          <input
            type="text"
            className="h-7 px-2 rounded text-black"
            style={{ minWidth: 120 }}
          />
        </div>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
} 