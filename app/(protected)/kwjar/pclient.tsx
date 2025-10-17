'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ZhedoriButtonBar from '@/app/components/ZhedoriButtonBar';
import KeywordsHubTable from './components/KeywordsHubTable';
import TagsPlenchPopup from './components/TagsPlenchPopup';
import IndustrySelectorPopup from './components/IndustrySelectorPopup';

export default function KwjarClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  // Tags plench popup state
  const [isTagsPopupOpen, setIsTagsPopupOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<{ tag_id: number; tag_name: string } | null>(null);
  
  // Industry selection state
  const [isIndustryPopupOpen, setIsIndustryPopupOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<{ industry_id: number; industry_name: string } | null>(null);
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<number[]>([]);
  
  // Gazelle bulk processing state
  const [gazelleLoading, setGazelleLoading] = useState(false);
  const [showGazelleFirstConfirm, setShowGazelleFirstConfirm] = useState(false);
  const [showGazelleSecondConfirm, setShowGazelleSecondConfirm] = useState(false);
  const [gazelleProgress, setGazelleProgress] = useState({ current: 0, total: 0 });
  
  // Debug selected tag changes
  useEffect(() => {
    console.log('🏷️ [PCLIENT] selectedTag changed:', selectedTag);
  }, [selectedTag]);
  const [columnPaginationControls, setColumnPaginationControls] = useState<{
    ColumnPaginationBar1: () => JSX.Element | null;
    ColumnPaginationBar2: () => JSX.Element | null;
  } | null>(null);
  const [mainPaginationControls, setMainPaginationControls] = useState<{
    PaginationControls: () => JSX.Element;
    SearchField: () => JSX.Element;
  } | null>(null);
  
  // Table actions state for mesozoic chamber
  const [tableActions, setTableActions] = useState<{
    DataForSEOActions: () => JSX.Element;
  } | null>(null);

  // Column pagination URL parameter states
  const [columnsPerPage, setColumnsPerPage] = useState(8);
  const [currentColumnPage, setCurrentColumnPage] = useState(1);
  
  // FPopup1 state (matching nwjar1)
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [kz101Checked, setKz101Checked] = useState(false);
  const [kz103Checked, setKz103Checked] = useState(false);
  const [activePopupTab, setActivePopupTab] = useState<'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7'>('ptab1');
  const [uelBarColors, setUelBarColors] = useState<{bg: string, text: string}>({bg: '#2563eb', text: '#ffffff'});
  const [uelBar37Colors, setUelBar37Colors] = useState<{bg: string, text: string}>({bg: '#1e40af', text: '#ffffff'});
  const [currentUrl, setCurrentUrl] = useState<string>('');
  
  // Chamber visibility states
  const [mandibleChamberVisible, setMandibleChamberVisible] = useState(true);
  const [sinusChamberVisible, setSinusChamberVisible] = useState(true);
  const [protozoicChamberVisible, setProtozoicChamberVisible] = useState(true);
  const [mesozoicChamberVisible, setMesozoicChamberVisible] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Initialize chamber visibility from localStorage
  useEffect(() => {
    const savedMandible = localStorage.getItem('kwjar_mandibleChamberVisible');
    if (savedMandible !== null) {
      setMandibleChamberVisible(JSON.parse(savedMandible));
    }
    
    const savedSinus = localStorage.getItem('kwjar_sinusChamberVisible');
    if (savedSinus !== null) {
      setSinusChamberVisible(JSON.parse(savedSinus));
    }
    
    const savedProtozoic = localStorage.getItem('kwjar_protozoicChamberVisible');
    if (savedProtozoic !== null) {
      setProtozoicChamberVisible(JSON.parse(savedProtozoic));
    }
    
    const savedMesozoic = localStorage.getItem('kwjar_mesozoicChamberVisible');
    if (savedMesozoic !== null) {
      setMesozoicChamberVisible(JSON.parse(savedMesozoic));
    }
  }, []);

  // Listen for bezel system visibility changes
  useEffect(() => {
    const handleMandibleChange = (event: CustomEvent) => {
      setMandibleChamberVisible(event.detail.visible);
    };
    
    const handleSinusChange = (event: CustomEvent) => {
      setSinusChamberVisible(event.detail.visible);
    };
    
    const handleProtozoicChange = (event: CustomEvent) => {
      setProtozoicChamberVisible(event.detail.visible);
    };
    
    const handleMesozoicChange = (event: CustomEvent) => {
      setMesozoicChamberVisible(event.detail.visible);
    };

    window.addEventListener('kwjarMandibleChamberVisibilityChange', handleMandibleChange as EventListener);
    window.addEventListener('kwjarSinusChamberVisibilityChange', handleSinusChange as EventListener);
    window.addEventListener('kwjarProtozoicChamberVisibilityChange', handleProtozoicChange as EventListener);
    window.addEventListener('kwjarMesozoicChamberVisibilityChange', handleMesozoicChange as EventListener);
    
    return () => {
      window.removeEventListener('kwjarMandibleChamberVisibilityChange', handleMandibleChange as EventListener);
      window.removeEventListener('kwjarSinusChamberVisibilityChange', handleSinusChange as EventListener);
      window.removeEventListener('kwjarProtozoicChamberVisibilityChange', handleProtozoicChange as EventListener);
      window.removeEventListener('kwjarMesozoicChamberVisibilityChange', handleMesozoicChange as EventListener);
    };
  }, []);


  // Handle URL parameters for popup, tab state, tag filtering, and column pagination
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fpop = urlParams.get('fpop');
    const kwtag = urlParams.get('kwtag');
    console.log('🏷️ [PCLIENT] URL params effect - kwtag:', kwtag, 'URL:', window.location.href);
    const ptab1 = urlParams.get('ptab1');
    const ptab2 = urlParams.get('ptab2');
    const ptab3 = urlParams.get('ptab3');
    const ptab4 = urlParams.get('ptab4');
    const ptab5 = urlParams.get('ptab5');
    const ptab6 = urlParams.get('ptab6');
    const ptab7 = urlParams.get('ptab7');
    const cpagQty = urlParams.get('cpag_qty');
    const cpagSpec = urlParams.get('cpag_spec');
    
    // Auto-load tag if kwtag parameter is present
    if (kwtag) {
      const tagId = parseInt(kwtag);
      if (!isNaN(tagId)) {
        // Fetch tag details from database
        const loadTagFromUrl = async () => {
          try {
            const { data: tagData, error } = await supabase
              .from('keywordshub_tags')
              .select('tag_id, tag_name')
              .eq('tag_id', tagId)
              .single();
            
            if (!error && tagData) {
              console.log('🏷️ [PCLIENT] Setting selectedTag from URL:', tagData);
              setSelectedTag({ tag_id: tagData.tag_id, tag_name: tagData.tag_name });
            } else {
              console.log('🏷️ [PCLIENT] Failed to load tag from URL. Error:', error);
            }
          } catch (err) {
            console.error('Error loading tag from URL:', err);
          }
        };
        loadTagFromUrl();
      }
    } else {
      // If no kwtag parameter, clear the selected tag (unless it was already null)
      console.log('🏷️ [PCLIENT] No kwtag in URL, clearing selectedTag');
      setSelectedTag(null);
    }
    
    // Handle column pagination URL parameters
    if (cpagQty) {
      const qtyValue = cpagQty === 'All' ? 0 : parseInt(cpagQty);
      if (!isNaN(qtyValue) || cpagQty === 'All') {
        setColumnsPerPage(qtyValue);
      }
    }
    
    if (cpagSpec) {
      const specValue = parseInt(cpagSpec);
      if (!isNaN(specValue) && specValue > 0) {
        setCurrentColumnPage(specValue);
      }
    }

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
  }, [supabase, searchParams]);

  // Update URL when popup state, tag selection, or column pagination changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle tag parameter
    if (selectedTag) {
      urlParams.set('kwtag', selectedTag.tag_id.toString());
    } else {
      urlParams.delete('kwtag');
    }
    
    // Handle column pagination parameters
    if (columnsPerPage === 0) {
      urlParams.set('cpag_qty', 'All');
    } else if (columnsPerPage !== 8) { // Only set if different from default
      urlParams.set('cpag_qty', columnsPerPage.toString());
    } else {
      urlParams.delete('cpag_qty');
    }
    
    if (currentColumnPage !== 1) { // Only set if different from default
      urlParams.set('cpag_spec', currentColumnPage.toString());
    } else {
      urlParams.delete('cpag_spec');
    }
    
    // Handle popup parameters
    if (isPopupOpen) {
      urlParams.set('fpop', 'open');
      // Clear all tab params first
      ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].forEach(tab => {
        urlParams.delete(tab);
      });
      // Set active tab
      urlParams.set(activePopupTab, 'active');
    } else {
      urlParams.delete('fpop');
      ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].forEach(tab => {
        urlParams.delete(tab);
      });
    }
    
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
    setCurrentUrl(window.location.href);
  }, [isPopupOpen, activePopupTab, selectedTag, columnsPerPage, currentColumnPage]);

  // Fetch custom colors for uelbar37 and uelbar38 (matching nwjar1 exactly)
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

  // Handle column pagination changes from table component
  const handleColumnPaginationChange = useCallback((newColumnsPerPage: number, newCurrentPage: number) => {
    setColumnsPerPage(newColumnsPerPage);
    setCurrentColumnPage(newCurrentPage);
  }, []);

  // Track URL changes for uelbar37 display (like nwjar1)
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

  // Handle checkbox clicks (mutually exclusive)
  const handleKz101Click = () => {
    setKz101Checked(!kz101Checked);
    if (kz103Checked) {
      setKz103Checked(false);
    }
  };

  const handleKz103Click = () => {
    setKz103Checked(!kz103Checked);
    if (kz101Checked) {
      setKz101Checked(false);
    }
  };

  // Gazelle Bulk Aggregate Handler
  const handleGazelleBulkAggregate = async () => {
    if (selectedKeywordIds.length === 0) {
      alert('Please select keywords from the table first');
      return;
    }

    setGazelleLoading(true);
    setGazelleProgress({ current: 0, total: selectedKeywordIds.length });

    let successCount = 0;
    let failCount = 0;
    const results: any[] = [];

    try {
      for (let i = 0; i < selectedKeywordIds.length; i++) {
        const keywordId = selectedKeywordIds[i];
        setGazelleProgress({ current: i + 1, total: selectedKeywordIds.length });

        try {
          console.log(`Gazelle Bulk: Processing keyword ${i + 1}/${selectedKeywordIds.length} (ID: ${keywordId})`);

          // Step 1: Run F400 (SERP Fetch) - always use Live mode for bulk
          const f400Response = await fetch('/api/f400-live', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              keyword_id: keywordId,
            }),
          });

          const f400Result = await f400Response.json();

          if (!f400Response.ok) {
            throw new Error(f400Result.error || 'F400 failed');
          }

          // Step 2: Run F410 (EMD Stamp Match)
          const f410Response = await fetch('/api/f410', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              keyword_id: keywordId,
            }),
          });

          const f410Result = await f410Response.json();

          if (!f410Response.ok) {
            throw new Error(f410Result.error || 'F410 failed');
          }

          // Step 3: Run F420 (Cache Ranking Zones)
          const f420Response = await fetch('/api/f420', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              keyword_id: keywordId,
              emd_stamp_method: 'method-1',
            }),
          });

          const f420Result = await f420Response.json();

          if (!f420Response.ok) {
            throw new Error(f420Result.error || 'F420 failed');
          }

          results.push({
            keyword_id: keywordId,
            success: true,
            f400_results: f400Result.organic_results_stored || 0,
            f410_matches: f410Result.matches_found || 0,
            f420_zones: f420Result.zones_cached || 0,
            f420_relations: f420Result.relations_created || 0,
          });
          successCount++;
        } catch (error) {
          console.error(`Error processing keyword ${keywordId}:`, error);
          results.push({
            keyword_id: keywordId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          failCount++;
        }
      }

      // Show final results
      const successResults = results.filter(r => r.success);
      const totalF400Results = successResults.reduce((sum, r) => sum + r.f400_results, 0);
      const totalF410Matches = successResults.reduce((sum, r) => sum + r.f410_matches, 0);
      const totalF420Relations = successResults.reduce((sum, r) => sum + r.f420_relations, 0);

      alert(
        `🦌 Gazelle Bulk Processing Complete!\n\n` +
        `Total Keywords Processed: ${selectedKeywordIds.length}\n` +
        `✅ Successful: ${successCount}\n` +
        `❌ Failed: ${failCount}\n\n` +
        `📊 Results:\n` +
        `• Total SERP results fetched: ${totalF400Results}\n` +
        `• Total EMD matches found: ${totalF410Matches}\n` +
        `• Total zone relations created: ${totalF420Relations}\n\n` +
        `The page will now refresh.`
      );

      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Gazelle bulk processing error:', error);
      alert(`Gazelle bulk processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGazelleLoading(false);
      setGazelleProgress({ current: 0, total: 0 });
    }
  };

  // Handle tab change (like nwjar1)
  const handleTabChange = (tab: 'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7') => {
    setActivePopupTab(tab);
    
    // Update URL parameters when tab changes
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('fpop', 'open');
    
    // Clear all tab params first
    ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].forEach(tabParam => {
      urlParams.delete(tabParam);
    });
    
    // Set the new active tab
    urlParams.set(tab, 'active');
    
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
    
    // Dispatch custom event for URL tracking
    window.dispatchEvent(new Event('urlchange'));
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
      {/* Mandible Chamber */}
      {mandibleChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            mandible_chamber
          </div>
          
          {/* Moved header content */}
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-800">🔍 Keywords Hub</h1>
            <ZhedoriButtonBar />
            
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
          </div>
        </div>
      )}

      {/* Sinus Chamber */}
      {sinusChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            sinus_chamber
          </div>
          
          {/* Main pagination and search controls with industry controls */}
          {mainPaginationControls && (
            <div className="flex items-center space-x-4">
              {mainPaginationControls.PaginationControls()}
              {mainPaginationControls.SearchField()}
              
              {/* Industry Selection Controls - Wrapped in bordered div */}
              <div className="flex items-center space-x-3 border border-black p-2 rounded-md">
                <button
                  onClick={() => setIsIndustryPopupOpen(true)}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition-colors"
                >
                  select industry
                </button>
                
                {selectedIndustry && (
                  <div className="flex items-center space-x-2 bg-purple-50 border border-purple-300 rounded px-2 py-1">
                    <span className="text-xs text-gray-600">Selected:</span>
                    <span className="font-bold text-purple-700 text-xs">
                      {selectedIndustry.industry_id}
                    </span>
                    <span className="text-xs text-gray-800">
                      {selectedIndustry.industry_name}
                    </span>
                  </div>
                )}
                
                <button
                  onClick={async () => {
                    if (!selectedIndustry) {
                      alert('Please select an industry first');
                      return;
                    }
                    if (selectedKeywordIds.length === 0) {
                      alert('Please select keywords from the table first');
                      return;
                    }
                    
                    const confirmed = confirm(
                      `Update ${selectedKeywordIds.length} keyword(s) to industry "${selectedIndustry.industry_name}" (ID: ${selectedIndustry.industry_id})?\n\nThis will set rel_industry_id for all selected keywords.`
                    );
                    
                    if (!confirmed) return;
                    
                    try {
                      const { error } = await supabase
                        .from('keywordshub')
                        .update({ rel_industry_id: selectedIndustry.industry_id })
                        .in('keyword_id', selectedKeywordIds);
                      
                      if (error) throw error;
                      
                      alert(`Successfully updated ${selectedKeywordIds.length} keyword(s) to industry "${selectedIndustry.industry_name}"`);
                      
                      // Trigger refresh by dispatching event
                      window.dispatchEvent(new CustomEvent('kwjar-refresh-needed'));
                    } catch (error) {
                      console.error('Error updating keywords:', error);
                      alert('Failed to update keywords');
                    }
                  }}
                  disabled={!selectedIndustry || selectedKeywordIds.length === 0}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    !selectedIndustry || selectedKeywordIds.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  update industry to selected
                  {selectedKeywordIds.length > 0 && ` (${selectedKeywordIds.length})`}
                </button>
              </div>
              
              {/* Gazelle Bulk Aggregate Button */}
              <button
                onClick={() => {
                  if (selectedKeywordIds.length === 0) {
                    alert('Please select keywords from the table first');
                    return;
                  }
                  setShowGazelleFirstConfirm(true);
                }}
                disabled={selectedKeywordIds.length === 0 || gazelleLoading}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  selectedKeywordIds.length === 0 || gazelleLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {gazelleLoading 
                  ? `Processing ${gazelleProgress.current}/${gazelleProgress.total}...`
                  : `🦌 Gazelle Aggregate ${selectedKeywordIds.length > 0 ? `(${selectedKeywordIds.length})` : ''}`
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* Protozoic Chamber */}
      {protozoicChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            protozoic_chamber
          </div>
          
          {/* Moved buttons and controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Functions Popup Button (styled like nwjar1) */}
              <button
                onClick={() => setIsPopupOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                functions popup
              </button>
              <button
                onClick={() => setIsTagsPopupOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                tags plench button
              </button>
              {selectedTag && (
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium bg-navy text-white border border-black px-3 py-1 rounded" style={{ backgroundColor: 'navy' }}>
                    {selectedTag.tag_name}
                  </div>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                    title="Clear filter"
                  >
                    ×
                  </button>
                </div>
              )}
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                delete kws and clear from any cncglub.kwslot*
              </button>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">DataForSEO Integration</div>
              <div className="text-xs text-gray-400">Project: Keywords Research</div>
            </div>
          </div>
        </div>
      )}

      {/* Mesozoic Chamber */}
      {mesozoicChamberVisible && (
        <div className="border border-black p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            mesozoic_chamber
          </div>
          
          {/* Table Actions */}
          {tableActions && (
            <div className="mt-2">
              {tableActions.DataForSEOActions()}
            </div>
          )}
        </div>
      )}

      {/* Header - now empty, keeping for potential future use */}
      <div className="bg-white border-b px-6 py-4" style={{ display: 'none' }}>
      </div>

      {/* Main Content - Full Width KeywordsHubTable */}
      <div className="flex-1 overflow-hidden">
        <KeywordsHubTable 
          selectedTagId={selectedTag?.tag_id}
          onColumnPaginationRender={setColumnPaginationControls}
          onMainPaginationRender={setMainPaginationControls}
          onTableActionsRender={setTableActions}
          initialColumnsPerPage={columnsPerPage}
          initialColumnPage={currentColumnPage}
          onColumnPaginationChange={handleColumnPaginationChange}
          onSelectedRowsChange={setSelectedKeywordIds}
        />
      </div>

      {/* Tags Plench Popup */}
      {isTagsPopupOpen && (
        <TagsPlenchPopup
          isOpen={isTagsPopupOpen}
          onClose={() => setIsTagsPopupOpen(false)}
          onSelectTag={(tag) => {
            setSelectedTag(tag);
            setIsTagsPopupOpen(false);
          }}
          selectedTag={selectedTag}
        />
      )}

      {/* Industry Selector Popup */}
      <IndustrySelectorPopup
        isOpen={isIndustryPopupOpen}
        onClose={() => setIsIndustryPopupOpen(false)}
        onSelect={setSelectedIndustry}
        currentSelection={selectedIndustry}
      />

      {/* Gazelle First Confirmation Modal */}
      {showGazelleFirstConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 rounded-full p-2 mr-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">⚠️ Resource-Intensive Operation Warning</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  You are about to run the <strong>Gazelle Bulk Aggregate Function</strong> on <strong>{selectedKeywordIds.length} keyword(s)</strong>.
                </p>
                <p className="text-gray-700 mb-4">
                  This is a <strong className="text-red-600">very resource-intensive operation</strong> that will:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Run F400 (LIVE SERP Fetch) for each keyword - <strong>~$0.015 per keyword</strong></li>
                  <li>Run F410 (EMD Stamp Match) for each keyword</li>
                  <li>Run F420 (Cache Ranking Zones) for each keyword</li>
                  <li>Take approximately <strong>{selectedKeywordIds.length * 25} seconds</strong> to complete</li>
                  <li>Consume significant API credits from your DataForSEO account</li>
                </ul>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-yellow-800 font-medium text-sm">
                    Estimated cost: <strong>${(selectedKeywordIds.length * 0.015).toFixed(2)} USD</strong>
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    This operation cannot be stopped once started.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowGazelleFirstConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowGazelleFirstConfirm(false);
                    setShowGazelleSecondConfirm(true);
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-md transition-colors"
                >
                  I Understand, Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gazelle Second Confirmation Modal */}
      {showGazelleSecondConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 rounded-full p-2 mr-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">🚨 Final Confirmation Required</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  <strong>This is your last chance to cancel!</strong>
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-800 font-medium mb-2">Clicking "Yes, Run Gazelle Now" will:</p>
                  <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                    <li>Process {selectedKeywordIds.length} keywords with F400 + F410 + F420</li>
                    <li>Cost approximately ${(selectedKeywordIds.length * 0.015).toFixed(2)} in API credits</li>
                    <li>Take approximately {Math.ceil(selectedKeywordIds.length * 25 / 60)} minutes to complete</li>
                    <li>Cannot be stopped or undone once started</li>
                  </ul>
                </div>
                <p className="text-gray-700 font-medium">
                  Selected keywords: <span className="text-blue-600">{selectedKeywordIds.length}</span>
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowGazelleSecondConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowGazelleSecondConfirm(false);
                    handleGazelleBulkAggregate();
                  }}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors font-medium"
                >
                  Yes, Run Gazelle Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FPopup1 Implementation - Matching nwjar1 exactly */}
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
              
              <span className="font-bold">{typeof window !== 'undefined' ? window.location.pathname : '/kwjar'}</span>
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
                SOPTION1 - Use Your Current Selection From Table
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
                SOPTION2 - Select All Items In Current Pagination
              </div>
              
              {/* Close button in header - spans both bars */}
              <button
                onClick={() => setIsPopupOpen(false)}
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
                  <div className="text-gray-600">
                    <p>Tab 1 content will go here</p>
                  </div>
                )}
                {activePopupTab === 'ptab2' && (
                  <div className="text-gray-600">
                    <p>Tab 2 content will go here</p>
                  </div>
                )}
                {activePopupTab === 'ptab3' && (
                  <div className="text-gray-600">
                    <p>Tab 3 content will go here</p>
                  </div>
                )}
                {activePopupTab === 'ptab4' && (
                  <div className="text-gray-600">
                    <p>Tab 4 content will go here</p>
                  </div>
                )}
                {activePopupTab === 'ptab5' && (
                  <div className="text-gray-600">
                    <p>Tab 5 content will go here</p>
                  </div>
                )}
                {activePopupTab === 'ptab6' && (
                  <div className="text-gray-600">
                    <p>Tab 6 content will go here</p>
                  </div>
                )}
                {activePopupTab === 'ptab7' && (
                  <div className="text-gray-600">
                    <p>Tab 7 content will go here</p>
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