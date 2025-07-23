'use client';

import React, { useState } from 'react';
// import '../styles/zarno-accordion.css';

interface Torna3ZarnoAccordionProps {
  gconPiece: any;
  gconPieceId: string;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onRefreshData?: () => Promise<void>;
}

export default function Torna3ZarnoAccordion({ 
  gconPiece, 
  gconPieceId, 
  isOpen, 
  onToggle,
  onRefreshData 
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
        
        // Refresh the gcon_piece data to get updated values
        if (onRefreshData) {
          await onRefreshData();
        }
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

  // Tornado-style container with custom CSS
  return (
    <div className="torna3-zarno-container">
      {!isOpen ? (
        // Tornado-style collapsed state
        <div 
          className="torna3-zarno-collapsed"
          onClick={() => onToggle(true)}
        >
          <span className="torna3-zarno-collapsed-text">
            📂 Open Top Area Manager
          </span>
          <span className="torna3-zarno-collapsed-label">zarno1</span>
        </div>
      ) : (
        <>
          {/* Tornado-style expanded header */}
          <div className="torna3-zarno-header">
            <button 
              onClick={() => onToggle(false)}
              className="torna3-zarno-header-button"
            >
              📁 Compact
            </button>
            <span className="torna3-zarno-header-label">zarno1</span>
          </div>

          {/* Tornado-style horizontal 3-column layout */}
          <div className="torna3-zarno-content">
            <div className="torna3-zarno-columns">
              
              {/* pelementor_cached section - 500px width */}
              <div className="torna3-zarno-column">
                <label className="torna3-zarno-label">
                  gcon_pieces.<span className="torna3-zarno-label-bold">pelementor_cached</span>
                </label>
                <div className="torna3-zarno-textarea-group">
                  <textarea
                    readOnly
                    value={gconPiece?.pelementor_cached ? formatJsonString(gconPiece.pelementor_cached) : ''}
                    className="torna3-zarno-textarea"
                  />
                  <div className="torna3-zarno-button-group">
                    <button
                      onClick={handleCopyPelementorCached}
                      className="torna3-zarno-button torna3-zarno-button-copy"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => {
                        const textarea = document.querySelector('.torna3-zarno-textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          textarea.style.height = textarea.style.height === '500px' ? '300px' : '500px';
                        }
                      }}
                      className="torna3-zarno-button torna3-zarno-button-expand"
                    >
                      ↕️ Expand
                    </button>
                  </div>
                </div>
              </div>

              {/* pelementor_edits section - 500px width */}
              <div className="torna3-zarno-column">
                <label className="torna3-zarno-label">
                  gcon_pieces.<span className="torna3-zarno-label-bold">pelementor_edits</span>
                </label>
                <div className="torna3-zarno-textarea-group">
                  <textarea
                    readOnly
                    value={gconPiece?.pelementor_edits ? formatJsonString(gconPiece.pelementor_edits) : ''}
                    className="torna3-zarno-textarea"
                  />
                  <div className="torna3-zarno-button-group">
                    <button
                      onClick={handleCopyPelementorEdits}
                      className="torna3-zarno-button torna3-zarno-button-copy"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => {
                        const textareas = document.querySelectorAll('.torna3-zarno-textarea');
                        const textarea = textareas[1] as HTMLTextAreaElement;
                        if (textarea) {
                          textarea.style.height = textarea.style.height === '500px' ? '300px' : '500px';
                        }
                      }}
                      className="torna3-zarno-button torna3-zarno-button-expand"
                    >
                      ↕️ Expand
                    </button>
                  </div>
                </div>
              </div>

              {/* F22 section - right side */}
              <div className="torna3-zarno-f22-section">
                <button
                  onClick={handleRunF22}
                  disabled={isRunningF22}
                  className="torna3-zarno-button torna3-zarno-button-f22-main"
                >
                  {isRunningF22 ? 'Running f22...' : 'Run f22 on this gcon_pieces row'}
                </button>
                
                <div className="torna3-zarno-f22-controls">
                  <label className="torna3-zarno-f22-label">F22 Function Report:</label>
                  <button
                    onClick={handleCopyF22Report}
                    disabled={!f22Report}
                    className="torna3-zarno-button torna3-zarno-button-copy torna3-zarno-button-copy-small"
                  >
                    📋 Copy Report
                  </button>
                  <button
                    onClick={handleRunF22}
                    disabled={isRunningF22}
                    className="torna3-zarno-button torna3-zarno-button-f22"
                  >
                    {isRunningF22 ? 'Running...' : '🔍 Full Diagnostic'}
                  </button>
                </div>
                
                <textarea
                  readOnly
                  value={f22Report || 'F22 function reports will appear here after execution...\n\nLook for:\n- TontoNormalizationProcess1 results\n- mud_title and mud_content processing\n- Database verification results\n- Any error messages\n\nCheck browser console (F12) for detailed debug logs.'}
                  className="torna3-zarno-textarea-f22"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}