'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CityjarTable from './components/CityjarTable';
import ExportButton from './components/ExportButton';
import ClassificationFilter from './components/ClassificationFilter';

const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
  { ssr: false }
);

export default function CityjarClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [classificationFilter, setClassificationFilter] = useState('all');

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
              City Manager
            </h1>
            <ExportButton />
            <ClassificationFilter 
              value={classificationFilter}
              onChange={setClassificationFilter}
            />
          </div>
          <div className="flex items-center space-x-4">
            <DrenjariButtonBarDriggsmanLinks />
            <div className="text-right">
              <div className="text-sm text-gray-500">City Management System</div>
              <div className="text-xs text-gray-400">Manage city data and configurations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width CityjarTable */}
      <div className="flex-1 overflow-hidden">
        <CityjarTable classificationFilter={classificationFilter} />
      </div>
    </div>
  );
}