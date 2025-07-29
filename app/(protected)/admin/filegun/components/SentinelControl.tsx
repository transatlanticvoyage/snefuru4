'use client';

import { useState } from 'react';
import { useSentinel } from '../hooks/useSentinel';

export default function SentinelControl() {
  const {
    status,
    operations,
    isLoading,
    error,
    startSentinel,
    stopSentinel,
    restartSentinel,
    syncDirectory,
    clearOperations,
    cleanupDeleted
  } = useSentinel();

  const [syncPath, setSyncPath] = useState('/app');
  const [showOperations, setShowOperations] = useState(false);

  const handleStart = async () => {
    await startSentinel(syncPath);
  };

  const handleStop = async () => {
    await stopSentinel();
  };

  const handleRestart = async () => {
    await restartSentinel(syncPath);
  };

  const handleSync = async () => {
    await syncDirectory(syncPath);
  };

  const handleClearOperations = async () => {
    await clearOperations();
  };

  const handleCleanup = async () => {
    await cleanupDeleted();
  };

  const getStatusColor = () => {
    if (!status) return 'gray';
    if (status.isActive && !status.isScanning) return 'green';
    if (status.isScanning) return 'blue';
    return 'red';
  };

  const getStatusText = () => {
    if (!status) return 'Unknown';
    if (status.isScanning) return 'Scanning...';
    if (status.isActive) return 'Active';
    return 'Inactive';
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-800">🛡️ Filegun Sentinel</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              getStatusColor() === 'green' ? 'bg-green-500' : 
              getStatusColor() === 'blue' ? 'bg-blue-500' : 
              getStatusColor() === 'red' ? 'bg-red-500' : 'bg-gray-500'
            }`}></div>
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
        </div>
        
        <button
          onClick={() => setShowOperations(!showOperations)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showOperations ? 'Hide' : 'Show'} Operations ({operations.length})
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Status Info */}
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
          <div className="bg-white p-2 rounded border">
            <div className="text-gray-500">Files</div>
            <div className="font-semibold">{status.totalFiles.toLocaleString()}</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="text-gray-500">Folders</div>
            <div className="font-semibold">{status.totalFolders.toLocaleString()}</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="text-gray-500">Pending</div>
            <div className="font-semibold">{status.pendingChanges}</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="text-gray-500">Errors</div>
            <div className="font-semibold text-red-600">{status.errorCount}</div>
          </div>
        </div>
      )}

      {/* Path Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Watch Path:
        </label>
        <input
          type="text"
          value={syncPath}
          onChange={(e) => setSyncPath(e.target.value)}
          className="w-full px-3 py-1 border border-gray-300 rounded text-sm font-mono"
          placeholder="/app"
        />
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleStart}
          disabled={isLoading || (status?.isActive && !status?.isScanning)}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : '▶️ Start'}
        </button>

        <button
          onClick={handleStop}
          disabled={isLoading || !status?.isActive}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : '⏹️ Stop'}
        </button>

        <button
          onClick={handleRestart}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : '🔄 Restart'}
        </button>

        <button
          onClick={handleSync}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : '🔄 Force Sync'}
        </button>

        <button
          onClick={handleCleanup}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : '🧹 Cleanup'}
        </button>
      </div>

      {/* Last Sync Time */}
      {status?.lastSyncTime && (
        <div className="text-xs text-gray-500 mb-2">
          Last sync: {new Date(status.lastSyncTime).toLocaleString()}
        </div>
      )}

      {/* Operations History */}
      {showOperations && (
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Recent Operations</h4>
            <button
              onClick={handleClearOperations}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear History
            </button>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {operations.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">
                No operations yet
              </div>
            ) : (
              operations.slice(0, 10).map((op) => (
                <div
                  key={op.id}
                  className={`text-xs p-2 mb-1 rounded border-l-3 ${
                    op.status === 'completed' ? 'bg-green-50 border-green-400' :
                    op.status === 'error' ? 'bg-red-50 border-red-400' :
                    'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{op.action}</span>
                    <span className="text-gray-500">
                      {new Date(op.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-600 truncate" title={op.path}>
                    {op.path}
                  </div>
                  {op.error && (
                    <div className="text-red-600 mt-1">{op.error}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}