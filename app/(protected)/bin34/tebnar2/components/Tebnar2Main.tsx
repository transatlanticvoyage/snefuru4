'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Tebnar2ImagePlan, 
  Tebnar2Image, 
  Tebnar2Batch, 
  Tebnar2State,
  Tebnar2ThrottleSettings 
} from '../types/tebnar2-types';
import { 
  TBN2_DEFAULT_PAGE_SIZE, 
  TBN2_PAGE_SIZE_OPTIONS, 
  TBN2_DEFAULT_THROTTLE,
  TBN2_DEBOUNCE_MS,
  TBN2_MAIN_ELEMENT_STYLING
} from '../constants/tebnar2-constants';
import { 
  tbn2_fetchImagePlansData,
  tbn2_fetchImagesData,
  tbn2_fetchBatchesData,
  tbn2_refreshAllData,
  tbn2_filterPlansByBatch,
  tbn2_validateUserAccess
} from '../utils/tbn2-data-functions';
import { tbn2_log } from '../utils/tbn2-utils';
import { tbn2_func_create_plans_from_xls_2 } from '../utils/tbn2_func_create_plans_from_xls_2';
import { tbn2_func_create_plans_make_images_2 } from '../utils/tbn2_func_create_plans_make_images_2';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Tebnar2Table from './Tebnar2Table';
import Tebnar2Filters from './Tebnar2Filters';
import Tebnar2Actions from './Tebnar2Actions';

