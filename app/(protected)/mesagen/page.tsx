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
  const [mudTitle, setMudTitle] = useState('Sample Mesagen Title');
  const [mudContent, setMudContent] = useState('');
  const [isRunningF22, setIsRunningF22] = useState(false);

  // Dummy data - similar to what edable would show
  const dummyData = {
    id: 'mesagen-demo-id-12345', // Mock gcon_piece ID for f22 processing
    meta_title: 'Sample Mesagen Content',
    mud_title: 'Sample Mesagen Title',
    mud_content: 'This is line 1\nThis is line 2\nThis is line 3\nThis is line 4\nThis is line 5\nThis is line 6\nThis is line 7\nThis is line 8\nThis is line 9\nThis is line 10',
    asn_sitespren_base: 'example.com',
    g_post_status: 'draft'
  };

  const handleTitleChange = (title: string) => {
    setMudTitle(title);
    // No backend save for now - UI only
  };

  const handleContentChange = (content: string) => {
    setMudContent(content);
    // No backend save for now - UI only
  };

  // Handle f22 processing for this specific gcon_piece
  const handleRunF22 = async () => {
    if (!user?.id || !dummyData.id) {
      alert('Unable to run f22: Missing user or gcon_piece ID');
      return;
    }

    setIsRunningF22(true);
    try {
      // Note: In a real implementation, this would use the actual gcon_piece ID
      // For demo purposes, we're using the mock ID from dummyData
      console.log(`Running f22 for gcon_piece ID: ${dummyData.id}`);
      
      // Since this is UI-only demo, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      alert(`F22 processing completed for gcon_piece: ${dummyData.id}`);
    } catch (error) {
      console.error('Error running f22:', error);
      alert('Error running f22 process');
    } finally {
      setIsRunningF22(false);
    }
  };

  // Set initial dummy content
  useEffect(() => {
    if (dummyData?.mud_title) {
      setMudTitle(dummyData.mud_title);
      // Update browser title
      document.title = `mesagen_${dummyData.mud_title}_${dummyData.asn_sitespren_base || ''}`;
    }
    if (dummyData?.mud_content) {
      setMudContent(dummyData.mud_content);
    }
  }, []);

  // Set fallback title
  useEffect(() => {
    if (!mudTitle) {
      const siteBase = dummyData.asn_sitespren_base || '';
      document.title = siteBase ? `mesagen_${siteBase}` : 'mesagen';
    }
  }, [mudTitle]);

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
          <div className="flex items-center justify-between">
            <div>
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
            <button
              onClick={handleRunF22}
              disabled={isRunningF22}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                isRunningF22
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isRunningF22 ? 'Running f22...' : 'Run f22 on this gcon_pieces row'}
            </button>
          </div>
        </div>

        {/* Main Table Editor */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <MesagenTableEditor 
            initialContent={dummyData.mud_content || '<p>Start editing your content...</p>'}
            onContentChange={handleContentChange}
            initialTitle={mudTitle}
            onTitleChange={handleTitleChange}
          />
        </div>

        {/* Debug Info */}
        <div className="mt-4 p-4 bg-gray-100 rounded text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>mud_title:</strong> {mudTitle}</p>
              <p><strong>mud_content Length:</strong> {mudContent.length} characters</p>
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