'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import ZhedoriButtonBar from '@/app/components/ZhedoriButtonBar';

export default function Test501Client() {
  const { user } = useAuth();
  const router = useRouter();
  const [counter, setCounter] = useState(0);

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
            <h1 className="text-2xl font-bold text-gray-800">🧪 Test501 Page</h1>
            <ZhedoriButtonBar />
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCounter(counter + 1)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Counter: {counter}
              </button>
              <button
                onClick={() => setCounter(0)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Test Page - Server-Side Title</div>
            <div className="text-xs text-gray-400">Route Group: (prot5)</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Server-Side Title Test</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-medium text-green-800">✅ What to Test:</h3>
              <ul className="mt-2 text-green-700 space-y-1">
                <li>• View Page Source should show &lt;title&gt;/test501 - Snefuru&lt;/title&gt;</li>
                <li>• Browser tab should show title immediately (no flash)</li>
                <li>• All interactive elements should work (counter, navigation)</li>
                <li>• Authentication should work normally</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-800">🔧 Architecture:</h3>
              <ul className="mt-2 text-blue-700 space-y-1">
                <li>• <code>layout.tsx</code> - Server component (enables metadata)</li>
                <li>• <code>ProtectedLayoutClient.tsx</code> - Client component (auth + UI)</li>
                <li>• <code>page.tsx</code> - Server component with metadata export</li>
                <li>• <code>Test501Client.tsx</code> - Client component with hooks</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="font-medium text-yellow-800">🎯 Current State:</h3>
              <div className="mt-2 text-yellow-700 space-y-1">
                <div>User: {user ? '✅ Authenticated' : '❌ Not authenticated'}</div>
                <div>Counter: {counter}</div>
                <div>Route: /test501</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}