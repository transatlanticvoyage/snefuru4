'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SubPage {
  name: string;
  path: string;
  description?: string;
}

export default function KxTemplatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [subPages, setSubPages] = useState<SubPage[]>([]);

  // In the future, this will dynamically fetch all subpages under /kxtemplates/
  // For now, it's an empty array that will be populated as you create new pages
  useEffect(() => {
    // This would eventually be replaced with a dynamic fetch or file system scan
    const templatePages: SubPage[] = [
      // Example structure for future pages:
      // { name: 'Template 1', path: '/kxtemplates/template1', description: 'Description of template 1' },
      // { name: 'Template 2', path: '/kxtemplates/template2', description: 'Description of template 2' },
    ];
    
    setSubPages(templatePages);
  }, []);

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
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6">KX Templates Directory</h1>

        {/* Subpages Directory Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Available Templates</h2>
          <div className="bg-white rounded-lg shadow p-6">
            {subPages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subPages.map((page) => (
                  <Link
                    key={page.path}
                    href={page.path}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <h3 className="font-semibold text-blue-600 hover:text-blue-800">
                      {page.name}
                    </h3>
                    {page.description && (
                      <p className="text-sm text-gray-600 mt-1">{page.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No template pages created yet. Subpages under /kxtemplates/ will appear here as they are created.
              </p>
            )}
          </div>
        </div>

        {/* FPopup1Template System Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            <span className="font-bold">FPopup1Template System</span> - Developer Information
          </h2>
          <div className="bg-gray-900 text-green-400 rounded-lg shadow p-6 font-mono text-sm">
            <div className="mb-4">
              <h3 className="text-white font-bold mb-2">File Structure:</h3>
              <div className="ml-4 space-y-1">
                <div>📁 components/ui/FPopup1Template/</div>
                <div className="ml-4">📄 FPopup1Template.tsx - Main popup component</div>
                <div className="ml-4">📄 FPopup1TemplateProvider.tsx - Context provider for popup state</div>
                <div className="ml-4">📄 FPopup1Header.tsx - Dual header bar system component</div>
                <div className="ml-4">📄 FPopup1Tabs.tsx - Tab navigation component</div>
                <div className="ml-4">📄 FPopup1Content.tsx - Content area component</div>
                <div className="ml-4">📄 types.ts - TypeScript type definitions</div>
                <div className="ml-4">📄 index.ts - Main export file</div>
                <div className="ml-4">📄 README.md - Documentation</div>
                <div className="ml-4">📁 hooks/</div>
                <div className="ml-8">📄 useFPopup1State.ts - State management hook</div>
                <div className="ml-8">📄 useFPopup1Url.ts - URL synchronization hook</div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-white font-bold mb-2">Key Features:</h3>
              <ul className="ml-4 space-y-1 list-disc list-inside">
                <li>Dual header bar system (uel_bar and uel_bar_37)</li>
                <li>7 configurable tabs (ptab1 through ptab7)</li>
                <li>URL parameter synchronization</li>
                <li>Customizable color schemes per tab</li>
                <li>Context-based state management</li>
                <li>Modal overlay with proper z-indexing</li>
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="text-white font-bold mb-2">Usage Example:</h3>
              <pre className="bg-gray-800 p-3 rounded overflow-x-auto">{`import { FPopup1Template, FPopup1TemplateProvider } from '@/components/ui/FPopup1Template';

// Wrap your component with the provider
<FPopup1TemplateProvider>
  <FPopup1Template
    isOpen={isPopupOpen}
    onClose={handleClose}
    currentUrl={window.location.href}
  />
</FPopup1TemplateProvider>`}</pre>
            </div>

            <div>
              <h3 className="text-white font-bold mb-2">Current Implementations:</h3>
              <ul className="ml-4 space-y-1 list-disc list-inside">
                <li>/mesagen - Functions popup for advanced table editor</li>
                <li>/admin/popnow - KPopup1 variant for admin tools</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}