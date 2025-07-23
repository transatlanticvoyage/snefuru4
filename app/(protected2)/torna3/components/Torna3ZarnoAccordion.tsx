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
  const [expandedCached, setExpandedCached] = useState(false);
  const [expandedEdits, setExpandedEdits] = useState(false);
  const [expandedF22, setExpandedF22] = useState(false);

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

  // Toggle accordion
  const handleToggleAccordion = () => {
    onToggle(!isOpen);
  };

  return (
    <div style={{
      backgroundColor: '#fefef8',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      marginBottom: '20px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      {/* Accordion Header */}
      <div
        onClick={handleToggleAccordion}
        style={{
          padding: '16px 20px',
          backgroundColor: '#f8f9fa',
          borderBottom: isOpen ? '1px solid #e0e0e0' : 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background-color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#e9ecef';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
        }}
      >
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
          Zarno Area - Pelementor Data Inspector
        </h3>
        <span style={{ fontSize: '20px', color: '#666' }}>
          {isOpen ? '▼' : '▶'}
        </span>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div style={{ padding: '20px' }}>
          {/* Pelementor Cached Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px' 
            }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                Pelementor Cached
              </h4>
              <div>
                <button
                  onClick={handleCopyPelementorCached}
                  style={{
                    padding: '6px 12px',
                    marginRight: '8px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Copy
                </button>
                <button
                  onClick={() => setExpandedCached(!expandedCached)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {expandedCached ? 'Collapse' : 'Expand'}
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={gconPiece?.pelementor_cached ? formatJsonString(gconPiece.pelementor_cached) : ''}
              style={{
                width: '100%',
                height: expandedCached ? '400px' : '100px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Pelementor Edits Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px' 
            }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                Pelementor Edits
              </h4>
              <div>
                <button
                  onClick={handleCopyPelementorEdits}
                  style={{
                    padding: '6px 12px',
                    marginRight: '8px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Copy
                </button>
                <button
                  onClick={() => setExpandedEdits(!expandedEdits)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {expandedEdits ? 'Collapse' : 'Expand'}
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={gconPiece?.pelementor_edits ? formatJsonString(gconPiece.pelementor_edits) : ''}
              style={{
                width: '100%',
                height: expandedEdits ? '400px' : '100px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* F22 Function Section */}
          <div style={{ 
            padding: '16px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            border: '1px solid #90caf9'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px' 
            }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                F22 Function - NWPI to GCON Pusher
              </h4>
              <button
                onClick={handleRunF22}
                disabled={isRunningF22}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isRunningF22 ? '#6c757d' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isRunningF22 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {isRunningF22 ? 'Running...' : 'Run F22'}
              </button>
            </div>

            {f22Report && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px' 
                }}>
                  <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                    F22 Report:
                  </h5>
                  <div>
                    <button
                      onClick={handleCopyF22Report}
                      style={{
                        padding: '4px 8px',
                        marginRight: '8px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Copy Report
                    </button>
                    <button
                      onClick={() => setExpandedF22(!expandedF22)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {expandedF22 ? 'Collapse' : 'Expand'}
                    </button>
                  </div>
                </div>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fff',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  maxHeight: expandedF22 ? 'none' : '100px',
                  overflow: expandedF22 ? 'visible' : 'auto'
                }}>
                  {f22Report}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}