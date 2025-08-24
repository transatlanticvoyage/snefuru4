'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import ZhedoriButtonBar from '@/app/components/ZhedoriButtonBar';
import SerpResultsTable from './components/SerpResultsTable';

export default function SerpjarClient() {
  const { user } = useAuth();
  const router = useRouter();

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
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-800">🎯 SERP Results</h1>
            <ZhedoriButtonBar />
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Search Engine Results</div>
            <div className="text-xs text-gray-400">Project: DataForSEO Integration</div>
          </div>
        </div>
        
        {/* New section below SERP Results heading */}
        <div className="mt-4 flex items-start space-x-6">
          <div className="font-bold text-gray-800" style={{ fontSize: '20px' }}>
            keywordshub.keyword_id
          </div>
          
          {/* UI Table */}
          <table className="border-collapse" style={{ border: '1px solid #4a5568' }}>
            <thead>
              <tr className="bg-gray-200">
                <th className="font-bold px-4 py-2" style={{ border: '1px solid #4a5568' }}>1</th>
                <th className="font-bold px-4 py-2" style={{ border: '1px solid #4a5568' }}>2</th>
                <th className="font-bold px-4 py-2" style={{ border: '1px solid #4a5568' }}>3</th>
                <th className="font-bold px-4 py-2" style={{ border: '1px solid #4a5568' }}>4</th>
                <th className="font-bold px-4 py-2" style={{ border: '1px solid #4a5568' }}>5</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="px-4 py-2" style={{ border: '1px solid #4a5568' }}></td>
                <td className="px-4 py-2" style={{ border: '1px solid #4a5568' }}></td>
                <td className="px-4 py-2" style={{ border: '1px solid #4a5568' }}></td>
                <td className="px-4 py-2" style={{ border: '1px solid #4a5568' }}></td>
                <td className="px-4 py-2" style={{ border: '1px solid #4a5568' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Content - Full Width SerpResultsTable */}
      <div className="flex-1 overflow-hidden">
        <SerpResultsTable />
      </div>
    </div>
  );
}