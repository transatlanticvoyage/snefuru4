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
      {/* Filters and Controls - exact clone from tebnar1 */}
      <Tebnar2Filters
        batches={tbn2_batches}
        selectedBatchId={tbn2_selectedBatchId}
        onBatchChange={setTbn2SelectedBatchId}
        error={tbn2_error}
        onRefresh={tbn2_fetchPlans}
        onErrorDismiss={() => setTbn2Error(null)}
      />

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

      {/* Main Table - exact clone from tebnar1 */}
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
      />
    </div>
  );
}