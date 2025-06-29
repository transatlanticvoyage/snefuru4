'use client';

import { useMemo } from 'react';

interface AvalUnit {
  id: string;
  fk_gcon_piece_id: string;
  line_key1: string;
  unit_type: string;
  payload: any;
  created_at: string;
  updated_at: string;
}

interface AvalancheSidebar1Props {
  units: AvalUnit[];
  lines: string[];
}

export default function AvalancheSidebar1({ units, lines }: AvalancheSidebar1Props) {
  // Group units by line_key1 for efficient lookup
  const unitsByLine = useMemo(() => {
    const grouped: Record<string, AvalUnit[]> = {};
    units.forEach(unit => {
      if (!grouped[unit.line_key1]) {
        grouped[unit.line_key1] = [];
      }
      grouped[unit.line_key1].push(unit);
    });
    return grouped;
  }, [units]);

  // Get preview text from payload
  const getPreviewText = (payload: any): string => {
    if (!payload) return '';
    
    // Handle different payload structures
    if (typeof payload === 'string') {
      return payload.substring(0, 50) + '...';
    }
    if (payload.preview) {
      return payload.preview;
    }
    if (payload.text) {
      return payload.text.substring(0, 50) + '...';
    }
    if (payload.content) {
      return payload.content.substring(0, 50) + '...';
    }
    
    // Fallback to JSON string preview
    return JSON.stringify(payload).substring(0, 50) + '...';
  };

  // Get color for unit type
  const getUnitTypeColor = (unitType: string): string => {
    const typeColors: Record<string, string> = {
      'heading': 'bg-blue-100 text-blue-800',
      'paragraph': 'bg-gray-100 text-gray-800',
      'image': 'bg-green-100 text-green-800',
      'list': 'bg-yellow-100 text-yellow-800',
      'quote': 'bg-purple-100 text-purple-800',
      'code': 'bg-red-100 text-red-800',
      'default': 'bg-gray-100 text-gray-600'
    };
    return typeColors[unitType] || typeColors.default;
  };

  return (
    <div className="w-full h-full bg-gray-50 border-r border-gray-300 flex flex-col">
      <div className="sticky top-0 bg-gray-100 border-b border-gray-300 p-2 z-10">
        <h3 className="text-sm font-semibold text-gray-700">Avalanche Units</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <tbody>
            {lines.map((_, index) => {
              const lineKey = `line-${index + 1}`;
              const lineUnits = unitsByLine[lineKey] || [];
              
              return (
                <tr 
                  key={lineKey}
                  data-line-id={lineKey}
                  className="border-b border-gray-200"
                >
                  <td className="align-top p-0">
                    {lineUnits.length > 0 ? (
                      <div className="p-2">
                        {lineUnits.map((unit) => (
                          <div
                            key={unit.id}
                            className="mb-1 p-2 bg-white rounded-md shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer last:mb-0"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getUnitTypeColor(unit.unit_type)}`}>
                                  {unit.unit_type}
                                </span>
                                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                                  {getPreviewText(unit.payload)}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <button
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="More options"
                                >
                                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic py-2 px-2">
                        No units for line {index + 1}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}