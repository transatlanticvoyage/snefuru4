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
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activePopupTab, setActivePopupTab] = useState<'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7'>('ptab1');
  const [uelBarColors, setUelBarColors] = useState<{bg: string, text: string}>({bg: '#2563eb', text: '#ffffff'});
  const [uelBar37Colors, setUelBar37Colors] = useState<{bg: string, text: string}>({bg: '#1e40af', text: '#ffffff'});
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [isTopAreaOpen, setIsTopAreaOpen] = useState<boolean>(true);
  
  // Export dropdown state
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  
  // Joni state variables
  const [isJoniLoadingDeplines, setIsJoniLoadingDeplines] = useState(false);
  const [hasJoniDeplines, setHasJoniDeplines] = useState<boolean | null>(null);
  const [isJoniRebuilding, setIsJoniRebuilding] = useState(false);
  
  // Image Plans Batch state
  const [imagePlansBatches, setImagePlansBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  
  const supabase = createClientComponentClient();
  
  // Get ID from URL parameters
  const id = params?.id as string;

  // Initialize current URL and accordion state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
      
      // Check URL parameter for zarno1
      const urlParams = new URLSearchParams(window.location.search);
      const zarno1Param = urlParams.get('zarno1');
      
      // Check localStorage for saved state
      const savedState = localStorage.getItem('mesagen_zarno1_state');
      
      // Priority: URL parameter > localStorage > default (open)
      if (zarno1Param === 'closed') {
        setIsTopAreaOpen(false);
      } else if (zarno1Param === 'open') {
        setIsTopAreaOpen(true);
      } else if (savedState) {
        setIsTopAreaOpen(savedState === 'open');
      }
    }
  }, []);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExportDropdownOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.export-dropdown-container')) {
          setIsExportDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportDropdownOpen]);

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

  // Check for mud_deplines and auto-trigger Joni if needed
  useEffect(() => {
    const checkAndTriggerJoni = async () => {
      if (!gconPiece || !id || isJoniLoadingDeplines) {
        return;
      }

      try {
        console.log('🌊 Joni: Checking if mud_deplines exist for piece:', id);
        
        // Check if mud_deplines exist for this gcon_piece
        const { data: deplines, error: deplinesError } = await supabase
          .from('mud_deplines')
          .select('depline_id')
          .eq('fk_gcon_piece_id', id)
          .limit(1);

        if (deplinesError) {
          console.error('❌ Joni: Error checking mud_deplines:', deplinesError);
          setHasJoniDeplines(false);
          return;
        }

        const deplinesExist = deplines && deplines.length > 0;
        setHasJoniDeplines(deplinesExist);

        if (!deplinesExist && gconPiece.mud_content) {
          console.log('🌊 Joni: No mud_deplines found, auto-triggering population');
          setIsJoniLoadingDeplines(true);
          
          try {
            await triggerJoniDeplinePopulation(id);
            console.log('✅ Joni: Auto-population completed successfully');
            setHasJoniDeplines(true);
          } catch (error) {
            console.error('❌ Joni: Auto-population failed:', error);
            setHasJoniDeplines(false);
          } finally {
            setIsJoniLoadingDeplines(false);
          }
        } else if (!gconPiece.mud_content) {
          console.log('🌊 Joni: No mud_content available for population');
          setHasJoniDeplines(false);
        } else {
          console.log('🌊 Joni: mud_deplines already exist, no action needed');
        }
      } catch (error) {
        console.error('❌ Joni: Error in auto-trigger check:', error);
        setHasJoniDeplines(false);
        setIsJoniLoadingDeplines(false);
      }
    };

    checkAndTriggerJoni();
  }, [gconPiece, id, supabase]);

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
          .eq('user_id', userData.id)
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

  // Handle saving image plan batch
  const handleSaveImagePlanBatch = async () => {
    if (!id || !selectedBatchId) {
      alert('Please select an image plan batch first');
      return;
    }

    setIsSavingBatch(true);

    try {
      const { error } = await supabase
        .from('gcon_pieces')
        .update({ mudfk_image_plan_batch_id: selectedBatchId })
        .eq('id', id);

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

  // Handle popup open/close
  const handlePopupOpen = () => {
    setIsPopupOpen(true);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
  };

  // Handle tab change
  const handleTabChange = (tab: 'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7') => {
    setActivePopupTab(tab);
  };

  // Handle accordion state change
  const handleAccordionToggle = (open: boolean) => {
    setIsTopAreaOpen(open);
    
    // Save to localStorage
    localStorage.setItem('mesagen_zarno1_state', open ? 'open' : 'closed');
    
    // Update URL parameter
    const url = new URL(window.location.href);
    url.searchParams.set('zarno1', open ? 'open' : 'closed');
    window.history.replaceState({}, '', url.toString());
  };

  // Joni functions
  const triggerJoniDeplinePopulation = async (gconPieceId: string) => {
    console.log('🌊 Joni: Starting manual rebuild for piece:', gconPieceId);
    
    try {
      const response = await fetch('/api/joni-mud-depline-population-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gcon_piece_id: gconPieceId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Joni: Manual rebuild completed:', result.data);
        return result;
      } else {
        throw new Error(result.message || 'Joni process failed');
      }
    } catch (error) {
      console.error('❌ Joni: Manual rebuild failed:', error);
      throw error;
    }
  };

  const handleJoniRebuild = async () => {
    if (!id) return;
    
    const confirmed = confirm('Reset content structure from original using Joni process?');
    if (!confirmed) return;
    
    setIsJoniRebuilding(true);
    
    try {
      await triggerJoniDeplinePopulation(id);
      alert('Joni rebuild completed successfully');
      // Refresh the page to show updated content
      window.location.reload();
    } catch (error) {
      console.error('❌ Joni rebuild failed:', error);
      alert(`Joni process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsJoniRebuilding(false);
    }
  };

  // Export functions
  const handleExportSQL = async () => {
    if (!id) return;
    
    try {
      const { data: mudDeplines, error } = await supabase
        .from('mud_deplines')
        .select('*')
        .eq('fk_gcon_piece_id', id);

      if (error) throw error;

      if (!mudDeplines || mudDeplines.length === 0) {
        alert('No mud_deplines found for this content piece');
        return;
      }

      // Generate SQL INSERT statements
      const tableName = 'mud_deplines';
      const columns = Object.keys(mudDeplines[0]).join(', ');
      
      let sqlContent = `-- SQL Export for mud_deplines (gcon_piece_id: ${id})\n`;
      sqlContent += `-- Generated on: ${new Date().toISOString()}\n\n`;
      
      mudDeplines.forEach(row => {
        const values = Object.values(row).map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          return val;
        }).join(', ');
        
        sqlContent += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
      });

      // Download file
      const blob = new Blob([sqlContent], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mud_deplines_${id}_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsExportDropdownOpen(false);
    } catch (error) {
      console.error('Export SQL failed:', error);
      alert('Failed to export SQL');
    }
  };

  const handleExportCSV = async () => {
    if (!id) return;
    
    try {
      const { data: mudDeplines, error } = await supabase
        .from('mud_deplines')
        .select('*')
        .eq('fk_gcon_piece_id', id);

      if (error) throw error;

      if (!mudDeplines || mudDeplines.length === 0) {
        alert('No mud_deplines found for this content piece');
        return;
      }

      // Generate CSV content
      const headers = Object.keys(mudDeplines[0]);
      let csvContent = headers.join(',') + '\n';
      
      mudDeplines.forEach(row => {
        const values = headers.map(header => {
          const val = row[header];
          if (val === null) return '';
          if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        });
        csvContent += values.join(',') + '\n';
      });

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mud_deplines_${id}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsExportDropdownOpen(false);
    } catch (error) {
      console.error('Export CSV failed:', error);
      alert('Failed to export CSV');
    }
  };

  const handleExportXLS = async () => {
    if (!id) return;
    
    try {
      const { data: mudDeplines, error } = await supabase
        .from('mud_deplines')
        .select('*')
        .eq('fk_gcon_piece_id', id);

      if (error) throw error;

      if (!mudDeplines || mudDeplines.length === 0) {
        alert('No mud_deplines found for this content piece');
        return;
      }

      // For XLS, we'll create a tab-separated values file that Excel can open
      const headers = Object.keys(mudDeplines[0]);
      let xlsContent = headers.join('\t') + '\n';
      
      mudDeplines.forEach(row => {
        const values = headers.map(header => {
          const val = row[header];
          if (val === null) return '';
          if (typeof val === 'string') {
            // Replace tabs and newlines for XLS compatibility
            return val.replace(/\t/g, ' ').replace(/\n/g, ' ');
          }
          return val;
        });
        xlsContent += values.join('\t') + '\n';
      });

      // Download file
      const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mud_deplines_${id}_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsExportDropdownOpen(false);
    } catch (error) {
      console.error('Export XLS failed:', error);
      alert('Failed to export XLS');
    }
  };

  // Set initial content when data loads
  useEffect(() => {
    if (gconPiece?.mud_title) {
      setMudTitle(gconPiece.mud_title);
      // Update browser title
      document.title = 'mesagen_' + gconPiece.mud_title + '_' + (gconPiece.asn_sitespren_base || '');
    }
    if (gconPiece?.mud_content) {
      setMudContent(gconPiece.mud_content);
    }
  }, [gconPiece?.mud_title, gconPiece?.mud_content, gconPiece?.asn_sitespren_base]);

  // Set fallback title
  useEffect(() => {
    if (!mudTitle && gconPiece?.asn_sitespren_base) {
      document.title = 'mesagen_' + gconPiece.asn_sitespren_base;
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
          <div className="flex items-start gap-4" style={{ marginTop: '10px' }}>
            {/* Info Box Wrapper - Valan-inspired styling */}
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4" style={{ width: '450px' }}>
              <div className="mb-3">
                <Link href="/gconjar1" className="text-blue-600 hover:text-blue-800">
                  ← Back to GconJar1
                </Link>
              </div>
              
              <div className="mb-3">
                <Link href={`/torya?gcon_piece_id=${id}`} className="text-blue-600 hover:text-blue-800">
                  -- Visit /torya --
                </Link>
              </div>
              
              <div className="mb-3 text-sm text-gray-600">
                <strong>gcon_pieces.id:</strong> {id}
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

            {/* New Image Plans Batch Box */}
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
            </div>
            
            {/* Functions Button */}
            <button
              onClick={handlePopupOpen}
              className="font-bold text-white rounded"
              style={{
                backgroundColor: '#800000',
                fontSize: '20px',
                paddingLeft: '14px',
                paddingRight: '14px',
                paddingTop: '10px',
                paddingBottom: '10px'
              }}
            >
              functions popup
            </button>
            
            {/* Joni Rebuild Button */}
            <button
              onClick={handleJoniRebuild}
              disabled={isJoniRebuilding}
              className="font-bold text-white rounded ml-3"
              style={{
                backgroundColor: '#581c87', // dark purple
                fontSize: '20px',
                paddingLeft: '14px',
                paddingRight: '14px',
                paddingTop: '10px',
                paddingBottom: '10px',
                opacity: isJoniRebuilding ? 0.6 : 1,
                cursor: isJoniRebuilding ? 'not-allowed' : 'pointer'
              }}
            >
              {isJoniRebuilding ? 'Processing...' : 'Rebuild (Joni)'}
            </button>
            
            {/* Export Button with Dropdown */}
            <div className="relative ml-3 export-dropdown-container">
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="font-bold text-white rounded"
                style={{
                  backgroundColor: '#581c87', // dark purple to match Joni button
                  fontSize: '20px',
                  paddingLeft: '14px',
                  paddingRight: '14px',
                  paddingTop: '10px',
                  paddingBottom: '10px'
                }}
              >
                Export
              </button>
              
              {/* Dropdown Menu */}
              {isExportDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50">
                  <button
                    onClick={handleExportSQL}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    SQL
                  </button>
                  <button
                    onClick={handleExportXLS}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    XLS
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Top Area Manager - Accordion Wrapper */}
        <div className="mb-4">
          <div 
            className="rounded-lg border border-gray-200 overflow-hidden transition-all duration-300"
            style={{ backgroundColor: '#fefef8' }} // Very soft light yellow
          >
            {!isTopAreaOpen ? (
              // Collapsed State - Compact View
              <div 
                className="flex items-center justify-between px-4 hover:bg-yellow-50 transition-colors"
                style={{ width: '200px', height: '60px' }}
              >
                <span 
                  className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                  onClick={() => handleAccordionToggle(true)}
                >
                  📂 Open Top Area Manager
                </span>
                <span className="text-xs text-gray-500 ml-2">zarno1</span>
              </div>
            ) : (
              // Expanded State - Full Content
              <div>
                {/* Top bar with Compact Button and zarno1 label */}
                <div 
                  className="flex items-center justify-between px-4 border-b border-gray-200"
                  style={{ height: '60px', backgroundColor: '#fefef8' }}
                >
                  <button
                    onClick={() => handleAccordionToggle(false)}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    📁 Compact
                  </button>
                  <span className="text-xs text-gray-500">zarno1</span>
                </div>
                
                {/* Content area */}
                <div className="p-4">
                
                {/* Original Content */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-6">
                    {/* mud_content Display Section */}
                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-2">gcon_pieces.mud_content</label>
                      <div className="flex gap-2">
                        <textarea
                          value={gconPiece?.mud_content || ''}
                          readOnly
                          placeholder="mud_content field value will appear here..."
                          className="resize-none border border-gray-300 rounded p-3 text-sm font-mono bg-white"
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
                          className="resize-none border border-gray-300 rounded p-3 text-sm font-mono bg-white"
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
                        className="resize-none border border-gray-300 rounded p-3 text-sm font-mono bg-white"
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
              </div>
            )}
          </div>
        </div>

        {/* Main Table Editor */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {isJoniLoadingDeplines ? (
            // Joni loading state
            <div className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
              <p className="text-gray-600">Joni processing content structure...</p>
              <p className="text-sm text-gray-500 mt-2">
                Setting up editable content from mud_content
              </p>
            </div>
          ) : (
            <MesagenTableEditor 
              initialContent={gconPiece?.mud_content || '<p>Start editing your content...</p>'}
              onContentChange={handleContentChange}
              gconPieceId={id}
              initialTitle={mudTitle}
              onTitleChange={handleTitleChange}
            />
          )}
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

        {/* Functions Popup Modal - Matching nwjar1 styling exactly */}
        {isPopupOpen && (
          <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white w-full h-full max-w-[95vw] max-h-[95vh] rounded-lg shadow-xl relative overflow-hidden">
              {/* uelbar37 header bar */}
              <div 
                className="absolute top-0 left-0 right-0 flex items-center px-4"
                style={{ 
                  height: '50px',
                  backgroundColor: uelBar37Colors.bg,
                  color: uelBar37Colors.text
                }}
              >
                <span className="font-semibold">BROWSER URL</span>
                
                {/* Vertical separator */}
                <div 
                  className="bg-gray-600"
                  style={{
                    width: '3px',
                    height: '100%',
                    marginLeft: '30px',
                    marginRight: '30px'
                  }}
                />
                
                <span className="font-mono text-sm overflow-hidden whitespace-nowrap text-ellipsis flex-1">
                  {currentUrl}
                </span>

                {/* Copy buttons in uelbar37 - positioned to the left of close button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentUrl);
                  }}
                  className="bg-gray-600 text-white font-bold flex items-center justify-center hover:bg-gray-700 transition-colors"
                  style={{
                    width: '80px',
                    height: '50px',
                    marginRight: '0px',
                    fontSize: '10px',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                  title="Copy Full URL"
                >
                  <div>COPY URL</div>
                </button>
              </div>
              
              {/* uelbar38 header bar */}
              <div 
                className="absolute left-0 right-0 flex items-center px-4"
                style={{ 
                  top: '50px',
                  height: '50px',
                  backgroundColor: uelBarColors.bg,
                  color: uelBarColors.text
                }}
              >
                <span className="font-semibold">uelbar38</span>
                
                {/* Vertical separator */}
                <div 
                  className="bg-gray-600"
                  style={{
                    width: '3px',
                    height: '100%',
                    marginLeft: '30px',
                    marginRight: '30px'
                  }}
                />
                
                <span className="font-bold">{typeof window !== 'undefined' ? window.location.pathname : ''}</span>
                
                {/* Close button in header - spans both bars */}
                <button
                  onClick={handlePopupClose}
                  className="absolute right-0 top-0 bg-gray-400 text-gray-800 font-bold flex items-center justify-center hover:bg-gray-500 transition-colors"
                  style={{
                    width: '260px',
                    height: '100px', // Spans both 50px bars
                    border: '2px solid #4a4a4a',
                    fontSize: '14px',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ fontSize: '20px' }}>×</div>
                  <div style={{ fontSize: '12px', lineHeight: '12px', textAlign: 'center' }}>
                    CLOSE<br/>POPUP
                  </div>
                </button>
              </div>
              
              {/* Popup content - adjusted to start below both headers */}
              <div className="h-full" style={{ paddingTop: '100px' }}>
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 bg-gray-50">
                  <nav className="flex">
                    {['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => handleTabChange(tab as any)}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                          activePopupTab === tab
                            ? 'border-blue-500 text-blue-600 bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>
                
                {/* Tab Content */}
                <div className="p-8 h-full overflow-auto">
                  {activePopupTab === 'ptab1' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Mesagen Functions</h3>
                      <div className="space-y-4">
                        <div className="text-center text-gray-500">
                          <p>Content for tab 1 will be added here.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activePopupTab === 'ptab2' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">PTAB2</h3>
                      <div className="text-center text-gray-500">
                        <p>Content for tab 2 will be added here.</p>
                      </div>
                    </div>
                  )}
                  
                  {activePopupTab === 'ptab3' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">PTAB3</h3>
                      <div className="text-center text-gray-500">
                        <p>Content for tab 3 will be added here.</p>
                      </div>
                    </div>
                  )}
                  
                  {activePopupTab === 'ptab4' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">PTAB4</h3>
                      <div className="text-center text-gray-500">
                        <p>Content for tab 4 will be added here.</p>
                      </div>
                    </div>
                  )}
                  
                  {activePopupTab === 'ptab5' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">PTAB5</h3>
                      <div className="text-center text-gray-500">
                        <p>Content for tab 5 will be added here.</p>
                      </div>
                    </div>
                  )}
                  
                  {activePopupTab === 'ptab6' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">PTAB6</h3>
                      <div className="text-center text-gray-500">
                        <p>Content for tab 6 will be added here.</p>
                      </div>
                    </div>
                  )}
                  
                  {activePopupTab === 'ptab7' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">PTAB7</h3>
                      <div className="text-center text-gray-500">
                        <p>Content for tab 7 will be added here.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}