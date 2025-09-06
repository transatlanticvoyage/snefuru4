'use client';

import { useState } from 'react';

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
  onCreateSession: (gconPieceId: string, sessionName?: string) => void;
  loading: boolean;
  sourceUrl?: string | null;
  matchingGconPieces?: GconPiece[];
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

export default function LandingPage({ onCreateSession, loading, sourceUrl, matchingGconPieces }: LandingPageProps) {
  const [gconPieceId, setGconPieceId] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFromMatch, setSelectedFromMatch] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // URL detection states
  const [urlInput, setUrlInput] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [postIdResult, setPostIdResult] = useState('None found');
  const [pageslugResult, setPageslugResult] = useState('None found');
  const [extractedDomainBase, setExtractedDomainBase] = useState('');
  const [sitesprenMatches, setSitesprenMatches] = useState<SitesprenMatch[]>([]);
  const [sitesprenResult, setSitesprenResult] = useState('None found');

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
    
    if (!gconPieceId.trim()) {
      alert('Please enter a gcon piece ID or select from matching content');
      return;
    }

    setIsCreating(true);
    try {
      await onCreateSession(
        gconPieceId.trim(), 
        sessionName.trim() || 'New Karma Wizard Session'
      );
    } finally {
      setIsCreating(false);
    }
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto" style={{ maxWidth: '1200px' }}>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Karma Wizard
              </h1>
              <p className="text-gray-600">
                Enhance your content with AI-generated images and automated WordPress integration
              </p>
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

            <div className="mb-8">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>How it works:</strong> {sourceUrl ? 'Select from matching content above or' : 'Enter the ID of a content piece (gcon_pieces) that you want to enhance with images.'} 
                      The wizard will guide you through fetching page info, generating images, and updating your WordPress site.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="metalron_chamber_div" style={{ border: '1px solid black', padding: '16px', position: 'relative' }}>
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

                <div className="platinum_chamber_div mt-4" style={{ border: '1px solid black', backgroundColor: '#fff', padding: '16px' }}>
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
                    <input
                      type="text"
                      value={sitesprenResult}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>

                <div className="nickel_chamber_div mt-4" style={{ border: '1px solid black', backgroundColor: '#fff', padding: '16px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    nickel_chamber_div
                  </div>
                  
                  {/* Chepno Functions Reference Table */}
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Chepno Functions Reference</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-300 bg-white text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-center font-medium w-12">Select</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">Function Name (ID)</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">Description & DB Tables</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">Connection Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input type="checkbox" className="form-checkbox h-4 w-4" />
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>chep11 - Plugin API</strong>
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
                            <td className="border border-gray-300 px-3 py-2 bg-blue-100">
                              <strong>chep15 - f22_nwpi_to_gcon_pusher</strong>
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
                            <td className="border border-gray-300 px-3 py-2 bg-blue-100">
                              <strong>chep16 - f47_generate_gcon_pieces</strong>
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
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>chep21 - REST API</strong>
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
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>chep31 - Test Plugin</strong>
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
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>chep41 - Check Version</strong>
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
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>chep51 - Update Plugin</strong>
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
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>chep61 - Barkro Push</strong>
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
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>wpsv2_sync (Plugin API)</strong>
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
                            <td className="border border-gray-300 px-3 py-2">
                              <strong>wpsv2_sync (REST API)</strong>
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
                  </div>
                </div>
              </div>

              <div>
                <label 
                  htmlFor="gconPieceId" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Gcon Piece ID *
                </label>
                <input
                  type="text"
                  id="gconPieceId"
                  value={gconPieceId}
                  onChange={(e) => setGconPieceId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the UUID of the content piece to enhance"
                  disabled={isCreating}
                  required
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

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isCreating || !gconPieceId.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Session...
                    </span>
                  ) : (
                    'Create New Karma Wizard Session'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">What happens next?</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Step 1</span>
                    <span>Fetch and analyze existing content</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Step 2</span>
                    <span>Generate AI images via API</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Step 3</span>
                    <span>Upload images to WordPress</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Step 4</span>
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
        </div>
      </div>
    </div>
  );
}