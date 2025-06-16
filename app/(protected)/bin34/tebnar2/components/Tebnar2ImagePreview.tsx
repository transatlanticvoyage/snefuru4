'use client';

import { Tebnar2Image, Tebnar2ImagePlan } from '../types/tebnar2-types';
import { TBN2_DEBOUNCE_MS } from '../constants/tebnar2-constants';

interface Tebnar2ImagePreviewProps {
  image: Tebnar2Image | null;
  imageId: string | null;
  plan: Tebnar2ImagePlan;
  imageNumber: number;
  fetchingImages: Set<string>;
  lastClickTime: Record<string, number>;
  onRefreshImages: () => void;
}

export default function Tebnar2ImagePreview({
  image,
  imageId,
  plan,
  imageNumber,
  fetchingImages,
  lastClickTime,
  onRefreshImages
}: Tebnar2ImagePreviewProps) {
  
  const fetchKey = `${plan.id}-${imageNumber}`;
  const isFetching = fetchingImages.has(fetchKey);
  
  // Check if we should show fetch button (placeholder logic)
  const tbn2_shouldShowFetchButton = (plan: Tebnar2ImagePlan, imgNum: number) => {
    // This logic would be cloned from tebnar1's shouldShowFetchButton function
    // For now, show if there's no image but there's content to generate from
    return !imageId && (plan.e_prompt1 || plan.e_associated_content1);
  };

  // Handle fetch image button click with debouncing
  const tbn2_handleFetchImage = () => {
    const now = Date.now();
    const lastClick = lastClickTime[fetchKey] || 0;
    
    if (now - lastClick < TBN2_DEBOUNCE_MS) {
      return; // Debounce protection
    }

    // Update last click time
    // Note: This would need to be passed up to parent component to update state
    console.log(`Would fetch image ${imageNumber} for plan ${plan.id}`);
    
    // TODO: Implement actual image generation logic
    // This would call the utility function to generate images
    // Similar to the cfunc_create_plans_make_images_1 functionality
  };

  const showFetchButton = tbn2_shouldShowFetchButton(plan, imageNumber);

  return (
    <div className="w-full h-20 flex items-center justify-center">
      {image ? (
        // Show actual image
        <img
          src={image.url || ''}
          alt={`Image ${imageNumber} for plan ${plan.id}`}
          className="max-w-full max-h-full object-contain border border-gray-200 rounded"
          onError={(e) => {
            // Handle broken image
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : imageId ? (
        // Image ID exists but image not loaded
        <div className="text-xs text-gray-500 text-center p-2">
          <div>ID: {imageId.substring(0, 8)}...</div>
          <button
            onClick={onRefreshImages}
            className="mt-1 text-blue-600 hover:text-blue-800 underline"
          >
            Refresh
          </button>
        </div>
      ) : showFetchButton ? (
        // Show fetch button for generating new image
        <button
          onClick={tbn2_handleFetchImage}
          disabled={isFetching}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            isFetching
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isFetching ? (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Gen...</span>
            </div>
          ) : (
            `Gen ${imageNumber}`
          )}
        </button>
      ) : (
        // Empty state
        <div className="text-xs text-gray-400 text-center">
          No image
        </div>
      )}
    </div>
  );
}