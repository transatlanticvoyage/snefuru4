'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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

  // Fetch all images for the user and map by id (cloned from tebnar1)
  const tbn2_fetchImages = async () => {
    if (!user?.id) {
      setTbn2ImagesById({});
      return;
    }
    
    try {
      // Get user's DB id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
        
      if (userError || !userData) {
        setTbn2ImagesById({});
        return;
      }
      
      // Fetch all images for this user
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('rel_users_id', userData.id);
        
      if (error) {
        setTbn2ImagesById({});
        return;
      }
      
      const imageMap: Record<string, Tebnar2Image> = {};
      (data || []).forEach(img => { 
        if (img.id) imageMap[img.id] = img; 
      });
      setTbn2ImagesById(imageMap);
    } catch (err) {
      console.error('Error fetching images:', err);
      setTbn2ImagesById({});
    }
  };

  // Fetch batches for dropdown (cloned from tebnar1)
  const tbn2_fetchBatches = async () => {
    if (!user?.id) {
      setTbn2Batches([]);
      return;
    }
    
    try {
      // Get user's DB id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
        
      if (userError || !userData) {
        setTbn2Batches([]);
        return;
      }
      
      // Fetch images_plans_batches for this user
      const { data, error } = await supabase
        .from('images_plans_batches')
        .select('*')
        .eq('rel_users_id', userData.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        setTbn2Batches([]);
        return;
      }
      
      setTbn2Batches(data || []);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setTbn2Batches([]);
    }
  };

  // Fetch plans data (cloned from tebnar1)
  const tbn2_fetchPlans = async () => {
    if (!user?.id) {
      setTbn2Plans([]);
      setTbn2Loading(false);
      return;
    }

    try {
      setTbn2Loading(true);
      setTbn2Error(null);

      // Get user's DB id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
        
      if (userError || !userData) {
        setTbn2Error('Could not find user record.');
        setTbn2Plans([]);
        setTbn2Loading(false);
        return;
      }

      // Fetch images_plans for this user
      const { data, error } = await supabase
        .from('images_plans')
        .select('*')
        .eq('rel_users_id', userData.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setTbn2Plans(data || []);
    } catch (err) {
      setTbn2Error(err instanceof Error ? err.message : 'Failed to fetch plans');
      setTbn2Plans([]);
    } finally {
      setTbn2Loading(false);
    }
  };

  // Effect hooks for data fetching
  useEffect(() => {
    tbn2_fetchImages();
  }, [user, supabase]);

  useEffect(() => {
    tbn2_fetchBatches();
  }, [user, supabase]);

  useEffect(() => {
    tbn2_fetchPlans();
  }, [user, supabase]);

  // Filter plans by selected batch
  const tbn2_filteredPlans = tbn2_selectedBatchId 
    ? tbn2_plans.filter(plan => plan.rel_images_plans_batches_id === tbn2_selectedBatchId)
    : tbn2_plans;

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
      {/* Filters and Controls */}
      <Tebnar2Filters
        batches={tbn2_batches}
        selectedBatchId={tbn2_selectedBatchId}
        onBatchChange={setTbn2SelectedBatchId}
        error={tbn2_error}
        onRefresh={tbn2_fetchPlans}
      />

      {/* Actions and Settings */}
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
        onPresetLoad={() => {}} // TODO: Implement preset loading
      />

      {/* Main Table */}
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
      />
    </div>
  );
}