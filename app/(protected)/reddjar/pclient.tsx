'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ReddjarTable from './components/ReddjarTable';
import RedditdoriButtonBar from '@/app/components/RedditdoriButtonBar';

export default function ReddjarClient() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Existing state
  const [columnPaginationControls, setColumnPaginationControls] = useState<{
    ColumnPaginationBar1: () => JSX.Element | null;
    ColumnPaginationBar2: () => JSX.Element | null;
  } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isScrapingLinks, setIsScrapingLinks] = useState(false);
  const [isScrapingCommentable, setIsScrapingCommentable] = useState(false);
  const [commentableFilter, setCommentableFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [scrapeStatusFilter, setScrapeStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  // FPopup1 state (same pattern as /nwjar1)
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [kz101Checked, setKz101Checked] = useState(false);
  const [kz103Checked, setKz103Checked] = useState(false);
  const [activePopupTab, setActivePopupTab] = useState<'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7'>('ptab1');
  const [uelBarColors, setUelBarColors] = useState<{bg: string, text: string}>({bg: '#2563eb', text: '#ffffff'});
  const [uelBar37Colors, setUelBar37Colors] = useState<{bg: string, text: string}>({bg: '#1e40af', text: '#ffffff'});
  const [currentUrl, setCurrentUrl] = useState<string>('');
  
  // Tags management state
  const [tagsData, setTagsData] = useState<any>(null);

  const handleScrapeLinks = async () => {
    if (selectedRows.size === 0) {
      alert('Please select at least one Reddit URL to scrape');
      return;
    }

    setIsScrapingLinks(true);
    try {
      console.log('Scraping links for selected rows:', Array.from(selectedRows));
      
      const response = await fetch('/api/reddit-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedUrlIds: Array.from(selectedRows)
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Show results summary
      const successful = result.results.filter((r: any) => r.success).length;
      const totalLinks = result.results.reduce((sum: number, r: any) => sum + r.links_found, 0);
      
      alert(`Scraping completed!\n\nSuccessful: ${successful}/${result.results.length} URLs\nTotal links found: ${totalLinks}\n\nNote: Check browser console for detailed debug output.\nRefresh page manually to see updated table data.`);
      
      // Don't auto-refresh so user can see console debug output
      // window.location.reload();
      
    } catch (error) {
      console.error('Error scraping links:', error);
      alert('Error occurred while scraping links: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsScrapingLinks(false);
    }
  };

  const handleScrapeCommentable = async () => {
    if (selectedRows.size === 0) {
      alert('Please select at least one Reddit URL to check commentability');
      return;
    }

    setIsScrapingCommentable(true);
    try {
      console.log('🚀 CLIENT: Checking commentability for selected rows:', Array.from(selectedRows));
      
      console.log('📡 CLIENT: Making API call to /api/reddit-commentable-scraper');
      const response = await fetch('/api/reddit-commentable-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedUrlIds: Array.from(selectedRows)
        }),
      });

      console.log('📨 CLIENT: API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });

      if (!response.ok) {
        console.error('❌ CLIENT: API response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ CLIENT: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      console.log('🔄 CLIENT: Parsing JSON response...');
      const result = await response.json();
      console.log('📊 CLIENT: Parsed API result:', result);
      
      // Show results summary
      const successful = result.results.filter((r: any) => r.success).length;
      const openThreads = result.results.filter((r: any) => r.success && r.is_commentable === true).length;
      const closedThreads = result.results.filter((r: any) => r.success && r.is_commentable === false).length;
      
      alert(`Commentability check completed!\n\nSuccessful: ${successful}/${result.results.length} URLs\nOpen for comments: ${openThreads}\nClosed: ${closedThreads}\n\nNote: Check browser console for detailed debug output.\nRefresh page manually to see updated table data.`);
      
      // Don't auto-refresh so user can see console debug output
      // window.location.reload();
      
    } catch (error) {
      console.error('Error checking commentability:', error);
      alert('Error occurred while checking commentability: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsScrapingCommentable(false);
    }
  };

  // FPopup1 URL parameter handling (same pattern as /nwjar1)
  useEffect(() => {
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

  // Fetch custom colors for uelbar37 and uelbar38
  useEffect(() => {
    const fetchUelBarColors = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_colors')
          .select('color_ref_code, hex_value')
          .in('color_ref_code', ['uelbar38_bgcolor1', 'uelbar38_textcolor1', 'uelbar37_bgcolor1', 'uelbar37_textcolor1']);

        if (!error && data && data.length > 0) {
          // uelbar38 colors
          const bgColor38Item = data.find(item => item.color_ref_code === 'uelbar38_bgcolor1');
          const textColor38Item = data.find(item => item.color_ref_code === 'uelbar38_textcolor1');
          
          const bgColor38 = bgColor38Item?.hex_value || '#2563eb';
          const textColor38 = textColor38Item?.hex_value || '#ffffff';
          
          setUelBarColors({bg: bgColor38, text: textColor38});

          // uelbar37 colors
          const bgColor37Item = data.find(item => item.color_ref_code === 'uelbar37_bgcolor1');
          const textColor37Item = data.find(item => item.color_ref_code === 'uelbar37_textcolor1');
          
          const bgColor37 = bgColor37Item?.hex_value || '#1e40af';
          const textColor37 = textColor37Item?.hex_value || '#ffffff';
          
          setUelBar37Colors({bg: bgColor37, text: textColor37});
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

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // FPopup1 handlers (same pattern as /nwjar1)
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
      const lastTab = localStorage.getItem('reddjar_lastActiveTab') || 'ptab1';
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
    localStorage.setItem('reddjar_lastActiveTab', tab); // Remember this tab for next time
    updatePopupURL(true, tab);
  };

  // Handle tags data from ReddjarTable
  const handleTagsUpdate = (newTagsData: any) => {
    setTagsData(newTagsData);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-800">Reddit URLs Jar</h1>

            {/* Functions Popup Button - styled like /nwjar1 */}
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
            
            {/* Column Pagination Button Bars */}
            {columnPaginationControls && (
              <>
                <div className="flex items-center">
                  {columnPaginationControls.ColumnPaginationBar1()}
                </div>
                <div className="flex items-center">
                  {columnPaginationControls.ColumnPaginationBar2()}
                </div>
              </>
            )}
            
            {/* Scrape Links Button */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleScrapeLinks}
                disabled={isScrapingLinks || isScrapingCommentable || selectedRows.size === 0}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  isScrapingLinks || isScrapingCommentable || selectedRows.size === 0
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600'
                }`}
              >
                {isScrapingLinks ? 'Scraping...' : 'scrape links'}
              </button>
              
              <button
                onClick={handleScrapeCommentable}
                disabled={isScrapingCommentable || isScrapingLinks || selectedRows.size === 0}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  isScrapingCommentable || isScrapingLinks || selectedRows.size === 0
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-green-500 text-white border-green-500 hover:bg-green-600 hover:border-green-600'
                }`}
              >
                {isScrapingCommentable ? 'Checking...' : 'scrape is_commentable'}
              </button>
            </div>
            
            {/* is_commentable Filter */}
            <div className="flex flex-col items-center">
              <div className="text-black font-bold mb-1" style={{ fontSize: '16px' }}>
                is_commentable
              </div>
              <select
                value={commentableFilter}
                onChange={(e) => setCommentableFilter(e.target.value as 'all' | 'yes' | 'no')}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">all</option>
                <option value="yes">yes</option>
                <option value="no">no</option>
              </select>
            </div>
            
            {/* is_commentable_scrape_status Filter */}
            <div className="flex flex-col items-center">
              <div className="text-black font-bold mb-1" style={{ fontSize: '16px' }}>
                is_commentable_scrape_status
              </div>
              <select
                value={scrapeStatusFilter}
                onChange={(e) => setScrapeStatusFilter(e.target.value as 'all' | 'success' | 'failed')}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Table: redditurlsvat</div>
            <div className="text-xs text-gray-400">Reddit SEO Tracking</div>
          </div>
        </div>
      </div>

      {/* RedditdoriButtonBar */}
      <div className="px-6">
        <RedditdoriButtonBar />
      </div>

      {/* Main Content - Full Width ReddjarTable */}
      <div className="flex-1 overflow-hidden">
        <ReddjarTable 
          onColumnPaginationRender={setColumnPaginationControls}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          commentableFilter={commentableFilter}
          scrapeStatusFilter={scrapeStatusFilter}
          onTagsUpdate={handleTagsUpdate}
          userInternalId={user?.user_metadata?.user_internal_id}
        />
      </div>

      {/* FPopup1 Modal - Same pattern as /nwjar1 */}
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
                Use Your Current Selection From Table | {selectedRows.size} rows
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
                Select All Items In Current Pagination
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
              
              {/* Tab Content - All tabs are blank as requested */}
              <div className="p-8 h-full overflow-auto">
                {activePopupTab === 'ptab1' && (
                  <div>
                    <p className="text-gray-500">ptab1 content area - currently blank</p>
                  </div>
                )}
                {activePopupTab === 'ptab2' && (
                  <div>
                    <p className="text-gray-500">ptab2 content area - currently blank</p>
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

                    {/* Management Actions */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                      <h4 className="text-lg font-semibold mb-4">Add URLs to Tag</h4>
                      
                      <button
                        onClick={() => tagsData?.functions?.handleAddUrlsToTag()}
                        disabled={!tagsData?.functions?.handleAddUrlsToTag || tagsData?.loadingStates?.isAddingUrlsToTag}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold rounded-md transition-colors text-lg"
                      >
                        {tagsData?.loadingStates?.isAddingUrlsToTag ? 'Adding URLs...' : 'Add Selected URLs to Selected Tag'}
                      </button>
                      <div className="mt-2 text-sm text-blue-600">
                        <p>• First select URLs from the main table using checkboxes</p>
                        <p>• Then select one tag from the table below using its checkbox</p>
                        <p>• Finally click the button above to add selected URLs to the selected tag</p>
                        <p>• Currently selected: {selectedRows.size} URL(s), {tagsData?.selectedTags?.size || 0} tag(s)</p>
                      </div>
                    </div>

                    {/* Create New Tag */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                      <h4 className="text-lg font-semibold mb-4">Create New Tag</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
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
                        <h4 className="text-md font-semibold">redditurlsvat_tags Table</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Select
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tag ID
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tag Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created At
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Updated At
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                URL Count
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
                                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                                    {tag.tag_id?.substring(0, 8)}...
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {tagsData?.formData?.editingTagId === tag.tag_id ? (
                                      <input
                                        type="text"
                                        value={tagsData?.formData?.editingTagName || ''}
                                        onChange={(e) => tagsData?.formData?.setEditingTagName(e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    ) : (
                                      tag.tag_name
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {tagsData?.formData?.editingTagId === tag.tag_id ? (
                                      <input
                                        type="number"
                                        value={tagsData?.formData?.editingTagOrder || 0}
                                        onChange={(e) => tagsData?.formData?.setEditingTagOrder(parseInt(e.target.value) || 0)}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    ) : (
                                      tag.tag_order || 0
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {tag.created_at ? new Date(tag.created_at).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {tag.updated_at ? new Date(tag.updated_at).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {tag.url_count || 0}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex space-x-2">
                                      {tagsData?.formData?.editingTagId === tag.tag_id ? (
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
                    <p className="text-gray-500">ptab4 content area - currently blank</p>
                  </div>
                )}
                {activePopupTab === 'ptab5' && (
                  <div>
                    <p className="text-gray-500">ptab5 content area - currently blank</p>
                  </div>
                )}
                {activePopupTab === 'ptab6' && (
                  <div>
                    <p className="text-gray-500">ptab6 content area - currently blank</p>
                  </div>
                )}
                {activePopupTab === 'ptab7' && (
                  <div>
                    <p className="text-gray-500">ptab7 content area - currently blank</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}