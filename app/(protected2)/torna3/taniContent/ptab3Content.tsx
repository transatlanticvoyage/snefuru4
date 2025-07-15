'use client';

import React from 'react';

interface Torna3Ptab3ContentProps {
  nemtorData: any[];
  visibleColumns: any[];
}

export default function Torna3Ptab3Content({ 
  nemtorData, 
  visibleColumns 
}: Torna3Ptab3ContentProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Nemtor Data Export</h3>
      <div className="space-y-4">
        <p>Export Nemtor Units data in various formats.</p>
        <div className="bg-green-50 p-4 rounded">
          <strong>Export Ready:</strong> {nemtorData.length} units with {visibleColumns.length} visible columns
        </div>
        <div className="space-y-3">
          <h5 className="font-medium">Export Options:</h5>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
              Export as CSV
            </button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
              Export as JSON
            </button>
            <button className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">
              Export as Excel
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <p>• CSV: Spreadsheet-compatible format</p>
            <p>• JSON: Developer-friendly data structure</p>
            <p>• Excel: Full formatting with formulas</p>
          </div>
        </div>
      </div>
    </div>
  );
}