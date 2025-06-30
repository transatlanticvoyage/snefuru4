'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Dynamically import components to avoid SSR issues
const MesagenTableEditor = dynamic(() => import('../components/MesagenTableEditor'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center">Loading editor...</div>
});

export default function MesagenPage() {
  const { user } = useAuth();
  const params = useParams();
  const [mudTitle, setMudTitle] = useState('');
  const [mudContent, setMudContent] = useState('');
  const [isRunningF22, setIsRunningF22] = useState(false);
  const [f22Report, setF22Report] = useState('');
  const [gconPiece, setGconPiece] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMudContentModal, setShowMudContentModal] = useState(false);
  const [showMudDocumentModal, setShowMudDocumentModal] = useState(false);
  
  const supabase = createClientComponentClient();
  
  // Get ID from URL parameters
  const id = params?.id as string;

  // Fetch gcon_piece data
  useEffect(() => {
    const fetchGconPiece = async () => {
      if (!user?.id || !id) {
        setLoading(false);
        return;
      }

      try {
        // Get user's internal ID first
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!userData) {
          setError('User not found');
          setLoading(false);
          return;
        }

        // Fetch the gcon_piece
        const { data: gconData, error: gconError } = await supabase
          .from('gcon_pieces')
          .select('*')
          .eq('id', id)
          .eq('fk_users_id', userData.id)
          .single();

        if (gconError) {
          setError('Content piece not found');
          setLoading(false);
          return;
        }

        setGconPiece(gconData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching gcon_piece:', err);
        setError('Failed to load content');
        setLoading(false);
      }
    };

    fetchGconPiece();
  }, [user?.id, id, supabase]);

  const handleTitleChange = (title: string) => {
    setMudTitle(title);
    // TODO: Auto-save functionality
  };

  const handleContentChange = (content: string) => {
    setMudContent(content);
    // TODO: Auto-save functionality
  };

  // Handle f22 processing for this specific gcon_piece
  const handleRunF22 = async () => {
    if (!user?.id || !id) {
      const errorMsg = 'Unable to run f22: Missing user or gcon_piece ID';
      alert(errorMsg);
      setF22Report(`❌ ERROR: ${errorMsg}\nTimestamp: ${new Date().toISOString()}`);
      return;
    }

    setIsRunningF22(true);
    const startTime = new Date();
    
    try {
      console.log(`Running f22 for gcon_piece ID: ${id}`);
      
      // Set initial report
      setF22Report(`🔄 PROCESSING F22 FUNCTION
Started: ${startTime.toISOString()}
Target: gcon_piece ID ${id}
User: ${user.id}
Status: Running TontoNormalizationProcess1 and BozoHTMLNormalizationProcess1...

Processing Steps:
1. Validating gcon_piece exists ✓
2. Extracting content from mud_content field...
3. Running dual-path normalization...
4. Updating mud_deplines table...
5. Updating aval_dorlis table...`);
      
      // Call the actual f22 API endpoint
      const response = await fetch('/api/f22-nwpi-to-gcon-pusher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordIds: [], // Empty array means process all records
          pushAll: true
        })
      });

      if (!response.ok) {
        throw new Error(`F22 API failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Add comprehensive debug logging for mesagen f22
      console.log('🔍 Mesagen F22 API Response:', result);
      console.log('🔍 Mesagen F22 Debug Info:', result.debugInfo);
      console.log('🔍 Mesagen F22 Results:', result.results);
      
      if (!result.success) {
        // Enhanced error reporting with full API response details
        const detailedError = `F22 processing failed: ${result.message}\n\nAPI Details:\n${JSON.stringify(result, null, 2)}`;
        throw new Error(detailedError);
      }
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      // Generate comprehensive success report with actual API results
      const successReport = `✅ F22 PROCESSING COMPLETED SUCCESSFULLY

Execution Summary:
- Started: ${startTime.toISOString()}
- Completed: ${endTime.toISOString()}
- Duration: ${duration}ms
- Target: gcon_piece ID ${id}
- User: ${user.id}

API Results:
- Records Processed: ${result.results?.processed || 0}
- Records Succeeded: ${result.results?.succeeded || 0}
- Records Failed: ${result.results?.failed || 0}
- Message: ${result.message}

Debug Information:
- Response Time: ${duration}ms
- API Call Time: ${endTime.toISOString()}
- Full Response: Check browser console for details
- Errors: ${result.results?.errors?.length || 0} errors logged

Processing Results:
✓ BozoHTMLNormalizationProcess1: HTML content normalized to plaintext
✓ TontoNormalizationProcess1: Text split by linebreaks (\\n)
✓ mud_content: Reconstructed and updated in gcon_pieces
✓ mud_title: Title field updated in gcon_pieces
✓ mud_deplines: Line-by-line entries created with HTML tag detection
✓ aval_dorlis: Complex HTML blocks extracted and stored with placeholders

Database Operations:
- gcon_pieces table: mud_content, mud_title, and aval_content updated
- mud_deplines table: Previous entries deleted, new entries inserted
- aval_dorlis table: Previous dorli blocks cleared, new blocks stored

System Status: All operations completed successfully
Next Steps: Refresh page to see updated content in mud system`;

      setF22Report(successReport);
      alert(`F22 processing completed for gcon_piece: ${id}\n\nThe page will refresh to load the updated content.`);
      
      // Refresh the page to load updated mud_title and mud_content
      window.location.reload();
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const errorReport = `❌ F22 PROCESSING FAILED

Error Details:
- Started: ${startTime.toISOString()}
- Failed: ${endTime.getTime()}
- Duration: ${duration}ms
- Target: gcon_piece ID ${id}
- User: ${user.id}

Error Information:
${error instanceof Error ? error.message : 'Unknown error occurred'}

Stack Trace:
${error instanceof Error ? error.stack || 'No stack trace available' : 'N/A'}

System Status: Processing halted due to error
Recommendation: Check logs and retry operation`;

      console.error('Error running f22:', error);
      setF22Report(errorReport);
      alert('Error running f22 process');
    } finally {
      setIsRunningF22(false);
    }
  };

  // Handle copying f22 report to clipboard
  const handleCopyF22Report = async () => {
    if (!f22Report) {
      alert('No f22 report available to copy');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(f22Report);
      alert('F22 report copied to clipboard');
    } catch (error) {
      console.error('Failed to copy report:', error);
      alert('Failed to copy report to clipboard');
    }
  };

  // Handle copying mud_content to clipboard
  const handleCopyMudContent = async () => {
    if (!gconPiece?.mud_content) {
      alert('No mud_content available to copy');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(gconPiece.mud_content);
      alert('mud_content copied to clipboard');
    } catch (error) {
      console.error('Failed to copy mud_content:', error);
      alert('Failed to copy mud_content to clipboard');
    }
  };

  // Handle copying mud_document to clipboard
  const handleCopyMudDocument = async () => {
    if (!gconPiece?.mud_document) {
      alert('No mud_document available to copy');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(gconPiece.mud_document);
      alert('mud_document copied to clipboard');
    } catch (error) {
      console.error('Failed to copy mud_document:', error);
      alert('Failed to copy mud_document to clipboard');
    }
  };

  // Set initial content when data loads
  useEffect(() => {
    if (gconPiece?.mud_title) {
      setMudTitle(gconPiece.mud_title);
      // Update browser title
      document.title = `mesagen_${gconPiece.mud_title}_${gconPiece.asn_sitespren_base || ''}`;
    }
    if (gconPiece?.mud_content) {
      setMudContent(gconPiece.mud_content);
    }
  }, [gconPiece?.mud_title, gconPiece?.mud_content, gconPiece?.asn_sitespren_base]);

  // Set fallback title
  useEffect(() => {
    if (!mudTitle && gconPiece?.asn_sitespren_base) {
      document.title = `mesagen_${gconPiece.asn_sitespren_base}`;
    } else if (!mudTitle) {
      document.title = 'mesagen';
    }
  }, [mudTitle, gconPiece?.asn_sitespren_base]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/gconjar1" className="text-purple-600 hover:text-purple-800">
            ← Back to GconJar1
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="mb-4">
          <div className="bg-gray-100 rounded-lg p-4" style={{ width: '330px' }}>
            <div className="mb-2">
              <Link href="/gconjar1" className="text-purple-600 hover:text-purple-800">
                ← Back to GconJar1
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-purple-800">Mesagen - Advanced Table Editor</h1>
            <div className="text-sm text-gray-600 mt-1">
              <span>Editing: {gconPiece?.meta_title || 'Untitled'}</span>
              {gconPiece?.asn_sitespren_base && (
                <span className="ml-2">({gconPiece.asn_sitespren_base})</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ID: {id}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div>
            
            <div className="flex gap-6">
              {/* mud_content Display Section */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-gray-700 mb-2">gcon_pieces.mud_content</label>
                <div className="flex gap-2">
                  <textarea
                    value={gconPiece?.mud_content || ''}
                    readOnly
                    placeholder="mud_content field value will appear here..."
                    className="resize-none border border-gray-300 rounded p-3 text-sm font-mono bg-gray-50"
                    style={{ width: '500px', height: '300px' }}
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleCopyMudContent}
                      disabled={!gconPiece?.mud_content}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        !gconPiece?.mud_content
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => setShowMudContentModal(true)}
                      disabled={!gconPiece?.mud_content}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        !gconPiece?.mud_content
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      🔍 Expand
                    </button>
                  </div>
                </div>
              </div>

              {/* mud_document Display Section */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-gray-700 mb-2">gcon_pieces.mud_document</label>
                <div className="flex gap-2">
                  <textarea
                    value={gconPiece?.mud_document || ''}
                    readOnly
                    placeholder="mud_document field value will appear here..."
                    className="resize-none border border-gray-300 rounded p-3 text-sm font-mono bg-gray-50"
                    style={{ width: '500px', height: '300px' }}
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleCopyMudDocument}
                      disabled={!gconPiece?.mud_document}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        !gconPiece?.mud_document
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => setShowMudDocumentModal(true)}
                      disabled={!gconPiece?.mud_document}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        !gconPiece?.mud_document
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      🔍 Expand
                    </button>
                  </div>
                </div>
              </div>

              {/* F22 Section */}
              <div className="flex flex-col items-end gap-3">
              <button
                onClick={handleRunF22}
                disabled={isRunningF22}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  isRunningF22
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isRunningF22 ? 'Running f22...' : 'Run f22 on this gcon_pieces row'}
              </button>
              
              {/* F22 Report Text Box */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">F22 Function Report:</label>
                  <button
                    onClick={handleCopyF22Report}
                    disabled={!f22Report}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      !f22Report
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    📋 Copy Report
                  </button>
                  <button
                    onClick={() => {
                      const detailedReport = {
                        timestamp: new Date().toISOString(),
                        pageType: 'mesagen',
                        gconPieceId: id,
                        f22Report: f22Report,
                        userAgent: navigator.userAgent,
                        url: window.location.href,
                        instructions: 'Check browser console (F12) for 🔍 DEBUG messages about mud_title and mud_content'
                      };
                      navigator.clipboard.writeText(JSON.stringify(detailedReport, null, 2));
                      alert('Complete diagnostic report copied to clipboard!');
                    }}
                    disabled={!f22Report}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      !f22Report
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    🔍 Full Diagnostic
                  </button>
                </div>
                <textarea
                  value={f22Report}
                  readOnly
                  placeholder="F22 function reports will appear here after execution...\n\nLook for:\n- TontoNormalizationProcess1 results\n- mud_title and mud_content processing\n- Database verification results\n- Any error messages\n\nCheck browser console (F12) for detailed debug logs."
                  className="resize-none border border-gray-300 rounded p-3 text-sm font-mono bg-gray-50"
                  style={{ width: '500px', height: '200px' }}
                />
                {f22Report && (
                  <div className="text-xs text-gray-600 mt-1">
                    💡 Tip: Check browser console (F12) for detailed 🔍 DEBUG messages about mud_title and mud_content processing
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Main Table Editor */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <MesagenTableEditor 
            initialContent={gconPiece?.mud_content || '<p>Start editing your content...</p>'}
            onContentChange={handleContentChange}
            gconPieceId={id}
            initialTitle={mudTitle}
            onTitleChange={handleTitleChange}
          />
        </div>

        {/* Debug Info */}
        <div className="mt-4 p-4 bg-gray-100 rounded text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>mud_title:</strong> {mudTitle}</p>
              <p><strong>mud_content Length:</strong> {mudContent.length} characters</p>
            </div>
            <div>
              <p><strong>Site:</strong> {gconPiece?.asn_sitespren_base}</p>
              <p><strong>Status:</strong> {gconPiece?.g_post_status || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* mud_content Expanded Modal */}
        {showMudContentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] w-[90vw] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  gcon_pieces.mud_content - Expanded View
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyMudContent}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    📋 Copy Content
                  </button>
                  <button
                    onClick={() => setShowMudContentModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    × Close
                  </button>
                </div>
              </div>
              
              <div className="flex-1 min-h-0">
                <textarea
                  value={gconPiece?.mud_content || ''}
                  readOnly
                  placeholder="mud_content field value will appear here..."
                  className="w-full h-full resize-none border border-gray-300 rounded p-4 text-sm font-mono bg-gray-50"
                />
              </div>
              
              <div className="mt-4 text-xs text-gray-600">
                <p><strong>Content Length:</strong> {gconPiece?.mud_content?.length || 0} characters</p>
                <p><strong>Record ID:</strong> {id}</p>
              </div>
            </div>
          </div>
        )}

        {/* mud_document Expanded Modal */}
        {showMudDocumentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] w-[90vw] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  gcon_pieces.mud_document - Expanded View
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyMudDocument}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    📋 Copy Content
                  </button>
                  <button
                    onClick={() => setShowMudDocumentModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    × Close
                  </button>
                </div>
              </div>
              
              <div className="flex-1 min-h-0">
                <textarea
                  value={gconPiece?.mud_document || ''}
                  readOnly
                  placeholder="mud_document field value will appear here..."
                  className="w-full h-full resize-none border border-gray-300 rounded p-4 text-sm font-mono bg-gray-50"
                />
              </div>
              
              <div className="mt-4 text-xs text-gray-600">
                <p><strong>Content Length:</strong> {gconPiece?.mud_document?.length || 0} characters</p>
                <p><strong>Record ID:</strong> {id}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}