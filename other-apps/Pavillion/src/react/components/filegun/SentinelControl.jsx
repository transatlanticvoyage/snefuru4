'use client';

import React, { useState } from 'react';

export default function SentinelControl() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [status, setStatus] = useState('inactive');
  const [syncPath, setSyncPath] = useState('/');

  if (isCollapsed) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Expand Sentinel
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-sm">.sentinel-lake</span>
          <button
            onClick={() => setIsCollapsed(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Collapse
          </button>
          <h3 className="text-lg font-semibold text-gray-800">🛡️ Filegun Sentinel</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              status === 'active' ? 'bg-green-500' : 
              status === 'scanning' ? 'bg-blue-500' : 
              'bg-gray-500'
            }`}></div>
            <span className="text-sm font-medium">
              {status === 'active' ? 'Active' : status === 'scanning' ? 'Scanning...' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monitor Path
          </label>
          <input
            type="text"
            value={syncPath}
            onChange={(e) => setSyncPath(e.target.value)}
            className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
            placeholder="Enter path to monitor"
          />
        </div>
        
        <div className="flex items-end space-x-2">
          <button
            onClick={() => setStatus('active')}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            disabled={status === 'active'}
          >
            Start
          </button>
          <button
            onClick={() => setStatus('inactive')}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            disabled={status === 'inactive'}
          >
            Stop
          </button>
          <button
            onClick={() => setStatus('scanning')}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Scan
          </button>
        </div>
      </div>

      {/* Status Info */}
      <div className="mt-4 text-xs text-gray-600">
        <p>Sentinel monitors file system changes and syncs with database</p>
        <p>Status: {status === 'active' ? 'Monitoring active' : 'Monitoring inactive'}</p>
      </div>
    </div>
  );
}