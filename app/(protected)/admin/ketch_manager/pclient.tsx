'use client';

import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import KetchSettingsTable from './components/KetchSettingsTable';

export default function KetchManagerClient() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="mb-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold">Ketch Manager</h1>
            <button
            onClick={async () => {
              try {
                const response = await fetch('https://valueoffershq.com/wp-json/snefuru/v1/ketch/trigger-css-update', {
                  method: 'POST'
                });
                const result = await response.json();
                if (result.success) {
                  alert('CSS updated successfully!');
                } else {
                  alert('Failed to update CSS: ' + (result.error || 'Unknown error'));
                }
              } catch (error) {
                alert('Error triggering CSS update: ' + error);
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Trigger CSS Update
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm ml-4"
          >
            waiting for new css function
          </button>
          </div>
          <p className="text-gray-600" style={{ fontSize: '16px' }}>
            <span className="font-bold">main db table:</span> ketch_settings
          </p>
        </div>
        
        <KetchSettingsTable />
      </div>
    </div>
  );
}