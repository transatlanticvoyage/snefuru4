import { ImageRecord } from '../types';
import { useState, useEffect } from 'react';
import { func_fetch_image_4 } from '../utils/cfunc_fetch_image_4';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Panjar4UIProps {
  images: ImageRecord[];
  onImagesRefresh?: () => void; // callback to refresh images from parent
}

export default function Panjar4UI({ images, onImagesRefresh }: Panjar4UIProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  
  // Functions popup state - cloned from nwjar1 and tebnar2
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [kz101Checked, setKz101Checked] = useState(false);
  const [kz103Checked, setKz103Checked] = useState(false);
  const [activePopupTab, setActivePopupTab] = useState<'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7'>('ptab1');
  const [uelBarColors, setUelBarColors] = useState<{bg: string, text: string}>({bg: '#2563eb', text: '#ffffff'});
  const [uelBar37Colors, setUelBar37Colors] = useState<{bg: string, text: string}>({bg: '#1e40af', text: '#ffffff'});
  const [currentUrl, setCurrentUrl] = useState<string>('');
  
  const supabase = createClientComponentClient();

  // Checkbox selection handlers
  const handleSelectRow = (imageId: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === images.length && images.length > 0) {
      // Deselect all
      setSelectedRows(new Set());
    } else {
      // Select all
      const allImageIds = new Set(images.map(image => image.id));
      setSelectedRows(allImageIds);
    }
  };

  const handleCheckboxCellClick = (imageId: number) => {
    handleSelectRow(imageId);
  };

  // Fetch custom colors for uelbar37 and uelbar38 - cloned from nwjar1 and tebnar2
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

  // Track URL changes for uelbar37 display - cloned from nwjar1 and tebnar2
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

  // Handle checkbox clicks with mutual exclusivity - cloned from nwjar1 and tebnar2
  const handleKz101Click = () => {
    setKz101Checked(true);
    setKz103Checked(false);
  };

  const handleKz103Click = () => {
    setKz103Checked(true);
    setKz101Checked(false);
  };

  // Update URL parameters for popup state - cloned from nwjar1 and tebnar2
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

  // Handle popup open/close with URL updates - cloned from nwjar1 and tebnar2
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
      const lastTab = localStorage.getItem('panjar4_lastActiveTab') || 'ptab1';
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

  // Handle tab changes with URL updates and localStorage - cloned from nwjar1 and tebnar2
  const handleTabChange = (tab: string) => {
    setActivePopupTab(tab as any);
    localStorage.setItem('panjar4_lastActiveTab', tab); // Remember this tab for next time
    updatePopupURL(true, tab);
  };

  // SOPTION1 and SOPTION2 handler - adapted for panjar4
  const [functionLoading, setFunctionLoading] = useState(false);

  const handleSelectedItemsFunction = async (functionName: string) => {
    let itemsToProcess: number[] = [];
    
    if (kz101Checked) {
      // SOPTION1: Use selected items
      if (selectedRows.size === 0) {
        alert('Please select at least one item from the table');
        return;
      }
      itemsToProcess = Array.from(selectedRows);
    } else if (kz103Checked) {
      // SOPTION2: Use all items in current view
      itemsToProcess = images.map(image => image.id);
    } else {
      alert('Please select either SOPTION1 or SOPTION2');
      return;
    }

    if (itemsToProcess.length === 0) {
      alert('No items to process');
      return;
    }

    setFunctionLoading(true);
    try {
      // Example API call structure - can be customized for different functions
      const response = await fetch(`/api/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_ids: itemsToProcess,
          selection_type: kz101Checked ? 'SOPTION1' : 'SOPTION2',
          total_items: itemsToProcess.length
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully processed ${itemsToProcess.length} items with ${functionName}`);
        // Refresh the data
        if (onImagesRefresh) {
          await onImagesRefresh();
        }
      } else {
        alert(`Error: ${result.error || `Failed to execute ${functionName}`}`);
      }
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      alert(`An error occurred while executing ${functionName}`);
    } finally {
      setFunctionLoading(false);
    }
  };

  // Effect to handle popup URL parameters on mount - cloned from nwjar1 and tebnar2
  useEffect(() => {
    document.title = '/panjar4 - Snefuru';
    
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

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDebug(null);
      const result = await func_fetch_image_4(prompt);
      setDebug(result);
      if (!result.success) {
        setError(result.error || 'Failed to generate image');
        return;
      }
      setPrompt('');
      // If parent provided a refresh callback, call it to reload images
      if (onImagesRefresh) {
        await onImagesRefresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Functions Popup Button - positioned at top of page */}
      <div className="mb-8">
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

      <div className="mb-8">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here"
          className="w-[400px] h-[150px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <div className="mt-4">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating...' : 'fetch with func_fetch_image_4'}
          </button>
        </div>
        {error && (
          <div className="mt-4">
            <div className="text-red-600">
              {error}
            </div>
            <pre className="mt-2 p-4 bg-gray-100 rounded-lg overflow-auto text-sm">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}
        {/* Debug Panel */}
        {debug && (
          <div className="mt-4">
            <div className="font-bold">Debug Panel (last API response):</div>
            <pre className="mt-2 p-4 bg-gray-200 rounded-lg overflow-auto text-xs">
              {JSON.stringify(debug, null, 2)}
            </pre>
            {debug.image?.img_file_url1 && (
              <div className="mt-2">
                <span className="font-bold">Returned Image URL: </span>
                <a href={debug.image.img_file_url1} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">{debug.image.img_file_url1}</a>
                <div className="mt-2">
                  <img src={debug.image.img_file_url1} alt="Debug Preview" className="h-32 w-32 object-cover border" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="text-center"
                style={{
                  width: '50px',
                  minWidth: '50px',
                  maxWidth: '50px',
                  padding: '6px 10px !important',
                  paddingTop: '6px !important',
                  paddingBottom: '6px !important',
                  paddingLeft: '10px !important',
                  paddingRight: '10px !important'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedRows.size === images.length && images.length > 0}
                  onChange={handleSelectAll}
                  style={{
                    width: '26px',
                    height: '26px',
                    margin: '0',
                    padding: '0',
                    cursor: 'pointer'
                  }}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image Preview</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Extension</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Width</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Height</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Function Used</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {images.map((image) => (
              <tr key={image.id}>
                <td 
                  className="text-center cursor-pointer"
                  style={{
                    width: '50px',
                    minWidth: '50px',
                    maxWidth: '50px',
                    padding: '6px 10px !important',
                    paddingTop: '6px !important',
                    paddingBottom: '6px !important',
                    paddingLeft: '10px !important',
                    paddingRight: '10px !important'
                  }}
                  onClick={() => handleCheckboxCellClick(image.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.has(image.id)}
                    onChange={() => handleSelectRow(image.id)}
                    style={{
                      width: '26px',
                      height: '26px',
                      margin: '0',
                      padding: '0',
                      cursor: 'pointer'
                    }}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {image.img_file_url1 && (
                    <img 
                      src={image.img_file_url1} 
                      alt="Generated" 
                      className="h-20 w-20 object-cover"
                    />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{image.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{image.rel_users_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(image.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{image.rel_images_plans_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {image.img_file_url1 ? (
                    <a 
                      href={image.img_file_url1} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Image
                    </a>
                  ) : (
                    <span className="text-gray-400">No URL</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{image.img_file_extension}</td>
                <td className="px-6 py-4 whitespace-nowrap">{image.img_file_size}</td>
                <td className="px-6 py-4 whitespace-nowrap">{image.width}</td>
                <td className="px-6 py-4 whitespace-nowrap">{image.height}</td>
                <td className="px-6 py-4">
                  <div 
                    className="max-w-xs truncate" 
                    title={image.prompt1 || undefined}
                  >
                    {image.prompt1 || 'No prompt'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{image.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">{image.function_used_to_fetch_the_image}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Functions Popup Modal - cloned from nwjar1 and tebnar2 */}
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
                SOPTION1 - Use Your Current Selection From Table | {selectedRows.size} rows
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
                SOPTION2 - Select All Items In Current View | {images.length} rows
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
                      
                      {/* Function Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={() => handleSelectedItemsFunction('panjar4_example_function_1')}
                          disabled={functionLoading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedRows.size === 0)}
                          className={`px-4 py-2 rounded font-medium ${
                            functionLoading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedRows.size === 0)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {functionLoading ? 'Processing...' : 'Example Function 1 - Process Selected Images'}
                        </button>
                        
                        <button
                          onClick={() => handleSelectedItemsFunction('panjar4_example_function_2')}
                          disabled={functionLoading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedRows.size === 0)}
                          className={`px-4 py-2 rounded font-medium ${
                            functionLoading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedRows.size === 0)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {functionLoading ? 'Processing...' : 'Example Function 2 - Batch Operations'}
                        </button>
                        
                        <button
                          onClick={() => handleSelectedItemsFunction('panjar4_delete_images')}
                          disabled={functionLoading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedRows.size === 0)}
                          className={`px-4 py-2 rounded font-medium ${
                            functionLoading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedRows.size === 0)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {functionLoading ? 'Processing...' : 'Delete Selected Images'}
                        </button>
                        
                        <button
                          onClick={() => handleSelectedItemsFunction('panjar4_download_images')}
                          disabled={functionLoading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedRows.size === 0)}
                          className={`px-4 py-2 rounded font-medium ${
                            functionLoading || (!kz101Checked && !kz103Checked) || (kz101Checked && selectedRows.size === 0)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {functionLoading ? 'Processing...' : 'Download Selected Images'}
                        </button>
                      </div>
                      
                      {/* Status Messages */}
                      {!kz101Checked && !kz103Checked && (
                        <p className="text-sm text-gray-500">
                          Select either SOPTION1 or SOPTION2 to enable functions
                        </p>
                      )}
                      {kz101Checked && selectedRows.size === 0 && (
                        <p className="text-sm text-gray-500">
                          SOPTION1 selected: Select items from the table to enable functions
                        </p>
                      )}
                      {kz101Checked && selectedRows.size > 0 && (
                        <p className="text-sm text-gray-600">
                          SOPTION1 selected: {selectedRows.size} item(s) will be processed
                        </p>
                      )}
                      {kz103Checked && (
                        <p className="text-sm text-gray-600">
                          SOPTION2 selected: All {images.length} items will be processed
                        </p>
                      )}
                      
                      {/* Current Selection Info */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">
                          <strong>Current Selection Info:</strong>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          • Selected Rows: {selectedRows.size}
                        </div>
                        <div className="text-xs text-gray-600">
                          • Total Images: {images.length}
                        </div>
                        <div className="text-xs text-gray-600">
                          • Page: /panjar4 (Image Management)
                        </div>
                      </div>
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
    </div>
  );
} 