export default function Tebnar2Main() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Check if user is authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  // Main state management - cloned from tebnar1
  const [tbn2_plans, setTbn2Plans] = useState<Tebnar2ImagePlan[]>([]);
  const [tbn2_loading, setTbn2Loading] = useState(true);
  const [tbn2_error, setTbn2Error] = useState<string | null>(null);
  const [tbn2_gridData, setTbn2GridData] = useState<string[][]>([]);
  const [tbn2_submitLoading, setTbn2SubmitLoading] = useState(false);
  const [tbn2_submitResult, setTbn2SubmitResult] = useState<string | null>(null);
  const [tbn2_batches, setTbn2Batches] = useState<Tebnar2Batch[]>([]);
  const [tbn2_selectedBatchId, setTbn2SelectedBatchId] = useState<string>('');
  const [tbn2_qtyPerPlan, setTbn2QtyPerPlan] = useState<number>(1);
  const [tbn2_aiModel, setTbn2AiModel] = useState<string>('openai');
  const [tbn2_makeImagesLoading, setTbn2MakeImagesLoading] = useState(false);
  const [tbn2_makeImagesResult, setTbn2MakeImagesResult] = useState<string | null>(null);
  const [tbn2_currentPage, setTbn2CurrentPage] = useState(1);
  const [tbn2_pageSize, setTbn2PageSize] = useState(TBN2_DEFAULT_PAGE_SIZE);
  const [tbn2_imagesById, setTbn2ImagesById] = useState<Record<string, Tebnar2Image>>({});
  const [tbn2_generateZip, setTbn2GenerateZip] = useState(false);
  const [tbn2_wipeMeta, setTbn2WipeMeta] = useState(true);
  const [tbn2_throttle1, setTbn2Throttle1] = useState<Tebnar2ThrottleSettings>(TBN2_DEFAULT_THROTTLE);
  const [tbn2_fetchingImages, setTbn2FetchingImages] = useState<Set<string>>(new Set());
  const [tbn2_loadingPreset, setTbn2LoadingPreset] = useState(false);
  const [tbn2_presetData, setTbn2PresetData] = useState<string[][] | null>(null);
  const [tbn2_lastClickTime, setTbn2LastClickTime] = useState<Record<string, number>>({});
  const [tbn2_urlBatchId, setTbn2UrlBatchId] = useState<string | null>(null);
  const [tbn2_selectedColTemplate, setTbn2SelectedColTemplate] = useState('option1');
  const [tbn2_stickyColCount, setTbn2StickyColCount] = useState(1);
  const [tbn2_narpiPushLoading, setTbn2NarpiPushLoading] = useState(false);
  const [tbn2_narpiPushProgress, setTbn2NarpiPushProgress] = useState(0);
  const [tbn2_narpiPushStatus, setTbn2NarpiPushStatus] = useState<string | null>(null);
  const [tbn2_selectedRows, setTbn2SelectedRows] = useState<Set<string>>(new Set());
  
  // Sorting state - default to submission_order ascending
  const [tbn2_sortColumn, setTbn2SortColumn] = useState<string | null>('submission_order');
  const [tbn2_sortDirection, setTbn2SortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Sitespren state for asn_sitespren_id widget
  const [tbn2_sitesprenOptions, setTbn2SitesprenOptions] = useState<Array<{id: string, sitespren_base: string}>>([]);
  const [tbn2_selectedSitesprenId, setTbn2SelectedSitesprenId] = useState<string>('');
  const [tbn2_sitesprenSaving, setTbn2SitesprenSaving] = useState(false);
  
  // Gcon piece state for asn_gcon_piece_id widget
  const [tbn2_gconPieceOptions, setTbn2GconPieceOptions] = useState<Array<{id: string, meta_title: string, asn_sitespren_base: string, post_name: string}>>([]);
  const [tbn2_selectedGconPieceId, setTbn2SelectedGconPieceId] = useState<string>('');
  const [tbn2_gconPieceSaving, setTbn2GconPieceSaving] = useState(false);
  const [tbn2_currentSitesprenBase, setTbn2CurrentSitesprenBase] = useState<string>('');
  
  // Reverse relation state - for finding gcon_piece assigned to current batch
  const [tbn2_assignedGconPiece, setTbn2AssignedGconPiece] = useState<{id: string, asn_sitespren_base: string, post_name: string} | null>(null);
  
  // Pushador actions state - sync actions from sitejar4
  const [tbn2_syncLoading, setTbn2SyncLoading] = useState<Set<string>>(new Set());
  const [tbn2_syncResults, setTbn2SyncResults] = useState<{[key: string]: {type: 'success' | 'error', message: string}}>({});
  const [tbn2_checkingPluginVersion, setTbn2CheckingPluginVersion] = useState<Set<string>>(new Set());
  const [tbn2_updatingPlugin, setTbn2UpdatingPlugin] = useState<Set<string>>(new Set());
  const [tbn2_barkroPushing, setTbn2BarkroPushing] = useState<Set<string>>(new Set());

  // Functions popup state - cloned from nwjar1
  const [tbn2_isPopupOpen, setTbn2IsPopupOpen] = useState(false);
  const [tbn2_kz101Checked, setTbn2Kz101Checked] = useState(false);
  const [tbn2_kz103Checked, setTbn2Kz103Checked] = useState(false);
  const [tbn2_activePopupTab, setTbn2ActivePopupTab] = useState<'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7'>('ptab1');
  const [tbn2_uelBarColors, setTbn2UelBarColors] = useState<{bg: string, text: string}>({bg: '#2563eb', text: '#ffffff'});
  const [tbn2_uelBar37Colors, setTbn2UelBar37Colors] = useState<{bg: string, text: string}>({bg: '#1e40af', text: '#ffffff'});
  const [tbn2_currentUrl, setTbn2CurrentUrl] = useState<string>('');

  // Inject CSS styles for main element styling (cloned from tebnar1)
  useEffect(() => {
    const styleId = 'tbn2-main-styling';
    
    // Remove existing styles
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const generateCSS = () => {
      return `
        main {
          width: ${TBN2_MAIN_ELEMENT_STYLING.layout.width} !important;
          max-width: ${TBN2_MAIN_ELEMENT_STYLING.layout.maxWidth} !important;
          min-width: ${TBN2_MAIN_ELEMENT_STYLING.layout.minWidth} !important;
          height: ${TBN2_MAIN_ELEMENT_STYLING.layout.height} !important;
          min-height: ${TBN2_MAIN_ELEMENT_STYLING.layout.minHeight} !important;
          max-height: ${TBN2_MAIN_ELEMENT_STYLING.layout.maxHeight} !important;
          margin: ${TBN2_MAIN_ELEMENT_STYLING.margins.margin} !important;
          padding: ${TBN2_MAIN_ELEMENT_STYLING.padding.padding} !important;
        }
        
        /* Custom select styling for sitespren and gcon piece dropdowns */
        .tbn2-custom-select {
          background-color: #16267b !important;
          color: #fff !important;
          font-size: 16px !important;
          padding: 4px 8px !important;
          border: 1px solid #16267b !important;
          position: relative;
        }
        
        .tbn2-custom-select:disabled {
          background-color: #e5e7eb !important;
          color: #9ca3af !important;
          border-color: #d1d5db !important;
        }
        
        .tbn2-custom-select option {
          background-color: white !important;
          color: black !important;
          font-size: 16px !important;
        }
        
        .tbn2-custom-select option:disabled {
          color: #9ca3af !important;
        }
        
        /* Specific widths for each dropdown */
        .tbn2-sitespren-select {
          width: 460px !important;
          min-width: 460px !important;
        }
        
        .tbn2-gcon-piece-select {
          width: 400px !important;
          min-width: 400px !important;
        }
        
        /* Allow expansion when dropdown is opened (focused or size changed) */
        .tbn2-sitespren-select:focus,
        .tbn2-sitespren-select[size]:not([size="1"]) {
          width: auto !important;
          min-width: 460px !important;
          max-width: none !important;
        }
        
        .tbn2-gcon-piece-select:focus,
        .tbn2-gcon-piece-select[size]:not([size="1"]) {
          width: auto !important;
          min-width: 400px !important;
          max-width: none !important;
        }
        
        /* Custom display overlay for truncated text */
        .tbn2-select-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 20px;
          bottom: 0;
          background-color: #16267b;
          color: white;
          padding: 4px 8px;
          font-size: 16px;
          pointer-events: none;
          display: flex;
          align-items: center;
          border-radius: 4px;
          z-index: 1;
        }
        
        .tbn2-select-overlay.disabled {
          background-color: #e5e7eb;
          color: #9ca3af;
        }
        
        .tbn2-select-container {
          position: relative;
        }
        
        .tbn2-sitespren-container {
          width: 460px;
          min-width: 460px;
        }
        
        .tbn2-gcon-piece-container {
          width: 400px;
          min-width: 400px;
        }
        
        .tbn2-custom-select:focus + .tbn2-select-overlay,
        .tbn2-custom-select[size]:not([size="1"]) + .tbn2-select-overlay {
          display: none;
        }
        
        /* Tooltip styles for pushador actions - cloned from sitejar4 */
        .group {
          position: relative;
        }
        
        .info-icon {
          font-size: 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .tooltip-content {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 8px;
          background: #1a1a1a;
          color: white;
          padding: 12px;
          border-radius: 6px;
          width: 320px;
          z-index: 50;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          transform: translateY(-5px);
        }
        
        .group:hover .tooltip-content {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .tooltip-content::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 16px;
          border: 6px solid transparent;
          border-top-color: #1a1a1a;
        }
      `;
    };

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = generateCSS();
    document.head.appendChild(styleElement);
    
    // Cleanup function
    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  // Fetch all images for the user using centralized data layer
  const tbn2_fetchImages = async () => {
    if (!user?.id) {
      setTbn2ImagesById({});
      return;
    }
    
    const result = await tbn2_fetchImagesData(user.id);
    if (result.success) {
      setTbn2ImagesById(result.data);
    } else {
      tbn2_log(`Error fetching images: ${result.error}`, 'error');
      setTbn2ImagesById({});
    }
  };

  // Fetch batches using centralized data layer
  const tbn2_fetchBatches = async () => {
    if (!user?.id) {
      setTbn2Batches([]);
      return;
    }
    
    const result = await tbn2_fetchBatchesData(user.id);
    if (result.success) {
      setTbn2Batches(result.data);
    } else {
      tbn2_log(`Error fetching batches: ${result.error}`, 'error');
      setTbn2Batches([]);
    }
  };

  // Fetch plans using centralized data layer
  const tbn2_fetchPlans = async () => {
    if (!user?.id) {
      setTbn2Plans([]);
      setTbn2Loading(false);
      return;
    }

    setTbn2Loading(true);
    setTbn2Error(null);

    const result = await tbn2_fetchImagePlansData(user.id);
    if (result.success) {
      setTbn2Plans(result.data);
      setTbn2Error(null);
    } else {
      setTbn2Error(result.error);
      setTbn2Plans([]);
    }
    setTbn2Loading(false);
  };

  // Function to load dummy data from admin_options - exact clone from tebnar1
  const tbn2_loadDummyData = async () => {
    setTbn2LoadingPreset(true);
    try {
      const response = await fetch('/api/admin-options/kregno_xls_info_1');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      if (result.success && result.data?.json1) {
        const { headers, rows } = result.data.json1;
        
        // Create grid data with headers as first row
        const newGridData = [headers, ...rows];
        setTbn2PresetData(newGridData);
        setTbn2Error('✅ Dummy data loaded successfully!');
      } else {
        throw new Error('No data found or invalid format');
      }
    } catch (err) {
      console.error('Error loading dummy data:', err);
      setTbn2Error(`❌ Failed to load dummy data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTbn2LoadingPreset(false);
    }
  };

  // Function to submit create plans from XLS - independent tebnar2 version
  const tbn2_handleSubmitCreatePlans = async () => {
    setTbn2SubmitLoading(true);
    setTbn2SubmitResult(null);
    
    try {
      // Convert gridData to records - exact logic from tebnar1
      if (!tbn2_gridData || tbn2_gridData.length === 0) {
        throw new Error('Grid is empty. Please load data first.');
      }
      
      const fieldNames = tbn2_gridData[0].map(f => f.trim()).filter(Boolean);
      const rows = tbn2_gridData.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
      
      if (fieldNames.length === 0 || rows.length === 0) {
        throw new Error('Grid is empty or missing headers');
      }
      
      const records = rows.map(row => {
        const obj: Record<string, string> = {};
        fieldNames.forEach((field, idx) => {
          if (field) obj[field] = row[idx] ?? '';
        });
        return obj;
      });
      
      const result = await tbn2_func_create_plans_from_xls_2(records, tbn2_gridData);
      
      if (result.success) {
        setTbn2SubmitResult('✅ Plans created successfully!');
        // Refresh the plans data to show new entries
        tbn2_fetchPlans();
      } else {
        setTbn2SubmitResult(`❌ Failed to create plans: ${result.message}`);
      }
    } catch (err) {
      console.error('Error creating plans:', err);
      setTbn2SubmitResult(`❌ Error creating plans: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTbn2SubmitLoading(false);
    }
  };

  // Function to submit create plans and make images - independent tebnar2 version
  const tbn2_handleSubmitMakeImages = async () => {
    setTbn2MakeImagesLoading(true);
    setTbn2MakeImagesResult(null);
    
    try {
      // Convert gridData to records - exact logic from tebnar1
      if (!tbn2_gridData || tbn2_gridData.length === 0) {
        throw new Error('Grid is empty. Please load data first.');
      }
      
      const fieldNames = tbn2_gridData[0].map(f => f.trim()).filter(Boolean);
      const rows = tbn2_gridData.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
      
      if (fieldNames.length === 0 || rows.length === 0) {
        throw new Error('Grid is empty or missing headers');
      }
      
      const records = rows.map(row => {
        const obj: Record<string, string> = {};
        fieldNames.forEach((field, idx) => {
          if (field) obj[field] = row[idx] ?? '';
        });
        return obj;
      });
      
      const result = await tbn2_func_create_plans_make_images_2({
        records: records,
        qty: tbn2_qtyPerPlan,
        aiModel: tbn2_aiModel,
        generateZip: tbn2_generateZip,
        wipeMeta: tbn2_wipeMeta,
        throttle1: tbn2_throttle1,
        gridData: tbn2_gridData
      });
      
      if (result.success) {
        setTbn2MakeImagesResult('🚀 Images generation started successfully!');
        // Refresh the plans data to show updated entries
        tbn2_fetchPlans();
        // Also refresh images to show new ones
        tbn2_fetchImages();
      } else {
        setTbn2MakeImagesResult(`❌ Failed to generate images: ${result.message}`);
      }
    } catch (err) {
      console.error('Error generating images:', err);
      setTbn2MakeImagesResult(`❌ Error generating images: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTbn2MakeImagesLoading(false);
    }
  };

  // Function to create narpi push for selected images to sitespren site - tebnar2 specific
  const tbn2_sfunc63_createNarpiPush = async () => {
    // Validation checks
    if (!tbn2_selectedBatchId || tbn2_narpiPushLoading) return;
    
    if (!tbn2_selectedSitesprenId) {
      setTbn2Error('❌ Please select a sitespren site first');
      return;
    }
    
    if (tbn2_selectedRows.size === 0) {
      setTbn2Error('❌ Please select at least one image plan from the table');
      return;
    }
    
    setTbn2NarpiPushLoading(true);
    setTbn2NarpiPushProgress(0);
    setTbn2NarpiPushStatus('Initializing narpi push...');
    setTbn2Error(null);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setTbn2NarpiPushProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);
      
      setTbn2NarpiPushStatus('Creating narpi push record...');
      
      // Call the sfunc_63_push_images API endpoint with sitespren and selected plans
      const response = await fetch('/api/bin45/sfunc_63_push_images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: tbn2_selectedBatchId,
          sitespren_id: tbn2_selectedSitesprenId,
          selected_plan_ids: Array.from(tbn2_selectedRows),
          push_method: 'tebnar2_sitespren_push'
        })
      });
      
      clearInterval(progressInterval);
      setTbn2NarpiPushProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setTbn2NarpiPushStatus('✅ Narpi push created successfully!');
      setTbn2Error(`🚀 Narpi push completed! Push ID: ${result.push_id} | Pushed ${tbn2_selectedRows.size} images to ${tbn2_currentSitesprenBase}`);
      
      // Clear status after 5 seconds
      setTimeout(() => {
        setTbn2NarpiPushStatus(null);
        setTbn2NarpiPushProgress(0);
      }, 5000);
      
    } catch (err) {
      console.error('TBN2 Narpi push error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setTbn2NarpiPushStatus('❌ Narpi push failed');
      setTbn2Error(`❌ Failed to create narpi push: ${errorMessage}`);
      
      // Clear error and status after 10 seconds
      setTimeout(() => {
        setTbn2NarpiPushStatus(null);
        setTbn2NarpiPushProgress(0);
        setTbn2Error(null);
      }, 10000);
      
    } finally {
      setTbn2NarpiPushLoading(false);
    }
  };

  // Function to fetch a single image for a specific plan and slot - independent tebnar2 version
  const tbn2_fetchSingleImage = async (plan: Tebnar2ImagePlan, imageSlot: number) => {
    console.log('🚀 TBN2 FETCH SINGLE IMAGE FUNCTION CALLED!', { plan_id: plan.id, imageSlot });
    
    const fetchKey = `${plan.id}-${imageSlot}`;
    const now = Date.now();
    
    // Debounce: prevent multiple clicks within TBN2_DEBOUNCE_MS (2 seconds)
    if (tbn2_lastClickTime[fetchKey] && (now - tbn2_lastClickTime[fetchKey]) < TBN2_DEBOUNCE_MS) {
      console.log('⏳ Request debounced - too soon since last click');
      setTbn2Error(`⏳ Please wait ${Math.ceil((TBN2_DEBOUNCE_MS - (now - tbn2_lastClickTime[fetchKey])) / 1000)} seconds before trying again`);
      return;
    }
    
    // Check if already fetching this image
    if (tbn2_fetchingImages.has(fetchKey)) {
      console.log('⏳ Request already in progress for this image');
      setTbn2Error('⏳ Image generation already in progress for this slot');
      return;
    }
    
    setTbn2LastClickTime(prev => ({ ...prev, [fetchKey]: now }));
    
    try {
      setTbn2FetchingImages(prev => new Set([...prev, fetchKey]));
      setTbn2Error(null);
      
      // Validate prompt data
      const prompt = plan.e_prompt1 || plan.e_more_instructions1 || plan.e_file_name1;
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        throw new Error('No valid prompt found for this plan.');
      }
      
      // Create request data
      const imageData = {
        plan_id: plan.id,
        image_slot: imageSlot,
        prompt: prompt.trim(),
        aiModel: tbn2_aiModel,
        wipeMeta: tbn2_wipeMeta
      };
      
      // Make API call to tebnar2 endpoint
      const response = await fetch('/api/tbn2_sfunc_fetch_single_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageData)
      });
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 429) {
          throw new Error('Please wait before generating another image (rate limited)');
        } else if (response.status === 400) {
          throw new Error('Invalid request - please check the plan data');
        } else if (response.status === 500) {
          throw new Error('Server error - please try again in a moment');
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh images and plans data using centralized functions
        if (user?.id) {
          const imagesResult = await tbn2_fetchImagesData(user.id);
          if (imagesResult.success) {
            setTbn2ImagesById(imagesResult.data);
          }
          
          const plansResult = await tbn2_fetchImagePlansData(user.id);
          if (plansResult.success) {
            setTbn2Plans(plansResult.data);
          }
        }
        
        setTbn2Error(`✅ Image ${imageSlot} generated successfully for plan ${plan.id}`);
        
        // Clear success message after 5 seconds
        setTimeout(() => setTbn2Error(null), 5000);
        
      } else {
        setTbn2Error(`❌ Failed to generate image ${imageSlot}: ${result.message || 'Unknown error'}`);
      }
      
    } catch (err) {
      console.error('TBN2 Fetch single image error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setTbn2Error(`❌ Error fetching image: ${errorMessage}`);
      
      // Clear error message after 10 seconds
      setTimeout(() => setTbn2Error(null), 10000);
      
    } finally {
      setTbn2FetchingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(fetchKey);
        return newSet;
      });
    }
  };

  // Helper function to truncate UUID for display
  const tbn2_truncateUUID = (uuid: string) => {
    if (!uuid || uuid.length < 8) return uuid;
    return uuid.substring(0, 4) + '...';
  };

  // Helper function to get display text for selected option
  const tbn2_getSelectedSitesprenDisplay = () => {
    if (!tbn2_selectedSitesprenId) return '';
    const option = tbn2_sitesprenOptions.find(s => s.id === tbn2_selectedSitesprenId);
    if (!option) return '';
    return `${tbn2_truncateUUID(option.id)} - ${option.sitespren_base}`;
  };

  const tbn2_getSelectedGconPieceDisplay = () => {
    if (!tbn2_selectedGconPieceId) return '';
    const option = tbn2_gconPieceOptions.find(g => g.id === tbn2_selectedGconPieceId);
    if (!option) return '';
    return `${tbn2_truncateUUID(option.id)} - ${option.meta_title}`;
  };

  // Column Template System Constants - tebnar2 specific
  const TBN2_COLUMN_TEMPLATES = {
    option1: { range: [0, -1], label: 'col temp all', description: 'columns 1-~' },
    option2: { range: [0, 6], label: 'col temp a', description: 'columns 1-7' },
    option3: { range: [7, 13], label: 'col temp b', description: 'columns 8-14' },
    option4: { range: [14, 20], label: 'col temp c', description: 'columns 15-21' },
    option5: { range: [21, 27], label: 'col temp d', description: 'columns 22-28' }
  };

  // Get all table columns for template system
  const tbn2_getAllTableColumns = () => {
    return [
      'submission_order',
      'int1', 'fk_image1_id', 'image1-preview',
      'int2', 'fk_image2_id', 'image2-preview',
      'int3', 'fk_image3_id', 'image3-preview',
      'int4', 'fk_image4_id', 'image4-preview',
      'id', 'rel_users_id', 'rel_images_plans_batches_id', 'created_at',
      'e_zpf_img_code', 'e_width', 'e_height', 'e_associated_content1',
      'e_file_name1', 'e_more_instructions1', 'e_prompt1', 'e_ai_tool1'
    ];
  };

  // Function to determine visible columns based on template
  const tbn2_getVisibleColumns = () => {
    const template = TBN2_COLUMN_TEMPLATES[tbn2_selectedColTemplate as keyof typeof TBN2_COLUMN_TEMPLATES];
    const allColumns = tbn2_getAllTableColumns();
    
    if (template.range[1] === -1) {
      return allColumns; // Show all columns
    }
    
    return allColumns.slice(template.range[0], template.range[1] + 1);
  };

  // Function to get sticky columns
  const tbn2_getStickyColumns = () => {
    return tbn2_getAllTableColumns().slice(0, tbn2_stickyColCount);
  };

  // Function to get non-sticky visible columns
  const tbn2_getNonStickyVisibleColumns = () => {
    const visibleColumns = tbn2_getVisibleColumns();
    return visibleColumns.slice(tbn2_stickyColCount);
  };

  // Sorting handler function
  const tbn2_handleSort = (columnKey: string) => {
    if (tbn2_sortColumn === columnKey) {
      // Toggle direction if same column
      setTbn2SortDirection(tbn2_sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, start with ascending
      setTbn2SortColumn(columnKey);
      setTbn2SortDirection('asc');
    }
  };

  // Function to sort plans data
  const tbn2_getSortedPlans = (plans: Tebnar2ImagePlan[]) => {
    if (!tbn2_sortColumn) {
      return plans; // No sorting applied
    }

    return [...plans].sort((a, b) => {
      const aValue = a[tbn2_sortColumn as keyof Tebnar2ImagePlan];
      const bValue = b[tbn2_sortColumn as keyof Tebnar2ImagePlan];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return tbn2_sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return tbn2_sortDirection === 'asc' ? -1 : 1;

      // Handle different data types
      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        // Convert to string for comparison
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return tbn2_sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Column width reference for sticky positioning
  const tbn2_getColumnWidth = (col: string) => {
    const widthMap: Record<string, string> = {
      submission_order: '80px',
      int1: '60px', int2: '60px', int3: '60px', int4: '60px',
      fk_image1_id: '45px', fk_image2_id: '45px', fk_image3_id: '45px', fk_image4_id: '45px',
      'image1-preview': '100px', 'image2-preview': '100px', 'image3-preview': '100px', 'image4-preview': '100px',
      id: '200px', rel_users_id: '150px', rel_images_plans_batches_id: '150px', created_at: '160px',
      e_zpf_img_code: '120px', e_width: '80px', e_height: '80px', e_associated_content1: '200px',
      e_file_name1: '200px', e_more_instructions1: '250px', e_prompt1: '300px', e_ai_tool1: '120px'
    };
    return widthMap[col] || '100px';
  };

  // Function to calculate sticky left position
  const tbn2_calculateStickyLeft = (index: number) => {
    let leftPosition = 0;
    const allColumns = tbn2_getAllTableColumns();
    
    for (let i = 0; i < index; i++) {
      const col = allColumns[i];
      const widthStr = tbn2_getColumnWidth(col);
      leftPosition += parseInt(widthStr.replace('px', ''));
    }
    return `${leftPosition}px`;
  };

  // Handlers for column template system
  const tbn2_handleColumnTemplateChange = (templateKey: string) => {
    setTbn2SelectedColTemplate(templateKey);
    tbn2_updateColumnTemplateUrl(templateKey, tbn2_stickyColCount);
    tbn2_saveColumnTemplateState(templateKey, tbn2_stickyColCount);
  };

  const tbn2_handleStickyColChange = (count: number) => {
    setTbn2StickyColCount(count);
    tbn2_updateColumnTemplateUrl(tbn2_selectedColTemplate, count);
    tbn2_saveColumnTemplateState(tbn2_selectedColTemplate, count);
  };

  // Function to update URL with column template parameters
  const tbn2_updateColumnTemplateUrl = (colTemplate: string, stickyCount: number) => {
    if (typeof window === 'undefined') return; // SSR safety
    
    const url = new URL(window.location.href);
    url.searchParams.set('coltemp', colTemplate);
    url.searchParams.set('stickycol', `option${stickyCount}`);
    window.history.replaceState({}, '', url.toString());
  };

  // Function to save column template state to localStorage
  const tbn2_saveColumnTemplateState = (colTemplate: string, stickyCount: number) => {
    if (typeof window === 'undefined') return; // SSR safety
    
    localStorage.setItem('tbn2_columnTemplate', colTemplate);
    localStorage.setItem('tbn2_stickyColumns', stickyCount.toString());
  };

  // Function to load column template state from localStorage
  const tbn2_loadColumnTemplateState = () => {
    if (typeof window === 'undefined') return; // SSR safety
    
    const savedTemplate = localStorage.getItem('tbn2_columnTemplate');
    const savedSticky = localStorage.getItem('tbn2_stickyColumns');
    
    if (savedTemplate && TBN2_COLUMN_TEMPLATES[savedTemplate as keyof typeof TBN2_COLUMN_TEMPLATES]) {
      setTbn2SelectedColTemplate(savedTemplate);
    }
    if (savedSticky) {
      const count = parseInt(savedSticky);
      if (count >= 1 && count <= 5) {
        setTbn2StickyColCount(count);
      }
    }
  };

  // Function to read column template URL parameters
  const tbn2_readColumnTemplateUrlParams = () => {
    if (typeof window === 'undefined') return; // SSR safety
    
    const urlParams = new URLSearchParams(window.location.search);
    const colTemp = urlParams.get('coltemp');
    const stickyCol = urlParams.get('stickycol');
    
    if (colTemp && TBN2_COLUMN_TEMPLATES[colTemp as keyof typeof TBN2_COLUMN_TEMPLATES]) {
      setTbn2SelectedColTemplate(colTemp);
    }
    if (stickyCol) {
      const count = parseInt(stickyCol.replace('option', ''));
      if (count >= 1 && count <= 5) {
        setTbn2StickyColCount(count);
      }
    }
  };

  // Effect to load column template state and URL params on mount
  useEffect(() => {
    tbn2_loadColumnTemplateState();
    tbn2_readColumnTemplateUrlParams();
  }, []);

  // Function to update URL with batch parameter - tebnar2 specific
  const tbn2_updateUrlWithBatch = (batchId: string) => {
    if (typeof window === 'undefined') return; // SSR safety
    
    const url = new URL(window.location.href);
    
    if (batchId && batchId !== '') {
      url.searchParams.set('batchid', batchId);
    } else {
      url.searchParams.delete('batchid');
    }
    
    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
  };

  // Function to validate if batch ID exists in current batches
  const tbn2_validateBatchId = (batchId: string): boolean => {
    return tbn2_batches.some(batch => batch.id === batchId);
  };

  // Fetch current batch's sitespren assignment
  const tbn2_fetchBatchSitespren = async (batchId: string) => {
    if (!batchId) {
      setTbn2SelectedSitesprenId('');
      setTbn2CurrentSitesprenBase('');
      setTbn2GconPieceOptions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('images_plans_batches')
        .select('asn_sitespren_id')
        .eq('id', batchId)
        .single();

      if (!error && data && data.asn_sitespren_id) {
        setTbn2SelectedSitesprenId(data.asn_sitespren_id);
        // Find the sitespren_base for this ID
        const selectedSitespren = tbn2_sitesprenOptions.find(s => s.id === data.asn_sitespren_id);
        if (selectedSitespren) {
          setTbn2CurrentSitesprenBase(selectedSitespren.sitespren_base);
          tbn2_fetchGconPieces(selectedSitespren.sitespren_base);
        }
      } else {
        setTbn2SelectedSitesprenId('');
        setTbn2CurrentSitesprenBase('');
        setTbn2GconPieceOptions([]);
      }
    } catch (err) {
      console.error('Error fetching batch sitespren:', err);
      setTbn2SelectedSitesprenId('');
      setTbn2CurrentSitesprenBase('');
      setTbn2GconPieceOptions([]);
    }
  };

  // Enhanced batch change handler that updates URL and loads sitespren
  const tbn2_handleBatchChange = (batchId: string) => {
    setTbn2SelectedBatchId(batchId);
    tbn2_updateUrlWithBatch(batchId);
    tbn2_fetchBatchSitespren(batchId);
    tbn2_fetchBatchGconPiece(batchId);
    tbn2_fetchAssignedGconPiece(batchId);
  };

  // Function to read URL parameters on component mount
  const tbn2_readUrlParameters = () => {
    if (typeof window === 'undefined') return; // SSR safety
    
    const urlParams = new URLSearchParams(window.location.search);
    const batchIdParam = urlParams.get('batchid');
    
    if (batchIdParam) {
      setTbn2UrlBatchId(batchIdParam);
    }
  };

  // Effect to read URL parameters on mount
  useEffect(() => {
    tbn2_readUrlParameters();
  }, []);

  // Effect to handle URL parameter validation after batches are loaded
  useEffect(() => {
    if (tbn2_urlBatchId && tbn2_batches.length > 0) {
      if (tbn2_validateBatchId(tbn2_urlBatchId)) {
        // Valid batch ID - apply the filter
        setTbn2SelectedBatchId(tbn2_urlBatchId);
        tbn2_fetchBatchSitespren(tbn2_urlBatchId);
        tbn2_fetchBatchGconPiece(tbn2_urlBatchId);
        tbn2_fetchAssignedGconPiece(tbn2_urlBatchId);
        setTbn2UrlBatchId(null); // Clear the URL batch ID state
      } else {
        // Invalid batch ID - show error and clear URL param
        setTbn2Error(`❌ Batch ID "${tbn2_urlBatchId}" not found or not accessible`);
        tbn2_updateUrlWithBatch('');
        setTbn2UrlBatchId(null);
        
        // Clear error message after 8 seconds
        setTimeout(() => setTbn2Error(null), 8000);
      }
    }
  }, [tbn2_urlBatchId, tbn2_batches]);

  // Effect to handle browser back/forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR safety
    
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const batchIdParam = urlParams.get('batchid');
      
      if (batchIdParam) {
        if (tbn2_validateBatchId(batchIdParam)) {
          setTbn2SelectedBatchId(batchIdParam);
          tbn2_fetchBatchSitespren(batchIdParam);
          tbn2_fetchBatchGconPiece(batchIdParam);
          tbn2_fetchAssignedGconPiece(batchIdParam);
        } else {
          setTbn2SelectedBatchId('');
          setTbn2Error(`❌ Batch ID "${batchIdParam}" not found`);
          setTimeout(() => setTbn2Error(null), 8000);
        }
      } else {
        setTbn2SelectedBatchId('');
        setTbn2SelectedSitesprenId('');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tbn2_batches]);

  // Effect to handle popup URL parameters on mount - cloned from nwjar1
  useEffect(() => {
    document.title = '/tebnar2 - Snefuru';
    
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
      setTbn2IsPopupOpen(true);
      
      // Set active tab based on URL parameters
      if (ptab1 === 'active') {
        setTbn2ActivePopupTab('ptab1');
      } else if (ptab2 === 'active') {
        setTbn2ActivePopupTab('ptab2');
      } else if (ptab3 === 'active') {
        setTbn2ActivePopupTab('ptab3');
      } else if (ptab4 === 'active') {
        setTbn2ActivePopupTab('ptab4');
      } else if (ptab5 === 'active') {
        setTbn2ActivePopupTab('ptab5');
      } else if (ptab6 === 'active') {
        setTbn2ActivePopupTab('ptab6');
      } else if (ptab7 === 'active') {
        setTbn2ActivePopupTab('ptab7');
      }
    }
  }, []);

  // Effect hooks for data fetching using centralized functions
  useEffect(() => {
    tbn2_fetchImages();
  }, [user]);

  useEffect(() => {
    tbn2_fetchBatches();
  }, [user]);

  useEffect(() => {
    tbn2_fetchPlans();
    tbn2_fetchSitesprenOptions();
  }, [user]);

  // Re-fetch gcon pieces when sitespren options are loaded and batch has sitespren
  useEffect(() => {
    if (tbn2_sitesprenOptions.length > 0 && tbn2_selectedBatchId && tbn2_selectedSitesprenId) {
      const sitespren = tbn2_sitesprenOptions.find(s => s.id === tbn2_selectedSitesprenId);
      if (sitespren) {
        tbn2_fetchGconPieces(sitespren.sitespren_base);
      }
    }
  }, [tbn2_sitesprenOptions]);

  // Fetch custom colors for uelbar37 and uelbar38 - cloned from nwjar1
  useEffect(() => {
    const fetchTbn2UelBarColors = async () => {
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
          
          setTbn2UelBarColors({bg: bgColor38, text: textColor38});

          // uelbar37 colors
          const bgColor37Item = data.find(item => item.color_ref_code === 'uelbar37_bgcolor1');
          const textColor37Item = data.find(item => item.color_ref_code === 'uelbar37_textcolor1');
          
          const bgColor37 = bgColor37Item?.hex_value || '#1e40af';
          const textColor37 = textColor37Item?.hex_value || '#ffffff';
          
          setTbn2UelBar37Colors({bg: bgColor37, text: textColor37});
        }
      } catch (err) {
        console.error('Error fetching uel bar colors:', err);
      }
    };

    fetchTbn2UelBarColors();
  }, [supabase]);

  // Track URL changes for uelbar37 display - cloned from nwjar1
  useEffect(() => {
    // Set initial URL
    setTbn2CurrentUrl(window.location.href);
    
    // Listen for URL changes (for pushState/replaceState)
    const handleUrlChange = () => {
      setTbn2CurrentUrl(window.location.href);
    };
    
    // Listen for popstate events (back/forward buttons)
    window.addEventListener('popstate', handleUrlChange);
    
    // Create a MutationObserver to watch for URL changes via pushState/replaceState
    const observer = new MutationObserver(() => {
      if (window.location.href !== tbn2_currentUrl) {
        setTbn2CurrentUrl(window.location.href);
      }
    });
    
    // Watch for changes to the document that might indicate URL changes
    observer.observe(document, { subtree: true, childList: true });
    
    // Custom event listener for our URL updates
    const handleCustomUrlUpdate = () => {
      setTbn2CurrentUrl(window.location.href);
    };
    window.addEventListener('urlchange', handleCustomUrlUpdate);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleCustomUrlUpdate);
      observer.disconnect();
    };
  }, [tbn2_currentUrl]);

  // Handle checkbox clicks with mutual exclusivity - cloned from nwjar1
  const tbn2_handleKz101Click = () => {
    setTbn2Kz101Checked(true);
    setTbn2Kz103Checked(false);
  };

  const tbn2_handleKz103Click = () => {
    setTbn2Kz103Checked(true);
    setTbn2Kz101Checked(false);
  };

  // Update URL parameters for popup state - cloned from nwjar1
  const tbn2_updatePopupURL = (fpopOpen: boolean, tabActive?: string) => {
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

  // Handle popup open/close with URL updates - cloned from nwjar1
  const tbn2_handlePopupOpen = () => {
    setTbn2IsPopupOpen(true);
    
    // Set default selection if neither option is selected
    if (!tbn2_kz101Checked && !tbn2_kz103Checked) {
      setTbn2Kz101Checked(true);
    }
    
    // Check if URL has specific tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hasTabInUrl = ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7']
      .some(tab => urlParams.get(tab) === 'active');
    
    if (!hasTabInUrl) {
      // No tab specified in URL, use last remembered tab from localStorage
      const lastTab = localStorage.getItem('tebnar2_lastActiveTab') || 'ptab1';
      setTbn2ActivePopupTab(lastTab as any);
      tbn2_updatePopupURL(true, lastTab);
    } else {
      // URL has tab specified, use current activePopupTab
      tbn2_updatePopupURL(true, tbn2_activePopupTab);
    }
  };

  const tbn2_handlePopupClose = () => {
    setTbn2IsPopupOpen(false);
    tbn2_updatePopupURL(false);
  };

  // Handle tab changes with URL updates and localStorage - cloned from nwjar1
  const tbn2_handleTabChange = (tab: string) => {
    setTbn2ActivePopupTab(tab as any);
    localStorage.setItem('tebnar2_lastActiveTab', tab); // Remember this tab for next time
    tbn2_updatePopupURL(true, tab);
  };

  // Fetch sitespren options for the logged in user
  const tbn2_fetchSitesprenOptions = async () => {
    if (!user?.id) return;
    
    try {
      const userValidation = await tbn2_validateUserAccess(user.id);
      if (!userValidation.success) return;

      const { data, error } = await supabase
        .from('sitespren')
        .select('id, sitespren_base')
        .eq('fk_users_id', userValidation.internalUserId)
        .order('sitespren_base', { ascending: true });

      if (!error && data) {
        setTbn2SitesprenOptions(data);
      }
    } catch (err) {
      console.error('Error fetching sitespren options:', err);
    }
  };

  // Save asn_sitespren_id to current batch
  const tbn2_handleSitesprenSave = async () => {
    if (!tbn2_selectedBatchId || !tbn2_selectedSitesprenId) {
      alert('Please select both a batch and a sitespren option');
      return;
    }

    setTbn2SitesprenSaving(true);
    try {
      const { error } = await supabase
        .from('images_plans_batches')
        .update({ asn_sitespren_id: tbn2_selectedSitesprenId })
        .eq('id', tbn2_selectedBatchId);

      if (error) {
        alert('Error saving sitespren assignment: ' + error.message);
      } else {
        alert('Sitespren assignment saved successfully');
      }
    } catch (err) {
      console.error('Error saving sitespren:', err);
      alert('An error occurred while saving');
    } finally {
      setTbn2SitesprenSaving(false);
    }
  };

  // Fetch gcon_pieces based on selected sitespren
  const tbn2_fetchGconPieces = async (sitesprenBase: string) => {
    if (!user?.id || !sitesprenBase) {
      setTbn2GconPieceOptions([]);
      return;
    }
    
    try {
      const userValidation = await tbn2_validateUserAccess(user.id);
      if (!userValidation.success) return;

      const { data, error } = await supabase
        .from('gcon_pieces')
        .select('id, meta_title, asn_sitespren_base, post_name')
        .eq('fk_users_id', userValidation.internalUserId)
        .eq('asn_sitespren_base', sitesprenBase)
        .order('meta_title', { ascending: true });

      if (!error && data) {
        setTbn2GconPieceOptions(data);
      } else {
        setTbn2GconPieceOptions([]);
      }
    } catch (err) {
      console.error('Error fetching gcon pieces:', err);
      setTbn2GconPieceOptions([]);
    }
  };

  // Fetch current batch's gcon_piece assignment
  const tbn2_fetchBatchGconPiece = async (batchId: string) => {
    if (!batchId) {
      setTbn2SelectedGconPieceId('');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('images_plans_batches')
        .select('asn_gcon_piece_id, asn_sitespren_id')
        .eq('id', batchId)
        .single();

      if (!error && data) {
        if (data.asn_gcon_piece_id) {
          setTbn2SelectedGconPieceId(data.asn_gcon_piece_id);
        } else {
          setTbn2SelectedGconPieceId('');
        }
        
        // Also ensure we have the right gcon pieces loaded if sitespren is set
        if (data.asn_sitespren_id && tbn2_sitesprenOptions.length > 0) {
          const sitespren = tbn2_sitesprenOptions.find(s => s.id === data.asn_sitespren_id);
          if (sitespren) {
            await tbn2_fetchGconPieces(sitespren.sitespren_base);
          }
        }
      } else {
        setTbn2SelectedGconPieceId('');
      }
    } catch (err) {
      console.error('Error fetching batch gcon piece:', err);
      setTbn2SelectedGconPieceId('');
    }
  };

  // Fetch assigned gcon piece - reverse lookup to find which gcon_piece has this batch assigned
  const tbn2_fetchAssignedGconPiece = async (batchId: string) => {
    if (!batchId) {
      setTbn2AssignedGconPiece(null);
      return;
    }

    try {
      const userValidation = await tbn2_validateUserAccess(user.id);
      if (!userValidation.success) return;

      const { data, error } = await supabase
        .from('gcon_pieces')
        .select('id, asn_sitespren_base, post_name')
        .eq('fk_users_id', userValidation.internalUserId)
        .eq('asn_image_plan_batch_id', batchId)
        .single();

      if (!error && data) {
        setTbn2AssignedGconPiece(data);
      } else {
        setTbn2AssignedGconPiece(null);
      }
    } catch (err) {
      console.error('Error fetching assigned gcon piece:', err);
      setTbn2AssignedGconPiece(null);
    }
  };

  // Save asn_gcon_piece_id to current batch
  const tbn2_handleGconPieceSave = async () => {
    if (!tbn2_selectedBatchId || !tbn2_selectedGconPieceId) {
      alert('Please select both a batch and a gcon piece option');
      return;
    }

    setTbn2GconPieceSaving(true);
    try {
      const { error } = await supabase
        .from('images_plans_batches')
        .update({ asn_gcon_piece_id: tbn2_selectedGconPieceId })
        .eq('id', tbn2_selectedBatchId);

      if (error) {
        alert('Error saving gcon piece assignment: ' + error.message);
      } else {
        alert('Gcon piece assignment saved successfully');
      }
    } catch (err) {
      console.error('Error saving gcon piece:', err);
      alert('An error occurred while saving');
    } finally {
      setTbn2GconPieceSaving(false);
    }
  };

  // Pushador actions handlers - cloned from sitejar4
  const tbn2_handleWpsv2Sync = async (siteId: string, method: 'plugin_api' | 'rest_api') => {
    setTbn2SyncLoading(prev => new Set([...prev, siteId]));
    
    setTbn2SyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[siteId];
      return newResults;
    });

    try {
      const response = await fetch('/api/wpsv2/sync-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId,
          method: method,
          fallbackEnabled: false
        })
      });

      const data = await response.json();

      if (data.success) {
        setTbn2SyncResults(prev => ({
          ...prev,
          [siteId]: {
            type: 'success',
            message: `✅ ${data.message} (${data.count} items)`
          }
        }));
      } else {
        setTbn2SyncResults(prev => ({
          ...prev,
          [siteId]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setTbn2SyncResults(prev => ({
        ...prev,
        [siteId]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setTbn2SyncLoading(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(siteId);
        return newLoading;
      });
    }
  };

  const tbn2_handleWpsv2TestPlugin = async (siteId: string) => {
    setTbn2SyncLoading(prev => new Set([...prev, `test_${siteId}`]));
    
    setTbn2SyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[`test_${siteId}`];
      return newResults;
    });

    try {
      const response = await fetch('/api/wpsv2/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId
        })
      });

      const data = await response.json();

      if (data.success) {
        const pluginStatus = data.results.plugin_api.success ? '✅' : '❌';
        const restStatus = data.results.rest_api.success ? '✅' : '❌';
        
        setTbn2SyncResults(prev => ({
          ...prev,
          [`test_${siteId}`]: {
            type: 'success',
            message: `Plugin: ${pluginStatus} | REST: ${restStatus} | ${data.results.recommendations[0] || 'Test completed'}`
          }
        }));
      } else {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`test_${siteId}`]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setTbn2SyncResults(prev => ({
        ...prev,
        [`test_${siteId}`]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setTbn2SyncLoading(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(`test_${siteId}`);
        return newLoading;
      });
    }
  };

  const tbn2_handleCheckPluginVersion = async (siteId: string) => {
    setTbn2CheckingPluginVersion(prev => new Set([...prev, siteId]));
    
    setTbn2SyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[`version_${siteId}`];
      return newResults;
    });

    try {
      const response = await fetch('/api/plugin/check-version', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId
        })
      });

      const data = await response.json();

      if (data.success) {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`version_${siteId}`]: {
            type: 'success',
            message: `✅ ${data.message} (Current: ${data.currentVersion || 'Unknown'}, Latest: ${data.latestVersion || 'Unknown'})`
          }
        }));
      } else {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`version_${siteId}`]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setTbn2SyncResults(prev => ({
        ...prev,
        [`version_${siteId}`]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setTbn2CheckingPluginVersion(prev => {
        const newSet = new Set(prev);
        newSet.delete(siteId);
        return newSet;
      });
    }
  };

  const tbn2_handleUpdatePlugin = async (siteId: string) => {
    setTbn2UpdatingPlugin(prev => new Set([...prev, siteId]));
    
    setTbn2SyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[`update_${siteId}`];
      return newResults;
    });

    try {
      const response = await fetch('/api/plugin/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId
        })
      });

      const data = await response.json();

      if (data.success) {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`update_${siteId}`]: {
            type: 'success',
            message: `✅ ${data.message} (Updated to version: ${data.newVersion || 'Unknown'})`
          }
        }));
      } else {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`update_${siteId}`]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setTbn2SyncResults(prev => ({
        ...prev,
        [`update_${siteId}`]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setTbn2UpdatingPlugin(prev => {
        const newSet = new Set(prev);
        newSet.delete(siteId);
        return newSet;
      });
    }
  };

  const tbn2_handleBarkroPush = async (siteId: string) => {
    setTbn2BarkroPushing(prev => new Set([...prev, siteId]));
    
    setTbn2SyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[`barkro_${siteId}`];
      return newResults;
    });

    try {
      const response = await fetch('/api/barkro/push-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId
        })
      });

      const data = await response.json();

      if (data.success) {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`barkro_${siteId}`]: {
            type: 'success',
            message: `✅ ${data.message}`
          }
        }));
      } else {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`barkro_${siteId}`]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setTbn2SyncResults(prev => ({
        ...prev,
        [`barkro_${siteId}`]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setTbn2BarkroPushing(prev => {
        const newSet = new Set(prev);
        newSet.delete(siteId);
        return newSet;
      });
    }
  };

  // SOPTION1 and SOPTION2 handler - adapted for tebnar2
  const [tbn2_functionLoading, setTbn2FunctionLoading] = useState(false);
  
  const tbn2_handleSelectedItemsFunction = async (functionName: string) => {
    let itemsToProcess: string[] = [];
    
    if (tbn2_kz101Checked) {
      // SOPTION1: Use selected items
      if (tbn2_selectedRows.size === 0) {
        alert('Please select at least one item from the table');
        return;
      }
      itemsToProcess = Array.from(tbn2_selectedRows);
    } else if (tbn2_kz103Checked) {
      // SOPTION2: Use all items in current pagination
      itemsToProcess = tbn2_paginatedPlans.map(plan => plan.id);
    } else {
      alert('Please select either SOPTION1 or SOPTION2');
      return;
    }

    if (itemsToProcess.length === 0) {
      alert('No items to process');
      return;
    }

    setTbn2FunctionLoading(true);
    try {
      // Example API call structure - can be customized for different functions
      const response = await fetch(`/api/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_ids: itemsToProcess,
          batch_id: tbn2_selectedBatchId || null,
          selection_type: tbn2_kz101Checked ? 'SOPTION1' : 'SOPTION2',
          total_items: itemsToProcess.length
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully processed ${itemsToProcess.length} items with ${functionName}`);
        // Refresh the data
        tbn2_fetchPlans();
      } else {
        alert(`Error: ${result.error || `Failed to execute ${functionName}`}`);
      }
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      alert(`An error occurred while executing ${functionName}`);
    } finally {
      setTbn2FunctionLoading(false);
    }
  };

  // Filter plans by selected batch using centralized function
  const tbn2_filteredPlans = tbn2_filterPlansByBatch(tbn2_plans, tbn2_selectedBatchId || null);

  // Apply sorting to filtered plans
  const tbn2_sortedPlans = tbn2_getSortedPlans(tbn2_filteredPlans);

  // Pagination logic
  const tbn2_totalPages = Math.ceil(tbn2_sortedPlans.length / tbn2_pageSize);
  const tbn2_startIndex = (tbn2_currentPage - 1) * tbn2_pageSize;
  const tbn2_endIndex = tbn2_startIndex + tbn2_pageSize;
  const tbn2_paginatedPlans = tbn2_sortedPlans.slice(tbn2_startIndex, tbn2_endIndex);

  if (tbn2_loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading Tebnar2...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      {/* Filters and Controls - enhanced with URL parameter support */}
      <Tebnar2Filters
        batches={tbn2_batches}
        selectedBatchId={tbn2_selectedBatchId}
        onBatchChange={tbn2_handleBatchChange}
        error={tbn2_error}
        onRefresh={tbn2_fetchPlans}
        onErrorDismiss={() => setTbn2Error(null)}
      />

      {/* Active Filter Indicator - tebnar2 specific */}
      {tbn2_selectedBatchId && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-blue-800 font-medium">
                📌 Filtered by batch: 
              </span>
              <code className="ml-2 px-2 py-1 bg-blue-100 text-blue-900 rounded text-sm font-mono">
                {tbn2_selectedBatchId}
              </code>
            </div>
            <button 
              onClick={() => tbn2_handleBatchChange('')}
              className="text-red-600 hover:text-red-800 hover:underline text-sm font-medium transition-colors"
              title="Clear batch filter"
            >
              Clear Filter
            </button>
          </div>
          <div className="mt-2 text-sm text-blue-600">
            Showing {tbn2_filteredPlans.length} plans from this batch
          </div>
        </div>
      )}


      {/* Functions Popup Button and Sitespren Widget */}
      <div className="mb-4 flex items-start space-x-4">
        {/* Functions Popup Button */}
        <button
          onClick={tbn2_handlePopupOpen}
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

        {/* Sitespren Assignment Widget */}
        <div 
          className="bg-white border border-gray-300 rounded-lg p-2"
        >
          <div className="font-bold text-gray-700 mb-1" style={{ fontSize: '16px' }}>asn_sitespren_id</div>
          <div className="flex items-center space-x-2">
            <div className="tbn2-select-container tbn2-sitespren-container">
              <select
                value={tbn2_selectedSitesprenId}
                onChange={(e) => {
                  setTbn2SelectedSitesprenId(e.target.value);
                  const selectedSitespren = tbn2_sitesprenOptions.find(s => s.id === e.target.value);
                  if (selectedSitespren) {
                    setTbn2CurrentSitesprenBase(selectedSitespren.sitespren_base);
                    tbn2_fetchGconPieces(selectedSitespren.sitespren_base);
                  } else {
                    setTbn2CurrentSitesprenBase('');
                    setTbn2GconPieceOptions([]);
                  }
                }}
                className="tbn2-custom-select tbn2-sitespren-select rounded px-2 py-1"
                disabled={!tbn2_selectedBatchId}
                style={{ color: 'transparent' }}
              >
                <option value="" disabled>
                  {!tbn2_selectedBatchId ? 'Select batch first' : 'id - sitespren_base'}
                </option>
                {tbn2_sitesprenOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.id} - {option.sitespren_base}
                  </option>
                ))}
              </select>
              <div className={`tbn2-select-overlay ${!tbn2_selectedBatchId ? 'disabled' : ''}`}>
                {tbn2_selectedSitesprenId ? tbn2_getSelectedSitesprenDisplay() : 
                 (!tbn2_selectedBatchId ? 'Select batch first' : 'id - sitespren_base')}
              </div>
            </div>
            <button
              onClick={tbn2_handleSitesprenSave}
              disabled={!tbn2_selectedSitesprenId || !tbn2_selectedBatchId || tbn2_sitesprenSaving}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              style={{ fontSize: '16px' }}
              title={!tbn2_selectedBatchId ? 'Select a batch first' : 'Save sitespren assignment'}
            >
              {tbn2_sitesprenSaving ? '...' : 'save'}
            </button>
          </div>

          {/* Pushador Actions Section */}
          {tbn2_selectedSitesprenId && (
            <>
              <hr className="my-3" />
              <div className="font-bold text-gray-700 mb-2" style={{ fontSize: '16px' }}>pushador_actions</div>
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 relative group flex items-center gap-1"
                    onClick={() => tbn2_handleWpsv2Sync(tbn2_selectedSitesprenId, 'plugin_api')}
                    disabled={tbn2_syncLoading.has(tbn2_selectedSitesprenId)}
                  >
                    <span className="info-icon">ⓘ</span>
                    {tbn2_syncLoading.has(tbn2_selectedSitesprenId) ? 'Syncing...' : 'Plugin API'}
                    <div className="tooltip-content">
                      <div className="font-bold mb-2">Plugin API Sync</div>
                      <div className="text-xs space-y-1">
                        <p><strong>Function:</strong> wpsv2SyncViaPluginApi()</p>
                        <p><strong>Location:</strong> /app/api/wpsv2/sync-site/route.ts:138-187</p>
                        <p><strong>Flow:</strong></p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>Fetches content from WP via custom plugin endpoint</li>
                          <li>Uses ruplin_api_key_1 for authentication</li>
                          <li>Calls wpsv2SaveContentToDatabase()</li>
                          <li>Saves to nwpi_content table</li>
                        </ol>
                        <p><strong>Endpoint:</strong> /wp-json/snefuru/v1/posts</p>
                        <p><strong>Auth:</strong> Bearer token in header</p>
                      </div>
                    </div>
                  </button>
                  <button
                    className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 relative group flex items-center gap-1"
                    onClick={() => tbn2_handleWpsv2Sync(tbn2_selectedSitesprenId, 'rest_api')}
                    disabled={tbn2_syncLoading.has(tbn2_selectedSitesprenId)}
                  >
                    <span className="info-icon">ⓘ</span>
                    {tbn2_syncLoading.has(tbn2_selectedSitesprenId) ? 'Syncing...' : 'Rest API'}
                    <div className="tooltip-content">
                      <div className="font-bold mb-2">REST API Sync</div>
                      <div className="text-xs space-y-1">
                        <p><strong>Function:</strong> wpsv2SyncViaRestApi()</p>
                        <p><strong>Location:</strong> /app/api/wpsv2/sync-site/route.ts:190-274</p>
                        <p><strong>Flow:</strong></p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>Uses standard WP REST API</li>
                          <li>Fetches posts & pages separately</li>
                          <li>Can work without auth (public posts only)</li>
                          <li>Saves to nwpi_content table</li>
                        </ol>
                        <p><strong>Endpoints:</strong> /wp-json/wp/v2/posts, /wp-json/wp/v2/pages</p>
                        <p><strong>Auth:</strong> Optional app password</p>
                      </div>
                    </div>
                  </button>
                  <button
                    className="px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 relative group flex items-center gap-1"
                    onClick={() => tbn2_handleWpsv2TestPlugin(tbn2_selectedSitesprenId)}
                    disabled={tbn2_syncLoading.has(`test_${tbn2_selectedSitesprenId}`)}
                  >
                    <span className="info-icon">ⓘ</span>
                    {tbn2_syncLoading.has(`test_${tbn2_selectedSitesprenId}`) ? 'Testing...' : 'Test Plugin'}
                    <div className="tooltip-content">
                      <div className="font-bold mb-2">Test Plugin Connection</div>
                      <div className="text-xs space-y-1">
                        <p><strong>Function:</strong> handleWpsv2TestPlugin()</p>
                        <p><strong>API Route:</strong> /api/test-plugin-connection</p>
                        <p><strong>Purpose:</strong> Verifies plugin is installed & API key is valid</p>
                        <p><strong>Tests:</strong></p>
                        <ul className="list-disc list-inside ml-2">
                          <li>Plugin presence check</li>
                          <li>API key authentication</li>
                          <li>Endpoint accessibility</li>
                          <li>Response format validation</li>
                        </ul>
                        <p><strong>Returns:</strong> Success/failure status</p>
                      </div>
                    </div>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 text-xs font-medium text-white bg-orange-600 rounded hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 relative group flex items-center gap-1"
                    onClick={() => tbn2_handleCheckPluginVersion(tbn2_selectedSitesprenId)}
                    disabled={tbn2_checkingPluginVersion.has(tbn2_selectedSitesprenId)}
                  >
                    <span className="info-icon">ⓘ</span>
                    {tbn2_checkingPluginVersion.has(tbn2_selectedSitesprenId) ? 'Checking...' : 'Check WP Plugin Version'}
                    <div className="tooltip-content">
                      <div className="font-bold mb-2">Check Plugin Version</div>
                      <div className="text-xs space-y-1">
                        <p><strong>Function:</strong> handleCheckPluginVersion()</p>
                        <p><strong>API Route:</strong> /api/check-plugin-version</p>
                        <p><strong>Purpose:</strong> Gets installed plugin version from WP site</p>
                        <p><strong>Process:</strong></p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>Queries WP plugin endpoint</li>
                          <li>Retrieves version number</li>
                          <li>Compares with latest available</li>
                          <li>Shows update availability</li>
                        </ol>
                        <p><strong>Uses:</strong> Plugin's version check endpoint</p>
                      </div>
                    </div>
                  </button>
                  <button
                    className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 relative group flex items-center gap-1"
                    onClick={() => tbn2_handleUpdatePlugin(tbn2_selectedSitesprenId)}
                    disabled={tbn2_updatingPlugin.has(tbn2_selectedSitesprenId)}
                  >
                    <span className="info-icon">ⓘ</span>
                    {tbn2_updatingPlugin.has(tbn2_selectedSitesprenId) ? 'Updating...' : 'Update Plugin'}
                    <div className="tooltip-content">
                      <div className="font-bold mb-2">Update Plugin</div>
                      <div className="text-xs space-y-1">
                        <p><strong>Function:</strong> handleUpdatePlugin()</p>
                        <p><strong>API Route:</strong> /api/update-plugin</p>
                        <p><strong>Purpose:</strong> Updates WP plugin to latest version</p>
                        <p><strong>Process:</strong></p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>Downloads latest plugin ZIP</li>
                          <li>Uploads to WordPress</li>
                          <li>Deactivates old version</li>
                          <li>Installs & activates new version</li>
                        </ol>
                        <p><strong>Note:</strong> Requires WP admin credentials</p>
                      </div>
                    </div>
                  </button>
                  <button
                    className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 relative group flex items-center gap-1"
                    onClick={() => tbn2_handleBarkroPush(tbn2_selectedSitesprenId)}
                    disabled={tbn2_barkroPushing.has(tbn2_selectedSitesprenId)}
                  >
                    <span className="info-icon">ⓘ</span>
                    {tbn2_barkroPushing.has(tbn2_selectedSitesprenId) ? 'Pushing...' : 'Push updates with Barkro'}
                    <div className="tooltip-content">
                      <div className="font-bold mb-2">Barkro Push Updates</div>
                      <div className="text-xs space-y-1">
                        <p><strong>Function:</strong> handleBarkroPush()</p>
                        <p><strong>API Route:</strong> /api/barkro/push-update/route.ts</p>
                        <p><strong>Purpose:</strong> Push plugin updates via Barkro system</p>
                        <p><strong>Flow:</strong></p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>Gets current plugin version from DB</li>
                          <li>Creates narpi_pushes record</li>
                          <li>Sends update notification to WP</li>
                          <li>WP checks & applies update</li>
                        </ol>
                        <p><strong>Endpoint:</strong> /wp-json/snefuru/v1/check-update</p>
                        <p><strong>Auth:</strong> Uses ruplin_api_key_1</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <hr className="my-3" />
              <div className="font-bold text-gray-700 mb-2" style={{ fontSize: '16px' }}>feedback message</div>
              
              {/* Feedback Messages Area */}
              <div className="min-h-[40px]">
                {(tbn2_syncResults[tbn2_selectedSitesprenId] || 
                  tbn2_syncResults[`test_${tbn2_selectedSitesprenId}`] || 
                  tbn2_syncResults[`version_${tbn2_selectedSitesprenId}`] || 
                  tbn2_syncResults[`update_${tbn2_selectedSitesprenId}`] || 
                  tbn2_syncResults[`barkro_${tbn2_selectedSitesprenId}`]) && (
                  <div className={`text-xs p-2 rounded ${
                    (tbn2_syncResults[tbn2_selectedSitesprenId]?.type === 'success' || 
                     tbn2_syncResults[`test_${tbn2_selectedSitesprenId}`]?.type === 'success' || 
                     tbn2_syncResults[`version_${tbn2_selectedSitesprenId}`]?.type === 'success' || 
                     tbn2_syncResults[`update_${tbn2_selectedSitesprenId}`]?.type === 'success' || 
                     tbn2_syncResults[`barkro_${tbn2_selectedSitesprenId}`]?.type === 'success') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {tbn2_syncResults[tbn2_selectedSitesprenId]?.message || 
                     tbn2_syncResults[`test_${tbn2_selectedSitesprenId}`]?.message || 
                     tbn2_syncResults[`version_${tbn2_selectedSitesprenId}`]?.message || 
                     tbn2_syncResults[`update_${tbn2_selectedSitesprenId}`]?.message || 
                     tbn2_syncResults[`barkro_${tbn2_selectedSitesprenId}`]?.message}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ReverseRelation Widget - Shows currently assigned gcon_piece */}
        <div 
          className="bg-white border border-gray-300 rounded-lg p-2"
          style={{ maxHeight: '85px' }}
        >
          <div className="font-bold text-gray-700 mb-1" style={{ fontSize: '16px' }}>ReverseRelation-from-gcon_pieces.asn_image_plan_batch_id (assigned gcon_piece)</div>
          <div className="flex items-center space-x-2">
            {/* Text display with copy button */}
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={(() => {
                  if (!tbn2_assignedGconPiece) return '';
                  // Format: "35a.- 5nezl.ksit.me/services-hub-page/"
                  const truncatedId = tbn2_assignedGconPiece.id.substring(0, 3) + '.';
                  const sitesprenBase = tbn2_assignedGconPiece.asn_sitespren_base || '';
                  const postName = tbn2_assignedGconPiece.post_name || '';
                  return `${truncatedId}- ${sitesprenBase}/${postName}/`;
                })()}
                className="flex-1 px-2 py-1 border border-gray-300 rounded bg-gray-50"
                style={{ fontSize: '14px' }}
              />
              <button
                onClick={() => {
                  if (!tbn2_assignedGconPiece) return;
                  const truncatedId = tbn2_assignedGconPiece.id.substring(0, 3) + '.';
                  const sitesprenBase = tbn2_assignedGconPiece.asn_sitespren_base || '';
                  const postName = tbn2_assignedGconPiece.post_name || '';
                  const textToCopy = `${truncatedId}- ${sitesprenBase}/${postName}/`;
                  navigator.clipboard.writeText(textToCopy);
                }}
                disabled={!tbn2_assignedGconPiece}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{ fontSize: '14px' }}
              >
                Copy
              </button>
            </div>
            {/* Open buttons */}
            <button
              onClick={() => {
                if (tbn2_assignedGconPiece) {
                  window.open(`/torya?gcon_piece_id=${tbn2_assignedGconPiece.id}`, '_blank');
                }
              }}
              disabled={!tbn2_assignedGconPiece}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              style={{ fontSize: '16px' }}
            >
              open /torya
            </button>
            <button
              onClick={() => {
                if (tbn2_assignedGconPiece) {
                  window.open(`/mesagen/${tbn2_assignedGconPiece.id}`, '_blank');
                }
              }}
              disabled={!tbn2_assignedGconPiece}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              style={{ fontSize: '16px' }}
            >
              open /mesagen
            </button>
          </div>
        </div>

        {/* Gcon Piece Assignment Widget */}
        <div 
          className="bg-white border border-gray-300 rounded-lg p-2"
          style={{ maxHeight: '85px' }}
        >
          <div className="font-bold text-gray-700 mb-1" style={{ fontSize: '16px' }}>asn_gcon_piece_id</div>
          <div className="flex items-center space-x-2">
            <div className="tbn2-select-container tbn2-gcon-piece-container">
              <select
                value={tbn2_selectedGconPieceId}
                onChange={(e) => setTbn2SelectedGconPieceId(e.target.value)}
                className="tbn2-custom-select tbn2-gcon-piece-select rounded px-2 py-1"
                disabled={!tbn2_selectedBatchId || !tbn2_selectedSitesprenId}
                style={{ color: 'transparent' }}
              >
                <option value="" disabled>
                  {!tbn2_selectedBatchId ? 'Select batch first' : 
                   !tbn2_selectedSitesprenId ? 'Select sitespren first' : 
                   'id - meta_title'}
                </option>
                {tbn2_gconPieceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.id} - {option.meta_title}
                  </option>
                ))}
              </select>
              <div className={`tbn2-select-overlay ${(!tbn2_selectedBatchId || !tbn2_selectedSitesprenId) ? 'disabled' : ''}`}>
                {tbn2_selectedGconPieceId ? tbn2_getSelectedGconPieceDisplay() :
                 (!tbn2_selectedBatchId ? 'Select batch first' : 
                  !tbn2_selectedSitesprenId ? 'Select sitespren first' : 
                  'id - meta_title')}
              </div>
            </div>
            <button
              onClick={tbn2_handleGconPieceSave}
              disabled={!tbn2_selectedGconPieceId || !tbn2_selectedBatchId || tbn2_gconPieceSaving}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              style={{ fontSize: '16px' }}
              title={!tbn2_selectedBatchId ? 'Select a batch first' : 
                     !tbn2_selectedSitesprenId ? 'Select a sitespren first' :
                     'Save gcon piece assignment'}
            >
              {tbn2_gconPieceSaving ? '...' : 'save'}
            </button>
          </div>
        </div>
      </div>

      {/* Column Template Controls - positioned just above the main table */}
      <div className="mb-6 flex items-stretch space-x-4">
        {/* SQL View Info */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-xs" style={{maxWidth: '130px', maxHeight: '75px'}}>
          <div className="font-semibold text-gray-700 mb-1">SQL View Info</div>
          <div className="text-gray-600">view name: images_plans</div>
          <div className="text-gray-600"># columns: {tbn2_getAllTableColumns().length}</div>
        </div>

        {/* Column Template Options */}
        <div className="bg-white border border-gray-300 rounded-lg p-2" style={{maxWidth: '600px', maxHeight: '75px'}}>
          <div className="text-xs font-semibold text-gray-700 mb-2">Column Templates (Show/Hide)</div>
          <div className="flex space-x-1">
            {Object.entries(TBN2_COLUMN_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => tbn2_handleColumnTemplateChange(key)}
                className={`text-xs leading-tight p-2 rounded border text-center ${
                  tbn2_selectedColTemplate === key
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                style={{width: '120px'}}
              >
                <div className="font-semibold">{template.label}</div>
                <div>{template.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sticky Columns Control */}
        <div className="bg-white border border-gray-300 rounded-lg p-2">
          <div className="text-xs font-semibold text-gray-700 mb-2">Sticky Columns At Left Side Of UI Grid Table</div>
          <div className="flex space-x-1">
            {[
              { id: 1, label: 'OPTION 1', subtitle: '1 left-most', range: 'column' },
              { id: 2, label: 'OPTION 2', subtitle: '2 left-most', range: 'columns' },
              { id: 3, label: 'OPTION 3', subtitle: '3 left-most', range: 'columns' },
              { id: 4, label: 'OPTION 4', subtitle: '4 left-most', range: 'columns' },
              { id: 5, label: 'OPTION 5', subtitle: '5 left-most', range: 'columns' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => tbn2_handleStickyColChange(option.id)}
                className={`text-xs leading-tight p-1 rounded border text-center ${
                  tbn2_stickyColCount === option.id
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                style={{width: '80px'}}
              >
                <div className="font-semibold">{option.label}</div>
                <div>{option.subtitle}</div>
                <div>{option.range}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Narpi Push Button */}
        <div className="bg-white border border-gray-300 rounded-lg p-2">
          <div className="text-xs font-semibold text-gray-700 mb-2">WordPress Push</div>
          <button
            onClick={tbn2_sfunc63_createNarpiPush}
            disabled={!tbn2_selectedBatchId || !tbn2_selectedSitesprenId || tbn2_selectedRows.size === 0 || tbn2_narpiPushLoading}
            className={`px-3 py-2 text-sm font-medium rounded border transition-colors ${
              !tbn2_selectedBatchId || !tbn2_selectedSitesprenId || tbn2_selectedRows.size === 0 || tbn2_narpiPushLoading
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-green-600 text-white border-green-600 hover:bg-green-700'
            }`}
            title={
              !tbn2_selectedBatchId ? 'Select a batch first' :
              !tbn2_selectedSitesprenId ? 'Select a sitespren site first' :
              tbn2_selectedRows.size === 0 ? 'Select at least one image plan from the table' :
              'Push selected images to sitespren site'
            }
          >
            {tbn2_narpiPushLoading ? '...' : 'tbn2_sfunc63_createNarpiPush()'}
          </button>
          
          {/* Progress Bar */}
          {(tbn2_narpiPushLoading || tbn2_narpiPushStatus) && (
            <div className="mt-2">
              <div className="w-36 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{width: `${tbn2_narpiPushProgress}%`}}
                ></div>
              </div>
              {tbn2_narpiPushStatus && (
                <div className="text-xs text-gray-600 mt-1">{tbn2_narpiPushStatus}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Table - enhanced with column template system */}
      <Tebnar2Table
        plans={tbn2_paginatedPlans}
        imagesById={tbn2_imagesById}
        fetchingImages={tbn2_fetchingImages}
        lastClickTime={tbn2_lastClickTime}
        currentPage={tbn2_currentPage}
        pageSize={tbn2_pageSize}
        totalPages={tbn2_totalPages}
        totalPlans={tbn2_sortedPlans.length}
        onPageChange={setTbn2CurrentPage}
        onPageSizeChange={setTbn2PageSize}
        onRefreshImages={tbn2_fetchImages}
        onFetchSingleImage={tbn2_fetchSingleImage}
        stickyColumns={tbn2_getStickyColumns()}
        visibleColumns={tbn2_getVisibleColumns()}
        calculateStickyLeft={tbn2_calculateStickyLeft}
        getColumnWidth={tbn2_getColumnWidth}
        selectedRows={tbn2_selectedRows}
        onSelectionChange={setTbn2SelectedRows}
        sortColumn={tbn2_sortColumn}
        sortDirection={tbn2_sortDirection}
        onSort={tbn2_handleSort}
      />

      {/* Functions Popup Modal - cloned from nwjar1 */}
      {tbn2_isPopupOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white w-full h-full max-w-[95vw] max-h-[95vh] rounded-lg shadow-xl relative overflow-hidden">
            {/* uelbar37 header bar */}
            <div 
              className="absolute top-0 left-0 right-0 flex items-center px-4"
              style={{ 
                height: '50px',
                backgroundColor: tbn2_uelBar37Colors.bg,
                color: tbn2_uelBar37Colors.text
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
                  // Parse URL to highlight batchid parameter for tebnar2
                  try {
                    const url = new URL(tbn2_currentUrl);
                    const batchidParam = url.searchParams.get('batchid');
                    
                    if (batchidParam) {
                      const fullUrl = tbn2_currentUrl;
                      const batchidText = `batchid=${batchidParam}`;
                      const parts = fullUrl.split(batchidText);
                      
                      if (parts.length === 2) {
                        return (
                          <>
                            {parts[0]}
                            <span style={{ fontWeight: 'bold', color: '#ff9e71' }}>
                              {batchidText}
                            </span>
                            {parts[1]}
                          </>
                        );
                      }
                    }
                    
                    return tbn2_currentUrl;
                  } catch (error) {
                    return tbn2_currentUrl;
                  }
                })()}
              </span>

              {/* Copy buttons in uelbar37 - positioned to the left of close button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tbn2_currentUrl);
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
                    const url = new URL(tbn2_currentUrl);
                    const batchidParam = url.searchParams.get('batchid');
                    if (batchidParam) {
                      navigator.clipboard.writeText(batchidParam);
                    }
                  } catch (error) {
                    console.error('Error copying batch ID:', error);
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
                title="Copy Batch ID"
              >
                <div>BATCH</div>
              </button>
            </div>
            
            {/* uelbar38 header bar */}
            <div 
              className="absolute left-0 right-0 flex items-center px-4"
              style={{ 
                top: '50px',
                height: '50px',
                backgroundColor: tbn2_uelBarColors.bg,
                color: tbn2_uelBarColors.text
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
                  color: tbn2_uelBarColors.text,
                  padding: '8px',
                  border: '1px solid black',
                  fontSize: '16px'
                }}
                onClick={tbn2_handleKz101Click}
              >
                <input
                  type="checkbox"
                  className="mr-2 pointer-events-none"
                  checked={tbn2_kz101Checked}
                  readOnly
                  style={{
                    width: '18px',
                    height: '18px'
                  }}
                />
                SOPTION1 - Use Your Current Selection From Table | {tbn2_selectedRows.size} rows
              </div>
              <div 
                className="flex items-center kz102 font-bold"
                style={{
                  color: tbn2_uelBarColors.text,
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
                  color: tbn2_uelBarColors.text,
                  padding: '8px',
                  border: '1px solid black',
                  fontSize: '16px'
                }}
                onClick={tbn2_handleKz103Click}
              >
                <input
                  type="checkbox"
                  className="mr-2 pointer-events-none"
                  checked={tbn2_kz103Checked}
                  readOnly
                  style={{
                    width: '18px',
                    height: '18px'
                  }}
                />
                SOPTION2 - Select All Items In Current Pagination | {tbn2_paginatedPlans.length} rows
              </div>
              
              {/* Close button in header - spans both bars */}
              <button
                onClick={tbn2_handlePopupClose}
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
                      onClick={() => tbn2_handleTabChange(tab)}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        tbn2_activePopupTab === tab
                          ? 'border-blue-500 text-blue-600 bg-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {tab === 'ptab1' ? 'Functions' : 
                       tab === 'ptab2' ? 'Create Plans' : 
                       tab}
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="p-8 h-full overflow-auto">
                {tbn2_activePopupTab === 'ptab1' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Functions</h3>
                    <div className="space-y-4">
                      
                      {/* Function Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={() => tbn2_handleSelectedItemsFunction('tbn2_example_function_1')}
                          disabled={tbn2_functionLoading || (!tbn2_kz101Checked && !tbn2_kz103Checked) || (tbn2_kz101Checked && tbn2_selectedRows.size === 0)}
                          className={`px-4 py-2 rounded font-medium ${
                            tbn2_functionLoading || (!tbn2_kz101Checked && !tbn2_kz103Checked) || (tbn2_kz101Checked && tbn2_selectedRows.size === 0)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {tbn2_functionLoading ? 'Processing...' : 'Example Function 1 - Process Selected Plans'}
                        </button>
                        
                        <button
                          onClick={() => tbn2_handleSelectedItemsFunction('tbn2_example_function_2')}
                          disabled={tbn2_functionLoading || (!tbn2_kz101Checked && !tbn2_kz103Checked) || (tbn2_kz101Checked && tbn2_selectedRows.size === 0)}
                          className={`px-4 py-2 rounded font-medium ${
                            tbn2_functionLoading || (!tbn2_kz101Checked && !tbn2_kz103Checked) || (tbn2_kz101Checked && tbn2_selectedRows.size === 0)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {tbn2_functionLoading ? 'Processing...' : 'Example Function 2 - Batch Operations'}
                        </button>
                        
                        <button
                          onClick={() => tbn2_handleSelectedItemsFunction('tbn2_regenerate_images')}
                          disabled={tbn2_functionLoading || (!tbn2_kz101Checked && !tbn2_kz103Checked) || (tbn2_kz101Checked && tbn2_selectedRows.size === 0)}
                          className={`px-4 py-2 rounded font-medium ${
                            tbn2_functionLoading || (!tbn2_kz101Checked && !tbn2_kz103Checked) || (tbn2_kz101Checked && tbn2_selectedRows.size === 0)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {tbn2_functionLoading ? 'Processing...' : 'Regenerate Images for Selected Plans'}
                        </button>
                      </div>
                      
                      {/* Status Messages */}
                      {!tbn2_kz101Checked && !tbn2_kz103Checked && (
                        <p className="text-sm text-gray-500">
                          Select either SOPTION1 or SOPTION2 to enable functions
                        </p>
                      )}
                      {tbn2_kz101Checked && tbn2_selectedRows.size === 0 && (
                        <p className="text-sm text-gray-500">
                          SOPTION1 selected: Select items from the table to enable functions
                        </p>
                      )}
                      {tbn2_kz101Checked && tbn2_selectedRows.size > 0 && (
                        <p className="text-sm text-gray-600">
                          SOPTION1 selected: {tbn2_selectedRows.size} item(s) will be processed
                        </p>
                      )}
                      {tbn2_kz103Checked && (
                        <p className="text-sm text-gray-600">
                          SOPTION2 selected: All {tbn2_paginatedPlans.length} items will be processed
                        </p>
                      )}
                      
                      {/* Current Selection Info */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">
                          <strong>Current Selection Info:</strong>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          • Selected Rows: {tbn2_selectedRows.size}
                        </div>
                        <div className="text-xs text-gray-600">
                          • Current Page Items: {tbn2_paginatedPlans.length}
                        </div>
                        <div className="text-xs text-gray-600">
                          • Total Filtered Plans: {tbn2_filteredPlans.length}
                        </div>
                        {tbn2_selectedBatchId && (
                          <div className="text-xs text-gray-600">
                            • Active Batch Filter: {tbn2_selectedBatchId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {tbn2_activePopupTab === 'ptab2' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Create New Image Plans</h3>
                    <p className="text-gray-600 mb-6">Use the tools below to create and submit new batches of image plans.</p>
                    
                    {/* Actions and Settings - moved from main page */}
                    <Tebnar2Actions
                      qtyPerPlan={tbn2_qtyPerPlan}
                      onQtyPerPlanChange={setTbn2QtyPerPlan}
                      aiModel={tbn2_aiModel}
                      onAiModelChange={setTbn2AiModel}
                      generateZip={tbn2_generateZip}
                      onGenerateZipChange={setTbn2GenerateZip}
                      wipeMeta={tbn2_wipeMeta}
                      onWipeMetaChange={setTbn2WipeMeta}
                      throttle1={tbn2_throttle1}
                      onThrottle1Change={setTbn2Throttle1}
                      submitLoading={tbn2_submitLoading}
                      submitResult={tbn2_submitResult}
                      makeImagesLoading={tbn2_makeImagesLoading}
                      makeImagesResult={tbn2_makeImagesResult}
                      loadingPreset={tbn2_loadingPreset}
                      onPresetLoad={tbn2_loadDummyData}
                      gridData={tbn2_gridData}
                      onGridDataChange={setTbn2GridData}
                      presetData={tbn2_presetData}
                      onSubmitCreatePlans={tbn2_handleSubmitCreatePlans}
                      onSubmitMakeImages={tbn2_handleSubmitMakeImages}
                    />
                  </div>
                )}
                {tbn2_activePopupTab === 'ptab3' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab3</h3>
                    <p className="text-gray-600">This is the content area for ptab3.</p>
                  </div>
                )}
                {tbn2_activePopupTab === 'ptab4' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab4</h3>
                    <p className="text-gray-600">This is the content area for ptab4.</p>
                  </div>
                )}
                {tbn2_activePopupTab === 'ptab5' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab5</h3>
                    <p className="text-gray-600">This is the content area for ptab5.</p>
                  </div>
                )}
                {tbn2_activePopupTab === 'ptab6' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab6</h3>
                    <p className="text-gray-600">This is the content area for ptab6.</p>
                  </div>
                )}
                {tbn2_activePopupTab === 'ptab7' && (
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