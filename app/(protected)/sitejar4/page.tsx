'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import SitesprenTable from './components/SitesprenTable';
import { cfunc_f71_createsite } from './utils/cfunc_f71_createsite';

export default function Sitejar4Page() {
  const [sitesprenData, setSitesprenData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const [debugExpanded, setDebugExpanded] = useState(false);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteNotification, setDeleteNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [kz101Checked, setKz101Checked] = useState(false);
  const [kz103Checked, setKz103Checked] = useState(false);
  const [activePopupTab, setActivePopupTab] = useState<'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7'>('ptab1');
  const [uelBarColors, setUelBarColors] = useState<{bg: string, text: string}>({bg: '#2563eb', text: '#ffffff'});
  const [uelBar37Colors, setUelBar37Colors] = useState<{bg: string, text: string}>({bg: '#1e40af', text: '#ffffff'});
  const [currentUrl, setCurrentUrl] = useState<string>('');
  // F71 Create Site Form state
  const [sitesList, setSitesList] = useState('');
  const [isSubmittingF71, setIsSubmittingF71] = useState(false);
  const [f71Notification, setF71Notification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [tagsData, setTagsData] = useState<any>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Set document title
    document.title = 'sitejar';
    
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

  // Initialize search term from URL parameter
  useEffect(() => {
    const searchsite = searchParams?.get('searchsite');
    if (searchsite) {
      setSearchTerm(searchsite);
    }
  }, [searchParams]);

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
    // COMMENTED OUT: This was causing navigation link issues - preventing normal clicks from working
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

  // Update URL when search term changes
  const updateSearchInURL = (newSearchTerm: string) => {
    const url = new URL(window.location.href);
    if (newSearchTerm.trim()) {
      url.searchParams.set('searchsite', newSearchTerm.trim());
    } else {
      url.searchParams.delete('searchsite');
    }
    router.replace(url.pathname + url.search, { scroll: false });
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    updateSearchInURL(newValue);
  };

  // Filter sitespren data based on search term
  const filteredSitesprenData = sitesprenData.filter(site => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      site.sitespren_base?.toLowerCase().includes(searchLower) ||
      site.true_root_domain?.toLowerCase().includes(searchLower) ||
      site.full_subdomain?.toLowerCase().includes(searchLower) ||
      site.webproperty_type?.toLowerCase().includes(searchLower) ||
      site.id?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    const fetchSitesprenData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // First get the internal user ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (userError || !userData) {
          setError('User not found');
          setLoading(false);
          return;
        }

        setUserInternalId(userData.id);

        // Fetch user's sitespren data via API (bypasses RLS)
        console.log('Fetching sitespren data for user ID:', userData.id);
        
        const response = await fetch(`/api/get_sitespren_data?user_internal_id=${userData.id}`);
        const result = await response.json();

        console.log('API fetch result:', result);

        if (result.success) {
          console.log('Setting sitespren data:', result.data);
          setSitesprenData(result.data || []);
        } else {
          console.error('Error fetching sitespren:', result.error);
          setError('Error fetching sites data');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSitesprenData();
  }, [user?.id, supabase]);

  // Function to refetch data after creating new sites
  const refetchSitesprenData = async () => {
    console.log('Refetching data...', { userId: user?.id, userInternalId });
    
    if (!user?.id || !userInternalId) {
      console.log('Missing user data for refetch');
      return;
    }

    try {
      const response = await fetch(`/api/get_sitespren_data?user_internal_id=${userInternalId}`);
      const result = await response.json();

      console.log('Refetch API result:', result);

      if (result.success) {
        console.log('Setting new data:', result.data);
        setSitesprenData(result.data || []);
      } else {
        console.error('Error in refetch:', result.error);
      }
    } catch (err) {
      console.error('Error refetching data:', err);
    }
  };

  // Handle selection change from table
  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedSiteIds(selectedIds);
  };

  // f71_createsite function
  const handleF71Submit = async () => {
    if (!sitesList.trim()) {
      setF71Notification({
        type: 'error',
        message: 'Please enter at least one site URL'
      });
      return;
    }

    if (!userInternalId) {
      setF71Notification({
        type: 'error',
        message: 'User verification failed'
      });
      return;
    }

    setIsSubmittingF71(true);
    setF71Notification(null);

    try {
      const result = await cfunc_f71_createsite(userInternalId, sitesList);
      
      if (result.success) {
        console.log('Sites created successfully, calling refetchSitesprenData()');
        setF71Notification({
          type: 'success',
          message: `Successfully created ${result.data?.sitesCreated} site(s)!`
        });
        setSitesList(''); // Clear the textarea
        await refetchSitesprenData(); // Refresh the table
      } else {
        setF71Notification({
          type: 'error',
          message: result.error || 'Failed to create sites'
        });
      }
    } catch (error) {
      console.error('Error creating sites:', error);
      setF71Notification({
        type: 'error',
        message: 'An error occurred while creating sites'
      });
    } finally {
      setIsSubmittingF71(false);
      // Clear notification after 5 seconds
      setTimeout(() => setF71Notification(null), 5000);
    }
  };

  // f18_deletesites function
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
      const lastTab = localStorage.getItem('sitejar4_lastActiveTab') || 'ptab1';
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
    localStorage.setItem('sitejar4_lastActiveTab', tab); // Remember this tab for next time
    updatePopupURL(true, tab);
  };

  // Handle tags data from SitesprenTable
  const handleTagsUpdate = (newTagsData: any) => {
    setTagsData(newTagsData);
  };

  const f18_deletesites = async () => {
    if (selectedSiteIds.length === 0) {
      setDeleteNotification({
        type: 'error',
        message: 'Please select at least one site to delete'
      });
      return;
    }

    if (!userInternalId) {
      setDeleteNotification({
        type: 'error',
        message: 'User verification failed'
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedSiteIds.length} selected site(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteNotification(null);

    try {
      const response = await fetch('/api/f18_deletesites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_ids: selectedSiteIds,
          user_internal_id: userInternalId
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDeleteNotification({
          type: 'success',
          message: `Successfully deleted ${result.data?.deletedCount || 0} site(s)`
        });
        setSelectedSiteIds([]); // Clear selection
        await refetchSitesprenData(); // Refresh the table
      } else {
        setDeleteNotification({
          type: 'error',
          message: result.error || 'Failed to delete sites'
        });
      }
    } catch (error) {
      console.error('Error deleting sites:', error);
      setDeleteNotification({
        type: 'error',
        message: 'An error occurred while deleting sites'
      });
    } finally {
      setIsDeleting(false);
      // Clear notification after 5 seconds
      setTimeout(() => setDeleteNotification(null), 5000);
    }
  };

  if (!user) {
    return (
      <div className="pr-4">
        <div className="text-center">
          <p>Please sign in to manage your sites.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pr-4">
        <div className="text-center">
          <p>Loading sites data...</p>
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

  return (
    <div className="pr-4">

      {/* Functions popup button */}
      <div className="mb-4">
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
      </div>

      {/* Delete notification */}
      {deleteNotification && (
        <div className={`mb-4 p-4 rounded-md ${
          deleteNotification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {deleteNotification.message}
        </div>
      )}



      {/* Debug Info */}
      <div className="mb-4 bg-yellow-100 border border-yellow-400 rounded overflow-hidden">
        <div 
          className="flex items-center justify-between p-2 cursor-pointer hover:bg-yellow-200"
          onClick={() => setDebugExpanded(!debugExpanded)}
        >
          <h3 className="font-bold text-sm">Debug Info (Count: {sitesprenData.length})</h3>
          <button className="text-yellow-800 hover:text-yellow-900">
            {debugExpanded ? '−' : '+'}
          </button>
        </div>
        {debugExpanded && (
          <div className="p-4 pt-0 border-t border-yellow-300">
            <div className="space-y-1 text-sm">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Internal User ID:</strong> {userInternalId}</p>
              <p><strong>Total Sites:</strong> {sitesprenData.length}</p>
              <p><strong>Filtered Sites:</strong> {filteredSitesprenData.length}</p>
              <p><strong>Search Term:</strong> {searchTerm || '(none)'}</p>
              <div>
                <strong>Data:</strong>
                <pre className="mt-1 text-xs bg-yellow-50 p-2 rounded border overflow-x-auto">
                  {JSON.stringify(sitesprenData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
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
                  // Parse URL to highlight searchsite parameter
                  try {
                    const url = new URL(currentUrl);
                    const searchsiteParam = url.searchParams.get('searchsite');
                    
                    if (searchsiteParam) {
                      const fullUrl = currentUrl;
                      const searchsiteText = `searchsite=${searchsiteParam}`;
                      const parts = fullUrl.split(searchsiteText);
                      
                      if (parts.length === 2) {
                        return (
                          <>
                            {parts[0]}
                            <span style={{ fontWeight: 'bold', color: '#ff9e71' }}>
                              {searchsiteText}
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
                    const searchsiteParam = url.searchParams.get('searchsite');
                    if (searchsiteParam) {
                      navigator.clipboard.writeText(searchsiteParam);
                    }
                  } catch (error) {
                    console.error('Error copying search term:', error);
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
                title="Copy Search Term"
              >
                <div>SEARCH</div>
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
                SOPTION1 - Use Your Current Selection From Table | {selectedSiteIds.length} rows
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
                SOPTION2 - Select All Items In Current Pagination | {filteredSitesprenData.length} rows
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
                    
                    {/* F71 Create Site Form */}
                    <div className="mb-8 bg-white p-6 rounded-lg shadow border">
                      <h2 className="text-xl font-semibold mb-4">Add New Sites</h2>
                      
                      {/* F71 Notification */}
                      {f71Notification && (
                        <div className={`mb-4 p-4 rounded-md ${
                          f71Notification.type === 'success' 
                            ? 'bg-green-100 border border-green-400 text-green-700' 
                            : 'bg-red-100 border border-red-400 text-red-700'
                        }`}>
                          {f71Notification.message}
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label htmlFor="sites-list-popup" className="block text-sm font-medium text-gray-700 mb-2">
                            Enter web properties (one per line)
                          </label>
                          <textarea
                            id="sites-list-popup"
                            value={sitesList}
                            onChange={(e) => setSitesList(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={6}
                            placeholder={`dogs.com
cats.com
facebook.com/catsgroup
https://linkedin.com/cats
http://www.drogs.com`}
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            URLs will be automatically cleaned (https://, http://, and www. will be removed)
                          </p>
                        </div>

                        <button
                          onClick={handleF71Submit}
                          disabled={isSubmittingF71}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-md transition-colors"
                        >
                          {isSubmittingF71 ? 'Creating Sites...' : 'f71_createsite'}
                        </button>
                      </div>
                    </div>

                    {/* Other Functions */}
                    <div className="space-y-4">
                      <p className="text-gray-600">Other functions for sitespren will be added here.</p>
                      {!kz101Checked && !kz103Checked && (
                        <p className="text-sm text-gray-500">
                          Select either SOPTION1 or SOPTION2 to enable functions
                        </p>
                      )}
                      {kz101Checked && selectedSiteIds.length === 0 && (
                        <p className="text-sm text-gray-500">
                          SOPTION1 selected: Select items from the table to enable functions
                        </p>
                      )}
                      {kz101Checked && selectedSiteIds.length > 0 && (
                        <p className="text-sm text-gray-600">
                          SOPTION1 selected: {selectedSiteIds.length} item(s) will be processed
                        </p>
                      )}
                      {kz103Checked && (
                        <p className="text-sm text-gray-600">
                          SOPTION2 selected: All {filteredSitesprenData.length} items will be processed
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {activePopupTab === 'ptab2' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Delete Sites</h3>
                    
                    {/* Delete notification */}
                    {deleteNotification && (
                      <div className={`mb-4 p-4 rounded-md ${
                        deleteNotification.type === 'success' 
                          ? 'bg-green-100 border border-green-400 text-green-700' 
                          : 'bg-red-100 border border-red-400 text-red-700'
                      }`}>
                        {deleteNotification.message}
                      </div>
                    )}
                    
                    {/* Bulk Delete Actions */}
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-red-800">
                          Delete Selected Sites
                        </h3>
                        <p className="text-sm text-red-600 mt-2">
                          This action will permanently delete the selected sites. This cannot be undone.
                        </p>
                      </div>
                      
                      {/* Selection Info */}
                      <div className="mb-4 p-3 bg-white rounded border border-red-300">
                        <div className="text-sm">
                          {kz101Checked && (
                            <p className="font-medium">
                              SOPTION1: {selectedSiteIds.length} site(s) selected from table
                            </p>
                          )}
                          {kz103Checked && (
                            <p className="font-medium">
                              SOPTION2: All {filteredSitesprenData.length} sites in current view will be affected
                            </p>
                          )}
                          {!kz101Checked && !kz103Checked && (
                            <p className="text-gray-500">
                              Please select either SOPTION1 or SOPTION2 above to choose which sites to delete
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={f18_deletesites}
                        disabled={isDeleting || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedSiteIds.length === 0)}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-bold rounded-md transition-colors"
                      >
                        {isDeleting ? 'Deleting...' : 'f18_deletesites'}
                      </button>
                      
                      {kz101Checked && selectedSiteIds.length === 0 && (
                        <p className="mt-2 text-sm text-red-600">
                          Please select at least one site from the table to delete
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {activePopupTab === 'ptab3' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tags Management</h3>
                    
                    {/* Tags Feedback */}
                    {tagsData?.tagsFeedback && (
                      <div className={`mb-4 p-4 rounded-md ${
                        tagsData.tagsFeedback.type === 'success' 
                          ? 'bg-green-100 border border-green-400 text-green-700' 
                          : tagsData.tagsFeedback.type === 'error'
                          ? 'bg-red-100 border border-red-400 text-red-700'
                          : 'bg-blue-100 border border-blue-400 text-blue-700'
                      }`}>
                        {tagsData.tagsFeedback.message}
                      </div>
                    )}

                    {/* Add Sites to Tag Button */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <button
                        onClick={() => tagsData?.functions?.handleAddSitesToTag()}
                        disabled={!tagsData?.functions?.handleAddSitesToTag || tagsData?.loadingStates?.isAddingSitesToTag}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold rounded-md transition-colors text-lg"
                      >
                        {tagsData?.loadingStates?.isAddingSitesToTag ? 'Adding Sites...' : 'Add Selected Sites to Selected Tag'}
                      </button>
                      <div className="mt-2 text-sm text-blue-600">
                        <p>• First select sites from the main table using checkboxes</p>
                        <p>• Then select one tag from the table below using its checkbox</p>
                        <p>• Finally click the button above to add selected sites to the selected tag</p>
                        <p>• Currently selected: {selectedSiteIds.length} site(s), {tagsData?.selectedTags?.size || 0} tag(s)</p>
                      </div>
                    </div>

                    {/* Create New Tag Form */}
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="text-md font-semibold mb-3">Create New Tag</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
                          <input
                            type="text"
                            value={tagsData?.formData?.newTagName || ''}
                            onChange={(e) => tagsData?.formData?.setNewTagName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter tag name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                          <input
                            type="number"
                            value={tagsData?.formData?.newTagOrder || 0}
                            onChange={(e) => tagsData?.formData?.setNewTagOrder(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => tagsData?.functions?.handleCreateTag()}
                        disabled={!tagsData?.functions?.handleCreateTag || tagsData?.loadingStates?.isCreatingTag || !tagsData?.formData?.newTagName?.trim()}
                        className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
                      >
                        {tagsData?.loadingStates?.isCreatingTag ? 'Creating...' : 'Create Tag'}
                      </button>
                    </div>

                    {/* Tags Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <h4 className="text-md font-semibold">sitespren_tags Table</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Select
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                tag_id
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                tag_name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                tag_order
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                created_at
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                updated_at
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                fk_user_id
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tagsData?.tags?.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                  No tags found. Create your first tag using the form above.
                                </td>
                              </tr>
                            ) : (
                              tagsData?.tags?.map((tag: any) => (
                                <tr key={tag.tag_id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <input
                                      type="checkbox"
                                      checked={tagsData?.selectedTags?.has(tag.tag_id) || false}
                                      onChange={(e) => tagsData?.functions?.handleTagSelection(tag.tag_id, e.target.checked)}
                                      className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-900">
                                    {tag.tag_id?.substring(0, 8)}...
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {tagsData?.editingTagId === tag.tag_id ? (
                                      <input
                                        type="text"
                                        value={tagsData?.formData?.editingTagName || ''}
                                        onChange={(e) => tagsData?.formData?.setEditingTagName(e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    ) : (
                                      <span className="font-medium">{tag.tag_name}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {tagsData?.editingTagId === tag.tag_id ? (
                                      <input
                                        type="number"
                                        value={tagsData?.formData?.editingTagOrder || 0}
                                        onChange={(e) => tagsData?.formData?.setEditingTagOrder(parseInt(e.target.value) || 0)}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    ) : (
                                      tag.tag_order
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {tag.created_at ? new Date(tag.created_at).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {tag.updated_at ? new Date(tag.updated_at).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-500">
                                    {tag.fk_user_id?.substring(0, 8)}...
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex space-x-2">
                                      {tagsData?.editingTagId === tag.tag_id ? (
                                        <>
                                          <button
                                            onClick={() => tagsData?.functions?.handleUpdateTag()}
                                            disabled={tagsData?.loadingStates?.isUpdatingTag}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs rounded"
                                          >
                                            {tagsData?.loadingStates?.isUpdatingTag ? 'Saving...' : 'Save'}
                                          </button>
                                          <button
                                            onClick={() => tagsData?.functions?.cancelEditingTag()}
                                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                                          >
                                            Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => tagsData?.functions?.startEditingTag(tag)}
                                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => tagsData?.functions?.handleDeleteTag(tag.tag_id)}
                                            disabled={tagsData?.loadingStates?.isDeletingTag?.has(tag.tag_id)}
                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs rounded"
                                          >
                                            {tagsData?.loadingStates?.isDeletingTag?.has(tag.tag_id) ? 'Deleting...' : 'Delete'}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
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

      {/* Sitespren Table */}
      <SitesprenTable 
        data={filteredSitesprenData} 
        userId={user.id}
        userInternalId={userInternalId!}
        onSelectionChange={handleSelectionChange}
        onDataUpdate={setSitesprenData}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        totalUnfilteredCount={sitesprenData.length}
        onTagsUpdate={handleTagsUpdate}
      />
    </div>
  );
}