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

export default function ValanClient() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [editorContent, setEditorContent] = useState('');
  const [editorLines, setEditorLines] = useState<string[]>([]);
  const [avalTitle, setAvalTitle] = useState('');
  const [avalMetadataMode, setAvalMetadataMode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Get ID from URL parameters
  const id = searchParams?.get('id');

  // Fetch Avalanche content
  const { gconPiece, avalUnits, loading, error } = useAvalancheContent(id);

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
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
    if (gconPiece?.aval_metadata_mode) {
      setAvalMetadataMode(gconPiece.aval_metadata_mode);
    }
  }, [gconPiece?.aval_content, gconPiece?.aval_title, gconPiece?.aval_metadata_mode]);

  // Save function
  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const response = await fetch('/api/valan-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          aval_title: avalTitle,
          aval_content: editorContent,
          aval_metadata_mode: avalMetadataMode,
          // aval_fk_featured_image_plan_id will be added later
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSaveMessage('✅ Saved successfully');
        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage('❌ Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

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

        {/* Main Editor Layout */}
        <div className="flex bg-white rounded-lg shadow-lg overflow-hidden max-w-7xl">
          {/* Avalanche Sidebar - 50% width */}
          <div className="w-1/2">
            <AvalancheSidebar1 
              units={avalUnits}
              lines={editorLines}
            />
          </div>

          {/* TipTap Editor - 50% width */}
          <div className="w-1/2">
            {/* Controls Area - Above Editor */}
            <div className="p-4 bg-gray-50 border-b border-gray-300">
              {/* Site Spren Base */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  asn_sitespren_base
                </label>
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm">
                  {gconPiece.asn_sitespren_base || 'Not set'}
                </div>
              </div>

              {/* Post Name */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  post_name
                </label>
                <div className="flex items-center gap-1 p-2 bg-gray-900 text-green-400 rounded font-mono text-sm border">
                  <button
                    onClick={() => {
                      if (gconPiece.asn_sitespren_base && gconPiece.post_name) {
                        window.open(`https://${gconPiece.asn_sitespren_base}/${gconPiece.post_name}`, '_blank');
                      }
                    }}
                    disabled={!gconPiece.post_name || !gconPiece.asn_sitespren_base}
                    className="w-6 h-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded flex items-center justify-center"
                    title="Open in new tab"
                  >
                    ↗
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(gconPiece.post_name || '')}
                    className="w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center justify-center"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                  <span className="flex-1 px-2">
                    {gconPiece.post_name || 'Not set'}
                  </span>
                </div>
              </div>

              {/* Page Slug */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  pageslug
                </label>
                <div className="flex items-center gap-1 p-2 bg-gray-900 text-green-400 rounded font-mono text-sm border">
                  <button
                    onClick={() => {
                      if (gconPiece.asn_sitespren_base && gconPiece.pageslug) {
                        window.open(`https://${gconPiece.asn_sitespren_base}/${gconPiece.pageslug}`, '_blank');
                      }
                    }}
                    disabled={!gconPiece.pageslug || !gconPiece.asn_sitespren_base}
                    className="w-6 h-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded flex items-center justify-center"
                    title="Open in new tab"
                  >
                    ↗
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(gconPiece.pageslug || '')}
                    className="w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center justify-center"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                  <span className="flex-1 px-2">
                    {gconPiece.pageslug || 'Not set'}
                  </span>
                </div>
              </div>

              {/* Page URL */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  pageurl
                </label>
                <div className="flex items-center gap-1 p-2 bg-gray-900 text-green-400 rounded font-mono text-sm border">
                  <button
                    onClick={() => {
                      if (gconPiece.pageurl) {
                        window.open(gconPiece.pageurl, '_blank');
                      }
                    }}
                    disabled={!gconPiece.pageurl}
                    className="w-6 h-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded flex items-center justify-center"
                    title="Open in new tab"
                  >
                    ↗
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(gconPiece.pageurl || '')}
                    className="w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center justify-center"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                  <span className="flex-1 px-2">
                    {gconPiece.pageurl || 'Not set'}
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <div className="mb-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {isSaving ? 'Saving...' : 'Save Avalanche Content'}
                </button>
                {saveMessage && (
                  <span className="ml-3 text-sm">{saveMessage}</span>
                )}
              </div>

              {/* Metadata Mode */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  aval_metadata_mode
                </label>
                <input
                  type="text"
                  value={avalMetadataMode}
                  onChange={(e) => setAvalMetadataMode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter metadata mode..."
                />
              </div>

              {/* Image Plan Batch ID */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  aval_fk_imgplan_batch_id
                </label>
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm">
                  {gconPiece.aval_fk_imgplan_batch_id || 'Not set'}
                </div>
              </div>

              {/* Featured Image Selector */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  aval_fk_featured_image_plan_id
                </label>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Select
                </button>
              </div>

              {/* Title Editor */}
              <div className="mb-4">
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
            </div>

            {/* aval_content Label */}
            <div className="p-2 bg-gray-100 border-b border-gray-300">
              <label className="text-sm font-bold text-gray-700">
                aval_content
              </label>
            </div>

            {/* TipTap Editor */}
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