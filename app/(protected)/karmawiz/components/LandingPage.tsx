'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import KarmaWizardSidebar from './KarmaWizardSidebar';

interface GconPiece {
  id: string;
  meta_title: string;
  h1title: string;
  asn_sitespren_base: string;
  pageurl: string;
  pageslug: string;
  created_at: string;
}

interface LandingPageProps {
  onCreateSession: (gconPieceId: string, sessionName?: string, jankyRelSitesprenId?: string) => void;
  loading: boolean;
  sourceUrl?: string | null;
  matchingGconPieces?: GconPiece[];
  currentSession?: any | null;
  onNavigateToStep?: (stepNumber: number) => void;
  onUpdateProgress?: (stepNumber: number, completed?: boolean) => void;
}

interface DetectionResult {
  g_post_id: string;
  pageslug: string;
  pageurl: string;
  meta_title: string;
  matchType: 'post_id' | 'pageslug';
}

interface SitesprenMatch {
  id: string;
  sitespren_base: string;
  driggs_brand_name?: string;
  driggs_city?: string;
  created_at: string;
}

export default function LandingPage({ onCreateSession, loading, sourceUrl, matchingGconPieces, currentSession, onNavigateToStep, onUpdateProgress }: LandingPageProps) {
  const { user } = useAuth();
  const [gconPieceId, setGconPieceId] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFromMatch, setSelectedFromMatch] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [jankyRelSitesprenId, setJankyRelSitesprenId] = useState('');
  
  // URL detection states
  const [urlInput, setUrlInput] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [postIdResult, setPostIdResult] = useState('None found');
  const [pageslugResult, setPageslugResult] = useState('None found');
  const [extractedDomainBase, setExtractedDomainBase] = useState('');
  const [sitesprenMatches, setSitesprenMatches] = useState<SitesprenMatch[]>([]);
  const [sitesprenResult, setSitesprenResult] = useState('None found');
  
  // Chamber visibility states - Initialize with null to avoid SSR hydration mismatch
  const [chamberVisibility, setChamberVisibility] = useState<{
    metalron: boolean;
    platinum: boolean;
    sulfur: boolean;
    plutonium: boolean;
    nickel: boolean;
  } | null>(null);

  // State to track if component is hydrated
  const [isHydrated, setIsHydrated] = useState(false);

  // State for radio selection between janky and gcon
  const [selectedFkOption, setSelectedFkOption] = useState<'janky' | 'gcon'>('janky');

  // State for new seed URL fields
  const [seedUrl1Frontend, setSeedUrl1Frontend] = useState('');
  const [seedUrl2WpEditor, setSeedUrl2WpEditor] = useState('');

  // Chepno action feedback state
  const [gadgetFeedback, setGadgetFeedback] = useState<{
    action: string;
    message: string;
    type: 'info' | 'success' | 'error';
    timestamp: string;
  } | null>(null);

  // Individual action feedback state (per action type)
  const [actionFeedbacks, setActionFeedbacks] = useState<{
    [actionKey: string]: {
      message: string;
      type: 'info' | 'success' | 'error';
      timestamp: string;
    }
  }>({});

  // Load chamber visibility from localStorage on component mount
  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window !== 'undefined') {
      const defaultVisibility = {
        metalron: true,
        platinum: true,
        sulfur: true,
        plutonium: true,
        nickel: true
      };

      try {
        const savedVisibility = localStorage.getItem('karmawiz-chamber-visibility');
        if (savedVisibility) {
          const parsedVisibility = JSON.parse(savedVisibility);
          setChamberVisibility(parsedVisibility);
        } else {
          setChamberVisibility(defaultVisibility);
        }
      } catch (error) {
        console.error('Error loading chamber visibility from localStorage:', error);
        setChamberVisibility(defaultVisibility);
      }

      setIsHydrated(true);
    }
  }, []);

  // Save chamber visibility to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (isHydrated && chamberVisibility && typeof window !== 'undefined') {
      try {
        localStorage.setItem('karmawiz-chamber-visibility', JSON.stringify(chamberVisibility));
      } catch (error) {
        console.error('Error saving chamber visibility to localStorage:', error);
      }
    }
  }, [chamberVisibility, isHydrated]);

  // Load seed URL fields from session when it changes
  useEffect(() => {
    if (currentSession) {
      setSeedUrl1Frontend(currentSession.seed_url_1_frontend_style || '');
      setSeedUrl2WpEditor(currentSession.seed_url_2_wp_editor_style || '');
    }
  }, [currentSession]);

  // Toggle chamber visibility
  const toggleChamberVisibility = (chamber: string) => {
    if (!chamberVisibility) return;
    
    setChamberVisibility(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [chamber]: !prev[chamber as keyof typeof prev]
      };
    });
  };

  const handleSelectFromMatch = (piece: GconPiece) => {
    setSelectedFromMatch(piece.id);
    setGconPieceId(piece.id);
    if (!sessionName) {
      setSessionName(`Karma Session - ${piece.meta_title || piece.h1title || 'Content Enhancement'}`);
    }
  };

  const handleCopyUrls = async () => {
    const urlText = `https://airductcharleston.com/bed-bugs-control/
https://airductcharleston.com/wp-admin/post.php?post=826&action=edit
https://airductcharleston.com/wp-admin/post.php?post=826&action=elementor`;
    
    try {
      await navigator.clipboard.writeText(urlText);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = urlText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const extractDomainBase = (url: string): string => {
    if (!url.trim()) return '';
    
    try {
      // Add protocol if missing
      const urlToProcess = url.includes('://') ? url : `https://${url}`;
      const urlObj = new URL(urlToProcess);
      
      let hostname = urlObj.hostname.toLowerCase();
      
      // Remove www. if present
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }
      
      return hostname;
    } catch (error) {
      // Fallback for malformed URLs
      try {
        let cleanUrl = url.trim().toLowerCase();
        
        // Remove protocol
        cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
        
        // Remove www.
        cleanUrl = cleanUrl.replace(/^www\./, '');
        
        // Take only the domain part (before first slash)
        const domainPart = cleanUrl.split('/')[0];
        
        return domainPart;
      } catch {
        return '';
      }
    }
  };

  const handleCopyDomainBase = async () => {
    try {
      await navigator.clipboard.writeText(extractedDomainBase);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = extractedDomainBase;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const matchSitespren = async (domainBase: string) => {
    if (!domainBase.trim()) {
      setSitesprenMatches([]);
      setSitesprenResult('None found');
      return;
    }

    try {
      const response = await fetch('/api/karmawiz/match-sitespren', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domainBase }),
      });

      const data = await response.json();
      
      if (data.success && data.matches) {
        setSitesprenMatches(data.matches);
        
        if (data.matches.length > 0) {
          const match = data.matches[0];
          setSitesprenResult(`${match.id} - ${match.sitespren_base}`);
        } else {
          setSitesprenResult('None found');
        }
      } else {
        console.error('Sitespren matching failed:', data.error);
        setSitesprenResult('Matching failed');
      }
    } catch (error) {
      console.error('Error calling sitespren matching API:', error);
      setSitesprenResult('Error occurred');
    }
  };

  // Save seed URL fields to database
  const saveSeedUrls = async () => {
    if (!currentSession?.session_id) {
      alert('No active session found');
      return;
    }

    try {
      const { error } = await supabase
        .from('karma_wizard_sessions')
        .update({
          seed_url_1_frontend_style: seedUrl1Frontend,
          seed_url_2_wp_editor_style: seedUrl2WpEditor
        })
        .eq('session_id', currentSession.session_id);

      if (error) {
        console.error('Error saving seed URLs:', error);
        alert('Failed to save seed URLs');
      } else {
        alert('Seed URLs saved successfully');
      }
    } catch (error) {
      console.error('Error saving seed URLs:', error);
      alert('Failed to save seed URLs');
    }
  };

  const handleUrlDetection = async () => {
    if (!urlInput.trim()) return;
    
    // Extract domain base from URL
    const domainBase = extractDomainBase(urlInput);
    setExtractedDomainBase(domainBase);
    
    // Match sitespren records based on domain base
    await matchSitespren(domainBase);
    
    setIsDetecting(true);
    
    try {
      const response = await fetch('/api/karmawiz/detect-gcon-from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawUrl: urlInput }),
      });

      const data = await response.json();
      
      if (data.success) {
        setDetectionResults(data.results);
        
        // Update the result fields based on matches
        const postIdMatches = data.results.filter((r: DetectionResult) => r.matchType === 'post_id');
        const pageslugMatches = data.results.filter((r: DetectionResult) => r.matchType === 'pageslug');
        
        // Format results for display
        if (postIdMatches.length > 0) {
          const match = postIdMatches[0];
          setPostIdResult(`${match.g_post_id} - ${match.pageslug} - ${match.pageurl} - ${match.meta_title}`);
        } else {
          setPostIdResult('None found');
        }
        
        if (pageslugMatches.length > 0) {
          const match = pageslugMatches[0];
          setPageslugResult(`${match.g_post_id} - ${match.pageslug} - ${match.pageurl} - ${match.meta_title}`);
        } else if (data.results.length > 0 && postIdMatches.length === 0) {
          // If we found results but not specifically by post_id, show in pageslug field
          const match = data.results[0];
          setPageslugResult(`${match.g_post_id} - ${match.pageslug} - ${match.pageurl} - ${match.meta_title}`);
        } else {
          setPageslugResult('None found');
        }
      } else {
        console.error('Detection failed:', data.error);
        setPostIdResult('Detection failed');
        setPageslugResult('Detection failed');
      }
    } catch (error) {
      console.error('Error calling detection API:', error);
      setPostIdResult('Error occurred');
      setPageslugResult('Error occurred');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gconPieceId.trim() && !jankyRelSitesprenId.trim()) {
      alert('Please enter either a gcon piece ID or sitespren ID');
      return;
    }

    setIsCreating(true);
    try {
      await onCreateSession(
        gconPieceId.trim() || '', 
        sessionName.trim() || 'New Karma Wizard Session',
        jankyRelSitesprenId.trim() || undefined
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Helper function to get feedback for a specific action
  const getActionFeedback = (action: string, method?: string) => {
    const actionKey = `${action}${method ? `_${method}` : ''}`;
    return actionFeedbacks[actionKey];
  };

  // Helper function to update both feedback states
  const updateFeedback = (action: string, method: string | undefined, message: string, type: 'info' | 'success' | 'error') => {
    const actionKey = `${action}${method ? `_${method}` : ''}`;
    const timestamp = new Date().toISOString();
    const actionDisplay = `${action}${method ? ` (${method})` : ''}`;
    
    // Update general feedback (most recent action)
    setGadgetFeedback({
      action: actionDisplay,
      message,
      type,
      timestamp
    });
    
    // Update individual action feedback
    setActionFeedbacks(prev => ({
      ...prev,
      [actionKey]: {
        message,
        type,
        timestamp
      }
    }));
  };

  // Chepno action handlers (adapted from /sitejar4 functionality)
  const handleChepnoAction = async (action: string, method?: string) => {
    if (!currentSession?.janky_rel_sitespren_id) {
      updateFeedback(action, method, 'No janky_rel_sitespren_id found in current session', 'error');
      return;
    }

    updateFeedback(action, method, 'Action started...', 'info');

    try {
      let endpoint = '';
      let payload: any = {};
      
      // Map chepno actions to their corresponding CORRECT API endpoints (same as sitejar4 ptab7)
      switch (action) {
        case 'chep11':
          // Plugin API sync - using proper sitejar4 endpoint
          endpoint = '/api/sync/wordpress-site';
          payload = { 
            siteId: currentSession.janky_rel_sitespren_id,
            method: 'plugin_api',
            fallbackEnabled: true
          };
          break;
        case 'chep15':
          // f22_nwpi_to_gcon_pusher - call the correct endpoint from nwjar1
          const f22Response = await fetch('/api/f22-nwpi-to-gcon-pusher', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              pushAll: true,
              sitespren_id: currentSession.janky_rel_sitespren_id 
            }),
          });
          const f22Data = await f22Response.json();
          
          if (!f22Response.ok || !f22Data.success) {
            throw new Error(f22Data.message || 'F22 API call failed');
          }
          
          updateFeedback('chep15', method, `${f22Data.message} (${f22Data.results?.processed || 0} processed, ${f22Data.results?.succeeded || 0} succeeded)`, 'success');
          return; // Early return to skip the generic success message
        case 'chep16':
          // f47_generate_gcon_pieces - call the correct endpoint from nwjar1
          const f47Response = await fetch('/api/f47_generate_gcon_pieces', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              generateAll: true,
              sitespren_id: currentSession.janky_rel_sitespren_id,
              sitespren_base: currentSession.sitespren_base || ''
            }),
          });
          const f47Data = await f47Response.json();
          
          if (!f47Response.ok || !f47Data.success) {
            throw new Error(f47Data.message || 'F47 API call failed');
          }
          
          updateFeedback('chep16', method, `${f47Data.message} (${f47Data.results?.processed || 0} processed, ${f47Data.results?.succeeded || 0} succeeded)`, 'success');
          return; // Early return to skip the generic success message
        case 'chep21':
          // REST API sync - using proper sitejar4 endpoint
          endpoint = '/api/sync/wordpress-site';
          payload = { 
            siteId: currentSession.janky_rel_sitespren_id,
            method: 'rest_api',
            fallbackEnabled: true
          };
          break;
        case 'chep31':
          // Test plugin - using proper sitejar4 endpoint
          endpoint = '/api/sync/test-plugin';
          payload = { 
            siteId: currentSession.janky_rel_sitespren_id
          };
          break;
        case 'chep41':
          // Check plugin version - using proper sitejar4 endpoint
          endpoint = '/api/plugin/check-version';
          payload = { 
            siteId: currentSession.janky_rel_sitespren_id,
            userId: user?.id
          };
          break;
        case 'chep51':
          // Update plugin - using proper sitejar4 endpoint
          endpoint = '/api/plugin/update';
          payload = { 
            siteId: currentSession.janky_rel_sitespren_id
          };
          break;
        case 'chep61':
          // Barkro push - using proper sitejar4 endpoint
          endpoint = '/api/barkro/push-update';
          payload = { 
            siteId: currentSession.janky_rel_sitespren_id
          };
          break;
        case 'wpsv2_sync':
          // Extended sync - using proper sitejar4 endpoint
          endpoint = '/api/wpsv2/sync-site';
          payload = { 
            siteId: currentSession.janky_rel_sitespren_id,
            method: method || 'plugin_api',
            fallbackEnabled: true
          };
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Make the actual API call (no more simulations)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      updateFeedback(action, method, data.message || `Action completed successfully for sitespren ID: ${currentSession.janky_rel_sitespren_id} (${currentSession.sitespren_base || 'N/A'})`, 'success');
    } catch (error) {
      updateFeedback(action, method, `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  // Copy feedback message to clipboard
  const copyFeedbackMessage = async () => {
    if (!gadgetFeedback) return;
    
    const message = `Action: ${gadgetFeedback.action}\\nMessage: ${gadgetFeedback.message}\\nTime: ${new Date(gadgetFeedback.timestamp).toLocaleString()}`;
    
    try {
      await navigator.clipboard.writeText(message);
      // Briefly show success
      const originalMessage = gadgetFeedback.message;
      setGadgetFeedback({
        ...gadgetFeedback,
        message: 'Message copied to clipboard!'
      });
      setTimeout(() => {
        setGadgetFeedback(prev => prev ? { ...prev, message: originalMessage } : null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  // Clear feedback message
  const clearFeedbackMessage = () => {
    setGadgetFeedback(null);
  };

  if (loading || isCreating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">
          {isCreating ? 'Creating session...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <KarmaWizardSidebar 
        currentStep={1} 
        session={currentSession}
        onNavigateToStep={onNavigateToStep}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="w-full px-6" style={{ paddingTop: '2px' }}>
          <div className="bg-white rounded-lg shadow-lg" style={{ padding: '8px 24px 24px 24px' }}>
            {/* Chamber Toggle Buttons */}
            <div className="pb-2 border-b border-gray-200">
              <div className="flex flex-wrap justify-center gap-2">
                {chamberVisibility && Object.entries(chamberVisibility).map(([chamber, isVisible]) => (
                  <button
                    key={chamber}
                    onClick={() => toggleChamberVisibility(chamber)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      isVisible
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {chamber}
                  </button>
                ))}
                {!chamberVisibility && (
                  <div className="flex gap-2">
                    {['metalron', 'platinum', 'sulfur', 'plutonium', 'nickel'].map(chamber => (
                      <div
                        key={chamber}
                        className="px-4 py-2 text-sm font-medium rounded-lg border bg-gray-100 text-gray-400 animate-pulse"
                      >
                        {chamber}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {sourceUrl && (
              <div className="mb-8">
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        <strong>Source URL Detected:</strong> {sourceUrl}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Searched your content for matching pieces based on this URL.
                      </p>
                    </div>
                  </div>
                </div>

                {matchingGconPieces && matchingGconPieces.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Matching Content Found ({matchingGconPieces.length})
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {matchingGconPieces.map((piece) => (
                        <div
                          key={piece.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedFromMatch === piece.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleSelectFromMatch(piece)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">
                                {piece.meta_title || piece.h1title || 'Untitled'}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {piece.pageurl || piece.asn_sitespren_base}
                              </p>
                              <p className="text-xs text-gray-500">
                                Created: {new Date(piece.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="ml-3">
                              {selectedFromMatch === piece.id ? (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchingGconPieces && matchingGconPieces.length === 0 && (
                  <div className="mb-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>No matching content found</strong> for "{sourceUrl}". 
                            You can still manually enter a gcon piece ID below.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}


            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="metalron_chamber_div" style={{ border: '1px solid black', padding: '16px', position: 'relative', display: chamberVisibility?.metalron ? 'block' : 'none' }}>
                  <div className="flex justify-between items-center">
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    metalron_chamber_div
                  </div>
                </div>

                <div className="silver_chamber_div mt-4" style={{ border: '1px solid black', backgroundColor: '#fff', padding: '16px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    silver_chamber_div
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div style={{ fontSize: '16px' }}>
                      SilverFunctionDetectGconRowFromRawURLs
                    </div>
                    
                    {/* New Seed URL Input Fields */}
                    <div className="flex gap-2">
                      <div style={{ border: '1px solid black', padding: '8px' }}>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          seed_url_1_frontend_style
                        </label>
                        <input
                          type="text"
                          value={seedUrl1Frontend}
                          onChange={(e) => setSeedUrl1Frontend(e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                          style={{ width: '200px' }}
                        />
                      </div>
                      
                      <div style={{ border: '1px solid black', padding: '8px' }}>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          seed_url_2_wp_editor_style
                        </label>
                        <input
                          type="text"
                          value={seedUrl2WpEditor}
                          onChange={(e) => setSeedUrl2WpEditor(e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                          style={{ width: '200px' }}
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={saveSeedUrls}
                        className="self-end px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Save seed_url fields
                      </button>
                    </div>
                    
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowTooltip(!showTooltip)}
                        className="w-6 h-6 bg-gray-500 text-white rounded-sm flex items-center justify-center text-xs font-bold hover:bg-gray-600"
                      >
                        ?
                      </button>
                      {showTooltip && (
                        <div className="absolute right-0 top-8 w-80 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10">
                          <p className="text-sm text-gray-700 mb-3">you may enter text like this:</p>
                          <div className="bg-gray-100 border rounded p-3 mb-3">
                            <code className="text-sm block whitespace-pre-wrap">
https://airductcharleston.com/bed-bugs-control/
https://airductcharleston.com/wp-admin/post.php?post=826&action=edit
https://airductcharleston.com/wp-admin/post.php?post=826&action=elementor
                            </code>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyUrls}
                            className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Copy All to Clipboard
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <hr className="my-4 border-gray-300" />

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      enter url
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUrlDetection()}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://elcajonplumber.net/emergency-plumber-el-cajon/"
                        disabled={isDetecting}
                      />
                      <button
                        type="button"
                        onClick={handleUrlDetection}
                        disabled={isDetecting || !urlInput.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDetecting ? 'Searching...' : 'Detect'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      found from wp post id: gcon_pieces.g_post_id (corresponds to wp_posts.post_id)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={postIdResult}
                      readOnly
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      found from gcon_pieces.pageslug (corresponds to wp_posts.post_name)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={pageslugResult}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="platinum_chamber_div mt-4" style={{ border: '1px solid black', backgroundColor: '#fff', padding: '16px', display: chamberVisibility?.platinum ? 'block' : 'none' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    platinum_chamber_div
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      extracted_domain_base
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={extractedDomainBase}
                        readOnly
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={handleCopyDomainBase}
                        disabled={!extractedDomainBase}
                        className="w-12 h-12 bg-gray-500 text-white rounded-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      matching sitespren_base inside your user account
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sitesprenResult}
                        readOnly
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (sitesprenMatches.length > 0) {
                            setJankyRelSitesprenId(sitesprenMatches[0].id);
                          }
                        }}
                        disabled={sitesprenMatches.length === 0}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                          sitesprenMatches.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        pass to janky
                      </button>
                    </div>
                  </div>
                </div>

              <div className="sulfur_chamber_div mt-4" style={{ border: '1px solid black', backgroundColor: '#fff', padding: '16px', display: chamberVisibility?.sulfur ? 'block' : 'none' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    sulfur_chamber_div
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      karma_wizard_sessions.rel_sitespren_id
                    </label>
                    <input
                      type="text"
                      value={jankyRelSitesprenId}
                      onChange={(e) => setJankyRelSitesprenId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter sitespren ID..."
                    />
                    
                    <button
                      onClick={async () => {
                        if (!jankyRelSitesprenId.trim() && !gconPieceId.trim()) {
                          alert('Please enter either a sitespren ID or gcon piece ID');
                          return;
                        }
                        setIsCreating(true);
                        try {
                          await onCreateSession(
                            gconPieceId.trim() || '', 
                            sessionName.trim() || 'New Karma Wizard Session',
                            jankyRelSitesprenId.trim() || undefined
                          );
                        } catch (error) {
                          console.error('Failed to create session:', error);
                        } finally {
                          setIsCreating(false);
                        }
                      }}
                      disabled={!jankyRelSitesprenId.trim() && !gconPieceId.trim()}
                      className={`mt-3 px-4 py-2 rounded font-medium transition-colors ${
                        (!jankyRelSitesprenId.trim() && !gconPieceId.trim())
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Create New Karma Wizard Session
                    </button>
                  </div>
                </div>

              <div className="plutonium_chamber_div mt-4" style={{ border: '1px solid black', backgroundColor: '#fff', padding: '16px', display: chamberVisibility?.plutonium ? 'block' : 'none' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    plutonium_chamber_div
                  </div>
                  
                  {/* Sitespren Data Badge - Duplicate from Sidebar */}
                  {currentSession && (
                    <div className="mt-4 border border-black rounded overflow-hidden">
                      <div className="w-full h-3.5 bg-blue-200 flex items-center px-2">
                        <span style={{ fontSize: '12px', color: '#394990' }}>
                          fk data badge
                        </span>
                      </div>
                      <div className="p-3">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          janky_rel_sitespren_id
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={currentSession.janky_rel_sitespren_id || ''}
                            readOnly
                            className="w-12 px-2 py-2 text-sm border border-gray-300 rounded-md bg-yellow-50 text-gray-600 font-mono"
                            placeholder="ID"
                          />
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              (from fk)sitespren_base
                            </label>
                            <input
                              type="text"
                              value={currentSession.sitespren_base || ''}
                              readOnly
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-green-50 text-gray-600"
                              placeholder="Sitespren base URL"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ruplin_api_key_site_specific
                      </label>
                      <input
                        type="text"
                        value=""
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        harbor_api_key_site_specific
                      </label>
                      <input
                        type="text"
                        value=""
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        klyra_api_key_site_specific
                      </label>
                      <input
                        type="text"
                        value=""
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

              <div className="nickel_chamber_div mt-4" style={{ border: '1px solid black', backgroundColor: '#fff', padding: '16px', display: chamberVisibility?.nickel ? 'block' : 'none' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    nickel_chamber_div
                  </div>
                  
                  {/* Sitespren Data Badge with Option Selector and Tool Buttons */}
                  {currentSession && (
                    <div className="mt-4 flex gap-4">
                      <div>
                        <div className="flex">
                          {/* Option 1 Selector */}
                      <div 
                        className="border border-black rounded-l overflow-hidden cursor-pointer"
                        style={{ width: '50px' }}
                        onClick={() => setSelectedFkOption('janky')}
                      >
                        <div className="w-full h-3.5 bg-blue-200 flex items-center justify-center">
                          <span style={{ fontSize: '10px', color: '#394990' }}>
                            option 1
                          </span>
                        </div>
                        <div className="flex items-center justify-center p-1">
                          <input
                            type="checkbox"
                            checked={selectedFkOption === 'janky'}
                            onChange={() => setSelectedFkOption('janky')}
                            className="w-5 h-5 cursor-pointer"
                            style={{ width: '20px', height: '20px' }}
                          />
                        </div>
                      </div>
                      {/* Original Sitespren Badge */}
                      <div className="border border-black border-l-0 rounded-r overflow-hidden" style={{ width: '320px' }}>
                        <div className="w-full h-3.5 bg-blue-200 flex items-center px-2">
                          <span style={{ fontSize: '12px', color: '#394990' }}>
                            fk data badge
                          </span>
                        </div>
                        <div className="p-3">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            janky_rel_sitespren_id
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={currentSession.janky_rel_sitespren_id || ''}
                              readOnly
                              className="w-12 px-2 py-2 text-sm border border-gray-300 rounded-md bg-yellow-50 text-gray-600 font-mono"
                              placeholder="ID"
                            />
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                (from fk)sitespren_base
                              </label>
                              <input
                                type="text"
                                value={currentSession.sitespren_base || ''}
                                readOnly
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-green-50 text-gray-600"
                                placeholder="Sitespren base URL"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                      </div>
                      
                      {/* Tool Buttons Full Section */}
                      <div className="flex gap-4">
                      <div className="p-4 min-w-96" style={{ border: '1px solid black' }}>
                      <div className="flex items-center mb-3">
                        <span className="text-sm font-semibold text-gray-800">
                          tool_buttons_full
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {/* Individual View */}
                        <button
                          onClick={() => currentSession.sitespren_base && window.open(`/sitnivid?site=${encodeURIComponent(currentSession.sitespren_base)}`, '_blank')}
                          disabled={!currentSession.sitespren_base}
                          className={`inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            currentSession.sitespren_base 
                              ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                              : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                          }`}
                        >
                          Individual View
                        </button>

                        {/* WP Admin */}
                        <button
                          onClick={() => currentSession.sitespren_base && window.open(`https://${currentSession.sitespren_base}/wp-admin/`, '_blank')}
                          disabled={!currentSession.sitespren_base}
                          className={`inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            currentSession.sitespren_base
                              ? 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
                              : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                          }`}
                          title="Open WP Admin"
                        >
                          WP
                        </button>

                        {/* Open Site */}
                        <button
                          onClick={() => currentSession.sitespren_base && window.open(`https://${currentSession.sitespren_base}`, '_blank')}
                          disabled={!currentSession.sitespren_base}
                          className={`inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            currentSession.sitespren_base
                              ? 'text-white bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                              : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                          }`}
                          title="Open Site"
                        >
                          Site
                        </button>

                        {/* Copy to Clipboard */}
                        <button
                          onClick={() => currentSession.sitespren_base && navigator.clipboard.writeText(currentSession.sitespren_base)}
                          disabled={!currentSession.sitespren_base}
                          className={`inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            currentSession.sitespren_base
                              ? 'text-white bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                              : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                          }`}
                          title="Copy domain to clipboard"
                        >
                          📋
                        </button>

                        {/* Google Search */}
                        <button
                          onClick={() => currentSession.sitespren_base && window.open(`https://www.google.com/search?q=site%3A${encodeURIComponent(currentSession.sitespren_base)}`, '_blank')}
                          disabled={!currentSession.sitespren_base}
                          className={`inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            currentSession.sitespren_base
                              ? 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
                              : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                          }`}
                          title="Google site: search"
                        >
                          G
                        </button>

                        {/* NW Jar */}
                        <button
                          onClick={() => currentSession.sitespren_base && window.open(`/nwjar1?coltemp=option1&sitebase=${encodeURIComponent(currentSession.sitespren_base)}`, '_blank')}
                          disabled={!currentSession.sitespren_base}
                          className={`inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            currentSession.sitespren_base
                              ? 'text-white bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
                              : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                          }`}
                          title="Open NW Jar"
                        >
                          NW
                        </button>

                        {/* GC Jar */}
                        <button
                          onClick={() => currentSession.sitespren_base && window.open(`/gconjar1?coltemp=option1&sitebase=${encodeURIComponent(currentSession.sitespren_base)}`, '_blank')}
                          disabled={!currentSession.sitespren_base}
                          className={`inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            currentSession.sitespren_base
                              ? 'text-white bg-teal-500 hover:bg-teal-600 focus:ring-teal-500'
                              : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                          }`}
                          title="Open GC Jar"
                        >
                          GC
                        </button>

                        {/* Driggsman */}
                        <button
                          onClick={() => currentSession.sitespren_base && window.open(`/drom?sitesentered=${encodeURIComponent(currentSession.sitespren_base)}&activefilterchamber=daylight&showmainchamberboxes=no&showtundrachamber=yes`, '_blank')}
                          disabled={!currentSession.sitespren_base}
                          className={`inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            currentSession.sitespren_base
                              ? 'text-white bg-purple-500 hover:bg-purple-600 focus:ring-purple-500'
                              : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                          }`}
                          title="Open Driggsman"
                        >
                          DG
                        </button>

                        {/* View Only This Site */}
                        <button
                          onClick={() => currentSession.sitespren_base && window.open(`/sitejar4?sitesentered=${encodeURIComponent(currentSession.sitespren_base)}`, '_blank')}
                          disabled={!currentSession.sitespren_base}
                          className={`inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            currentSession.sitespren_base
                              ? 'text-white bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
                              : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                          }`}
                          title="View only this site"
                        >
                          Site
                        </button>
                      </div>
                    </div>
                    </div>
                      
                      {/* Option 2 - FK Data Badge positioned to right of tool_buttons_full */}
                      {currentSession && (
                        <div className="flex" style={{ marginLeft: '16px' }}>
                          {/* Option 2 Selector */}
                          <div 
                            className="border border-black rounded-l overflow-hidden cursor-pointer"
                            style={{ width: '50px' }}
                            onClick={() => setSelectedFkOption('gcon')}
                          >
                            <div className="w-full h-3.5 bg-blue-200 flex items-center justify-center">
                              <span style={{ fontSize: '10px', color: '#394990' }}>
                                option 2
                              </span>
                            </div>
                            <div className="flex items-center justify-center p-1">
                              <input
                                type="checkbox"
                                checked={selectedFkOption === 'gcon'}
                                onChange={() => setSelectedFkOption('gcon')}
                                className="w-5 h-5 cursor-pointer"
                                style={{ width: '20px', height: '20px' }}
                              />
                            </div>
                          </div>
                          {/* FK Data Badge */}
                          <div className="border border-black border-l-0 rounded-r overflow-hidden" style={{ width: '320px' }}>
                            <div className="w-full h-3.5 bg-blue-200 flex items-center px-2">
                              <span style={{ fontSize: '12px', color: '#394990' }}>
                                fk data badge
                              </span>
                            </div>
                            <div className="p-3">
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                rel_gcon_piece_id
                              </label>
                              <div className="flex space-x-2 mb-2">
                                <input
                                  type="text"
                                  value={currentSession.rel_gcon_piece_id || ''}
                                  readOnly
                                  className="w-12 px-2 py-2 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-600 font-mono"
                                  placeholder="ID"
                                />
                                <input
                                  type="text"
                                  value={currentSession.gcon_post_name || ''}
                                  readOnly
                                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                                  placeholder="Post name"
                                />
                              </div>
                              <input
                                type="text"
                                value={currentSession.gcon_meta_title || ''}
                                readOnly
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                                placeholder="Meta title"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                  )}
                  
                  {/* Navigation Buttons with Dynamic URLs */}
                  {currentSession && currentSession.sitespren_base && (
                    <div className="mt-4 flex justify-start gap-2">
                      <a 
                        href={`/gconjar1?sitebase=${currentSession.sitespren_base}`}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        /gconjar1
                      </a>
                      <a 
                        href={`/nwjar1?sitebase=${currentSession.sitespren_base}`}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        /nwjar1
                      </a>
                    </div>
                  )}
                  
                  {/* Chepno Functions Reference Table */}
                  <div className="mt-4">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">Chepno Functions Reference UI Table Grid</h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-300 bg-white text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-3 py-2 text-center text-gray-500">-</th>
                            <th className="border border-gray-300 px-3 py-2 text-center text-gray-500">-</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-gray-500">-</th>
                            <th className="border border-gray-300 px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedFkOption === 'janky'}
                                onChange={() => setSelectedFkOption('janky')}
                                className="cursor-pointer"
                                style={{ width: '20px', height: '20px' }}
                              />
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedFkOption === 'gcon'}
                                onChange={() => setSelectedFkOption('gcon')}
                                className="cursor-pointer"
                                style={{ width: '20px', height: '20px' }}
                              />
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-gray-500">-</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-gray-500">-</th>
                          </tr>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-center font-medium w-12">Select</th>
                            <th className="border border-gray-300 px-3 py-2 text-center font-medium w-20">submit</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">Function Name (ID)</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium w-48">Feedback (janky_rel_sitespren_id)</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium w-48">Feedback (rel_gcon_piece_id)</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">Description & DB Tables</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">Connection Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input type="checkbox" className="form-checkbox h-4 w-4" />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <button 
                                type="button"
                                onClick={() => handleChepnoAction('chep11')}
                                disabled={!currentSession?.janky_rel_sitespren_id}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  currentSession?.janky_rel_sitespren_id
                                    ? 'bg-blue-200 text-gray-800 hover:bg-blue-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                submit
                              </button>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>chep11 - Plugin API</strong>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep11')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep11')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep11')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep11')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep11', 'gcon')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep11', 'gcon')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep11', 'gcon')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep11', 'gcon')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Calls WordPress site via Plugin API endpoint <code>/wp-json/snefuru/v1/posts</code>. 
                              Syncs WordPress posts/pages to <code>nwpi_posts</code> table. 
                              Updates <code>ywp_sites.last_sync_at</code> timestamp.
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Plugin API (Snefuru WordPress plugin)
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input type="checkbox" className="form-checkbox h-4 w-4" />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <button 
                                type="button"
                                onClick={() => handleChepnoAction('chep15')}
                                disabled={!currentSession?.janky_rel_sitespren_id}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  currentSession?.janky_rel_sitespren_id
                                    ? 'bg-blue-200 text-gray-800 hover:bg-blue-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                submit
                              </button>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 bg-blue-100">
                              <strong>chep15 - f22_nwpi_to_gcon_pusher</strong>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep15')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep15')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep15')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep15')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep15', 'gcon')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep15', 'gcon')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep15', 'gcon')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep15', 'gcon')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Transfers content from <code>nwpi_posts</code> to <code>gcon_pieces</code> table. 
                              Applies BozoHTMLNormalizationProcess1 and TontoNormalizationProcess1 transformations. 
                              Updates fields like <code>mud_content</code>, <code>mud_title</code>, <code>aval_content</code>, 
                              and <code>mud_deplines</code> for content processing.
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Internal Database API
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input type="checkbox" className="form-checkbox h-4 w-4" />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <button 
                                type="button"
                                onClick={() => handleChepnoAction('chep16')}
                                disabled={!currentSession?.janky_rel_sitespren_id}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  currentSession?.janky_rel_sitespren_id
                                    ? 'bg-blue-200 text-gray-800 hover:bg-blue-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                submit
                              </button>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 bg-blue-100">
                              <strong>chep16 - f47_generate_gcon_pieces</strong>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep16')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep16')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep16')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep16')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep16', 'gcon')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep16', 'gcon')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep16', 'gcon')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep16', 'gcon')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Generates new <code>gcon_pieces</code> records from <code>nwpi_posts</code> data. 
                              Creates structured content pieces for further processing. 
                              Works with selected items or all items from the nwpi dataset.
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Internal Database API
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input type="checkbox" className="form-checkbox h-4 w-4" />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <button 
                                type="button"
                                onClick={() => handleChepnoAction('chep21')}
                                disabled={!currentSession?.janky_rel_sitespren_id}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  currentSession?.janky_rel_sitespren_id
                                    ? 'bg-blue-200 text-gray-800 hover:bg-blue-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                submit
                              </button>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>chep21 - REST API</strong>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep21')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep21')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep21')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep21')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep21', 'gcon')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep21', 'gcon')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep21', 'gcon')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep21', 'gcon')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Calls WordPress site via standard REST API <code>/wp-json/wp/v2/posts</code>. 
                              Syncs WordPress posts/pages to <code>nwpi_posts</code> table. 
                              Updates <code>ywp_sites.last_sync_at</code> timestamp.
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              WordPress REST API
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input type="checkbox" className="form-checkbox h-4 w-4" />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <button 
                                type="button"
                                onClick={() => handleChepnoAction('chep31')}
                                disabled={!currentSession?.janky_rel_sitespren_id}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  currentSession?.janky_rel_sitespren_id
                                    ? 'bg-blue-200 text-gray-800 hover:bg-blue-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                submit
                              </button>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>chep31 - Test Plugin</strong>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep31')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep31')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep31')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep31')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep31', 'gcon')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep31', 'gcon')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep31', 'gcon')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep31', 'gcon')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Tests plugin connectivity by checking: 1) WordPress REST API availability, 
                              2) Snefuru plugin status endpoint, 3) Plugin posts endpoint. 
                              No database writes, only reads from <code>ywp_sites</code>.
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Plugin API (Snefuru WordPress plugin)
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input type="checkbox" className="form-checkbox h-4 w-4" />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <button 
                                type="button"
                                onClick={() => handleChepnoAction('chep41')}
                                disabled={!currentSession?.janky_rel_sitespren_id}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  currentSession?.janky_rel_sitespren_id
                                    ? 'bg-blue-200 text-gray-800 hover:bg-blue-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                submit
                              </button>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>chep41 - Check Version</strong>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep41')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep41')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep41')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep41')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep41', 'gcon')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep41', 'gcon')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep41', 'gcon')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep41', 'gcon')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Checks current plugin version installed on WordPress site via plugin API endpoint. 
                              Reads from <code>barkro_plugin_versions</code> table to compare versions.
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Plugin API (Snefuru WordPress plugin)
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input type="checkbox" className="form-checkbox h-4 w-4" />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <button 
                                type="button"
                                onClick={() => handleChepnoAction('chep51')}
                                disabled={!currentSession?.janky_rel_sitespren_id}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  currentSession?.janky_rel_sitespren_id
                                    ? 'bg-blue-200 text-gray-800 hover:bg-blue-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                submit
                              </button>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>chep51 - Update Plugin</strong>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep51')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep51')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep51')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep51')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep51', 'gcon')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep51', 'gcon')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep51', 'gcon')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep51', 'gcon')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Updates the Snefuru plugin on WordPress site. 
                              Writes to <code>barkro_update_pushes</code> and <code>barkro_site_status</code> tables 
                              to track update attempts and status.
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Plugin API (Snefuru WordPress plugin)
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input type="checkbox" className="form-checkbox h-4 w-4" />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <button 
                                type="button"
                                onClick={() => handleChepnoAction('chep61')}
                                disabled={!currentSession?.janky_rel_sitespren_id}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  currentSession?.janky_rel_sitespren_id
                                    ? 'bg-blue-200 text-gray-800 hover:bg-blue-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                submit
                              </button>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>chep61 - Barkro Push</strong>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep61')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep61')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep61')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep61')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('chep61', 'gcon')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('chep61', 'gcon')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('chep61', 'gcon')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('chep61', 'gcon')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Pushes plugin updates from local <code>snefuruplin</code> directory to WordPress site. 
                              Creates ZIP file and sends via <code>/wp-json/snefuru/v1/check-update</code>. 
                              Updates <code>barkro_update_pushes</code>, <code>barkro_plugin_versions</code>, 
                              and <code>barkro_site_status</code> tables.
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Plugin API (Snefuru WordPress plugin)
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input type="checkbox" className="form-checkbox h-4 w-4" />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <button 
                                type="button"
                                onClick={() => handleChepnoAction('wpsv2_sync', 'plugin_api')}
                                disabled={!currentSession?.janky_rel_sitespren_id}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  currentSession?.janky_rel_sitespren_id
                                    ? 'bg-blue-200 text-gray-800 hover:bg-blue-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                submit
                              </button>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>wpsv2_sync (Plugin API)</strong>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('wpsv2_sync', 'plugin_api')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('wpsv2_sync', 'plugin_api')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('wpsv2_sync', 'plugin_api')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('wpsv2_sync', 'plugin_api')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('wpsv2_sync_plugin_api', 'gcon')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('wpsv2_sync_plugin_api', 'gcon')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('wpsv2_sync_plugin_api', 'gcon')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('wpsv2_sync_plugin_api', 'gcon')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Extended sync operation that syncs WordPress content to database via Plugin API. 
                              Articles flow: wp → nwpi. Updates <code>nwpi_posts</code> and <code>ywp_sites</code> tables.
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Plugin API (Snefuru WordPress plugin)
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input type="checkbox" className="form-checkbox h-4 w-4" />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <button 
                                type="button"
                                onClick={() => handleChepnoAction('wpsv2_sync', 'rest_api')}
                                disabled={!currentSession?.janky_rel_sitespren_id}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  currentSession?.janky_rel_sitespren_id
                                    ? 'bg-blue-200 text-gray-800 hover:bg-blue-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                submit
                              </button>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>wpsv2_sync (REST API)</strong>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('wpsv2_sync', 'rest_api')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('wpsv2_sync', 'rest_api')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('wpsv2_sync', 'rest_api')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('wpsv2_sync', 'rest_api')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className={`text-xs p-2 rounded min-h-[40px] ${
                                getActionFeedback('wpsv2_sync_rest_api', 'gcon')?.type === 'success' ? 'bg-green-50 text-green-700' :
                                getActionFeedback('wpsv2_sync_rest_api', 'gcon')?.type === 'error' ? 'bg-red-50 text-red-700' :
                                getActionFeedback('wpsv2_sync_rest_api', 'gcon')?.type === 'info' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {getActionFeedback('wpsv2_sync_rest_api', 'gcon')?.message || 'No feedback yet'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              Extended sync operation that syncs WordPress content to database via REST API. 
                              Articles flow: wp → nwpi. Updates <code>nwpi_posts</code> and <code>ywp_sites</code> tables.
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              WordPress REST API
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Chepno Action Feedback */}
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Action Feedback (of most recently run action)</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyFeedbackMessage()}
                            disabled={!gadgetFeedback}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded border disabled:cursor-not-allowed"
                          >
                            Copy Message
                          </button>
                          <button
                            onClick={() => clearFeedbackMessage()}
                            disabled={!gadgetFeedback}
                            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 disabled:bg-gray-50 disabled:text-gray-400 text-red-700 rounded border disabled:cursor-not-allowed"
                          >
                            Clear Message
                          </button>
                        </div>
                      </div>
                      
                      <div className="min-h-[80px] p-3 bg-gray-50 border rounded-md">
                        {gadgetFeedback ? (
                          <div className={`text-sm ${
                            gadgetFeedback.type === 'success' ? 'text-green-700' : 
                            gadgetFeedback.type === 'error' ? 'text-red-700' : 'text-gray-700'
                          }`}>
                            <div className="font-medium">{gadgetFeedback.action}</div>
                            <div className="mt-1">{gadgetFeedback.message}</div>
                            {gadgetFeedback.timestamp && (
                              <div className="text-xs text-gray-500 mt-2">
                                {new Date(gadgetFeedback.timestamp).toLocaleString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">
                            No feedback messages yet. Click a submit button in the table above to test a chepno function.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              <div>
                <label 
                  htmlFor="gconPieceId" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Gcon Piece ID (Optional - provide either this or Sitespren ID)
                </label>
                <input
                  type="text"
                  id="gconPieceId"
                  value={gconPieceId}
                  onChange={(e) => setGconPieceId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the UUID of the content piece to enhance"
                  disabled={isCreating}
                />
                <p className="mt-1 text-sm text-gray-500">
                  This should be a UUID from the gcon_pieces table representing the content you want to work on.
                </p>
              </div>

              <div>
                <label 
                  htmlFor="sessionName" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Session Name (Optional)
                </label>
                <input
                  type="text"
                  id="sessionName"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Give your wizard session a descriptive name"
                  disabled={isCreating}
                />
                <p className="mt-1 text-sm text-gray-500">
                  If left blank, will default to "New Karma Wizard Session"
                </p>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">What happens next?</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Step 1</span>
                    <span>Designate Basic Session Info (Current Step)</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Step 2</span>
                    <span>Fetch and analyze existing content</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Step 3</span>
                    <span>Generate AI images via API</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Step 4</span>
                    <span>Upload images to WordPress</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Step 5</span>
                    <span>Update content with image references</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <a 
                href="/karmajar" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                → View existing sessions in Karmajar
              </a>
            </div>
          </div>

          {/* Step 1 Content - Only show when session exists */}
          {currentSession && (
            <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Step 1: Designate Basic Session Info
                </h2>
                <p className="text-gray-600">
                  Review and confirm your Karma Wizard session details before proceeding to content analysis.
                </p>
              </div>

              {/* Session Details */}
              <div className="bg-white border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Session Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Session ID</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono">
                        {currentSession.session_id}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {currentSession.session_name}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Session Status</label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {currentSession.session_status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {currentSession.rel_gcon_piece_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gcon Piece ID</label>
                        <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded font-mono">
                          {currentSession.rel_gcon_piece_id}
                        </p>
                      </div>
                    )}

                    {currentSession.janky_rel_sitespren_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sitespren ID</label>
                        <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded font-mono">
                          {currentSession.janky_rel_sitespren_id}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Steps Planned</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {currentSession.total_steps_planned}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {new Date(currentSession.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Source Verification */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Content Source:</strong> This session will work with{' '}
                      {currentSession.rel_gcon_piece_id ? 'the selected gcon piece' : 'the specified sitespren'}.
                      The wizard will fetch content data, generate images, and update your WordPress site.
                    </p>
                  </div>
                </div>
              </div>

              {/* Session Steps Overview */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Wizard Process Overview</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-medium mr-3">1</div>
                    <span><strong>Step 1:</strong> Designate Basic Session Info (Current Step)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium mr-3">2</div>
                    <span><strong>Step 2:</strong> Fetch and analyze existing content</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium mr-3">3</div>
                    <span><strong>Step 3:</strong> Generate AI images via API</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium mr-3">4</div>
                    <span><strong>Step 4:</strong> Upload images to WordPress</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium mr-3">5</div>
                    <span><strong>Step 5:</strong> Update content with image references</span>
                  </div>
                </div>
              </div>

              {/* Step 1 Completion Button */}
              <div className="text-center pt-6 border-t">
                <button
                  onClick={() => onNavigateToStep && onNavigateToStep(2)}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Complete Step 1 - Proceed to Content Analysis →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}