'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAvalancheContent } from './hooks/useAvalancheContent';

// Dynamically import components to avoid SSR issues
const TipTapEditor = dynamic(() => import('./components/TipTapEditor'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center">Loading editor...</div>
});

const AvalancheSidebar1 = dynamic(() => import('./components/AvalancheSidebar1'), {
  ssr: false,
  loading: () => <div className="w-64 h-96 bg-gray-100 animate-pulse"></div>
});

export default function ValanPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [editorContent, setEditorContent] = useState('');
  const [editorLines, setEditorLines] = useState<string[]>([]);
  const [avalTitle, setAvalTitle] = useState('');

  // Get ID from URL parameters
  const id = searchParams?.get('id');

  // Fetch Avalanche content
  const { gconPiece, avalUnits, loading, error } = useAvalancheContent(id);

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    // TODO: Auto-save content changes to aval_content field
  };

  const handleLinesChange = (lines: string[]) => {
    setEditorLines(lines);
  };

  // Set initial content when data loads
  useEffect(() => {
    if (gconPiece?.aval_content) {
      setEditorContent(gconPiece.aval_content);
    }
    if (gconPiece?.aval_title) {
      setAvalTitle(gconPiece.aval_title);
    }
  }, [gconPiece?.aval_content, gconPiece?.aval_title]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading Avalanche content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
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
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
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
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>
        
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Valan - Avalanche Editor</h1>
          <div className="text-sm text-gray-600 mt-1">
            <span>Editing: {gconPiece.meta_title || 'Untitled'}</span>
            {gconPiece.asn_sitespren_base && (
              <span className="ml-2">({gconPiece.asn_sitespren_base})</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ID: {id} • {avalUnits.length} units loaded
          </div>
        </div>

        {/* Title Editor */}
        <div className="mb-4 max-w-7xl">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            aval_title
          </label>
          <input
            type="text"
            value={avalTitle}
            onChange={(e) => setAvalTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            placeholder="Enter avalanche title..."
          />
        </div>

        {/* Main Editor Layout */}
        <div className="flex bg-white rounded-lg shadow-lg overflow-hidden max-w-7xl">
          {/* Avalanche Sidebar */}
          <AvalancheSidebar1 
            units={avalUnits}
            lines={editorLines}
          />

          {/* TipTap Editor */}
          <div className="flex-1">
            <TipTapEditor 
              initialContent={'<p>Loading content...</p>'}
              content={gconPiece.aval_content || '<p>Start editing your Avalanche content...</p>'}
              onChange={handleEditorChange}
              onLinesChange={handleLinesChange}
            />
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-4 p-4 bg-gray-100 rounded text-xs text-gray-600 max-w-7xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Content:</strong> {editorContent.length} characters</p>
              <p><strong>Lines:</strong> {editorLines.length}</p>
              <p><strong>Units:</strong> {avalUnits.length}</p>
            </div>
            <div>
              <details>
                <summary className="cursor-pointer">View Units Data</summary>
                <pre className="mt-2 p-2 bg-white rounded overflow-x-auto text-xs">
                  {JSON.stringify(avalUnits.map(u => ({ 
                    line_key1: u.line_key1, 
                    unit_type: u.unit_type, 
                    payload: u.payload 
                  })), null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}