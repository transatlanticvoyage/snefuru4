'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WaterTable from './components/WaterTable';
import MarzdiStickyMenu from './components/marzdi_sticky_menu';

export default function ToryaPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gconPieceId, setGconPieceId] = useState<string | null>(null);
  const [gconPiece, setGconPiece] = useState<any>(null);
  const [isTopAreaOpen, setIsTopAreaOpen] = useState<boolean>(true);
  const [isPopulatingUnits, setIsPopulatingUnits] = useState(false);
  const [populateMessage, setPopulateMessage] = useState<string | null>(null);
  const [isRunningF22, setIsRunningF22] = useState(false);
  const [f22Report, setF22Report] = useState<string>('');
  
  // Image Plans Batch state
  const [imagePlansBatches, setImagePlansBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // Compile text content state
  const [isCompilingTextContent, setIsCompilingTextContent] = useState(false);

  useEffect(() => {
    // Get gcon_piece_id from URL parameters
    const gconPieceIdParam = searchParams?.get('gcon_piece_id');
    if (gconPieceIdParam) {
      setGconPieceId(gconPieceIdParam);
      console.log('Torya: Loaded with gcon_piece_id:', gconPieceIdParam);
    }
    
    // Handle zarno1 state from URL and localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const zarno1Param = urlParams.get('zarno1');
    
    // Try to get saved state from localStorage
    const savedState = localStorage.getItem('torya_zarno1_state');
    
    if (zarno1Param === 'closed') {
      setIsTopAreaOpen(false);
    } else if (zarno1Param === 'open') {
      setIsTopAreaOpen(true);
    } else if (savedState) {
      // Use saved state if no URL param
      setIsTopAreaOpen(savedState === 'open');
    }
    
    setLoading(false);
  }, [searchParams]);

  // Fetch gcon_piece data when gconPieceId is available
  useEffect(() => {
    const fetchGconPiece = async () => {
      if (!user?.id || !gconPieceId) {
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
          return;
        }

        // Fetch the gcon_piece
        const { data: gconData, error: gconError } = await supabase
          .from('gcon_pieces')
          .select('id, asn_sitespren_base, mud_title, h1title, pelementor_cached, pelementor_edits')
          .eq('id', gconPieceId)
          .eq('fk_users_id', userData.id)
          .single();

        if (gconError) {
          setError('Content piece not found');
          return;
        }

        setGconPiece(gconData);
      } catch (err) {
        console.error('Error fetching gcon_piece:', err);
        setError('Failed to load content');
      }
    };

    fetchGconPiece();
  }, [user?.id, gconPieceId, supabase]);

  // Fetch images_plans_batches for current user
  useEffect(() => {
    const fetchImagePlansBatches = async () => {
      if (!user?.id) return;

      try {
        // Get user's internal ID first
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!userData) return;

        // Fetch images_plans_batches for this user
        const { data: batchesData, error } = await supabase
          .from('images_plans_batches')
          .select('*')
          .eq('rel_users_id', userData.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching images_plans_batches:', error);
          return;
        }

        setImagePlansBatches(batchesData || []);

        // Set current selected batch if gconPiece has one
        if (gconPiece?.mudfk_image_plan_batch_id) {
          setSelectedBatchId(gconPiece.mudfk_image_plan_batch_id);
        }
      } catch (err) {
        console.error('Error in fetchImagePlansBatches:', err);
      }
    };

    fetchImagePlansBatches();
  }, [user?.id, supabase, gconPiece?.mudfk_image_plan_batch_id]);

  // Set browser title based on gcon_piece data
  useEffect(() => {
    if (gconPiece?.asn_sitespren_base) {
      document.title = 'torya_' + gconPiece.asn_sitespren_base;
    } else if (gconPieceId) {
      document.title = 'torya';
    } else {
      document.title = 'torya';
    }
  }, [gconPiece?.asn_sitespren_base, gconPieceId]);

  // Handle accordion state change
  const handleAccordionToggle = (open: boolean) => {
    setIsTopAreaOpen(open);
    
    // Save to localStorage
    localStorage.setItem('torya_zarno1_state', open ? 'open' : 'closed');
    
    // Update URL parameter
    const url = new URL(window.location.href);
    url.searchParams.set('zarno1', open ? 'open' : 'closed');
    window.history.replaceState({}, '', url.toString());
  };

  // Handle populate nemtor_units
  const handlePopulateNemtorUnits = async () => {
    if (!gconPieceId) {
      setPopulateMessage('Error: No gcon_piece_id available');
      return;
    }

    setIsPopulatingUnits(true);
    setPopulateMessage(null);

    try {
      const response = await fetch('/api/populate-nemtor-units', {
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
        setPopulateMessage(`✅ ${result.message}`);
      } else {
        setPopulateMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error populating nemtor_units:', error);
      setPopulateMessage('❌ Error: Failed to populate nemtor_units');
    } finally {
      setIsPopulatingUnits(false);
      // Clear message after 5 seconds
      setTimeout(() => setPopulateMessage(null), 5000);
    }
  };

  // Handle f22 function
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
        if (user?.id) {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

          if (userData) {
            const { data: refreshedData } = await supabase
              .from('gcon_pieces')
              .select('id, asn_sitespren_base, mud_title, h1title, pelementor_cached, pelementor_edits')
              .eq('id', gconPieceId)
              .eq('fk_users_id', userData.id)
              .single();

            if (refreshedData) {
              setGconPiece(refreshedData);
            }
          }
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

  // Handle saving image plan batch
  const handleSaveImagePlanBatch = async () => {
    if (!gconPieceId || !selectedBatchId) {
      alert('Please select an image plan batch first');
      return;
    }

    setIsSavingBatch(true);

    try {
      const { error } = await supabase
        .from('gcon_pieces')
        .update({ mudfk_image_plan_batch_id: selectedBatchId })
        .eq('id', gconPieceId);

      if (error) {
        throw error;
      }

      // Update local state
      setGconPiece((prev: any) => prev ? { ...prev, mudfk_image_plan_batch_id: selectedBatchId } : prev);
      
      alert('Image plan batch saved successfully!');
    } catch (error) {
      console.error('Error saving image plan batch:', error);
      alert('Failed to save image plan batch');
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Handle compile new_desired_text_content into pelementor_edits
  const handleCompileTextContent = async () => {
    if (!gconPieceId || !gconPiece) {
      alert('No gcon_piece found to process');
      return;
    }

    if (!gconPiece.pelementor_cached) {
      alert('No pelementor_cached data found to use as starting point');
      return;
    }

    setIsCompilingTextContent(true);

    try {
      // Step 1: Start with pelementor_cached as our base for pelementor_edits
      let pelementorEditsContent = gconPiece.pelementor_cached;

      // Step 2: Fetch all nemtor_units for this gcon_piece
      const { data: nemtorUnits, error: nemtorError } = await supabase
        .from('nemtor_units')
        .select('unit_id, full_text_cached, full_text_edits')
        .eq('fk_gcon_piece_id', gconPieceId);

      if (nemtorError) {
        console.error('Error fetching nemtor_units:', nemtorError);
        throw nemtorError;
      }

      if (!nemtorUnits || nemtorUnits.length === 0) {
        alert('No nemtor_units found for this gcon_piece');
        return;
      }

      // Step 3: Process units that have full_text_edits values
      let replacementsCount = 0;
      const replacements: { original: string; replacement: string; unitId: string }[] = [];

      nemtorUnits.forEach(unit => {
        // Only process if full_text_edits has a real value (not null, empty, or whitespace)
        if (unit.full_text_edits && unit.full_text_edits.trim() !== '') {
          // Only process if we also have original full_text_cached to replace
          if (unit.full_text_cached && unit.full_text_cached.trim() !== '') {
            // Replace full_text_cached with full_text_edits in pelementorEditsContent
            const originalText = unit.full_text_cached;
            const newText = unit.full_text_edits;
            
            // Check if the original text exists in pelementorEditsContent
            if (pelementorEditsContent.includes(originalText)) {
              pelementorEditsContent = pelementorEditsContent.replace(originalText, newText);
              replacementsCount++;
              replacements.push({
                original: originalText.substring(0, 100) + (originalText.length > 100 ? '...' : ''),
                replacement: newText.substring(0, 100) + (newText.length > 100 ? '...' : ''),
                unitId: unit.unit_id
              });
            }
          }
        }
      });

      // Step 4: Update pelementor_edits in database
      const { error: updateError } = await supabase
        .from('gcon_pieces')
        .update({ pelementor_edits: pelementorEditsContent })
        .eq('id', gconPieceId);

      if (updateError) {
        console.error('Error updating pelementor_edits:', updateError);
        throw updateError;
      }

      // Step 5: Update local state
      setGconPiece((prev: any) => prev ? { ...prev, pelementor_edits: pelementorEditsContent } : prev);

      // Step 6: Show success message with details
      const successMessage = `Successfully compiled text content!\n\nReplacements made: ${replacementsCount}\n\n` +
        replacements.map(r => `• Unit ${r.unitId.substring(0, 8)}...\n  FROM: ${r.original}\n  TO: ${r.replacement}`).join('\n\n');
      
      alert(successMessage);

    } catch (error) {
      console.error('Error compiling text content:', error);
      alert('Failed to compile text content. Please try again.');
    } finally {
      setIsCompilingTextContent(false);
    }
  };

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Menu Component */}
      <MarzdiStickyMenu h1Title={gconPiece?.h1title} />
      
      <div className="p-4">
        <div className="mb-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
          <button
            className={`px-4 py-2 font-medium rounded-md transition-colors ${
              isPopulatingUnits
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
            onClick={handlePopulateNemtorUnits}
            disabled={isPopulatingUnits || !gconPieceId}
          >
            {isPopulatingUnits ? 'Populating...' : 'handlePopulateNemtorUnit'}
          </button>
        </div>
        
        {/* Populate feedback message */}
        {populateMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            populateMessage.startsWith('✅') 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {populateMessage}
          </div>
        )}
        
        {/* Cloned Areas from Mesagen Page */}
        {gconPieceId && (
          <div className="mb-4">
            <div className="flex items-start gap-4" style={{ marginTop: '10px' }}>
              {/* AREA 1: Info Box - Cloned from mesagen */}
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4" style={{ width: '450px' }}>
                <div className="mb-3">
                  <Link href="/gconjar1" className="text-blue-600 hover:text-blue-800">
                    ← Back to GconJar1
                  </Link>
                </div>
                
                <div className="mb-3">
                  <Link href={`/torya?gcon_piece_id=${gconPieceId}`} className="text-blue-600 hover:text-blue-800">
                    -- Visit /torya --
                  </Link>
                </div>
                
                <div className="mb-3 text-sm text-gray-600">
                  <strong>gcon_pieces.id:</strong> {gconPieceId}
                </div>

                {/* asn_sitespren_base */}
                <div className="mb-3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    asn_sitespren_base
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm">
                    {gconPiece?.asn_sitespren_base || 'Not set'}
                  </div>
                </div>

                {/* post_name */}
                <div className="mb-3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    post_name
                  </label>
                  <div className="flex items-center gap-1 p-2 bg-gray-900 text-green-400 rounded font-mono text-sm border">
                    <button
                      onClick={() => {
                        if (gconPiece?.asn_sitespren_base && gconPiece?.post_name) {
                          window.open(`https://${gconPiece.asn_sitespren_base}/${gconPiece.post_name}`, '_blank');
                        }
                      }}
                      disabled={!gconPiece?.post_name || !gconPiece?.asn_sitespren_base}
                      className="w-6 h-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded flex items-center justify-center"
                      title="Open in new tab"
                    >
                      ↗
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(gconPiece?.post_name || '')}
                      className="w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center justify-center"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                    <span className="flex-1 px-2">
                      {gconPiece?.post_name || 'Not set'}
                    </span>
                  </div>
                </div>

                {/* pageslug */}
                <div className="mb-3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    pageslug
                  </label>
                  <div className="flex items-center gap-1 p-2 bg-gray-900 text-green-400 rounded font-mono text-sm border">
                    <button
                      onClick={() => {
                        if (gconPiece?.asn_sitespren_base && gconPiece?.pageslug) {
                          window.open(`https://${gconPiece.asn_sitespren_base}/${gconPiece.pageslug}`, '_blank');
                        }
                      }}
                      disabled={!gconPiece?.pageslug || !gconPiece?.asn_sitespren_base}
                      className="w-6 h-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded flex items-center justify-center"
                      title="Open in new tab"
                    >
                      ↗
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(gconPiece?.pageslug || '')}
                      className="w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center justify-center"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                    <span className="flex-1 px-2">
                      {gconPiece?.pageslug || 'Not set'}
                    </span>
                  </div>
                </div>

                {/* pageurl */}
                <div className="mb-3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    pageurl
                  </label>
                  <div className="flex items-center gap-1 p-2 bg-gray-900 text-green-400 rounded font-mono text-sm border">
                    <button
                      onClick={() => {
                        if (gconPiece?.pageurl) {
                          window.open(gconPiece.pageurl, '_blank');
                        }
                      }}
                      disabled={!gconPiece?.pageurl}
                      className="w-6 h-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded flex items-center justify-center"
                      title="Open in new tab"
                    >
                      ↗
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(gconPiece?.pageurl || '')}
                      className="w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center justify-center"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                    <span className="flex-1 px-2">
                      {gconPiece?.pageurl || 'Not set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* AREA 2: Image Plans Batch Box - Cloned from mesagen */}
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4" style={{ width: '450px' }}>
                <div className="mb-3">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    mudfk_image_plan_batch_id
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-sm"
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                  >
                    <option value="">Select image plan batch...</option>
                    {imagePlansBatches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batch_name || `Batch ${batch.id.substring(0, 8)}...`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={handleSaveImagePlanBatch}
                    disabled={isSavingBatch || !selectedBatchId}
                    className="px-4 py-2 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: '#000000',
                      fontSize: '16px'
                    }}
                  >
                    {isSavingBatch ? 'Saving...' : 'save'}
                  </button>
                </div>

                {/* Batch Link - Show if batch is assigned */}
                {gconPiece?.mudfk_image_plan_batch_id && (
                  <div className="mt-3">
                    <a
                      href={`/bin34/tebnar2?batchid=${gconPiece.mudfk_image_plan_batch_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 rounded text-center"
                      style={{
                        fontSize: '16px',
                        color: '#374151', // dark gray
                        backgroundColor: '#faf8f1', // very light beige
                        textDecoration: 'none'
                      }}
                    >
                      open batch in /tebnar2
                    </a>
                  </div>
                )}
              </div>

              {/* NEW AREA 3: Dublish Function Box */}
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4" style={{ width: '450px' }}>
                <div className="mb-3">
                  <strong className="text-sm font-bold text-gray-700">
                    Publish new elementor page using dublish function
                  </strong>
                </div>
                
                <hr className="my-3 border-gray-300" />
                
                <div className="mb-3">
                  <button
                    onClick={handleCompileTextContent}
                    disabled={isCompilingTextContent || !gconPiece?.pelementor_cached}
                    className={`w-full px-4 py-2 text-white rounded transition-colors ${
                      isCompilingTextContent || !gconPiece?.pelementor_cached
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-black hover:bg-gray-800'
                    }`}
                    style={{
                      fontSize: '14px'
                    }}
                  >
                    {isCompilingTextContent ? 'Compiling...' : 'compile new_desired_text_content into pelementor_edits'}
                  </button>
                </div>
                
                <hr className="my-3 border-gray-300" />
                
                <div className="mb-3">
                  <button
                    onClick={() => alert('compile new_desired_image_content into pelementor_edits - functionality coming soon')}
                    className="w-full px-4 py-2 text-white rounded"
                    style={{
                      backgroundColor: '#000000',
                      fontSize: '14px'
                    }}
                  >
                    compile new_desired_image_content into pelementor_edits
                  </button>
                </div>
                
                <hr className="my-3 border-gray-300" />
                
                <div className="mb-3">
                  <button
                    onClick={() => alert('run dublish function - functionality coming soon')}
                    className="w-full px-4 py-2 text-white rounded"
                    style={{
                      backgroundColor: '#000000',
                      fontSize: '14px'
                    }}
                  >
                    run dublish function
                  </button>
                </div>
                
                <div className="text-xs text-gray-600 mt-2">
                  create new page on asn_sitespren_base from defined data (such as pelementor_edits field in some cases, etc.)
                </div>
              </div>
            </div>
          </div>
        )}
        
        <h1 className="text-2xl font-bold mb-6">Torya</h1>
        {gconPieceId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>gcon_piece_id:</strong> {gconPieceId}
              {gconPiece?.asn_sitespren_base && (
                <span className="ml-4">
                  <strong>Site:</strong> {gconPiece.asn_sitespren_base}
                </span>
              )}
            </p>
          </div>
        )}
        <WaterTable 
          gconPieceId={gconPieceId} 
          isTopAreaOpen={isTopAreaOpen}
          handleAccordionToggle={handleAccordionToggle}
          gconPiece={gconPiece}
          isRunningF22={isRunningF22}
          f22Report={f22Report}
          handleRunF22={handleRunF22}
          handleCopyPelementorCached={handleCopyPelementorCached}
          handleCopyPelementorEdits={handleCopyPelementorEdits}
          handleCopyF22Report={handleCopyF22Report}
        />
      </div>
    </div>
  );
}