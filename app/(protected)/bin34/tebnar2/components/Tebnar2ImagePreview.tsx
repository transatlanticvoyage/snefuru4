'use client';

import { Tebnar2Image, Tebnar2ImagePlan } from '../types/tebnar2-types';
import { TBN2_DEBOUNCE_MS } from '../constants/tebnar2-constants';
import { tbn2_shouldShowFetchButton } from '../utils/tbn2-data-functions';

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
  const showFetchButton = tbn2_shouldShowFetchButton(plan, imageNumber);

  // Handle fetch image button click - exact clone from tebnar1
  const tbn2_handleFetchImage = () => {
    console.log(`Would fetch image ${imageNumber} for plan ${plan.id}`);
    // TODO: Implement actual image generation logic
  };

  // Exact HTML structure from tebnar1
  if (image) {
    return (
      <img
        src={image.img_file_url1 || ''}
        alt={`Image ${imageNumber}`}
        style={{
          width: '80px',
          height: '80px',
          objectFit: 'contain' as const,
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
        }}
      />
    );
  } else if (isFetching) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded"
        style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#f3f4f6',
        }}
      >
        <div 
          className="animate-spin rounded-full border-b-2 border-blue-600"
          style={{
            width: '20px',
            height: '20px',
            borderColor: 'transparent transparent #2563eb transparent',
          }}
        ></div>
      </div>
    );
  } else if (showFetchButton) {
    return (
      <button
        onClick={tbn2_handleFetchImage}
        className="border border-blue-300 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg transition-colors duration-200 ease-in-out"
        style={{
          width: '80px',
          height: '32px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '600',
          transition: 'background-color 200ms ease-in-out',
          backgroundColor: 'transparent',
          borderColor: '#93c5fd',
          color: '#1d4ed8',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#dbeafe';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        Fetch Now
      </button>
    );
  } else {
    return (
      <div className="text-gray-400 text-sm">No image</div>
    );
  }
}