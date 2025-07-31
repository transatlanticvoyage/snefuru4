'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import example
const MenjariButtonBarFileGunLinks = dynamic(
  () => import('@/app/components/MenjariButtonBarFileGunLinks'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
  }
);

export default function FilegunNavDemoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showComponent, setShowComponent] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">FileGun Navigation Demo</h1>
          <p className="text-gray-600">This demo is only available in development mode</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🧭 FileGun Navigation Demo</h1>
            <p className="text-sm text-gray-600">MenjariButtonBarFileGunLinks Component Demo</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Environment: Development Only</div>
            <div className="text-xs text-gray-400">Project: Tregnar</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        
        {/* Demo Section 1: Basic Usage */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Usage</h2>
          <p className="text-gray-600 mb-4">
            The MenjariButtonBarFileGunLinks component provides quick navigation between FileGun, FileJar, and FolderJar pages.
          </p>
          <MenjariButtonBarFileGunLinks />
        </div>

        {/* Demo Section 2: Dynamic Loading */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Dynamic Import Example</h2>
          <p className="text-gray-600 mb-4">
            Click the button below to dynamically load another instance of the component:
          </p>
          <button
            onClick={() => setShowComponent(!showComponent)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
          >
            {showComponent ? 'Hide' : 'Show'} Dynamic Component
          </button>
          {showComponent && (
            <MenjariButtonBarFileGunLinks className="mt-4" />
          )}
        </div>

        {/* Demo Section 3: Custom Styling */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Custom Styling Example</h2>
          <p className="text-gray-600 mb-4">
            The component accepts a className prop for custom styling:
          </p>
          <MenjariButtonBarFileGunLinks className="border-2 border-blue-200 bg-blue-50" />
        </div>

        {/* Usage Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Usage Instructions</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong>Regular Click:</strong> Navigate to the page in the same tab</p>
            <p><strong>Ctrl+Click (PC) / Cmd+Click (Mac):</strong> Open in new tab</p>
            <p><strong>Middle Click:</strong> Open in new tab</p>
            <p><strong>Right Click:</strong> Show context menu with "Open in new tab" option</p>
          </div>
        </div>

        {/* Code Examples */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Code Examples</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Static Import:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import MenjariButtonBarFileGunLinks from '@/app/components/MenjariButtonBarFileGunLinks';

export default function MyPage() {
  return (
    <div>
      <MenjariButtonBarFileGunLinks />
    </div>
  );
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">Dynamic Import:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import dynamic from 'next/dynamic';

const MenjariButtonBarFileGunLinks = dynamic(
  () => import('@/app/components/MenjariButtonBarFileGunLinks'),
  { ssr: false }
);

export default function MyPage() {
  return (
    <div>
      <MenjariButtonBarFileGunLinks />
    </div>
  );
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}