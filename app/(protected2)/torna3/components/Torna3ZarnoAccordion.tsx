'use client';

import React, { useState } from 'react';

interface Torna3ZarnoAccordionProps {
  gconPiece: any;
  gconPieceId: string;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export default function Torna3ZarnoAccordion({ 
  gconPiece, 
  gconPieceId, 
  isOpen, 
  onToggle 
}: Torna3ZarnoAccordionProps) {
  const [isRunningF22, setIsRunningF22] = useState(false);
  const [f22Report, setF22Report] = useState<string>('');

  // Handle F22 function
  const handleRunF22 = async () => {
    if (!gconPieceId) {
      setF22Report('Error: No gcon_piece_id available');
      return;
    }

    setIsRunningF22(true);
    setF22Report('Starting F22 processing...');

    try {
      const response = await fetch('/api/f22-nwpi-to-gcon-pusher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gcon_piece_id: gconPieceId
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setF22Report(result.message || 'F22 function completed successfully');
      } else {
        setF22Report(`Error: ${result.error || 'F22 function failed'}`);
      }
    } catch (error) {
      console.error('Error running F22:', error);
      setF22Report('Error: Failed to run F22 function');
    } finally {
      setIsRunningF22(false);
    }
  };

  // Copy functions
  const handleCopyPelementorCached = () => {
    if (gconPiece?.pelementor_cached) {
      const content = typeof gconPiece.pelementor_cached === 'string' 
        ? gconPiece.pelementor_cached 
        : JSON.stringify(gconPiece.pelementor_cached, null, 2);
      navigator.clipboard.writeText(content);
    }
  };

  const handleCopyPelementorEdits = () => {
    if (gconPiece?.pelementor_edits) {
      const content = typeof gconPiece.pelementor_edits === 'string' 
        ? gconPiece.pelementor_edits 
        : JSON.stringify(gconPiece.pelementor_edits, null, 2);
      navigator.clipboard.writeText(content);
    }
  };

  const handleCopyF22Report = () => {
    if (f22Report) {
      navigator.clipboard.writeText(f22Report);
    }
  };

  const formatJsonString = (jsonString: string | any) => {
    if (typeof jsonString === 'string') {
      try {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return jsonString;
      }
    }
    return JSON.stringify(jsonString, null, 2);
  };

  // Tornado-style container with transition
  return (
    <div 
      style={{ 
        backgroundColor: '#fefef8', 
        marginBottom: '20px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {!isOpen ? (
        // Tornado-style collapsed state
        <div 
          className="flex items-center justify-between px-4 hover:bg-yellow-50 cursor-pointer transition-colors"
          style={{ width: '200px', height: '60px' }}
          onClick={() => onToggle(true)}
        >
          <span className="text-sm font-medium text-gray-700 flex-1">
            📂 Open Top Area Manager
          </span>
          <span className="text-xs text-gray-500 ml-2">zarno1</span>
        </div>
      ) : (
        <>
          {/* Tornado-style expanded header */}
          <div className="flex items-center justify-between px-4 border-b border-gray-200" 
               style={{ height: '60px', backgroundColor: '#fefef8' }}>
            <button 
              onClick={() => onToggle(false)}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              📁 Compact
            </button>
            <span className="text-xs text-gray-500">zarno1</span>
          </div>

          {/* Tornado-style horizontal 3-column layout */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-6">
              
              {/* pelementor_cached section - 500px width */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-2">
                  gcon_pieces.<span className="font-bold">pelementor_cached</span>
                </label>
                <div className="flex gap-2">
                  <textarea
                    readOnly
                    value={gconPiece?.pelementor_cached ? formatJsonString(gconPiece.pelementor_cached) : ''}
                    style={{ 
                      width: '500px', 
                      height: '300px',
                      resize: 'none'
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleCopyPelementorCached}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => {
                        const textarea = document.querySelector('textarea[style*="500px"]') as HTMLTextAreaElement;
                        if (textarea) {
                          textarea.style.height = textarea.style.height === '300px' ? '500px' : '300px';
                        }
                      }}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                    >
                      ↕️ Expand
                    </button>
                  </div>
                </div>
              </div>

              {/* pelementor_edits section - 500px width */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-2">
                  gcon_pieces.<span className="font-bold">pelementor_edits</span>
                </label>
                <div className="flex gap-2">
                  <textarea
                    readOnly
                    value={gconPiece?.pelementor_edits ? formatJsonString(gconPiece.pelementor_edits) : ''}
                    style={{ 
                      width: '500px', 
                      height: '300px',
                      resize: 'none'
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleCopyPelementorEdits}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => {
                        const textareas = document.querySelectorAll('textarea[style*="500px"]');
                        const textarea = textareas[1] as HTMLTextAreaElement;
                        if (textarea) {
                          textarea.style.height = textarea.style.height === '300px' ? '500px' : '300px';
                        }
                      }}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                    >
                      ↕️ Expand
                    </button>
                  </div>
                </div>
              </div>

              {/* F22 section - right side */}
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">F22 Function Report:</label>
                  <button
                    onClick={handleCopyF22Report}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    disabled={!f22Report}
                  >
                    📋 Copy Report
                  </button>
                  <button
                    onClick={handleRunF22}
                    disabled={isRunningF22}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:bg-gray-400"
                  >
                    {isRunningF22 ? 'Running...' : '🔍 Full Diagnostic'}
                  </button>
                </div>
                
                <textarea
                  readOnly
                  value={f22Report || 'F22 function reports will appear here after execution...\n\nLook for:\n- TontoNormalizationProcess1 results\n- mud_title and mud_content processing\n- Database verification results\n- Any error messages\n\nCheck browser console (F12) for detailed debug logs.'}
                  style={{ 
                    width: '500px', 
                    height: '200px',
                    resize: 'none'
                  }}
                  className="border border-gray-300 rounded p-3 text-sm font-mono bg-white"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}