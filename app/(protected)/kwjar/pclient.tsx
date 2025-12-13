'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ZhedoriButtonBar from '@/app/components/ZhedoriButtonBar';
import ClavedoriButtonBar from '@/app/components/ClavedoriButtonBar';
import KeywordsHubTable from './components/KeywordsHubTable';
import TagsPlenchPopup from './components/TagsPlenchPopup';
import IndustrySelectorPopup from './components/IndustrySelectorPopup';
import ExportButton from './components/ExportButton';

export default function KwjarClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  // Tags plench popup state
  const [isTagsPopupOpen, setIsTagsPopupOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<{ tag_id: number; tag_name: string } | null>(null);
  const [tagFilterRefreshKey, setTagFilterRefreshKey] = useState(0);
  
  // Industry selection state
  const [isIndustryPopupOpen, setIsIndustryPopupOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<{ industry_id: number; industry_name: string } | null>(null);
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<number[]>([]);
  
  // Gazelle bulk processing state
  const [gazelleLoading, setGazelleLoading] = useState(false);
  const [showGazelleFirstConfirm, setShowGazelleFirstConfirm] = useState(false);
  const [showGazelleSecondConfirm, setShowGazelleSecondConfirm] = useState(false);
  
  // Export data state
  const [exportData, setExportData] = useState<{
    allFilteredData: any[];
    selectedData: any[];
    starredData: any[];
    chosenData: any[];
    columns: any[];
    paginatedData: any[];
    currentPage: number;
    itemsPerPage: number;
  }>({
    allFilteredData: [],
    selectedData: [],
    starredData: [],
    chosenData: [],
    columns: [],
    paginatedData: [],
    currentPage: 1,
    itemsPerPage: 25
  });
  const [gazelleProgress, setGazelleProgress] = useState({ current: 0, total: 0 });
  const [f400Mode, setF400Mode] = useState<'live' | 'queued' | null>(null); // User must choose before proceeding
  
  // Retry failed keywords state
  const [showRetryPopup, setShowRetryPopup] = useState(false);
  const [failedKeywords, setFailedKeywords] = useState<Array<{
    keyword_id: number;
    keyword_datum: string;
    batch_id: number;
    batch_name: string;
    fetch_id: number;
  }>>([]);
  const [loadingFailedKeywords, setLoadingFailedKeywords] = useState(false);
  const [failedKeywordCount, setFailedKeywordCount] = useState<number>(0);
  
  // Delete keywords state
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Debug selected tag changes
  useEffect(() => {
    console.log('🏷️ [PCLIENT] selectedTag changed:', selectedTag);
  }, [selectedTag]);

  // Check for failed keywords on page load
  useEffect(() => {
    const checkFailedCount = async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: recentBatches } = await supabase
          .from('zhe_serp_fetch_batches')
          .select('batch_id, failed_keywords')
          .gt('failed_keywords', 0)
          .gte('created_at', sevenDaysAgo.toISOString());

        if (!recentBatches || recentBatches.length === 0) {
          setFailedKeywordCount(0);
          return;
        }

        const batchIds = recentBatches.map(b => b.batch_id);
        const { data: failedFetches } = await supabase
          .from('zhe_serp_fetches')
          .select('fetch_id, items_count')
          .in('batch_id', batchIds);

        const failedCount = failedFetches?.filter(f => f.items_count === '0' || !f.items_count).length || 0;
        setFailedKeywordCount(failedCount);
      } catch (error) {
        console.error('Error checking failed keyword count:', error);
      }
    };

    checkFailedCount();
  }, [supabase]);
  const [columnPaginationControls, setColumnPaginationControls] = useState<{
    ColumnPaginationBar1: () => JSX.Element | null;
    ColumnPaginationBar2: () => JSX.Element | null;
  } | null>(null);
  const [mainPaginationControls, setMainPaginationControls] = useState<{
    PaginationControls: () => JSX.Element;
    SearchField: () => JSX.Element;
    itemsPerPage: number;
    setItemsPerPage: (value: number) => void;
    currentPage: number;
    setCurrentPage: (value: number) => void;
    totalPages: number;
    totalItems: number;
    paginatedDataLength: number;
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
  const [venlarChamberVisible, setVenlarChamberVisible] = useState(true);
  const [protozoicChamberVisible, setProtozoicChamberVisible] = useState(true);
  const [mesozoicChamberVisible, setMesozoicChamberVisible] = useState(true);
  const [rocketChamberVisible, setRocketChamberVisible] = useState(true);
  const [showHoistColumns, setShowHoistColumns] = useState(true);
  const [showJoistColumns, setShowJoistColumns] = useState(true);
  const [showRelExactCityIdColumn, setShowRelExactCityIdColumn] = useState(false);
  const [showAssociatedPrincipalCityColumn, setShowAssociatedPrincipalCityColumn] = useState(false);
  
  // Venlar chamber filter states
  const [dfsFetchStatusFilter, setDfsFetchStatusFilter] = useState('all');
  const [searchVolumeFilter, setSearchVolumeFilter] = useState('all');
  const [cpcFilter, setCpcFilter] = useState('all');
  const [competitionFilter, setCompetitionFilter] = useState('all');
  const [competitionIndexFilter, setCompetitionIndexFilter] = useState('all');
  const [exactCityPopulationFilter, setExactCityPopulationFilter] = useState('all');
  const [largestCityPopulationFilter, setLargestCityPopulationFilter] = useState('all');
  const [cityClassificationFilter, setCityClassificationFilter] = useState('all');

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
    
    const savedVenlar = localStorage.getItem('kwjar_venlarChamberVisible');
    if (savedVenlar !== null) {
      setVenlarChamberVisible(JSON.parse(savedVenlar));
    }
    
    const savedProtozoic = localStorage.getItem('kwjar_protozoicChamberVisible');
    if (savedProtozoic !== null) {
      setProtozoicChamberVisible(JSON.parse(savedProtozoic));
    }
    
    const savedMesozoic = localStorage.getItem('kwjar_mesozoicChamberVisible');
    if (savedMesozoic !== null) {
      setMesozoicChamberVisible(JSON.parse(savedMesozoic));
    }
    
    const savedRocket = localStorage.getItem('kwjar_rocketChamberVisible');
    if (savedRocket !== null) {
      setRocketChamberVisible(JSON.parse(savedRocket));
    }
    
    const savedHoistColumns = localStorage.getItem('kwjar_showHoistColumns');
    if (savedHoistColumns !== null) {
      setShowHoistColumns(JSON.parse(savedHoistColumns));
    }
    
    const savedJoistColumns = localStorage.getItem('kwjar_showJoistColumns');
    if (savedJoistColumns !== null) {
      setShowJoistColumns(JSON.parse(savedJoistColumns));
    }
    
    const savedRelExactCityId = localStorage.getItem('kwjar_showRelExactCityIdColumn');
    if (savedRelExactCityId !== null) {
      setShowRelExactCityIdColumn(JSON.parse(savedRelExactCityId));
    }
    
    const savedAssociatedPrincipalCity = localStorage.getItem('kwjar_showAssociatedPrincipalCityColumn');
    if (savedAssociatedPrincipalCity !== null) {
      setShowAssociatedPrincipalCityColumn(JSON.parse(savedAssociatedPrincipalCity));
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
    
    const handleVenlarChange = (event: CustomEvent) => {
      setVenlarChamberVisible(event.detail.visible);
      localStorage.setItem('kwjar_venlarChamberVisible', JSON.stringify(event.detail.visible));
    };
    
    const handleProtozoicChange = (event: CustomEvent) => {
      setProtozoicChamberVisible(event.detail.visible);
    };
    
    const handleMesozoicChange = (event: CustomEvent) => {
      setMesozoicChamberVisible(event.detail.visible);
    };
    
    const handleRocketChange = (event: CustomEvent) => {
      setRocketChamberVisible(event.detail.visible);
    };

    window.addEventListener('kwjarMandibleChamberVisibilityChange', handleMandibleChange as EventListener);
    window.addEventListener('kwjarSinusChamberVisibilityChange', handleSinusChange as EventListener);
    window.addEventListener('kwjarVenlarChamberVisibilityChange', handleVenlarChange as EventListener);
    window.addEventListener('kwjarProtozoicChamberVisibilityChange', handleProtozoicChange as EventListener);
    window.addEventListener('kwjarMesozoicChamberVisibilityChange', handleMesozoicChange as EventListener);
    window.addEventListener('kwjarRocketChamberVisibilityChange', handleRocketChange as EventListener);
    
    return () => {
      window.removeEventListener('kwjarMandibleChamberVisibilityChange', handleMandibleChange as EventListener);
      window.removeEventListener('kwjarSinusChamberVisibilityChange', handleSinusChange as EventListener);
      window.removeEventListener('kwjarVenlarChamberVisibilityChange', handleVenlarChange as EventListener);
      window.removeEventListener('kwjarProtozoicChamberVisibilityChange', handleProtozoicChange as EventListener);
      window.removeEventListener('kwjarMesozoicChamberVisibilityChange', handleMesozoicChange as EventListener);
      window.removeEventListener('kwjarRocketChamberVisibilityChange', handleRocketChange as EventListener);
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
    let batchId: number | null = null;

    try {
      // ═══════════════════════════════════════════════════════════
      // STEP 0: Create batch record
      // ═══════════════════════════════════════════════════════════
      console.log('📦 Creating Gazelle batch record...');
      const { data: batchData, error: batchError } = await supabase.rpc('create_serp_fetch_batch', {
        p_batch_name: `Gazelle Bulk: ${selectedKeywordIds.length} keywords`,
        p_batch_source: 'bulk-kwjar',
        p_user_id: user?.id || null,
        p_total_keywords: selectedKeywordIds.length
      });

      if (batchError) {
        console.error('Error creating batch:', batchError);
        throw new Error('Failed to create batch record');
      }

      batchId = batchData;
      console.log(`✅ Batch created: #${batchId}`);

      for (let i = 0; i < selectedKeywordIds.length; i++) {
        const keywordId = selectedKeywordIds[i];
        setGazelleProgress({ current: i + 1, total: selectedKeywordIds.length });

        try {
          console.log(`Gazelle Bulk: Processing keyword ${i + 1}/${selectedKeywordIds.length} (ID: ${keywordId}) [Batch #${batchId}] - Mode: ${f400Mode}`);

          // Step 1: Run F400 (SERP Fetch) - use selected mode
          const f400Endpoint = f400Mode === 'live' ? '/api/f400-live' : '/api/f400';
          const f400Response = await fetch(f400Endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              keyword_id: keywordId,
              batch_id: batchId,
              fetch_source: 'bulk-kwjar',
              initiated_by_user_id: user?.id || null
            }),
          });

          const f400Result = await f400Response.json();

          if (!f400Response.ok) {
            throw new Error(f400Result.error || 'F400 failed');
          }

          // For queued mode, wait and complete the pending fetch
          if (f400Mode === 'queued' && f400Result.status === 'pending') {
            console.log(`Gazelle Bulk: Waiting for queued fetch to complete (keyword ${keywordId})...`);
            
            // Wait 60 seconds for the queued task
            await new Promise(resolve => setTimeout(resolve, 60000));
            
            // Try to complete the pending fetch
            const completeResponse = await fetch('/api/f400-complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fetch_id: f400Result.fetch_id,
              }),
            });

            const completeResult = await completeResponse.json();
            
            if (!completeResponse.ok || !completeResult.success) {
              throw new Error('F400 queued fetch did not complete in time. Keyword may need manual retry.');
            }
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

          // Update batch progress after successful completion
          if (batchId) {
            await supabase.rpc('update_batch_progress', {
              p_batch_id: batchId,
              p_completed: successCount + failCount,
              p_failed: failCount,
              p_status: null // Keep as 'in_progress' until done
            });
          }
        } catch (error) {
          console.error(`Error processing keyword ${keywordId}:`, error);
          results.push({
            keyword_id: keywordId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          failCount++;

          // Update batch progress after failure
          if (batchId) {
            await supabase.rpc('update_batch_progress', {
              p_batch_id: batchId,
              p_completed: successCount + failCount,
              p_failed: failCount,
              p_status: null // Keep as 'in_progress'
            });
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // Mark batch as completed
      // ═══════════════════════════════════════════════════════════
      if (batchId) {
        const finalStatus = failCount === selectedKeywordIds.length ? 'failed' : 'completed';
        await supabase.rpc('update_batch_progress', {
          p_batch_id: batchId,
          p_completed: successCount + failCount,
          p_failed: failCount,
          p_status: finalStatus
        });
        console.log(`✅ Batch #${batchId} marked as ${finalStatus}`);
      }

      // Show final results
      const successResults = results.filter(r => r.success);
      const totalF400Results = successResults.reduce((sum, r) => sum + r.f400_results, 0);
      const totalF410Matches = successResults.reduce((sum, r) => sum + r.f410_matches, 0);
      const totalF420Relations = successResults.reduce((sum, r) => sum + r.f420_relations, 0);

      alert(
        `🦌 Gazelle Bulk Processing Complete!\n\n` +
        `Batch ID: #${batchId}\n` +
        `F400 Mode: ${f400Mode === 'live' ? 'Live (instant)' : 'Queued (delayed)'}\n` +
        `Total Keywords Processed: ${selectedKeywordIds.length}\n` +
        `✅ Successful: ${successCount}\n` +
        `❌ Failed: ${failCount}\n\n` +
        `📊 Results:\n` +
        `• Total SERP results fetched: ${totalF400Results}\n` +
        `• Total EMD matches found: ${totalF410Matches}\n` +
        `• Total zone relations created: ${totalF420Relations}\n\n` +
        `Estimated cost: $${(successCount * (f400Mode === 'live' ? 0.015 : 0.002)).toFixed(2)} USD\n\n` +
        `The page will now refresh.`
      );

      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Gazelle bulk processing error:', error);
      
      // Mark batch as failed if it was created
      if (batchId) {
        await supabase.rpc('update_batch_progress', {
          p_batch_id: batchId,
          p_completed: successCount + failCount,
          p_failed: failCount,
          p_status: 'failed'
        });
      }
      
      alert(`Gazelle bulk processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGazelleLoading(false);
      setGazelleProgress({ current: 0, total: 0 });
    }
  };

  // Check for failed keywords in recent batches
  const checkForFailedKeywords = async () => {
    setLoadingFailedKeywords(true);
    try {
      // Get recent batches from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentBatches, error: batchError } = await supabase
        .from('zhe_serp_fetch_batches')
        .select('batch_id, batch_name, failed_keywords')
        .gt('failed_keywords', 0)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (batchError) throw batchError;

      if (!recentBatches || recentBatches.length === 0) {
        alert('No failed keywords found in recent batches.');
        return;
      }

      // Get all fetches from these batches
      const batchIds = recentBatches.map(b => b.batch_id);
      const { data: batchFetches, error: fetchError } = await supabase
        .from('zhe_serp_fetches')
        .select(`
          fetch_id,
          rel_keyword_id,
          batch_id,
          items_count
        `)
        .in('batch_id', batchIds);

      if (fetchError) throw fetchError;

      // Find fetches with no results (failed)
      const failedFetches = batchFetches?.filter(f => f.items_count === '0' || !f.items_count) || [];

      if (failedFetches.length === 0) {
        alert('All keywords in recent batches have been successfully fetched.');
        return;
      }

      // Get keyword details for failed fetches
      const keywordIds = failedFetches.map(f => f.rel_keyword_id);
      const { data: keywordDetails, error: kwError } = await supabase
        .from('keywordshub')
        .select('keyword_id, keyword_datum')
        .in('keyword_id', keywordIds);

      if (kwError) throw kwError;

      // Merge data
      const failedKeywordsList = failedFetches.map(fetch => {
        const keyword = keywordDetails?.find(k => k.keyword_id === fetch.rel_keyword_id);
        const batch = recentBatches.find(b => b.batch_id === fetch.batch_id);
        
        return {
          keyword_id: fetch.rel_keyword_id,
          keyword_datum: keyword?.keyword_datum || `Unknown (ID: ${fetch.rel_keyword_id})`,
          batch_id: fetch.batch_id!,
          batch_name: batch?.batch_name || `Batch #${fetch.batch_id}`,
          fetch_id: fetch.fetch_id
        };
      });

      setFailedKeywords(failedKeywordsList);
      setShowRetryPopup(true);
    } catch (error) {
      console.error('Error checking for failed keywords:', error);
      alert('Error checking for failed keywords');
    } finally {
      setLoadingFailedKeywords(false);
    }
  };

  // Delete keywords function
  const deleteSelectedKeywords = async () => {
    if (selectedKeywordIds.length === 0) {
      alert('Please select keywords to delete');
      return;
    }

    setDeleteLoading(true);

    try {
      console.log('🗑️ Fetching associated tags for selected keywords...');

      // First, get all associated tags for the selected keywords
      const { data: tagRelations, error: tagError } = await supabase
        .from('keywordshub_tag_relations')
        .select(`
          fk_keyword_id,
          keywordshub_tags (
            tag_id,
            tag_name
          ),
          keywordshub!keywordshub_tag_relations_fk_keyword_id_fkey (
            keyword_datum
          )
        `)
        .in('fk_keyword_id', selectedKeywordIds);

      if (tagError) {
        console.error('Error fetching tag relations:', tagError);
        throw new Error(`Failed to fetch associated tags: ${tagError.message}`);
      }

      // Process the tag data
      const associatedTags = new Set();
      const keywordTagMap = new Map();

      tagRelations?.forEach(relation => {
        const tag = relation.keywordshub_tags;
        const keyword = relation.keywordshub;
        if (tag) {
          associatedTags.add(`${tag.tag_name} (ID: ${tag.tag_id})`);
          if (!keywordTagMap.has(relation.fk_keyword_id)) {
            keywordTagMap.set(relation.fk_keyword_id, {
              keyword_datum: keyword?.keyword_datum || `ID: ${relation.fk_keyword_id}`,
              tags: []
            });
          }
          keywordTagMap.get(relation.fk_keyword_id).tags.push(tag.tag_name);
        }
      });

      const tagList = Array.from(associatedTags);
      const taggedKeywordsList = Array.from(keywordTagMap.entries())
        .map(([keywordId, data]) => `• ${data.keyword_datum}: ${data.tags.join(', ')}`)
        .join('\n');

      // Create detailed confirmation message
      let confirmMessage = `Are you sure you want to delete ${selectedKeywordIds.length} keywords and clear them from any cncglub.kwslot* tables?\n\n`;
      
      if (tagList.length > 0) {
        confirmMessage += `⚠️ DELETE ANY ASSOCIATED KEYWORD TAGS\n\n`;
        confirmMessage += `The following tags will be removed from these keywords:\n`;
        confirmMessage += `${tagList.join('\n')}\n\n`;
        confirmMessage += `Keywords with tags:\n${taggedKeywordsList}\n\n`;
      }
      
      confirmMessage += `This action cannot be undone.`;

      const confirmed = window.confirm(confirmMessage);

      if (!confirmed) {
        setDeleteLoading(false);
        return;
      }

      console.log('🗑️ Starting delete operation for keywords:', selectedKeywordIds);

      // Delete tag relations first
      if (tagRelations && tagRelations.length > 0) {
        console.log('🗑️ Deleting keyword tag relations...');
        const { error: tagDeleteError } = await supabase
          .from('keywordshub_tag_relations')
          .delete()
          .in('fk_keyword_id', selectedKeywordIds);

        if (tagDeleteError) {
          throw new Error(`Failed to delete keyword tag relations: ${tagDeleteError.message}`);
        }
        console.log(`✅ Deleted ${tagRelations.length} tag relations`);
      }

      // Delete from cncglub kwslot tables
      const response = await fetch('/api/delete-keywords-cncglub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword_ids: selectedKeywordIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to clear cncglub data: ${response.statusText}`);
      }

      // Then delete from keywordshub table
      const { error: deleteError } = await supabase
        .from('keywordshub')
        .delete()
        .in('keyword_id', selectedKeywordIds);

      if (deleteError) {
        throw new Error(`Failed to delete keywords: ${deleteError.message}`);
      }

      console.log('✅ Successfully deleted keywords and cleared cncglub data');
      
      let successMessage = `Successfully deleted ${selectedKeywordIds.length} keywords and cleared them from cncglub tables`;
      if (tagRelations && tagRelations.length > 0) {
        successMessage += `\n\nAlso removed ${tagRelations.length} keyword tag associations`;
      }
      
      alert(successMessage);

      // Clear selection and refresh data
      setSelectedKeywordIds([]);
      window.dispatchEvent(new Event('kwjar-refresh-needed'));

    } catch (error) {
      console.error('❌ Error deleting keywords:', error);
      alert(`Error deleting keywords: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Force select all keywords in current filters function
  const forceSelectAllInFilters = async () => {
    try {
      // We need to get all keywords matching current filters from the table component
      // For now, we'll trigger a custom event that the table can listen to
      const event = new CustomEvent('force-select-all-in-filters', {
        detail: { 
          selectedKeywordIds,
          setSelectedKeywordIds: (ids: number[]) => setSelectedKeywordIds(ids)
        }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error in force select all:', error);
    }
  };

  // Retry failed keywords - auto-run Gazelle
  const retryFailedKeywords = async (keywordsToRetry: number[]) => {
    if (keywordsToRetry.length === 0) return;

    setShowRetryPopup(false);
    setGazelleLoading(true);
    setGazelleProgress({ current: 0, total: keywordsToRetry.length });

    let successCount = 0;
    let failCount = 0;
    const results: any[] = [];
    let batchId: number | null = null;

    try {
      // Create retry batch
      console.log('📦 Creating retry batch record...');
      const { data: retryBatchId, error: batchError } = await supabase.rpc('create_serp_fetch_batch', {
        p_batch_name: `Retry: ${keywordsToRetry.length} failed keywords`,
        p_batch_source: 'bulk-kwjar',
        p_user_id: user?.id || null,
        p_total_keywords: keywordsToRetry.length
      });

      if (batchError || !retryBatchId) {
        throw new Error('Failed to create retry batch');
      }

      batchId = retryBatchId;
      console.log(`✅ Retry batch created: #${batchId}`);

      // Run Gazelle on each failed keyword
      for (let i = 0; i < keywordsToRetry.length; i++) {
        const keywordId = keywordsToRetry[i];
        setGazelleProgress({ current: i + 1, total: keywordsToRetry.length });

        try {
          // Run F400, F410, F420 (same as main Gazelle)
          const f400Response = await fetch('/api/f400-live', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keyword_id: keywordId,
              batch_id: batchId,
              fetch_source: 'bulk-kwjar',
              initiated_by_user_id: user?.id || null
            }),
          });

          const f400Result = await f400Response.json();
          if (!f400Response.ok) throw new Error(f400Result.error || 'F400 failed');

          const f410Response = await fetch('/api/f410', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword_id: keywordId }),
          });

          const f410Result = await f410Response.json();
          if (!f410Response.ok) throw new Error(f410Result.error || 'F410 failed');

          const f420Response = await fetch('/api/f420', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keyword_id: keywordId,
              emd_stamp_method: 'method-1',
            }),
          });

          const f420Result = await f420Response.json();
          if (!f420Response.ok) throw new Error(f420Result.error || 'F420 failed');

          results.push({
            keyword_id: keywordId,
            success: true,
            f400_results: f400Result.organic_results_stored || 0,
            f410_matches: f410Result.matches_found || 0,
            f420_zones: f420Result.zones_cached || 0,
            f420_relations: f420Result.relations_created || 0,
          });
          successCount++;

          if (batchId) {
            await supabase.rpc('update_batch_progress', {
              p_batch_id: batchId,
              p_completed: successCount + failCount,
              p_failed: failCount,
              p_status: null
            });
          }
        } catch (error) {
          console.error(`Error processing keyword ${keywordId}:`, error);
          results.push({
            keyword_id: keywordId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          failCount++;

          if (batchId) {
            await supabase.rpc('update_batch_progress', {
              p_batch_id: batchId,
              p_completed: successCount + failCount,
              p_failed: failCount,
              p_status: null
            });
          }
        }
      }

      // Mark batch as completed
      if (batchId) {
        const finalStatus = failCount === keywordsToRetry.length ? 'failed' : 'completed';
        await supabase.rpc('update_batch_progress', {
          p_batch_id: batchId,
          p_completed: successCount + failCount,
          p_failed: failCount,
          p_status: finalStatus
        });
      }

      // Show results
      alert(
        `🔄 Retry Complete!\n\n` +
        `Batch ID: #${batchId}\n` +
        `✅ Successful: ${successCount}\n` +
        `❌ Failed Again: ${failCount}\n\n` +
        `The page will now refresh.`
      );

      window.location.reload();
    } catch (error) {
      console.error('Retry error:', error);
      
      if (batchId) {
        await supabase.rpc('update_batch_progress', {
          p_batch_id: batchId,
          p_status: 'failed'
        });
      }
      
      alert(`Retry failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Handle refresh tag filter - force table to re-filter by current tag
  const handleRefreshTagFilter = () => {
    if (selectedTag) {
      console.log('🔄 Refreshing tag filter for:', selectedTag);
      // Increment the refresh key to force KeywordsHubTable to re-render and re-fetch
      setTagFilterRefreshKey(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mandible Chamber */}
      {mandibleChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            mandible_chamber
          </div>
          
          {/* Moved header content */}
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">🔍 Keywords Hub</h1>
            <ClavedoriButtonBar />
            <ZhedoriButtonBar />
            
            
            {/* Joist Columns Toggle */}
            <div className="flex flex-col gap-2 border border-gray-300 rounded px-3 py-2 bg-gray-50">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Show joist columns</span>
                <button
                  onClick={() => {
                    const newValue = !showJoistColumns;
                    setShowJoistColumns(newValue);
                    localStorage.setItem('kwjar_showJoistColumns', JSON.stringify(newValue));
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showJoistColumns ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showJoistColumns ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Sub-options for joist columns */}
              <div className="ml-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">rel_exact_city_id</span>
                  <button
                    onClick={() => {
                      const newValue = !showRelExactCityIdColumn;
                      setShowRelExactCityIdColumn(newValue);
                      localStorage.setItem('kwjar_showRelExactCityIdColumn', JSON.stringify(newValue));
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      showRelExactCityIdColumn ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        showRelExactCityIdColumn ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">associated_principal_city</span>
                  <button
                    onClick={() => {
                      const newValue = !showAssociatedPrincipalCityColumn;
                      setShowAssociatedPrincipalCityColumn(newValue);
                      localStorage.setItem('kwjar_showAssociatedPrincipalCityColumn', JSON.stringify(newValue));
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      showAssociatedPrincipalCityColumn ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        showAssociatedPrincipalCityColumn ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Hoist Columns Toggle */}
            <div className="flex flex-wrap items-center gap-2 border border-gray-300 rounded px-3 py-2 bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Show hoist columns</span>
              <button
                onClick={() => {
                  const newValue = !showHoistColumns;
                  setShowHoistColumns(newValue);
                  localStorage.setItem('kwjar_showHoistColumns', JSON.stringify(newValue));
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showHoistColumns ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showHoistColumns ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sinus Chamber */}
      {sinusChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            sinus_chamber
          </div>
          
          {/* Industry Selection Controls - Wrapped in bordered div */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-3 border border-black p-2 rounded-md">
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
                  setF400Mode(null); // Reset mode for fresh selection
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
                  ? `Processing ${gazelleProgress.current}/${gazelleProgress.total}... (${f400Mode === 'live' ? 'LIVE' : 'QUEUED'})`
                  : `🦌 Gazelle Aggregate ${selectedKeywordIds.length > 0 ? `(${selectedKeywordIds.length})` : ''}`
                }
              </button>

              {/* Retry Failed Keywords Button */}
              <button
                onClick={checkForFailedKeywords}
                disabled={loadingFailedKeywords}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors relative ${
                  loadingFailedKeywords
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : failedKeywordCount > 0
                    ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                    : 'bg-gray-400 text-white'
                }`}
                title={failedKeywordCount > 0 
                  ? `${failedKeywordCount} failed keywords available to retry`
                  : 'No failed keywords in recent batches'}
              >
                {loadingFailedKeywords ? 'Checking...' : 
                 failedKeywordCount > 0 ? `🔄 Retry Failed (${failedKeywordCount})` : 
                 '🔄 No Failed Keywords'}
                {failedKeywordCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {failedKeywordCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Retry Failed Keywords Popup */}
      {showRetryPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔄</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Retry Failed Keywords</h3>
                    <p className="text-sm text-gray-600">{failedKeywords.length} keywords failed in recent batches</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRetryPopup(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> These keywords had fetch errors (network timeout, API issues, etc.). 
                  Retrying will create a new batch and run F400+F410+F420 for each.
                </p>
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-3 py-2 text-left text-xs font-semibold">Keyword ID</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold">Keyword</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold">Original Batch</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold">Fetch ID</th>
                  </tr>
                </thead>
                <tbody>
                  {failedKeywords.map((kw, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-xs font-mono">{kw.keyword_id}</td>
                      <td className="border px-3 py-2 text-xs">{kw.keyword_datum}</td>
                      <td className="border px-3 py-2 text-xs text-gray-600">{kw.batch_name}</td>
                      <td className="border px-3 py-2 text-xs font-mono text-gray-500">{kw.fetch_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-700">
                  <strong>{failedKeywords.length}</strong> keyword{failedKeywords.length !== 1 ? 's' : ''} will be selected for retry
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRetryPopup(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => retryFailedKeywords(failedKeywords.map(kw => kw.keyword_id))}
                    className="px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-md transition-colors font-medium"
                  >
                    🔄 Select & Prepare for Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Venlar Chamber */}
      {venlarChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            venlar_chamber
          </div>
          
          {/* Filter Dropdowns Table */}
          <table style={{ border: '1px solid gray', borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">DFS Fetch Status</div>
                </th>
                <th style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">Search Volume</div>
                </th>
                <th style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">CPC</div>
                </th>
                <th style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">Competition</div>
                </th>
                <th style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">Competition Index</div>
                </th>
                <th style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">City Classification (joist)</div>
                </th>
                <th style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">Exact City Pop (joist)</div>
                </th>
                <th style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">Largest City Pop (hoist)</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">
                    <select
                      value={dfsFetchStatusFilter}
                      onChange={(e) => setDfsFetchStatusFilter(e.target.value)}
                      className={`border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        dfsFetchStatusFilter !== 'all' ? 'bg-navy text-white' : 'bg-white text-gray-700'
                      }`}
                      style={dfsFetchStatusFilter !== 'all' ? { backgroundColor: 'navy', color: 'white' } : {}}
                    >
                      <option value="all">all</option>
                      <option value="fetched">fetched</option>
                      <option value="pending">pending</option>
                      <option value="error">error</option>
                    </select>
                  </div>
                </td>
                <td style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">
                    <select
                      value={searchVolumeFilter}
                      onChange={(e) => setSearchVolumeFilter(e.target.value)}
                      className={`border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        searchVolumeFilter !== 'all' ? 'bg-navy text-white' : 'bg-white text-gray-700'
                      }`}
                      style={searchVolumeFilter !== 'all' ? { backgroundColor: 'navy', color: 'white' } : {}}
                    >
                      <option value="all">all</option>
                      <option value="> 1000">&gt; 1,000</option>
                      <option value="> 750">&gt; 750</option>
                      <option value="> 500">&gt; 500</option>
                      <option value="> 250">&gt; 250</option>
                      <option value="> 100">&gt; 100</option>
                      <option value="> 50">&gt; 50</option>
                      <option value="> 20">&gt; 20</option>
                      <option value="> 10">&gt; 10</option>
                      <option value="> 5">&gt; 5</option>
                    </select>
                  </div>
                </td>
                <td style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">
                    <select
                      value={cpcFilter}
                      onChange={(e) => setCpcFilter(e.target.value)}
                      className={`border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        cpcFilter !== 'all' ? 'bg-navy text-white' : 'bg-white text-gray-700'
                      }`}
                      style={cpcFilter !== 'all' ? { backgroundColor: 'navy', color: 'white' } : {}}
                    >
                      <option value="all">all</option>
                      <option value="< 5">&lt; $5</option>
                      <option value="< 10">&lt; $10</option>
                      <option value="< 20">&lt; $20</option>
                      <option value="< 30">&lt; $30</option>
                    </select>
                  </div>
                </td>
                <td style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">
                    <select
                      value={competitionFilter}
                      onChange={(e) => setCompetitionFilter(e.target.value)}
                      className={`border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        competitionFilter !== 'all' ? 'bg-navy text-white' : 'bg-white text-gray-700'
                      }`}
                      style={competitionFilter !== 'all' ? { backgroundColor: 'navy', color: 'white' } : {}}
                    >
                      <option value="all">all</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM + LOW">MEDIUM + LOW</option>
                    </select>
                  </div>
                </td>
                <td style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">
                    <select
                      value={competitionIndexFilter}
                      onChange={(e) => setCompetitionIndexFilter(e.target.value)}
                      className={`border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        competitionIndexFilter !== 'all' ? 'bg-navy text-white' : 'bg-white text-gray-700'
                      }`}
                      style={competitionIndexFilter !== 'all' ? { backgroundColor: 'navy', color: 'white' } : {}}
                    >
                      <option value="all">all</option>
                      <option value="0-20">0-20</option>
                      <option value="21-50">21-50</option>
                      <option value="51-100">51-100</option>
                    </select>
                  </div>
                </td>
                <td style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">
                    <select
                      value={cityClassificationFilter}
                      onChange={(e) => setCityClassificationFilter(e.target.value)}
                      className={`border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        cityClassificationFilter !== 'all' ? 'bg-navy text-white' : 'bg-white text-gray-700'
                      }`}
                      style={cityClassificationFilter !== 'all' ? { backgroundColor: 'navy', color: 'white' } : {}}
                    >
                      <option value="all">all</option>
                      <option value="principal_city">principal_city</option>
                      <option value="formidable_suburb">formidable_suburb</option>
                      <option value="smaller_suburb">smaller_suburb</option>
                    </select>
                  </div>
                </td>
                <td style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">
                    <select
                      value={exactCityPopulationFilter}
                      onChange={(e) => setExactCityPopulationFilter(e.target.value)}
                      className={`border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        exactCityPopulationFilter !== 'all' ? 'bg-navy text-white' : 'bg-white text-gray-700'
                      }`}
                      style={exactCityPopulationFilter !== 'all' ? { backgroundColor: 'navy', color: 'white' } : {}}
                    >
                      <option value="all">all</option>
                      <option value="0-20k">0-20k</option>
                      <option value="20-30k">20-30k</option>
                      <option value="30-40k">30-40k</option>
                      <option value="40-50k">40-50k</option>
                      <option value="50-60k">50-60k</option>
                      <option value="60-80k">60-80k</option>
                      <option value="80-100k">80-100k</option>
                      <option value="100-150k">100-150k</option>
                      <option value="150-200k">150-200k</option>
                      <option value="200-300k">200-300k</option>
                      <option value="300-450k">300-450k</option>
                      <option value="450-600k">450-600k</option>
                      <option value="600k-infinity">600k-infinity</option>
                    </select>
                  </div>
                </td>
                <td style={{ border: '1px solid gray', padding: '0' }}>
                  <div className="cell_inner_wrapper_div">
                    <select
                      value={largestCityPopulationFilter}
                      onChange={(e) => setLargestCityPopulationFilter(e.target.value)}
                      className={`border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        largestCityPopulationFilter !== 'all' ? 'bg-navy text-white' : 'bg-white text-gray-700'
                      }`}
                      style={largestCityPopulationFilter !== 'all' ? { backgroundColor: 'navy', color: 'white' } : {}}
                    >
                      <option value="all">all</option>
                      <option value="0-20k">0-20k</option>
                      <option value="20-30k">20-30k</option>
                      <option value="30-40k">30-40k</option>
                      <option value="40-50k">40-50k</option>
                      <option value="50-60k">50-60k</option>
                      <option value="60-80k">60-80k</option>
                      <option value="80-100k">80-100k</option>
                      <option value="100-150k">100-150k</option>
                      <option value="150-200k">150-200k</option>
                      <option value="200-300k">200-300k</option>
                      <option value="300-450k">300-450k</option>
                      <option value="450-600k">450-600k</option>
                      <option value="600k-infinity">600k-infinity</option>
                    </select>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Protozoic Chamber */}
      {protozoicChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            protozoic_chamber
          </div>
          
          {/* Moved buttons and controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Functions Popup Button (styled like nwjar1) */}
              <button
                onClick={() => setIsPopupOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                functions popup
              </button>
              
              {/* Tags section with border */}
              <div className="flex flex-wrap items-center gap-2 border border-black px-3 py-2 rounded">
                <button
                  onClick={() => setIsTagsPopupOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <div className="w-4 h-4 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-sm border border-yellow-400 relative">
                    <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-yellow-100 rounded-full opacity-60"></div>
                    <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-yellow-600 rounded-full"></div>
                  </div>
                  <span>tags plench button</span>
                </button>
                
                {selectedTag && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-medium bg-navy text-white border border-black px-3 py-1 rounded" style={{ backgroundColor: 'navy' }}>
                      {selectedTag.tag_name}
                    </div>
                    
                    {/* REFRESH button */}
                    <button
                      onClick={handleRefreshTagFilter}
                      className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                      title="Refresh tag filter"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>REFRESH</span>
                    </button>
                    
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                      title="Clear filter"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={deleteSelectedKeywords}
                disabled={deleteLoading || selectedKeywordIds.length === 0}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  deleteLoading || selectedKeywordIds.length === 0
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {deleteLoading 
                  ? 'Deleting...' 
                  : `delete kws and clear from any cncglub.kwslot* (${selectedKeywordIds.length} selected)`
                }
              </button>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">DataForSEO Integration</div>
              <div className="text-xs text-gray-400">Project: Keywords Research</div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Keywords Box */}
      {protozoicChamberVisible && (
        <div className="border border-black p-1" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="flex items-center gap-2 text-sm">
            <span>Selected KW Rows: ({selectedKeywordIds.length})</span>
            <button
              onClick={forceSelectAllInFilters}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Force Select All In Current Filters Regardless Of Pagination
            </button>
            <ExportButton 
              allFilteredData={exportData.allFilteredData}
              selectedData={exportData.selectedData}
              starredData={exportData.starredData}
              chosenData={exportData.chosenData}
              columns={exportData.columns}
            />
            
            {/* Vertical Separator */}
            <div className="border-l border-black h-6" style={{ borderLeftWidth: '5px' }}></div>
            
            <button
              onClick={() => {
                // Select all starred on current page only
                const currentPageStarredIds = exportData.paginatedData
                  .filter(item => item.is_starred === true)
                  .map(item => item.keyword_id);
                
                setSelectedKeywordIds(currentPageStarredIds);
                
                // Also dispatch custom event to update table internal selection
                window.dispatchEvent(new CustomEvent('forceSelectKeywords', {
                  detail: { keywordIds: currentPageStarredIds }
                }));
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Select All Starred On This Page
            </button>
            
            <button
              onClick={() => {
                // Select all starred in all current filtered data
                const allStarredIds = exportData.starredData.map(item => item.keyword_id);
                
                setSelectedKeywordIds(allStarredIds);
                
                // Also dispatch custom event to update table internal selection
                window.dispatchEvent(new CustomEvent('forceSelectKeywords', {
                  detail: { keywordIds: allStarredIds }
                }));
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Select All Starred In All Current Filtered
            </button>
            
            {/* Vertical Separator */}
            <div className="border-l border-black h-6" style={{ borderLeftWidth: '5px' }}></div>
            
            <button
              onClick={() => {
                // Select all chosen on current page only
                const currentPageChosenIds = exportData.paginatedData
                  .filter(item => item.is_chosen === true)
                  .map(item => item.keyword_id);
                
                setSelectedKeywordIds(currentPageChosenIds);
                
                // Also dispatch custom event to update table internal selection
                window.dispatchEvent(new CustomEvent('forceSelectKeywords', {
                  detail: { keywordIds: currentPageChosenIds }
                }));
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Select All is_chosen On This Page
            </button>
            
            <button
              onClick={() => {
                // Select all chosen in all current filtered data
                const allChosenIds = exportData.allFilteredData
                  .filter(item => item.is_chosen === true)
                  .map(item => item.keyword_id);
                
                setSelectedKeywordIds(allChosenIds);
                
                // Also dispatch custom event to update table internal selection
                window.dispatchEvent(new CustomEvent('forceSelectKeywords', {
                  detail: { keywordIds: allChosenIds }
                }));
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Select All is_chosen In All Current Filtered
            </button>
            
            <button
              onClick={() => {
                // Select all chosen in all filtered data (mirroring starred functionality)
                const allChosenIds = exportData.chosenData.map(item => item.keyword_id);
                
                setSelectedKeywordIds(allChosenIds);
                
                // Also dispatch custom event to update table internal selection
                window.dispatchEvent(new CustomEvent('forceSelectKeywords', {
                  detail: { keywordIds: allChosenIds }
                }));
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Select All is_chosen In All Filtered
            </button>
            
            {/* Vertical Separator */}
            <div className="border-l border-black h-6" style={{ borderLeftWidth: '5px' }}></div>
            
            <button
              onClick={() => {
                // Clear all selections
                setSelectedKeywordIds([]);
                
                // Also dispatch custom event to clear table internal selection
                window.dispatchEvent(new CustomEvent('forceSelectKeywords', {
                  detail: { keywordIds: [] }
                }));
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Mesozoic Chamber */}
      {mesozoicChamberVisible && (
        <div className="border border-black p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            mesozoic_chamber
          </div>
          
        </div>
      )}
      
      {/* Rocket Chamber */}
      {rocketChamberVisible && (
        <div className="border border-black" style={{ 
          marginTop: '0px', 
          marginLeft: '16px', 
          marginRight: '16px', 
          marginBottom: '0px',
          padding: 0,
          margin: 0,
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            top: '4px', 
            left: '4px', 
            fontSize: '16px', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <svg 
              width="22" 
              height="22" 
              viewBox="0 0 24 24" 
              fill="black"
            >
              {/* Rocket body */}
              <path d="M12 2 L8 10 L16 10 Z" fill="black"/>
              {/* Rocket fins */}
              <path d="M8 10 L6 12 L8 12 Z" fill="black"/>
              <path d="M16 10 L18 12 L16 12 Z" fill="black"/>
              {/* Exhaust flames */}
              <path d="M10 14 L9 18 L10.5 16 L12 20 L13.5 16 L15 18 L14 14 Z" fill="black"/>
              {/* Window */}
              <circle cx="12" cy="6" r="1" fill="white"/>
            </svg>
            rocket_chamber
          </div>
          <div style={{ marginTop: '24px', paddingTop: '4px', paddingBottom: 0, paddingLeft: '8px', paddingRight: '8px' }}>
            <div className="flex items-end justify-between">
              <div className="flex items-end space-x-8">
                {/* Row pagination, search box, and column pagination table */}
                <table style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold' }}>row pagination</span>
                          <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                            Showing <span style={{ fontWeight: 'bold' }}>{(mainPaginationControls?.paginatedDataLength || 0).toLocaleString()}</span> of <span style={{ fontWeight: 'bold' }}>{(mainPaginationControls?.totalItems || 0).toLocaleString()}</span> results
                          </span>
                        </div>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          search box 2
                        </div>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          wolf sticky columns exclusion band
                        </div>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          pillarshift column templates
                        </div>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold' }}>column pagination</span>
                          <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                            Showing <span style={{ fontWeight: 'bold' }}>6</span> non-sticky(non wolf band) columns of <span style={{ fontWeight: 'bold' }}>109</span> sourcedef columns
                          </span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid black', padding: '4px' }}>
                        <div className="flex items-end space-x-4">
                          {/* Row Pagination Bar 1 - Rows per page selector */}
                          <div className="flex items-center">
                            <div className="flex items-center">
                              <span className="text-xs text-gray-600 mr-2">Rows/page:</span>
                              <div className="inline-flex rounded-md shadow-sm" role="group">
                                {[10, 25, 50, 100, 200, 'All'].map((value) => (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => {
                                      if (value === 'All' && mainPaginationControls) {
                                        mainPaginationControls.setItemsPerPage(mainPaginationControls.totalItems || 2000);
                                        mainPaginationControls.setCurrentPage(1);
                                      } else if (mainPaginationControls && typeof value === 'number') {
                                        mainPaginationControls.setItemsPerPage(value);
                                        mainPaginationControls.setCurrentPage(1);
                                      }
                                    }}
                                    className={`
                                      px-2 py-2.5 text-sm font-medium border -mr-px cursor-pointer
                                      ${value === 10 ? 'rounded-l' : ''}
                                      ${value === 'All' ? 'rounded-r' : ''}
                                      ${(value === 'All' && mainPaginationControls?.itemsPerPage === mainPaginationControls?.totalItems) || 
                                        mainPaginationControls?.itemsPerPage === value
                                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:bg-blue-700 focus:text-white'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                      }
                                      focus:z-10 focus:ring-2 focus:ring-blue-500
                                    `}
                                    style={{ 
                                      fontSize: '14px', 
                                      paddingTop: '10px', 
                                      paddingBottom: '10px'
                                    }}
                                  >
                                    {value}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Row Pagination Bar 2 - Page navigation */}
                          <div className="flex items-center">
                            <div className="flex items-center">
                              <span className="text-xs text-gray-600 mr-2">Row page:</span>
                              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                {/* Previous button - Circular refresh wheel with infinite cycling */}
                                <button
                                  onClick={() => {
                                    if (mainPaginationControls) {
                                      const newPage = mainPaginationControls.currentPage === 1 
                                        ? mainPaginationControls.totalPages 
                                        : mainPaginationControls.currentPage - 1;
                                      mainPaginationControls.setCurrentPage(newPage);
                                    }
                                  }}
                                  className="relative inline-flex items-center rounded-l-md px-2 py-2.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer"
                                  style={{ 
                                    fontSize: '14px', 
                                    paddingTop: '10px', 
                                    paddingBottom: '10px'
                                  }}
                                >
                                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M1 4v6h6" />
                                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                  </svg>
                                </button>
                                
                                {/* Page numbers - dynamically showing current pages */}
                                {(() => {
                                  const currentPage = mainPaginationControls?.currentPage || 1;
                                  const totalPages = mainPaginationControls?.totalPages || 1;
                                  
                                  const getPageNumbers = () => {
                                    const pages = [];
                                    const startPage = Math.max(1, currentPage - 2);
                                    const endPage = Math.min(totalPages, startPage + 4);
                                    
                                    for (let i = startPage; i <= endPage; i++) {
                                      pages.push(i);
                                    }
                                    
                                    return pages;
                                  };
                                  
                                  return getPageNumbers().map((pageNum) => (
                                    <button
                                      key={pageNum}
                                      onClick={() => {
                                        if (mainPaginationControls) {
                                          mainPaginationControls.setCurrentPage(pageNum);
                                        }
                                      }}
                                      className={`
                                        relative inline-flex items-center px-2 py-2.5 text-sm font-semibold
                                        ${pageNum === currentPage
                                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                        }
                                      `}
                                      style={{ 
                                        fontSize: '14px', 
                                        paddingTop: '10px', 
                                        paddingBottom: '10px'
                                      }}
                                    >
                                      {pageNum}
                                    </button>
                                  ));
                                })()}
                                
                                {/* Next button - Circular refresh wheel with infinite cycling */}
                                <button
                                  onClick={() => {
                                    if (mainPaginationControls) {
                                      const newPage = mainPaginationControls.currentPage === mainPaginationControls.totalPages 
                                        ? 1 
                                        : mainPaginationControls.currentPage + 1;
                                      mainPaginationControls.setCurrentPage(newPage);
                                    }
                                  }}
                                  className="relative inline-flex items-center rounded-r-md px-2 py-2.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer"
                                  style={{ 
                                    fontSize: '14px', 
                                    paddingTop: '10px', 
                                    paddingBottom: '10px'
                                  }}
                                >
                                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M23 4v6h-6" />
                                    <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                                  </svg>
                                </button>
                              </nav>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px' }}>
                        <div className="flex items-end">
                          <input
                            type="text"
                            placeholder="search keyword_datum"
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm w-48"
                            style={{ marginBottom: '3px' }}
                          />
                          <button
                            className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-2 py-2 rounded-md text-sm transition-colors w-10 h-10 flex items-center justify-center ml-1"
                          >
                            CL
                          </button>
                        </div>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px' }}>
                        <button
                          onClick={() => {}}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          wolf options
                        </button>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px' }}>
                        <button
                          onClick={() => {}}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          use the pillarshift coltemp system
                        </button>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px' }}>
                        <div className="flex items-end space-x-4">
                          {/* Column Pagination Bar 1 - Columns per page selector */}
                          <div className="flex items-center">
                            <div className="flex items-center">
                              <span className="text-xs text-gray-600 mr-2">Cols/page:</span>
                              {[6, 8, 10, 12, 15, 'ALL'].map((value) => (
                                <button
                                  key={value}
                                  onClick={() => {
                                    if (value === 'ALL') {
                                      // TODO: Connect to actual columns length
                                      console.log('Set to ALL columns');
                                    } else {
                                      // TODO: Connect to actual columnsPerPage setter
                                      console.log('Set columns per page to:', value);
                                    }
                                  }}
                                  className={`px-2 py-2.5 text-sm border ${value === 6 ? 'rounded-l' : ''} ${value === 'ALL' ? 'rounded-r' : ''} -mr-px cursor-pointer ${
                                    value === 6 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
                                  }`}
                                  style={{ 
                                    fontSize: '14px', 
                                    paddingTop: '10px', 
                                    paddingBottom: '10px',
                                    backgroundColor: value === 6 ? '#f8f782' : undefined
                                  }}
                                >
                                  {value}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Column Pagination Bar 2 - Current column page selector */}
                          <div className="flex items-center">
                            <div className="flex items-center">
                              <span className="text-xs text-gray-600 mr-2">Col page:</span>
                              <button
                                onClick={() => {
                                  // TODO: Connect to actual first page setter
                                  console.log('Go to first column page');
                                }}
                                className="px-2 py-2.5 text-sm border rounded-l -mr-px cursor-pointer bg-white hover:bg-gray-200"
                                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
                              >
                                ≪
                              </button>
                              <button
                                onClick={() => {
                                  // TODO: Connect to actual previous page with infinite cycling
                                  console.log('Previous column page with infinite cycling');
                                }}
                                className="px-2 py-2.5 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
                                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
                              >
                                <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M1 4v6h6" />
                                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                </svg>
                              </button>
                              
                              {/* Column page numbers - showing sample pagination */}
                              {[1, 2, 3, 4, 5].map((pageNum) => (
                                <button
                                  key={pageNum}
                                  onClick={() => {
                                    // TODO: Connect to actual column page setter
                                    console.log('Go to column page:', pageNum);
                                  }}
                                  className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
                                    pageNum === 1 // Default current page
                                      ? 'text-black border-black' 
                                      : 'bg-white hover:bg-gray-200'
                                  }`}
                                  style={{ 
                                    fontSize: '14px', 
                                    paddingTop: '10px', 
                                    paddingBottom: '10px',
                                    backgroundColor: pageNum === 1 ? '#f8f782' : undefined
                                  }}
                                >
                                  {pageNum}
                                </button>
                              ))}
                              
                              <button
                                onClick={() => {
                                  // TODO: Connect to actual next page with infinite cycling
                                  console.log('Next column page with infinite cycling');
                                }}
                                className="px-2 py-2.5 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
                                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
                              >
                                <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M23 4v6h-6" />
                                  <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  // TODO: Connect to actual last page setter
                                  console.log('Go to last column page');
                                }}
                                className="px-2 py-2.5 text-sm border rounded-r cursor-pointer bg-white hover:bg-gray-200"
                                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
                              >
                                ≫
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header - now empty, keeping for potential future use */}
      <div className="bg-white border-b px-6 py-4" style={{ display: 'none' }}>
      </div>

      {/* Main Content - KeywordsHubTable */}
      <div className="flex-1 overflow-hidden min-w-0">
        <KeywordsHubTable 
          selectedTagId={selectedTag?.tag_id}
          tagFilterRefreshKey={tagFilterRefreshKey}
          showJoistColumns={showJoistColumns}
          showHoistColumns={showHoistColumns}
          showRelExactCityIdColumn={showRelExactCityIdColumn}
          showAssociatedPrincipalCityColumn={showAssociatedPrincipalCityColumn}
          onColumnPaginationRender={setColumnPaginationControls}
          onMainPaginationRender={setMainPaginationControls}
          onTableActionsRender={setTableActions}
          initialColumnsPerPage={columnsPerPage}
          initialColumnPage={currentColumnPage}
          onColumnPaginationChange={handleColumnPaginationChange}
          onSelectedRowsChange={setSelectedKeywordIds}
          dfsFetchStatusFilter={dfsFetchStatusFilter}
          searchVolumeFilter={searchVolumeFilter}
          cpcFilter={cpcFilter}
          competitionFilter={competitionFilter}
          competitionIndexFilter={competitionIndexFilter}
          exactCityPopulationFilter={exactCityPopulationFilter}
          largestCityPopulationFilter={largestCityPopulationFilter}
          cityClassificationFilter={cityClassificationFilter}
          dfsFetchStatusFilter={dfsFetchStatusFilter}
          onExportDataChange={setExportData}
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
                
                {/* Live vs Queued Mode Selection */}
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Select F400 Mode: <span className="text-red-600">*Required</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="live"
                        checked={f400Mode === 'live'}
                        onChange={() => setF400Mode('live')}
                        className="sr-only peer"
                      />
                      <div className={`px-4 py-3 rounded-l-lg border-2 transition-colors ${
                        f400Mode === 'live' 
                          ? 'bg-green-500 text-white border-green-500' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}>
                        <span className="font-bold block">Live (instant)</span>
                        <span className="text-xs block mt-1">⚡ Results in 2-3 seconds</span>
                        <span className="text-xs block">~$0.015 per keyword</span>
                      </div>
                    </label>
                    <label className="inline-flex items-center cursor-pointer -ml-1">
                      <input
                        type="radio"
                        value="queued"
                        checked={f400Mode === 'queued'}
                        onChange={() => setF400Mode('queued')}
                        className="sr-only peer"
                      />
                      <div className={`px-4 py-3 rounded-r-lg border-2 transition-colors ${
                        f400Mode === 'queued' 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}>
                        <span className="font-bold block">Queued (delayed)</span>
                        <span className="text-xs block mt-1">⏱️ Results in 2-10 minutes</span>
                        <span className="text-xs block">~$0.002 per keyword</span>
                      </div>
                    </label>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">
                  This is a <strong className="text-red-600">very resource-intensive operation</strong> that will:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Run F400 ({f400Mode === 'live' ? 'LIVE' : f400Mode === 'queued' ? 'QUEUED' : ''} SERP Fetch) for each keyword</li>
                  <li>Run F410 (EMD Stamp Match) for each keyword</li>
                  <li>Run F420 (Cache Ranking Zones) for each keyword</li>
                  <li>Take approximately <strong>{f400Mode === 'live' ? selectedKeywordIds.length * 25 : selectedKeywordIds.length * 120} seconds</strong> to complete</li>
                  <li>Consume API credits from your DataForSEO account</li>
                </ul>
                <div className={`border rounded-md p-3 ${f400Mode ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-100 border-gray-300'}`}>
                  <p className={`font-medium text-sm ${f400Mode ? 'text-yellow-800' : 'text-gray-600'}`}>
                    Estimated cost: <strong>{f400Mode ? `$${(selectedKeywordIds.length * (f400Mode === 'live' ? 0.015 : 0.002)).toFixed(2)} USD` : 'Select mode to see estimate'}</strong>
                  </p>
                  <p className={`text-sm mt-1 ${f400Mode ? 'text-yellow-700' : 'text-gray-500'}`}>
                    This operation cannot be stopped once started.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowGazelleFirstConfirm(false);
                    setF400Mode(null); // Reset mode on cancel
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!f400Mode) {
                      alert('Please select either Live or Queued mode before continuing');
                      return;
                    }
                    setShowGazelleFirstConfirm(false);
                    setShowGazelleSecondConfirm(true);
                  }}
                  disabled={!f400Mode}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    f400Mode
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
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
                    <li>Process {selectedKeywordIds.length} keywords with F400 ({f400Mode === 'live' ? 'LIVE' : 'QUEUED'}) + F410 + F420</li>
                    <li>Cost approximately ${(selectedKeywordIds.length * (f400Mode === 'live' ? 0.015 : 0.002)).toFixed(2)} in API credits</li>
                    <li>Take approximately {Math.ceil(selectedKeywordIds.length * (f400Mode === 'live' ? 25 : 120) / 60)} minutes to complete</li>
                    <li>Cannot be stopped or undone once started</li>
                  </ul>
                </div>
                <p className="text-gray-700 font-medium">
                  Selected keywords: <span className="text-blue-600">{selectedKeywordIds.length}</span>
                </p>
                <p className="text-gray-700 font-medium mt-2">
                  F400 Mode: <span className={`font-bold ${f400Mode === 'live' ? 'text-green-600' : 'text-blue-600'}`}>{f400Mode === 'live' ? 'Live (instant)' : 'Queued (delayed)'}</span>
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