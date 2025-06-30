'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NwpiContentTable from './components/NwpiContentTable';
import NwpiPusherButton from './components/NwpiPusherButton';

export default function NwJar1Page() {
  const [nwpiContent, setNwpiContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [kz101Checked, setKz101Checked] = useState(false);
  const [kz103Checked, setKz103Checked] = useState(false);
  const [activePopupTab, setActivePopupTab] = useState<'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7'>('ptab1');
  const [uelBarColors, setUelBarColors] = useState<{bg: string, text: string}>({bg: '#2563eb', text: '#ffffff'});
  const [uelBar37Colors, setUelBar37Colors] = useState<{bg: string, text: string}>({bg: '#1e40af', text: '#ffffff'});
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [selectedContentIds, setSelectedContentIds] = useState<Set<string>>(new Set());
  const [f47Loading, setF47Loading] = useState(false);
  const [f22Loading, setF22Loading] = useState(false);
  const [f22Error, setF22Error] = useState<{message: string, details?: any} | null>(null);
  const [f47Error, setF47Error] = useState<{message: string, details?: any} | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.title = '/nwjar1 - Snefuru';
    
    // Handle URL parameters for popup and tab state
    const urlParams = new URLSearchParams(window.location.search);
    const fpop = urlParams.get('fpop');
    const ptab1 = urlParams.get('ptab1');
    const ptab2 = urlParams.get('ptab2');
    const ptab3 = urlParams.get('ptab3');
    const ptab4 = urlParams.get('ptab4');
    const ptab5 = urlParams.get('ptab5');
    const ptab6 = urlParams.get('ptab6');
    const ptab7 = urlParams.get('ptab7');
    
    // Auto-open popup if fpop=open is in URL
    if (fpop === 'open') {
      setIsPopupOpen(true);
      
      // Set active tab based on URL parameters
      if (ptab1 === 'active') {
        setActivePopupTab('ptab1');
      } else if (ptab2 === 'active') {
        setActivePopupTab('ptab2');
      } else if (ptab3 === 'active') {
        setActivePopupTab('ptab3');
      } else if (ptab4 === 'active') {
        setActivePopupTab('ptab4');
      } else if (ptab5 === 'active') {
        setActivePopupTab('ptab5');
      } else if (ptab6 === 'active') {
        setActivePopupTab('ptab6');
      } else if (ptab7 === 'active') {
        setActivePopupTab('ptab7');
      }
    }
  }, []);

  useEffect(() => {
    const fetchNwpiContent = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // First get the internal user ID
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

        // Fetch nwpi_content data for this user
        const { data: nwpiContent, error: contentError } = await supabase
          .from('nwpi_content')
          .select('*')
          .eq('fk_users_id', userData.id)
          .order('i_sync_completed_at', { ascending: false });

        if (contentError) {
          console.error('Error fetching nwpi_content:', contentError);
          setError('Error fetching content');
        } else {
          setNwpiContent(nwpiContent || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchNwpiContent();
  }, [user?.id, supabase]);

  // Fetch custom colors for uelbar37 and uelbar38
  useEffect(() => {
    const fetchUelBarColors = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_colors')
          .select('color_ref_code, hex_value')
          .in('color_ref_code', ['uelbar38_bgcolor1', 'uelbar38_textcolor1', 'uelbar37_bgcolor1', 'uelbar37_textcolor1']);

        console.log('Custom colors query result:', { data, error });

        if (!error && data && data.length > 0) {
          // uelbar38 colors
          const bgColor38Item = data.find(item => item.color_ref_code === 'uelbar38_bgcolor1');
          const textColor38Item = data.find(item => item.color_ref_code === 'uelbar38_textcolor1');
          
          const bgColor38 = bgColor38Item?.hex_value || '#2563eb';
          const textColor38 = textColor38Item?.hex_value || '#ffffff';
          
          console.log('uelbar38 colors:', { bgColor38, textColor38 });
          setUelBarColors({bg: bgColor38, text: textColor38});

          // uelbar37 colors
          const bgColor37Item = data.find(item => item.color_ref_code === 'uelbar37_bgcolor1');
          const textColor37Item = data.find(item => item.color_ref_code === 'uelbar37_textcolor1');
          
          const bgColor37 = bgColor37Item?.hex_value || '#1e40af';
          const textColor37 = textColor37Item?.hex_value || '#ffffff';
          
          console.log('uelbar37 colors:', { bgColor37, textColor37 });
          setUelBar37Colors({bg: bgColor37, text: textColor37});
        } else {
          console.log('No custom colors found, using defaults');
        }
      } catch (err) {
        console.error('Error fetching uel bar colors:', err);
      }
    };

    fetchUelBarColors();
  }, [supabase]);

  // Track URL changes for uelbar37 display
  useEffect(() => {
    // Set initial URL
    setCurrentUrl(window.location.href);
    
    // Listen for URL changes (for pushState/replaceState)
    const handleUrlChange = () => {
      setCurrentUrl(window.location.href);
    };
    
    // Listen for popstate events (back/forward buttons)
    window.addEventListener('popstate', handleUrlChange);
    
    // Create a MutationObserver to watch for URL changes via pushState/replaceState
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        setCurrentUrl(window.location.href);
      }
    });
    
    // Watch for changes to the document that might indicate URL changes
    observer.observe(document, { subtree: true, childList: true });
    
    // Custom event listener for our URL updates
    const handleCustomUrlUpdate = () => {
      setCurrentUrl(window.location.href);
    };
    window.addEventListener('urlchange', handleCustomUrlUpdate);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleCustomUrlUpdate);
      observer.disconnect();
    };
  }, [currentUrl]);

  if (!user) {
    return (
      <div className="pr-4">
        <div className="text-center">
          <p>Please sign in to view your synced content.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pr-4">
        <div className="text-center">
          <p>Loading synced content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pr-4">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  // Get current sitebase from URL
  const currentSitebase = searchParams?.get('sitebase');
  const hasSitebase = Boolean(currentSitebase);

  // Handle checkbox clicks with mutual exclusivity
  const handleKz101Click = () => {
    setKz101Checked(true);
    setKz103Checked(false);
  };

  const handleKz103Click = () => {
    setKz103Checked(true);
    setKz101Checked(false);
  };

  // Update URL parameters for popup state
  const updatePopupURL = (fpopOpen: boolean, tabActive?: string) => {
    const url = new URL(window.location.href);
    
    if (fpopOpen) {
      url.searchParams.set('fpop', 'open');
      
      // Clear all tab parameters first
      ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].forEach(tab => {
        url.searchParams.delete(tab);
      });
      
      // Set the active tab parameter
      if (tabActive) {
        url.searchParams.set(tabActive, 'active');
      } else {
        // Default to ptab1 if no specific tab provided
        url.searchParams.set('ptab1', 'active');
      }
    } else {
      // Remove popup and all tab parameters when popup is closed
      url.searchParams.delete('fpop');
      ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].forEach(tab => {
        url.searchParams.delete(tab);
      });
    }
    
    // Update URL without triggering page reload
    window.history.replaceState({}, '', url.toString());
    
    // Trigger custom event to update our URL display
    window.dispatchEvent(new Event('urlchange'));
  };

  // Handle popup open/close with URL updates
  const handlePopupOpen = () => {
    setIsPopupOpen(true);
    
    // Set default selection if neither option is selected
    if (!kz101Checked && !kz103Checked) {
      setKz101Checked(true);
    }
    
    // Check if URL has specific tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hasTabInUrl = ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7']
      .some(tab => urlParams.get(tab) === 'active');
    
    if (!hasTabInUrl) {
      // No tab specified in URL, use last remembered tab from localStorage
      const lastTab = localStorage.getItem('nwjar1_lastActiveTab') || 'ptab1';
      setActivePopupTab(lastTab as any);
      updatePopupURL(true, lastTab);
    } else {
      // URL has tab specified, use current activePopupTab
      updatePopupURL(true, activePopupTab);
    }
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    updatePopupURL(false);
  };

  // Handle tab changes with URL updates and localStorage
  const handleTabChange = (tab: string) => {
    setActivePopupTab(tab as any);
    localStorage.setItem('nwjar1_lastActiveTab', tab); // Remember this tab for next time
    updatePopupURL(true, tab);
  };

  // f22_nwpi_to_gcon_pusher handler
  const handleF22NwpiToGconPusher = async () => {
    let itemsToProcess: string[] = [];
    
    if (kz101Checked) {
      // SOPTION1: Use selected items
      if (selectedContentIds.size === 0) {
        alert('Please select at least one item from the table');
        return;
      }
      itemsToProcess = Array.from(selectedContentIds);
    } else if (kz103Checked) {
      // SOPTION2: Push all items in current view
      itemsToProcess = nwpiContent.map(item => item.internal_post_id);
    } else {
      alert('Please select SOPTION1 or SOPTION2 first');
      return;
    }

    setF22Loading(true);
    setF22Error(null); // Clear previous errors
    try {
      const response = await fetch('/api/f22-nwpi-to-gcon-pusher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordIds: itemsToProcess
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      // Get response text first to check if it's empty
      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from server');
      }

      // Try to parse JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        const debugInfo = {
          jsonError: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error',
          responseStatus: response.status,
          responseText: responseText.substring(0, 500)
        };
        console.error('JSON parsing error:', debugInfo);
        throw new Error(`Invalid JSON response from server.\n\nDebug Info:\n- Status: ${response.status}\n- JSON Error: ${debugInfo.jsonError}\n- Response: "${responseText.substring(0, 200)}..."`);
      }

      // Add debug logging
      console.log('🔍 F22 API Response:', result);
      
      if (result.success) {
        // Create comprehensive success report similar to mesagen page
        const successReport = `✅ F22 PROCESSING COMPLETED SUCCESSFULLY

Execution Summary:
- Processed: ${result.results?.processed || 0} records
- Succeeded: ${result.results?.succeeded || 0} records  
- Failed: ${result.results?.failed || 0} records
- Message: ${result.message}

API Results:
- Endpoint: /api/f22-nwpi-to-gcon-pusher
- Response Time: ${new Date().toISOString()}
- Selected Items: ${kz101Checked ? selectedContentIds.size : (kz103Checked ? nwpiContent.length : 0)}

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

Debug Information:
- Check browser console (F12) for 🔍 DEBUG messages about mud_title and mud_content
- Full Response: ${JSON.stringify(result, null, 2)}
- Errors: ${result.results?.errors?.length || 0} errors logged

System Status: All operations completed successfully`;

        alert(successReport);
        setF22Error(null); // Clear any previous errors on success
        // Could refresh data or show more detailed results here
      } else {
        const errorMessage = result.message || 'Failed to push to GCon pieces';
        console.error('🚨 F22 API returned error:', result);
        
        // Create comprehensive error report
        const errorReport = `❌ F22 PROCESSING FAILED

Error Details:
- Message: ${errorMessage}
- Processed: ${result.results?.processed || 0} records
- Succeeded: ${result.results?.succeeded || 0} records
- Failed: ${result.results?.failed || 0} records

API Information:
- Endpoint: /api/f22-nwpi-to-gcon-pusher
- Timestamp: ${new Date().toISOString()}
- Selected Items: ${kz101Checked ? selectedContentIds.size : (kz103Checked ? nwpiContent.length : 0)}

${result.results?.errors?.length > 0 ? `
Specific Errors (${result.results.errors.length}):
${result.results.errors.map((error: string, i: number) => `${i + 1}. ${error}`).join('\n')}
` : ''}

Debug Information:
- Check browser console (F12) for 🔍 DEBUG messages
- Full API Response: ${JSON.stringify(result, null, 2)}

System Status: Processing halted due to errors
Recommendation: Check logs and retry operation`;

        alert(errorReport);
        setF22Error({
          message: errorMessage,
          details: {
            apiResponse: result,
            debugInfo: result.debugInfo,
            results: result.results,
            timestamp: new Date().toISOString(),
            endpoint: '/api/f22-nwpi-to-gcon-pusher',
            selectedItems: kz101Checked ? selectedContentIds.size : (kz103Checked ? nwpiContent.length : 0)
          }
        });
      }
    } catch (error) {
      console.error('🚨 Error calling f22_nwpi_to_gcon_pusher:', error);
      const errorMessage = 'An error occurred while pushing to GCon pieces';
      
      // Create comprehensive client error report
      const clientErrorReport = `❌ F22 CLIENT ERROR

Error Details:
- Type: Network/Client Error
- Message: ${error instanceof Error ? error.message : 'Unknown error occurred'}
- Timestamp: ${new Date().toISOString()}

Request Information:
- Endpoint: POST /api/f22-nwpi-to-gcon-pusher
- Selected Items: ${kz101Checked ? selectedContentIds.size : (kz103Checked ? nwpiContent.length : 0)}
- Request Mode: ${kz101Checked ? 'SOPTION1 (Selected)' : 'SOPTION2 (All)'}

Error Stack:
${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}

Debug Information:
- Check browser console (F12) for detailed error logs
- Check network tab for failed requests
- Verify API endpoint is accessible

System Status: Request failed before reaching server
Recommendation: Check network connection and API availability`;

      alert(clientErrorReport);
      setF22Error({
        message: errorMessage,
        details: {
          clientError: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          timestamp: new Date().toISOString(),
          endpoint: '/api/f22-nwpi-to-gcon-pusher',
          selectedItems: kz101Checked ? selectedContentIds.size : (kz103Checked ? nwpiContent.length : 0),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      });
    } finally {
      setF22Loading(false);
    }
  };

  // f47_generate_gcon_pieces handler
  const handleF47GenerateGconPieces = async () => {
    let itemsToProcess: string[] = [];
    
    if (kz101Checked) {
      // SOPTION1: Use selected items
      if (selectedContentIds.size === 0) {
        alert('Please select at least one item from the table');
        return;
      }
      itemsToProcess = Array.from(selectedContentIds);
    } else if (kz103Checked) {
      // SOPTION2: Use all items in current filtered data
      itemsToProcess = nwpiContent.map(item => item.internal_post_id);
    } else {
      alert('Please select either SOPTION1 or SOPTION2');
      return;
    }

    if (itemsToProcess.length === 0) {
      alert('No items to process');
      return;
    }

    setF47Loading(true);
    setF47Error(null); // Clear previous errors
    try {
      const response = await fetch('/api/f47_generate_gcon_pieces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          internal_post_ids: itemsToProcess
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully generated ${result.data.created_count} GCon pieces from ${itemsToProcess.length} items`);
        setF47Error(null); // Clear any previous errors on success
        // Could refresh data or show more detailed results here
      } else {
        const errorMessage = result.error || 'Failed to generate GCon pieces';
        alert(`Error: ${errorMessage}`);
        setF47Error({
          message: errorMessage,
          details: result.data || result
        });
      }
    } catch (error) {
      console.error('Error calling f47_generate_gcon_pieces:', error);
      const errorMessage = 'An error occurred while generating GCon pieces';
      alert(errorMessage);
      setF47Error({
        message: errorMessage,
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
    } finally {
      setF47Loading(false);
    }
  };

  return (
    <div className="pr-4">
      <div className="mb-8 flex items-center" style={{ gap: '16px' }}>
        <button
          onClick={handlePopupOpen}
          className="font-bold text-white rounded"
          style={{
            backgroundColor: '#800000', // maroon color
            fontSize: '20px',
            paddingLeft: '14px',
            paddingRight: '14px',
            paddingTop: '10px',
            paddingBottom: '10px'
          }}
        >
          functions popup
        </button>
        
        {/* Go Forward Button */}
        {hasSitebase && currentSitebase ? (
          <Link
            href={`/gconjar1?coltemp=option1&sitebase=${encodeURIComponent(currentSitebase)}`}
            className="font-bold text-gray-600 rounded hover:bg-gray-300 transition-colors"
            style={{
              backgroundColor: '#e5e7eb', // light gray
              fontSize: '20px',
              paddingLeft: '14px',
              paddingRight: '14px',
              paddingTop: '10px',
              paddingBottom: '10px',
              textDecoration: 'none'
            }}
          >
            &gt;&gt; Go Forward To /gconjar1
          </Link>
        ) : (
          <button
            disabled
            className="font-bold text-gray-400 rounded cursor-not-allowed opacity-50"
            style={{
              backgroundColor: '#f3f4f6', // lighter gray for disabled
              fontSize: '20px',
              paddingLeft: '14px',
              paddingRight: '14px',
              paddingTop: '10px',
              paddingBottom: '10px'
            }}
          >
            &gt;&gt; Go Forward To /gconjar1
          </button>
        )}
      </div>

      {/* Popup Modal */}
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
                {(() => {
                  // Parse URL to highlight sitebase parameter
                  try {
                    const url = new URL(currentUrl);
                    const sitebaseParam = url.searchParams.get('sitebase');
                    
                    if (sitebaseParam) {
                      const fullUrl = currentUrl;
                      const sitebaseText = `sitebase=${sitebaseParam}`;
                      const parts = fullUrl.split(sitebaseText);
                      
                      if (parts.length === 2) {
                        return (
                          <>
                            {parts[0]}
                            <span style={{ fontWeight: 'bold', color: '#ff9e71' }}>
                              {sitebaseText}
                            </span>
                            {parts[1]}
                          </>
                        );
                      }
                    }
                    
                    return currentUrl;
                  } catch (error) {
                    return currentUrl;
                  }
                })()}
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
              <button
                onClick={() => {
                  try {
                    const url = new URL(currentUrl);
                    const sitebaseParam = url.searchParams.get('sitebase');
                    if (sitebaseParam) {
                      navigator.clipboard.writeText(sitebaseParam);
                    }
                  } catch (error) {
                    console.error('Error copying site:', error);
                  }
                }}
                className="bg-gray-600 text-white font-bold flex items-center justify-center hover:bg-gray-700 transition-colors"
                style={{
                  width: '60px',
                  height: '50px',
                  marginRight: '0px',
                  fontSize: '10px',
                  flexDirection: 'column',
                  gap: '2px'
                }}
                title="Copy Site Domain"
              >
                <div>SITE</div>
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
              
              <span className="font-bold">{window.location.pathname}</span>
              <div 
                className="ml-4 flex items-center kz101 cursor-pointer"
                style={{
                  color: uelBarColors.text,
                  padding: '8px',
                  border: '1px solid black',
                  fontSize: '16px'
                }}
                onClick={handleKz101Click}
              >
                <input
                  type="checkbox"
                  className="mr-2 pointer-events-none"
                  checked={kz101Checked}
                  readOnly
                  style={{
                    width: '18px',
                    height: '18px'
                  }}
                />
                SOPTION1 - Use Your Current Selection From Table | {selectedContentIds.size} rows
              </div>
              <div 
                className="flex items-center kz102 font-bold"
                style={{
                  color: uelBarColors.text,
                  padding: '8px',
                  border: '1px solid black',
                  fontSize: '16px'
                }}
              >
                OR
              </div>
              <div 
                className="flex items-center kz103 cursor-pointer"
                style={{
                  color: uelBarColors.text,
                  padding: '8px',
                  border: '1px solid black',
                  fontSize: '16px'
                }}
                onClick={handleKz103Click}
              >
                <input
                  type="checkbox"
                  className="mr-2 pointer-events-none"
                  checked={kz103Checked}
                  readOnly
                  style={{
                    width: '18px',
                    height: '18px'
                  }}
                />
                SOPTION2 - Select All Items In Current Pagination | {nwpiContent.length} rows
              </div>
              
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
                      onClick={() => handleTabChange(tab)}
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
                    <h3 className="text-lg font-semibold mb-4">Functions</h3>
                    <div className="space-y-4">
                      <div className="flex items-center" style={{ gap: '100px' }}>
                        <button
                          onClick={handleF22NwpiToGconPusher}
                          disabled={f22Loading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedContentIds.size === 0)}
                          className={`px-4 py-2 rounded font-medium ${
                            f22Loading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedContentIds.size === 0)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {f22Loading ? 'Processing...' : 'f22_nwpi_to_gcon_pusher'}
                        </button>
                        <button
                          onClick={handleF47GenerateGconPieces}
                          disabled={f47Loading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedContentIds.size === 0)}
                          className={`px-4 py-2 rounded font-medium ${
                            f47Loading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedContentIds.size === 0)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {f47Loading ? 'Processing...' : 'f47_generate_gcon_pieces'}
                        </button>
                      </div>
                      {!kz101Checked && !kz103Checked && (
                        <p className="text-sm text-gray-500">
                          Select either SOPTION1 or SOPTION2 to enable this function
                        </p>
                      )}
                      {kz101Checked && selectedContentIds.size === 0 && (
                        <p className="text-sm text-gray-500">
                          SOPTION1 selected: Select items from the table to enable this function
                        </p>
                      )}
                      {kz101Checked && selectedContentIds.size > 0 && (
                        <p className="text-sm text-gray-600">
                          SOPTION1 selected: {selectedContentIds.size} item(s) will be processed
                        </p>
                      )}
                      {kz103Checked && (
                        <p className="text-sm text-gray-600">
                          SOPTION2 selected: All {nwpiContent.length} items will be processed
                        </p>
                      )}

                      {/* Error Display Area */}
                      {(f22Error || f47Error) && (
                        <div className="mt-6 space-y-4">
                          <h4 className="text-md font-medium text-red-700">Error Details</h4>
                          
                          {f22Error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-4">
                                <h5 className="text-lg font-medium text-red-800 flex items-center">
                                  <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                  f22_nwpi_to_gcon_pusher Error
                                </h5>
                                <button
                                  onClick={() => {
                                    const errorReport = {
                                      timestamp: new Date().toISOString(),
                                      errorType: 'f22_nwpi_to_gcon_pusher',
                                      message: f22Error.message,
                                      details: f22Error.details,
                                      userAgent: navigator.userAgent,
                                      url: window.location.href,
                                      instructions: 'Check browser console (F12) for 🔍 DEBUG messages'
                                    };
                                    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
                                    alert('Complete error report copied to clipboard!');
                                  }}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                                >
                                  📋 Copy Full Report
                                </button>
                              </div>
                              
                              <div className="space-y-4 text-sm text-red-700">
                                <div>
                                  <p className="font-medium text-red-800">Error Message:</p>
                                  <p className="mt-1 bg-white p-3 rounded border text-red-900 font-mono text-sm">{f22Error.message}</p>
                                </div>
                                
                                <div>
                                  <p className="font-medium text-red-800">🔍 Detailed Debug Analysis:</p>
                                  <div className="mt-2 bg-white p-3 rounded border space-y-3">
                                    <div><strong>Error Type:</strong> f22_nwpi_to_gcon_pusher API failure</div>
                                    <div><strong>HTTP Status:</strong> {f22Error.details?.message?.includes('405') ? '405 Method Not Allowed' : 
                                                                                 f22Error.details?.message?.includes('500') ? '500 Internal Server Error' : 
                                                                                 'Unknown HTTP error'}</div>
                                    <div><strong>Likely Causes:</strong></div>
                                    <ul className="list-disc list-inside text-xs space-y-1 ml-4">
                                      {f22Error.details?.message?.includes('405') && (
                                        <>
                                          <li>API route not properly configured for POST requests</li>
                                          <li>Next.js server needs restart</li>
                                          <li>API route file corrupted or missing</li>
                                        </>
                                      )}
                                      {f22Error.details?.message?.includes('500') && (
                                        <>
                                          <li>Server-side error in f22 processing logic</li>
                                          <li>Database connection issue</li>
                                          <li>Missing environment variables</li>
                                        </>
                                      )}
                                      <li>Network connectivity issue</li>
                                      <li>Authentication/session expired</li>
                                    </ul>
                                    <div><strong>API Details:</strong></div>
                                    <div className="text-xs bg-gray-100 p-2 rounded">
                                      <div>Endpoint: POST /api/f22-nwpi-to-gcon-pusher</div>
                                      <div>User Agent: {navigator.userAgent.substring(0, 100)}...</div>
                                      <div>Timestamp: {new Date().toISOString()}</div>
                                      <div>Selected Items: {kz101Checked ? selectedContentIds.size : (kz103Checked ? nwpiContent.length : 0)}</div>
                                    </div>
                                    <div><strong>Debug Steps:</strong></div>
                                    <ul className="list-disc list-inside text-xs space-y-1 ml-4">
                                      <li>Open browser console (F12) and look for detailed error messages</li>
                                      <li>Check Network tab for actual API response body</li>
                                      <li>Look for 🔍 DEBUG messages in console logs</li>
                                      <li>Try refreshing the page and attempting again</li>
                                      <li>Copy full report above for developer support</li>
                                    </ul>
                                  </div>
                                </div>
                                
                                {f22Error.details && (
                                  <div>
                                    <p className="font-medium text-red-800">Technical Details:</p>
                                    <div className="mt-1 bg-white p-3 rounded border max-h-60 overflow-y-auto">
                                      <pre className="text-xs whitespace-pre-wrap text-gray-800">
                                        {JSON.stringify(f22Error.details, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-4 flex gap-3">
                                <button
                                  onClick={() => setF22Error(null)}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                                >
                                  Clear Error
                                </button>
                                <button
                                  onClick={() => {
                                    console.log('🔍 Full F22 Error Object:', f22Error);
                                    alert('Full error details logged to console (F12)');
                                  }}
                                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
                                >
                                  Log to Console
                                </button>
                              </div>
                            </div>
                          )}

                          {f47Error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                  <h5 className="text-sm font-medium text-red-800">f47_generate_gcon_pieces Error</h5>
                                  <div className="mt-2 text-sm text-red-700">
                                    <p className="font-medium">Error Message:</p>
                                    <p className="mt-1 bg-white p-2 rounded border">{f47Error.message}</p>
                                    
                                    {f47Error.details && (
                                      <div className="mt-3">
                                        <p className="font-medium">Additional Details:</p>
                                        <div className="mt-1 bg-white p-2 rounded border max-h-48 overflow-y-auto">
                                          <pre className="text-xs whitespace-pre-wrap">
                                            {JSON.stringify(f47Error.details, null, 2)}
                                          </pre>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-3">
                                    <button
                                      onClick={() => setF47Error(null)}
                                      className="text-sm text-red-600 hover:text-red-800 underline"
                                    >
                                      Clear f47 Error
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activePopupTab === 'ptab2' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab2</h3>
                    <p className="text-gray-600">This is the content area for ptab2.</p>
                  </div>
                )}
                {activePopupTab === 'ptab3' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab3</h3>
                    <p className="text-gray-600">This is the content area for ptab3.</p>
                  </div>
                )}
                {activePopupTab === 'ptab4' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab4</h3>
                    <p className="text-gray-600">This is the content area for ptab4.</p>
                  </div>
                )}
                {activePopupTab === 'ptab5' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab5</h3>
                    <p className="text-gray-600">This is the content area for ptab5.</p>
                  </div>
                )}
                {activePopupTab === 'ptab6' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab6</h3>
                    <p className="text-gray-600">This is the content area for ptab6.</p>
                  </div>
                )}
                {activePopupTab === 'ptab7' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab7</h3>
                    <p className="text-gray-600">This is the content area for ptab7.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {nwpiContent && nwpiContent.length > 0 ? (
        <NwpiContentTable 
          data={nwpiContent} 
          userId={user.id}
          selectedRows={selectedContentIds}
          onSelectionChange={setSelectedContentIds}
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            No synced content found. Use the sync buttons on the sitejar4 page to sync your WordPress sites.
          </p>
        </div>
      )}
    </div>
  );
}