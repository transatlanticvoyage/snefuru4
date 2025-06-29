'use client';

import { useState, useEffect } from 'react';

interface DorliBlock {
  dorli_id: string;
  fk_gcon_piece_id: string;
  tag: string;
  placeholder: string;
  raw: string;
  line_count: number;
  created_at: string;
}

interface DorliEditorProps {
  dorliBlock: DorliBlock;
  onUpdate: (dorliId: string, newRaw: string) => Promise<boolean>;
  focused: boolean;
  onFocus: () => void;
}

type ViewMode = 'visual' | 'html';

export default function DorliEditor({ dorliBlock, onUpdate, focused, onFocus }: DorliEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [rawContent, setRawContent] = useState(dorliBlock.raw);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update local content when dorli block changes
  useEffect(() => {
    setRawContent(dorliBlock.raw);
  }, [dorliBlock.raw]);

  const handleSave = async () => {
    if (rawContent === dorliBlock.raw) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const success = await onUpdate(dorliBlock.dorli_id, rawContent);
    
    if (success) {
      setIsEditing(false);
    }
    
    setIsSaving(false);
  };

  const handleCancel = () => {
    setRawContent(dorliBlock.raw);
    setIsEditing(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawContent(e.target.value);
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  // Calculate textarea height based on content
  const calculateHeight = () => {
    const lineCount = rawContent.split('\n').length;
    const minHeight = Math.max(lineCount * 24, 120); // 24px per line, minimum 120px
    return Math.min(minHeight, 400); // Maximum 400px
  };

  return (
    <div 
      className={`border border-gray-300 rounded ${focused ? 'ring-2 ring-purple-500 border-purple-300' : ''}`}
      onClick={onFocus}
    >
      {/* Dorli Header */}
      <div className="bg-blue-50 border-b border-blue-200 p-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-blue-100 px-2 py-1 rounded">
              {dorliBlock.placeholder}
            </span>
            <span className="text-xs text-blue-600">
              {dorliBlock.tag.toUpperCase()} • {dorliBlock.line_count} lines
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <button
                  onClick={handleCancel}
                  className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
            
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => setViewMode('visual')}
                className={`px-2 py-1 text-xs font-medium ${
                  viewMode === 'visual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Visual
              </button>
              <button
                onClick={() => setViewMode('html')}
                className={`px-2 py-1 text-xs font-medium ${
                  viewMode === 'html'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                HTML
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dorli Content */}
      <div className="p-2">
        {viewMode === 'html' ? (
          <textarea
            value={rawContent}
            onChange={handleTextareaChange}
            className="w-full p-2 font-mono text-sm border border-gray-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ height: `${calculateHeight()}px` }}
            placeholder="Enter HTML content..."
            onFocus={onFocus}
          />
        ) : (
          <div className="min-h-[120px] max-h-[400px] overflow-auto">
            <div 
              className="prose prose-sm max-w-none p-2 border border-gray-200 rounded bg-gray-50"
              dangerouslySetInnerHTML={{ __html: rawContent }}
            />
            <button
              onClick={() => setViewMode('html')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Click to edit HTML →
            </button>
          </div>
        )}
      </div>

      {/* Status indicator */}
      {isEditing && (
        <div className="bg-yellow-50 border-t border-yellow-200 px-2 py-1">
          <span className="text-xs text-yellow-700">• Unsaved changes</span>
        </div>
      )}
    </div>
  );
}