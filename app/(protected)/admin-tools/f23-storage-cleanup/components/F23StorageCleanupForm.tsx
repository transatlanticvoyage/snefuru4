'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { F23DeletionMode, F23OperationResult, F23ApiResponse } from '../types/f23-types';
import { F23_DELETION_MODES } as MODES } from '../constants/f23-constants';

export default function F23StorageCleanupForm() {
  const [f23_folderInput, setF23FolderInput] = useState('');
  const [f23_deletionMode, setF23DeletionMode] = useState<F23DeletionMode>('preview');
  const [f23_isProcessing, setF23IsProcessing] = useState(false);
  const [f23_results, setF23Results] = useState<F23OperationResult | null>(null);
  const [f23_error, setF23Error] = useState<string | null>(null);
  const [f23_logs, setF23Logs] = useState<string[]>([]);

  const { user } = useAuth();
  const router = useRouter();

  // Check if user is authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  const f23_parseFolderList = (input: string): string[] => {
    return input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  const f23_validateInput = (folders: string[]): string | null => {
    if (folders.length === 0) {
      return 'Please enter at least one folder name';
    }
    
    if (folders.length > 50) {
      return 'Maximum 50 folders allowed per operation';
    }

    return null;
  };

  const f23_formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const f23_handleSubmit = async () => {
    setF23IsProcessing(true);
    setF23Error(null);
    setF23Results(null);
    setF23Logs([]);

    try {
      const folders = f23_parseFolderList(f23_folderInput);
      const validationError = f23_validateInput(folders);
      
      if (validationError) {
        setF23Error(validationError);
        return;
      }

      const response = await fetch('/api/f23-storage-cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          f23_folders: folders,
          f23_mode: f23_deletionMode
        }),
      });

      const data: F23ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.f23_log?.[0] || 'Operation failed');
      }

      if (data.success) {
        setF23Results(data.f23_results);
        setF23Logs(data.f23_log);
      } else {
        setF23Error('Operation failed');
        setF23Logs(data.f23_log);
      }

    } catch (error) {
      console.error('F23 Storage cleanup error:', error);
      setF23Error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setF23IsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">F23 Storage Cleanup</h1>
        <p className="text-gray-600">
          Admin tool for managing storage folders in bucket: bucket-images-b1/barge1
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6">
        <div className="space-y-6">
          {/* Folder Input */}
          <div>
            <label htmlFor="f23_folders" className="block text-sm font-medium text-gray-700 mb-2">
              Folder Names (one per line)
            </label>
            <textarea
              id="f23_folders"
              value={f23_folderInput}
              onChange={(e) => setF23FolderInput(e.target.value)}
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder={`2025_06_01 - 17\n2025_06_01 - 18\n2025_06_02 - 1\nold_batch_2024_12_15\ntemp_uploads_jan_2025`}
              disabled={f23_isProcessing}
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter folder names exactly as they appear in storage (without the "barge1/" prefix)
            </p>
          </div>

          {/* Deletion Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Operation Mode
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value={MODES.PREVIEW}
                  checked={f23_deletionMode === MODES.PREVIEW}
                  onChange={(e) => setF23DeletionMode(e.target.value as F23DeletionMode)}
                  disabled={f23_isProcessing}
                  className="mr-2"
                />
                <span className="text-sm">
                  <strong>Preview Only</strong> - Show what would be deleted (safe)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value={MODES.TRASH}
                  checked={f23_deletionMode === MODES.TRASH}
                  onChange={(e) => setF23DeletionMode(e.target.value as F23DeletionMode)}
                  disabled={f23_isProcessing}
                  className="mr-2"
                />
                <span className="text-sm">
                  <strong>Move to Trash</strong> - Move files to f23_trash folder (recoverable)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value={MODES.PERMANENT}
                  checked={f23_deletionMode === MODES.PERMANENT}
                  onChange={(e) => setF23DeletionMode(e.target.value as F23DeletionMode)}
                  disabled={f23_isProcessing}
                  className="mr-2"
                />
                <span className="text-sm text-red-700">
                  <strong>Permanent Delete</strong> - Permanently remove files (irreversible)
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={f23_handleSubmit}
              disabled={f23_isProcessing || !f23_folderInput.trim()}
              className={`px-6 py-2 font-medium rounded-md transition-colors ${
                f23_deletionMode === MODES.PERMANENT
                  ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white'
                  : f23_deletionMode === MODES.TRASH
                  ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white'
              }`}
            >
              {f23_isProcessing ? 'Processing...' : `${f23_deletionMode === MODES.PREVIEW ? 'Preview' : f23_deletionMode === MODES.TRASH ? 'Move to Trash' : 'Permanently Delete'}`}
            </button>
            
            {f23_isProcessing && (
              <div className="flex items-center text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm">Processing folders...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {f23_error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error</p>
          <p>{f23_error}</p>
        </div>
      )}

      {/* Results Display */}
      {f23_results && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Operation Results ({f23_results.mode})
          </h2>
          
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Total Files</h3>
              <p className="text-2xl font-bold text-blue-700">{f23_results.totalFilesProcessed}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-green-900 mb-2">Total Size</h3>
              <p className="text-2xl font-bold text-green-700">{f23_formatBytes(f23_results.totalSizeProcessed)}</p>
            </div>
          </div>

          {/* Folder Results */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Folder Details</h3>
            {f23_results.folders.map((folder, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                folder.status === 'success' ? 'bg-green-50 border-green-200' :
                folder.status === 'empty' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{folder.folder}</h4>
                    {folder.message && (
                      <p className={`text-sm ${
                        folder.status === 'success' ? 'text-green-700' :
                        folder.status === 'empty' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {folder.message}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {folder.fileCount} files
                    </p>
                    <p className="text-sm text-gray-500">
                      {f23_formatBytes(folder.totalSize)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Display */}
      {f23_logs.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Operation Log</h3>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white p-3 rounded border max-h-64 overflow-y-auto">
            {f23_logs.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}