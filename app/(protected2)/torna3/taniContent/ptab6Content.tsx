'use client';

import React from 'react';

export default function Torna3Ptab6Content() {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Nemtor Help & Documentation</h3>
      <div className="space-y-4">
        <p>Documentation and help resources for working with Nemtor Units.</p>
        
        <div className="space-y-3">
          <h5 className="font-medium">Quick Reference:</h5>
          <div className="bg-blue-50 p-4 rounded space-y-2">
            <div><strong>Nemtor Units:</strong> Elementor widget components with metadata</div>
            <div><strong>Columns:</strong> 32 total fields including IDs, content, and properties</div>
            <div><strong>Filtering:</strong> Use column templates to show/hide specific fields</div>
            <div><strong>Export:</strong> Available in CSV, JSON, and Excel formats</div>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="font-medium">Documentation Links:</h5>
          <div className="space-y-2">
            <a href="#" className="block p-3 bg-white border rounded hover:bg-gray-50">
              <div className="font-medium text-blue-600">Nemtor Units Field Reference</div>
              <div className="text-sm text-gray-600">Complete guide to all 32 data fields</div>
            </a>
            <a href="#" className="block p-3 bg-white border rounded hover:bg-gray-50">
              <div className="font-medium text-blue-600">Column Template Management</div>
              <div className="text-sm text-gray-600">How to create and manage custom views</div>
            </a>
            <a href="#" className="block p-3 bg-white border rounded hover:bg-gray-50">
              <div className="font-medium text-blue-600">Export and Integration Guide</div>
              <div className="text-sm text-gray-600">Working with exported data in external tools</div>
            </a>
            <a href="#" className="block p-3 bg-white border rounded hover:bg-gray-50">
              <div className="font-medium text-blue-600">Troubleshooting Common Issues</div>
              <div className="text-sm text-gray-600">Solutions for data validation and performance</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}