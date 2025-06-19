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
  tbn2_filterPlansByBatch
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

  // Function to create narpi push for current batch - tebnar2 specific
  const tbn2_sfunc63_createNarpiPush = async () => {
    if (!tbn2_selectedBatchId || tbn2_narpiPushLoading) return;
    
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
      
      // Call the sfunc_63_push_images API endpoint
      const response = await fetch('/api/bin45/sfunc_63_push_images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: tbn2_selectedBatchId,
          push_method: 'tebnar2_batch_push'
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
      setTbn2Error(`🚀 Narpi push completed! Push ID: ${result.push_id}`);
      
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

  // Column width reference for sticky positioning
  const tbn2_getColumnWidth = (col: string) => {
    const widthMap: Record<string, string> = {
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

  // Enhanced batch change handler that updates URL
  const tbn2_handleBatchChange = (batchId: string) => {
    setTbn2SelectedBatchId(batchId);
    tbn2_updateUrlWithBatch(batchId);
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
        } else {
          setTbn2SelectedBatchId('');
          setTbn2Error(`❌ Batch ID "${batchIdParam}" not found`);
          setTimeout(() => setTbn2Error(null), 8000);
        }
      } else {
        setTbn2SelectedBatchId('');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tbn2_batches]);

  // Effect hooks for data fetching using centralized functions
  useEffect(() => {
    tbn2_fetchImages();
  }, [user]);

  useEffect(() => {
    tbn2_fetchBatches();
  }, [user]);

  useEffect(() => {
    tbn2_fetchPlans();
  }, [user]);

  // Filter plans by selected batch using centralized function
  const tbn2_filteredPlans = tbn2_filterPlansByBatch(tbn2_plans, tbn2_selectedBatchId || null);

  // Pagination logic
  const tbn2_totalPages = Math.ceil(tbn2_filteredPlans.length / tbn2_pageSize);
  const tbn2_startIndex = (tbn2_currentPage - 1) * tbn2_pageSize;
  const tbn2_endIndex = tbn2_startIndex + tbn2_pageSize;
  const tbn2_paginatedPlans = tbn2_filteredPlans.slice(tbn2_startIndex, tbn2_endIndex);

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

      {/* Actions and Settings - exact clone from tebnar1 */}
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
            disabled={!tbn2_selectedBatchId || tbn2_narpiPushLoading}
            className={`px-3 py-2 text-sm font-medium rounded border transition-colors ${
              !tbn2_selectedBatchId || tbn2_narpiPushLoading
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-green-600 text-white border-green-600 hover:bg-green-700'
            }`}
            title={!tbn2_selectedBatchId ? 'Select a batch to enable narpi push' : 'Create narpi push for current batch'}
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
        totalPlans={tbn2_filteredPlans.length}
        onPageChange={setTbn2CurrentPage}
        onPageSizeChange={setTbn2PageSize}
        onRefreshImages={tbn2_fetchImages}
        onFetchSingleImage={tbn2_fetchSingleImage}
        stickyColumns={tbn2_getStickyColumns()}
        visibleColumns={tbn2_getVisibleColumns()}
        calculateStickyLeft={tbn2_calculateStickyLeft}
        getColumnWidth={tbn2_getColumnWidth}
      />
    </div>
  );
}