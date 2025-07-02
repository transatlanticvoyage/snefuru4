'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface BakliMockup {
  bakli_id: string;
  fk_user_id: string;
  bakli_name: string;
  bakli_description: string | null;
  bakli_content: string | null;
  bakli_css: string | null;
  bakli_status: string;
  bakli_folder: string | null;
  bakli_tags: string[] | null;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  bakli_notes: string | null;
}

type TabType = 'html' | 'css' | 'preview';
type ViewMode = 'view1' | 'view2';
type EditorTheme = 'light' | 'dark';

export default function BaklidPage() {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const bakliId = searchParams?.get('bakli_id');
  
  const [mockup, setMockup] = useState<BakliMockup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('html');
  const [viewMode, setViewMode] = useState<ViewMode>('view1');
  const [editorTheme, setEditorTheme] = useState<EditorTheme>('light');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Form states
  const [htmlContent, setHtmlContent] = useState('');
  const [cssContent, setCssContent] = useState('');
  const [mockupName, setMockupName] = useState('');
  const [mockupDescription, setMockupDescription] = useState('');
  const [mockupStatus, setMockupStatus] = useState('draft');
  const [mockupFolder, setMockupFolder] = useState('');
  const [mockupNotes, setMockupNotes] = useState('');

  useEffect(() => {
    if (bakliId) {
      fetchMockup();
    } else {
      setError('No bakli_id provided');
      setLoading(false);
    }
  }, [bakliId]);

  const fetchMockup = async () => {
    if (!bakliId || !user?.id) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) {
        setError('User not found');
        return;
      }

      // Fetch the mockup
      const { data, error } = await supabase
        .from('bakli_mockups')
        .select('*')
        .eq('bakli_id', bakliId)
        .eq('fk_user_id', userData.id)
        .single();

      if (error) {
        setError('Mockup not found or access denied');
        return;
      }

      setMockup(data);
      
      // Set form states
      setHtmlContent(data.bakli_content || '');
      setCssContent(data.bakli_css || '');
      setMockupName(data.bakli_name || '');
      setMockupDescription(data.bakli_description || '');
      setMockupStatus(data.bakli_status || 'draft');
      setMockupFolder(data.bakli_folder || '');
      setMockupNotes(data.bakli_notes || '');

      // Update page title
      document.title = `${data.bakli_name} - Bakli Mockup - Snefuru`;

      // Update view count
      await supabase
        .from('bakli_mockups')
        .update({ 
          view_count: (data.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('bakli_id', bakliId);

    } catch (err) {
      console.error('Error fetching mockup:', err);
      setError('Failed to load mockup');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bakliId || !mockup) {
      alert('Cannot save: mockup not loaded');
      return;
    }

    setIsSaving(true);

    try {
      const updateData = {
        bakli_name: mockupName.trim(),
        bakli_description: mockupDescription.trim() || null,
        bakli_content: htmlContent,
        bakli_css: cssContent,
        bakli_status: mockupStatus,
        bakli_folder: mockupFolder.trim() || null,
        bakli_notes: mockupNotes.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('bakli_mockups')
        .update(updateData)
        .eq('bakli_id', bakliId);

      if (error) throw error;

      // Update local state
      setMockup(prev => prev ? { ...prev, ...updateData } : null);
      setLastSaved(new Date());
      
      // Create version history entry
      await supabase
        .from('bakli_mockup_versions')
        .insert([{
          fk_bakli_id: bakliId,
          version_number: Date.now(), // Simple versioning for now
          bakli_content: htmlContent,
          bakli_css: cssContent,
          change_notes: 'Auto-saved version'
        }]);

      alert('Mockup saved successfully!');
    } catch (err) {
      console.error('Error saving mockup:', err);
      alert('Failed to save mockup');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPreview = () => {
    // Create the CSS link reference to our API endpoint for saved CSS
    const cssLinkTag = bakliId ? `<link rel="stylesheet" type="text/css" href="/api/bakli-css/${bakliId}">` : '';
    
    // Also include current editor CSS for live preview
    const liveStyles = `
      <style id="live-css">
        /* Live CSS from editor */
        ${cssContent}
      </style>
    `;
    
    const resetStyles = `
      <style>
        /* Reset styles for iframe content */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
      </style>
    `;

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        ${resetStyles}
        ${cssLinkTag}
        ${liveStyles}
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    return (
      <iframe
        srcDoc={fullHtml}
        className="w-full h-full border-0"
        title="Mockup Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    );
  };

  // Get editor styling based on theme
  const getEditorClasses = () => {
    const baseClasses = "flex-1 w-full p-4 border rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent";
    
    if (editorTheme === 'dark') {
      return `${baseClasses} bg-gray-900 text-gray-100 border-gray-600`;
    }
    return `${baseClasses} bg-white text-gray-900 border-gray-300`;
  };

  // Simple syntax highlighting for HTML content
  const highlightHTML = (content: string) => {
    if (editorTheme === 'light') {
      return content
        .replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)(.*?)(&gt;)/g, '<span style="color: #0066cc;">$1$2</span><span style="color: #cc6600;">$3</span><span style="color: #0066cc;">$4</span>')
        .replace(/(\w+)(=)("[^"]*")/g, '<span style="color: #cc0066;">$1</span><span style="color: #666;">$2</span><span style="color: #009900;">$3</span>');
    } else {
      return content
        .replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)(.*?)(&gt;)/g, '<span style="color: #7dd3fc;">$1$2</span><span style="color: #fbbf24;">$3</span><span style="color: #7dd3fc;">$4</span>')
        .replace(/(\w+)(=)("[^"]*")/g, '<span style="color: #f472b6;">$1</span><span style="color: #9ca3af;">$2</span><span style="color: #34d399;">$3</span>');
    }
  };

  // Simple syntax highlighting for CSS content
  const highlightCSS = (content: string) => {
    if (editorTheme === 'light') {
      return content
        .replace(/(\/\*.*?\*\/)/g, '<span style="color: #999; font-style: italic;">$1</span>')
        .replace(/([a-zA-Z-]+)(\s*:\s*)([^;]+)(;)/g, '<span style="color: #0066cc;">$1</span><span style="color: #666;">$2</span><span style="color: #009900;">$3</span><span style="color: #666;">$4</span>')
        .replace(/(\{|\})/g, '<span style="color: #cc6600;">$1</span>');
    } else {
      return content
        .replace(/(\/\*.*?\*\/)/g, '<span style="color: #6b7280; font-style: italic;">$1</span>')
        .replace(/([a-zA-Z-]+)(\s*:\s*)([^;]+)(;)/g, '<span style="color: #7dd3fc;">$1</span><span style="color: #9ca3af;">$2</span><span style="color: #34d399;">$3</span><span style="color: #9ca3af;">$4</span>')
        .replace(/(\{|\})/g, '<span style="color: #fbbf24;">$1</span>');
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
        <p className="text-gray-500">Loading mockup...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/admin/baklijar" className="text-purple-600 hover:text-purple-800">
            ← Back to Bakli Mockups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <Link href="/admin/baklijar" className="text-purple-200 hover:text-white">
                ← Back to List
              </Link>
              <h1 className="text-xl font-bold">{mockupName || 'Untitled Mockup'}</h1>
            </div>
            <p className="text-purple-200 text-sm mt-1">
              {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-white text-purple-600 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Mockup Details Bar */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={mockupName}
              onChange={(e) => setMockupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
              placeholder="Mockup name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={mockupStatus}
              onChange={(e) => setMockupStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
            <input
              type="text"
              value={mockupFolder}
              onChange={(e) => setMockupFolder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
              placeholder="Optional folder..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={mockupDescription}
              onChange={(e) => setMockupDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
              placeholder="Brief description..."
            />
          </div>
        </div>
      </div>

      {/* View Mode & Theme Toggle */}
      <div className="bg-gray-100 border-b border-gray-200 p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-8">
          {/* View Mode Toggle */}
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('view1')}
              className={`px-6 py-2 text-sm font-medium transition-colors ${
                viewMode === 'view1'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              View 1
            </button>
            <button
              onClick={() => setViewMode('view2')}
              className={`px-6 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                viewMode === 'view2'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              View 2
            </button>
          </div>

          {/* Editor Theme Toggle */}
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setEditorTheme('light')}
              className={`px-6 py-2 text-sm font-medium transition-colors ${
                editorTheme === 'light'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Light Mode
            </button>
            <button
              onClick={() => setEditorTheme('dark')}
              className={`px-6 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                editorTheme === 'dark'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Dark Mode
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {viewMode === 'view1' && (
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="max-w-7xl mx-auto">
            <nav className="flex">
              {[
                { id: 'html' as TabType, label: 'Enter HTML', icon: '📝' },
                { id: 'css' as TabType, label: 'Enter CSS', icon: '🎨' },
                { id: 'preview' as TabType, label: 'View Frontend', icon: '👁️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'view1' ? (
          // View 1: Original single-pane layout
          <div className="max-w-7xl mx-auto h-full p-4">
            {activeTab === 'html' && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">HTML Content</h3>
                  <div className="text-sm text-gray-500">
                    {htmlContent.length} characters
                  </div>
                </div>
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className={getEditorClasses()}
                  style={{ 
                    minHeight: '700px',
                    ...(editorTheme === 'dark' && {
                      backgroundColor: '#111827',
                      color: '#f3f4f6',
                      borderColor: '#374151'
                    })
                  }}
                  placeholder="Enter your HTML content here..."
                  spellCheck={false}
                />
              </div>
            )}

            {activeTab === 'css' && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">CSS Styles</h3>
                  <div className="text-sm text-gray-500">
                    {cssContent.length} characters
                  </div>
                </div>
                <textarea
                  value={cssContent}
                  onChange={(e) => setCssContent(e.target.value)}
                  className={getEditorClasses()}
                  style={{ 
                    minHeight: '700px',
                    ...(editorTheme === 'dark' && {
                      backgroundColor: '#111827',
                      color: '#f3f4f6',
                      borderColor: '#374151'
                    })
                  }}
                  placeholder="Enter your CSS styles here..."
                  spellCheck={false}
                />
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Live Preview</h3>
                  <div className="text-sm text-gray-500">
                    Renders your HTML + CSS
                  </div>
                </div>
                <div className="flex-1 border border-gray-300 rounded-md overflow-hidden bg-white" style={{ minHeight: '700px' }}>
                  {renderPreview()}
                </div>
              </div>
            )}
          </div>
        ) : (
          // View 2: Split layout with preview always visible on left
          <div className="h-full flex">
            {/* Left Side - Live Preview */}
            <div className="flex-1 flex flex-col">
              {/* Left Tab Navigation */}
              <div className="bg-white border-b border-gray-200">
                <nav className="flex">
                  <button className="px-6 py-4 text-sm font-medium border-b-2 border-purple-500 text-purple-600 bg-purple-50 flex items-center gap-2">
                    <span>👁️</span>
                    View Frontend
                  </button>
                </nav>
              </div>
              
              {/* Left Content */}
              <div className="flex-1 p-4">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Live Preview</h3>
                    <div className="text-sm text-gray-500">
                      Renders your HTML + CSS
                    </div>
                  </div>
                  <div className="flex-1 border border-gray-300 rounded-md overflow-hidden bg-white" style={{ minHeight: '700px' }}>
                    {renderPreview()}
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Separator */}
            <div className="w-1 bg-gray-600 flex-shrink-0"></div>

            {/* Right Side - HTML/CSS Editing */}
            <div className="flex-1 flex flex-col">
              {/* Right Tab Navigation */}
              <div className="bg-white border-b border-gray-200">
                <nav className="flex">
                  {[
                    { id: 'html' as TabType, label: 'Enter HTML', icon: '📝' },
                    { id: 'css' as TabType, label: 'Enter CSS', icon: '🎨' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'border-purple-500 text-purple-600 bg-purple-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Right Content */}
              <div className="flex-1 p-4">
                {activeTab === 'html' && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">HTML Content</h3>
                      <div className="text-sm text-gray-500">
                        {htmlContent.length} characters
                      </div>
                    </div>
                    <textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className={getEditorClasses()}
                      style={{ 
                        minHeight: '700px',
                        ...(editorTheme === 'dark' && {
                          backgroundColor: '#111827',
                          color: '#f3f4f6',
                          borderColor: '#374151'
                        })
                      }}
                      placeholder="Enter your HTML content here..."
                      spellCheck={false}
                    />
                  </div>
                )}

                {activeTab === 'css' && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">CSS Styles</h3>
                      <div className="text-sm text-gray-500">
                        {cssContent.length} characters
                      </div>
                    </div>
                    <textarea
                      value={cssContent}
                      onChange={(e) => setCssContent(e.target.value)}
                      className={getEditorClasses()}
                      style={{ 
                        minHeight: '700px',
                        ...(editorTheme === 'dark' && {
                          backgroundColor: '#111827',
                          color: '#f3f4f6',
                          borderColor: '#374151'
                        })
                      }}
                      placeholder="Enter your CSS styles here..."
                      spellCheck={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes Section (always visible at bottom) */}
      <div className="bg-gray-100 border-t border-gray-200 p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">Internal Notes</label>
          <textarea
            value={mockupNotes}
            onChange={(e) => setMockupNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-purple-500"
            rows={2}
            placeholder="Add any internal notes about this mockup..."
          />
        </div>
      </div>
    </div>
  );
}