'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
  { ssr: false }
);

const AddressjarTable = dynamic(
  () => import('./components/AddressjarTable'),
  { ssr: false }
);


export default function AddressjarClient() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Column pagination control state
  const [columnPaginationControls, setColumnPaginationControls] = useState<{
    ColumnPaginationBar1: () => JSX.Element | null;
    ColumnPaginationBar2: () => JSX.Element | null;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">
              <strong>Address Constellation System</strong>
            </h1>
            
            {/* Column Pagination Button Bars */}
            {columnPaginationControls && (
              <>
                <div className="flex items-center">
                  {columnPaginationControls.ColumnPaginationBar1()}
                </div>
                <div className="flex items-center">
                  {columnPaginationControls.ColumnPaginationBar2()}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <DrenjariButtonBarDriggsmanLinks />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AddressjarTable onColumnPaginationRender={setColumnPaginationControls} />
      </div>
    </div>
  );
}