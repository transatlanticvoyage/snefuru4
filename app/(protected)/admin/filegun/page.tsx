'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import FilegunExplorer from './components/FilegunExplorer';
import FilegunColumnView from './components/FilegunColumnView';
import FilegunToolbar from './components/FilegunToolbar';
import FilegunStatusBar from './components/FilegunStatusBar';
import SentinelControl from './components/SentinelControl';
import SentinelStatus from './components/SentinelStatus';
import { useFilegunDirectory } from './hooks/useFilegunDirectory';
import { useFilegunOperations } from './hooks/useFilegunOperations';
import MenjariButtonBarFileGunLinks from '@/app/components/MenjariButtonBarFileGunLinks';

export default function FilegunPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'column'>('column'); // Default to column view
  const [toolbarKey, setToolbarKey] = useState(0); // Force toolbar refresh
  
  const {
    currentPath,
    items,
    isLoading,
    error,
    navigateToPath,
    navigateUp,
    refresh
  } = useFilegunDirectory('/');

  const {
    operations,
    isLoading: isOperationLoading,
    createFolder,
    createFile,
    renameItem,
    deleteItem
  } = useFilegunOperations();

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
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Filegun</h1>
          <p className="text-gray-600">Filegun is only available in development mode</p>
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

  const handleCreateFolder = async (name: string) => {
    await createFolder(currentPath, name);
    refresh();
  };

  const handleCreateFile = async (name: string) => {
    await createFile(currentPath, name);
    refresh();
  };

  const handleRename = async (oldPath: string, newName: string) => {
    await renameItem(oldPath, newName);
    refresh();
  };

  const handleDelete = async (itemPath: string) => {
    await deleteItem(itemPath);
    refresh();
  };

  const handlePinStatusChange = () => {
    // Force toolbar to refresh by changing its key
    setToolbarKey(prev => prev + 1);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🔫 Filegun</h1>
          </div>
          <div className="flex items-center space-x-6">
            <MenjariButtonBarFileGunLinks />
            <SentinelStatus />
            <div className="text-right">
              <div className="text-sm text-gray-500">Environment: Development Only</div>
              <div className="text-xs text-gray-400">Project: Tregnar</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <FilegunToolbar
        key={toolbarKey}
        currentPath={currentPath}
        onNavigateUp={navigateUp}
        onRefresh={refresh}
        onCreateFolder={handleCreateFolder}
        onCreateFile={handleCreateFile}
        canNavigateUp={currentPath !== '/'}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNavigateToPath={navigateToPath}
        onPinStatusChange={handlePinStatusChange}
      />

      {/* Sentinel Control Panel */}
      <div className="px-6">
        <SentinelControl />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-600 mb-2">❌ Error</div>
              <div className="text-gray-600">{error}</div>
              <button
                onClick={refresh}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-hidden">
            {viewMode === 'column' ? (
              <FilegunColumnView
                initialPath={currentPath}
                onRename={handleRename}
                onDelete={handleDelete}
                onPinStatusChange={handlePinStatusChange}
              />
            ) : (
              <div className="h-full overflow-auto">
                <FilegunExplorer
                  items={items}
                  isLoading={isLoading || isOperationLoading}
                  onNavigate={navigateToPath}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  onPinStatusChange={handlePinStatusChange}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <FilegunStatusBar
        operations={operations}
        currentPath={currentPath}
        itemCount={items.length}
      />
    </div>
  );
}