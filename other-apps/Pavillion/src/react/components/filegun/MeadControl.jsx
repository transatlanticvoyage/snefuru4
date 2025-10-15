'use client';

import React, { useState } from 'react';

export default function MeadControl() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Expand Mead Control
        </button>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-sm">.mead-lake</span>
          <button
            onClick={() => setIsCollapsed(true)}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Collapse
          </button>
          <h3 className="text-lg font-semibold text-gray-800">🍯 Mead Lake Control</h3>
        </div>
      </div>

      {/* Mead Controls */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600">
            Harvest Data
          </button>
          <button className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600">
            Process Queue
          </button>
          <button className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600">
            Export Report
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-white p-2 rounded border">
            <div className="text-gray-600">Queue Size</div>
            <div className="font-bold">0 items</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="text-gray-600">Processing</div>
            <div className="font-bold">Idle</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="text-gray-600">Harvested</div>
            <div className="font-bold">0 MB</div>
          </div>
        </div>

        <div className="text-xs text-gray-600">
          <p>Mead Lake processes and stores file metadata for advanced operations</p>
        </div>
      </div>
    </div>
  );
}