'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import GconPiecesTable from "./components/GconPiecesTable";
import { cfunc_215_createpiece } from "./utils/cfunc_215_createpiece";

export default function Gconjar1Page() {
  const [gconPieces, setGconPieces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [kz101Checked, setKz101Checked] = useState(false);
  const [kz103Checked, setKz103Checked] = useState(false);
  const [activePopupTab, setActivePopupTab] = useState<'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7'>('ptab1');
  const [uelBarColors, setUelBarColors] = useState<{bg: string, text: string}>({bg: '#2563eb', text: '#ffffff'});
  const [uelBar37Colors, setUelBar37Colors] = useState<{bg: string, text: string}>({bg: '#1e40af', text: '#ffffff'});
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [selectedGconIds, setSelectedGconIds] = useState<Set<string>>(new Set());
  const [f127Loading, setF127Loading] = useState(false);
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Set document title (simplified to avoid MutationObserver conflicts)
    document.title = 'gconjar1';
    
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
    
    // Add custom styles to make main element full width for this page only
    const style = document.createElement('style');
    style.textContent = `
      body > div.min-h-screen.bg-gray-50 > main {
        margin-left: 8px !important;
        margin-right: 0px !important;
        padding-left: 0px !important;
        padding-right: 0px !important;
        max-width: none !important;
        width: calc(100vw - 8px) !important;
        position: relative !important;
      }
      
      /* Ensure content fills available width on all screen sizes */
      @media (min-width: 1280px) {
        body > div.min-h-screen.bg-gray-50 > main {
          width: calc(100vw - 8px) !important;
        }
      }
      
      /* For ultra-wide monitors (27-inch and larger) */
      @media (min-width: 1920px) {
        body > div.min-h-screen.bg-gray-50 > main {
          width: calc(100vw - 8px) !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Cleanup function to remove the style when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Track URL changes
  useEffect(() => {
    // Initialize URL on mount
    setCurrentUrl(window.location.href);
    
    // Handle URL changes
    const handleUrlChange = () => {
      setCurrentUrl(window.location.href);
    };
    
    // Custom event for URL updates
    const handleCustomUrlUpdate = () => {
      setCurrentUrl(window.location.href);
    };
    
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('urlchange', handleCustomUrlUpdate);
    
    // Use MutationObserver as fallback
    // COMMENTED OUT: This was causing meta title conflicts - interfering with static title assignments
    // The popstate and urlchange events are sufficient for tracking URL changes in the popup
    // const observer = new MutationObserver(() => {
    //   if (window.location.href !== currentUrl) {
    //     setCurrentUrl(window.location.href);
    //   }
    // });
    // 
    // observer.observe(document.querySelector('head') || document.documentElement, {
    //   childList: true,
    //   subtree: true
    // });
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleCustomUrlUpdate);
      // observer.disconnect(); // Commented out since observer is disabled
    };
  }, [currentUrl]);

  useEffect(() => {
    const fetchGconPieces = async () => {
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

        // Fetch user's gcon_pieces data
        const { data: gconPieces, error } = await supabase
          .from("gcon_pieces")
          .select("*")
          .eq("fk_users_id", userData.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching gcon_pieces:", error);
          setError("Error fetching content pieces");
        } else {
          setGconPieces(gconPieces || []);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchGconPieces();
  }, [user?.id, supabase]);

  // Function to refetch data after creating new piece
  const refetchGconPieces = async () => {
    if (!user?.id) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userData) {
        const { data: gconPieces, error } = await supabase
          .from("gcon_pieces")
          .select("*")
          .eq("fk_users_id", userData.id)
          .order("created_at", { ascending: false });

        if (!error && gconPieces) {
          setGconPieces(gconPieces);
        }
      }
    } catch (err) {
      console.error("Error refetching data:", err);
    }
  };

  // Handle create new piece
  const handleCreateNewPiece = async () => {
    if (!user?.id) return;

    setIsCreating(true);
    setNotification(null);

    try {
      const result = await cfunc_215_createpiece(user.id);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: 'New content piece created successfully!'
        });
        // Refetch data to update the table
        await refetchGconPieces();
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to create content piece'
        });
      }
    } catch (error) {
      console.error('Error creating piece:', error);
      setNotification({
        type: 'error',
        message: 'An error occurred while creating the content piece'
      });
    } finally {
      setIsCreating(false);
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  };

  if (!user) {
    return (
      <div className="p-4">
        <div className="text-center">
          <p>Please sign in to view your content pieces.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center">
          <p>Loading content pieces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
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
      const lastTab = localStorage.getItem('gconjar1_lastActiveTab') || 'ptab1';
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
    localStorage.setItem('gconjar1_lastActiveTab', tab); // Remember this tab for next time
    updatePopupURL(true, tab);
  };

  // f127_wipegconpiecesdata handler - delete selected rows
  const handleF127WipeGconPiecesData = async () => {
    let itemsToDelete: string[] = [];
    
    if (kz101Checked) {
      // SOPTION1: Use selected items
      if (selectedGconIds.size === 0) {
        alert('Please select at least one item from the table');
        return;
      }
      itemsToDelete = Array.from(selectedGconIds);
    } else if (kz103Checked) {
      // SOPTION2: Delete all items in current view
      itemsToDelete = gconPieces.map(item => item.id);
    } else {
      alert('Please select SOPTION1 or SOPTION2 first');
      return;
    }

    // Confirmation dialog
    const confirmMessage = kz101Checked 
      ? `Are you sure you want to delete ${itemsToDelete.length} selected gcon_pieces records? This action cannot be undone.`
      : `Are you sure you want to delete ALL ${itemsToDelete.length} gcon_pieces records from the current view? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setF127Loading(true);
    try {
      // Get user's database ID first
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) {
        alert('Error: User not found');
        return;
      }

      // First, set any foreign key references to NULL (don't delete other table records)
      const { error: updateError } = await supabase
        .from('images_plans_batches')
        .update({ asn_gcon_piece_id: null })
        .in('asn_gcon_piece_id', itemsToDelete);

      if (updateError) {
        console.error('Error updating foreign key references:', updateError);
        alert(`Error updating foreign key references: ${updateError.message}`);
        return;
      }

      // Now delete the selected gcon_pieces records
      const { error } = await supabase
        .from('gcon_pieces')
        .delete()
        .eq('fk_users_id', userData.id)
        .in('id', itemsToDelete);

      if (error) {
        console.error('Error deleting gcon_pieces records:', error);
        alert(`Error deleting records: ${error.message}`);
      } else {
        alert(`Successfully deleted ${itemsToDelete.length} gcon_pieces records`);
        
        // Clear selection and refresh data
        setSelectedGconIds(new Set());
        await refetchGconPieces();
      }
    } catch (error) {
      console.error('Error in f127_wipegconpiecesdata:', error);
      alert('An error occurred while deleting the records');
    } finally {
      setF127Loading(false);
    }
  };

  return (
    <div className="pr-4">
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-md ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="mb-6 flex items-center" style={{ gap: '16px' }}>
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
        
        {/* Go Back Button */}
        {hasSitebase && currentSitebase ? (
          <Link
            href={`/nwjar1?coltemp=option1&sitebase=${encodeURIComponent(currentSitebase)}`}
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
            &lt;&lt; go back to /nwjar1
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
            &lt;&lt; go back to /nwjar1
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
                SOPTION1 - Use Your Current Selection From Table | {selectedGconIds.size} rows
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
                SOPTION2 - Select All Items In Current Pagination | {gconPieces.length} rows
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
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        activePopupTab === tab
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
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
                      <button
                        onClick={handleF127WipeGconPiecesData}
                        disabled={f127Loading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedGconIds.size === 0)}
                        className={`px-4 py-2 rounded font-medium ${
                          f127Loading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedGconIds.size === 0)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {f127Loading ? 'Deleting...' : 'f127_wipegconpiecesdata'}
                      </button>
                      
                      {!kz101Checked && !kz103Checked && (
                        <p className="text-sm text-gray-500">
                          Select either SOPTION1 or SOPTION2 to enable functions
                        </p>
                      )}
                      {kz101Checked && selectedGconIds.size === 0 && (
                        <p className="text-sm text-gray-500">
                          SOPTION1 selected: Select items from the table to enable functions
                        </p>
                      )}
                      {kz101Checked && selectedGconIds.size > 0 && (
                        <p className="text-sm text-gray-600">
                          SOPTION1 selected: {selectedGconIds.size} item(s) will be deleted
                        </p>
                      )}
                      {kz103Checked && (
                        <p className="text-sm text-gray-600">
                          SOPTION2 selected: All {gconPieces.length} items will be deleted
                        </p>
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

      <GconPiecesTable 
        initialData={gconPieces} 
        userId={user.id}
        selectedRows={selectedGconIds}
        onSelectionChange={setSelectedGconIds}
      />
    </div>
  );
}