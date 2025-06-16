// Tebnar2 Data Layer Functions - Independent clones from tebnar1

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Tebnar2ImagePlan, Tebnar2Image, Tebnar2Batch } from '../types/tebnar2-types';

// Initialize Supabase client
const tbn2_createSupabaseClient = () => {
  return createClientComponentClient();
};

// User validation and access functions
export const tbn2_validateUserAccess = async (userId: string) => {
  const supabase = tbn2_createSupabaseClient();
  
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userId)
      .single();
      
    if (userError || !userData) {
      return { success: false, internalUserId: null, error: 'User not found' };
    }
    
    return { success: true, internalUserId: userData.id, error: null };
  } catch (err) {
    return { 
      success: false, 
      internalUserId: null, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
};

// Main data fetching function for image plans
export const tbn2_fetchImagePlansData = async (userId: string): Promise<{
  success: boolean;
  data: Tebnar2ImagePlan[];
  error: string | null;
}> => {
  const supabase = tbn2_createSupabaseClient();
  
  try {
    // First validate user access
    const userValidation = await tbn2_validateUserAccess(userId);
    if (!userValidation.success) {
      return { success: false, data: [], error: userValidation.error };
    }

    // Fetch images_plans for this user
    const { data, error } = await supabase
      .from('images_plans')
      .select('*')
      .eq('rel_users_id', userValidation.internalUserId)
      .order('created_at', { ascending: false });
      
    if (error) {
      return { success: false, data: [], error: error.message };
    }
    
    return { success: true, data: data || [], error: null };
  } catch (err) {
    return { 
      success: false, 
      data: [], 
      error: err instanceof Error ? err.message : 'Failed to fetch plans' 
    };
  }
};

// Fetch images for user and create lookup map
export const tbn2_fetchImagesData = async (userId: string): Promise<{
  success: boolean;
  data: Record<string, Tebnar2Image>;
  error: string | null;
}> => {
  const supabase = tbn2_createSupabaseClient();
  
  try {
    // First validate user access
    const userValidation = await tbn2_validateUserAccess(userId);
    if (!userValidation.success) {
      return { success: false, data: {}, error: userValidation.error };
    }

    // Fetch all images for this user
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('rel_users_id', userValidation.internalUserId);
      
    if (error) {
      return { success: false, data: {}, error: error.message };
    }
    
    // Create lookup map by image ID
    const imageMap: Record<string, Tebnar2Image> = {};
    (data || []).forEach(img => { 
      if (img.id) imageMap[img.id] = img; 
    });
    
    return { success: true, data: imageMap, error: null };
  } catch (err) {
    return { 
      success: false, 
      data: {}, 
      error: err instanceof Error ? err.message : 'Failed to fetch images' 
    };
  }
};

// Fetch batches for dropdown
export const tbn2_fetchBatchesData = async (userId: string): Promise<{
  success: boolean;
  data: Tebnar2Batch[];
  error: string | null;
}> => {
  const supabase = tbn2_createSupabaseClient();
  
  try {
    // First validate user access
    const userValidation = await tbn2_validateUserAccess(userId);
    if (!userValidation.success) {
      return { success: false, data: [], error: userValidation.error };
    }

    // Fetch images_plans_batches for this user
    const { data, error } = await supabase
      .from('images_plans_batches')
      .select('*')
      .eq('rel_users_id', userValidation.internalUserId)
      .order('created_at', { ascending: false });
      
    if (error) {
      return { success: false, data: [], error: error.message };
    }
    
    return { success: true, data: data || [], error: null };
  } catch (err) {
    return { 
      success: false, 
      data: [], 
      error: err instanceof Error ? err.message : 'Failed to fetch batches' 
    };
  }
};

// Refresh batches and select specific batch
export const tbn2_refreshBatchesAndSelect = async (userId: string, batchId: string): Promise<{
  success: boolean;
  data: Tebnar2Batch[];
  shouldSelect: boolean;
  error: string | null;
}> => {
  const batchResult = await tbn2_fetchBatchesData(userId);
  
  if (!batchResult.success) {
    return { 
      success: false, 
      data: [], 
      shouldSelect: false, 
      error: batchResult.error 
    };
  }
  
  // Check if the requested batch exists in the fetched data
  const batchExists = batchResult.data.some((batch: Tebnar2Batch) => batch.id === batchId);
  
  return {
    success: true,
    data: batchResult.data,
    shouldSelect: batchExists,
    error: null
  };
};

// Comprehensive refresh function for all data
export const tbn2_refreshAllData = async (userId: string): Promise<{
  success: boolean;
  plans: Tebnar2ImagePlan[];
  images: Record<string, Tebnar2Image>;
  batches: Tebnar2Batch[];
  error: string | null;
}> => {
  try {
    // Fetch all data concurrently
    const [plansResult, imagesResult, batchesResult] = await Promise.all([
      tbn2_fetchImagePlansData(userId),
      tbn2_fetchImagesData(userId),
      tbn2_fetchBatchesData(userId)
    ]);

    // Check for any errors
    const errors = [plansResult.error, imagesResult.error, batchesResult.error].filter(Boolean);
    
    if (errors.length > 0) {
      return {
        success: false,
        plans: [],
        images: {},
        batches: [],
        error: `Multiple errors: ${errors.join(', ')}`
      };
    }

    return {
      success: true,
      plans: plansResult.data,
      images: imagesResult.data,
      batches: batchesResult.data,
      error: null
    };
  } catch (err) {
    return {
      success: false,
      plans: [],
      images: {},
      batches: [],
      error: err instanceof Error ? err.message : 'Failed to refresh data'
    };
  }
};

// Check if fetch button should be shown for image slot (cloned from tebnar1)
export const tbn2_shouldShowFetchButton = (plan: Tebnar2ImagePlan, imageSlot: number): boolean => {
  if (!plan) return false;
  
  // Check if this specific image slot already has an image
  const imageFieldName = `fk_image${imageSlot}_id` as keyof Tebnar2ImagePlan;
  const hasImage = plan[imageFieldName];
  
  if (hasImage) return false; // Already has image
  
  // Always allow fetching image 1 if it's missing
  if (imageSlot === 1) return true;
  
  // For slots 2-4, only show if all previous slots have images
  // This ensures we fill images in order: 1, then 2, then 3, then 4
  for (let i = 1; i < imageSlot; i++) {
    const prevImageField = `fk_image${i}_id` as keyof Tebnar2ImagePlan;
    if (!plan[prevImageField]) {
      return false; // Previous slot is empty, so don't show this one
    }
  }
  
  return true;
};

// Filter plans by batch ID
export const tbn2_filterPlansByBatch = (
  plans: Tebnar2ImagePlan[], 
  batchId: string | null
): Tebnar2ImagePlan[] => {
  if (!batchId) return plans;
  return plans.filter(plan => plan.rel_images_plans_batches_id === batchId);
};

// Pagination helper functions
export const tbn2_calculatePagination = (
  totalItems: number, 
  currentPage: number, 
  pageSize: number
) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    totalPages,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

// Apply pagination to data
export const tbn2_paginateData = <T>(
  data: T[], 
  currentPage: number, 
  pageSize: number
): T[] => {
  const { startIndex, endIndex } = tbn2_calculatePagination(data.length, currentPage, pageSize);
  return data.slice(startIndex, endIndex);
};