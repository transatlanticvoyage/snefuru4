'use client';

import { useState } from 'react';

interface FilegunToolbarProps {
  currentPath: string;
  onNavigateUp: () => void;
  onRefresh: () => void;
  onCreateFolder: (name: string) => Promise<void>;
  onCreateFile: (name: string) => Promise<void>;
  canNavigateUp: boolean;
  viewMode: 'list' | 'column';
  onViewModeChange: (mode: 'list' | 'column') => void;
}

export default function FilegunToolbar({
  currentPath,
  onNavigateUp,
  onRefresh,
  onCreateFolder,
  onCreateFile,
  canNavigateUp,
  viewMode,
  onViewModeChange
}: FilegunToolbarProps) {
  const [showCreateDialog, setShowCreateDialog] = useState<'folder' | 'file' | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const handleCreate = async () => {
    if (!newItemName.trim() || !showCreateDialog) return;

    try {
      if (showCreateDialog === 'folder') {
        await onCreateFolder(newItemName.trim());
      } else {
        await onCreateFile(newItemName.trim());
      }
      setNewItemName('');
      setShowCreateDialog(null);
    } catch (error) {
      alert(`Error creating ${showCreateDialog}: ${error.message}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      setNewItemName('');
      setShowCreateDialog(null);
    }
  };

  return (
    <div className="bg-white border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onNavigateUp}
              disabled={!canNavigateUp}
              className={`px-3 py-1 text-sm rounded ${
                canNavigateUp
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title="Go up one level"
            >
              ↑ Up
            </button>
            
            <button
              onClick={onRefresh}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              title="Refresh directory"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Current Path */}
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Path:</span>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
              {currentPath}
            </code>
          </div>
        </div>

        {/* View Controls and Create Controls */}
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded p-1">
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="List View"
            >
              ☰ List
            </button>
            <button
              onClick={() => onViewModeChange('column')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'column'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="Column View"
            >
              ▦ Column
            </button>
          </div>

          {/* Create Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateDialog('folder')}
              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              📁 New Folder
            </button>
            
            <button
              onClick={() => setShowCreateDialog('file')}
              className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              📄 New File
            </button>
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="mt-3 p-3 bg-gray-50 rounded border">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium">
              Create new {showCreateDialog}:
            </span>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Enter ${showCreateDialog} name`}
              className="flex-1 px-2 py-1 border rounded text-sm"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={!newItemName.trim()}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              Create
            </button>
            <button
              onClick={() => {
                setNewItemName('');
                setShowCreateDialog(null);
              }}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}