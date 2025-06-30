'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const MesagenTableEditor = dynamic(() => import('./components/MesagenTableEditor'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center">Loading editor...</div>
});

export default function MesagenPage() {
  const { user } = useAuth();
  const [avalTitle, setAvalTitle] = useState('Sample Mesagen Title');
  const [avalContent, setAvalContent] = useState('');

  // Dummy data - similar to what edable would show
  const dummyData = {
    meta_title: 'Sample Mesagen Content',
    aval_title: 'Sample Mesagen Title',
    aval_content: 'This is line 1\nThis is line 2\nThis is line 3\nThis is line 4\nThis is line 5\nThis is line 6\nThis is line 7\nThis is line 8\nThis is line 9\nThis is line 10',
    asn_sitespren_base: 'example.com',
    g_post_status: 'draft'
  };

  const handleTitleChange = (title: string) => {
    setAvalTitle(title);
    // No backend save for now - UI only
  };

  const handleContentChange = (content: string) => {
    setAvalContent(content);
    // No backend save for now - UI only
  };

  // Set initial dummy content
  useEffect(() => {
    if (dummyData?.aval_title) {
      setAvalTitle(dummyData.aval_title);
      // Update browser title
      document.title = `mesagen_${dummyData.aval_title}_${dummyData.asn_sitespren_base || ''}`;
    }
    if (dummyData?.aval_content) {
      setAvalContent(dummyData.aval_content);
    }
  }, []);

  // Set fallback title
  useEffect(() => {
    if (!avalTitle) {
      const siteBase = dummyData.asn_sitespren_base || '';
      document.title = siteBase ? `mesagen_${siteBase}` : 'mesagen';
    }
  }, [avalTitle]);

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
          <Link href="/gconjar1" className="text-purple-600 hover:text-purple-800">
            ← Back to GconJar1
          </Link>
        </div>
        
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-purple-800">Mesagen - Advanced Table Editor</h1>
          <div className="text-sm text-gray-600 mt-1">
            <span>Editing: {dummyData.meta_title || 'Untitled'}</span>
            {dummyData.asn_sitespren_base && (
              <span className="ml-2">({dummyData.asn_sitespren_base})</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Mode: UI Demo (No Backend)
          </div>
        </div>

        {/* Main Table Editor */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <MesagenTableEditor 
            initialContent={dummyData.aval_content || '<p>Start editing your content...</p>'}
            onContentChange={handleContentChange}
            initialTitle={avalTitle}
            onTitleChange={handleTitleChange}
          />
        </div>

        {/* Debug Info */}
        <div className="mt-4 p-4 bg-gray-100 rounded text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Title:</strong> {avalTitle}</p>
              <p><strong>Content Length:</strong> {avalContent.length} characters</p>
            </div>
            <div>
              <p><strong>Site:</strong> {dummyData.asn_sitespren_base}</p>
              <p><strong>Status:</strong> {dummyData.g_post_status || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}