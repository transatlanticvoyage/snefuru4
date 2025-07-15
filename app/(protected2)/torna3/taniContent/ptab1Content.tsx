'use client';

import React from 'react';

interface Torna3Ptab1ContentProps {
  nemtorData: any[];
  visibleColumns: any[];
  totalColumns: number;
}

export default function Torna3Ptab1Content({ 
  nemtorData, 
  visibleColumns, 
  totalColumns 
}: Torna3Ptab1ContentProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Nemtor Units Functions</h3>
      <div className="space-y-4">
        <div className="flex items-center" style={{ gap: '100px' }}>
          <button className="px-4 py-2 rounded font-medium bg-green-600 text-white hover:bg-green-700">
            nemtor_data_exporter
          </button>
          <button className="px-4 py-2 rounded font-medium bg-blue-600 text-white hover:bg-blue-700">
            nemtor_validator
          </button>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Data Overview:</h4>
          <ul className="text-sm space-y-1">
            <li>• Total Units: {nemtorData.length}</li>
            <li>• Visible Columns: {visibleColumns.length} of {totalColumns}</li>
            <li>• Widget Types: Mixed Elementor components</li>
            <li>• Data Status: Active monitoring</li>
          </ul>
        </div>
      </div>
    </div>
  );
}