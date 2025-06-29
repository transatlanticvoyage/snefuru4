'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEdableContent } from '../hooks/useEdableContent';

// Dynamically import components to avoid SSR issues
const EdableTableEditor = dynamic(() => import('../components/EdableTableEditor'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center">Loading editor...</div>
});

export default function EdablePage() {
  const { user } = useAuth();
  const params = useParams();
  const [avalTitle, setAvalTitle] = useState('');
  const [avalContent, setAvalContent] = useState('');

  // Get ID from URL parameters
  const id = params?.id as string;

  // Fetch content
  const { gconPiece, loading, error } = useEdableContent(id);

  const handleTitleChange = (title: string) => {
    setAvalTitle(title);
    // TODO: Auto-save or manual save functionality
  };

  const handleContentChange = (content: string) => {
    setAvalContent(content);
    // TODO: Auto-save or manual save functionality
  };

  // Set initial content when data loads
  useEffect(() => {
    if (gconPiece?.aval_title) {
      setAvalTitle(gconPiece.aval_title);
      // Update browser title
      document.title = `edable_${gconPiece.aval_title}_${gconPiece.asn_sitespren_base || ''}`;
    }
    if (gconPiece?.aval_content) {
      setAvalContent(gconPiece.aval_content);
    }
  }, [gconPiece?.aval_title, gconPiece?.aval_content, gconPiece?.asn_sitespren_base]);

  // Set fallback title
  useEffect(() => {
    if (!avalTitle && gconPiece) {
      const siteBase = gconPiece.asn_sitespren_base || '';
      document.title = siteBase ? `edable_${siteBase}` : 'edable';
    } else if (!avalTitle && !gconPiece) {
      document.title = 'edable';
    }
  }, [avalTitle, gconPiece]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <Link href="/dashboard" className="text-purple-600 hover:text-purple-800 mt-4 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!gconPiece) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No content found for this ID</p>
          <Link href="/dashboard" className="text-purple-600 hover:text-purple-800 mt-4 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="mb-4">
          <Link href="/dashboard" className="text-purple-600 hover:text-purple-800">
            ← Back to Dashboard
          </Link>
        </div>
        
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-purple-800">Edable - Advanced Table Editor</h1>
          <div className="text-sm text-gray-600 mt-1">
            <span>Editing: {gconPiece.meta_title || 'Untitled'}</span>
            {gconPiece.asn_sitespren_base && (
              <span className="ml-2">({gconPiece.asn_sitespren_base})</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ID: {id}
          </div>
        </div>

        {/* Title Editor */}
        <div className="mb-4 bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-bold text-purple-700 mb-2">
            Title (aval_title)
          </label>
          <input
            type="text"
            value={avalTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-4 py-3 text-xl font-bold border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter title..."
          />
        </div>

        {/* Main Table Editor */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <EdableTableEditor 
            initialContent={gconPiece.aval_content || '<p>Start editing your content...</p>'}
            onContentChange={handleContentChange}
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
              <p><strong>Site:</strong> {gconPiece.asn_sitespren_base}</p>
              <p><strong>Status:</strong> {gconPiece.g_post_status || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}