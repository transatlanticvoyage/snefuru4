'use client';

import React from 'react';

export default function Torna3Ptab5Content() {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Nemtor Advanced Options</h3>
      <div className="space-y-4">
        <p>Advanced configuration and maintenance tools for Nemtor Units.</p>
        
        <div className="space-y-3">
          <h5 className="font-medium">System Configuration:</h5>
          <div className="bg-gray-50 p-4 rounded space-y-3">
            <div className="flex items-center justify-between">
              <span>Auto-refresh data every 5 minutes</span>
              <input type="checkbox" className="w-4 h-4" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span>Enable debug logging</span>
              <input type="checkbox" className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <span>Show technical metadata columns</span>
              <input type="checkbox" className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="font-medium">Maintenance Tools:</h5>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Rebuild Search Index
            </button>
            <button className="w-full text-left px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Clear Cache and Refresh
            </button>
            <button className="w-full text-left px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Optimize Database Performance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}