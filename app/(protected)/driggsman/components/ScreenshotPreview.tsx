'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface ScreenshotPreviewProps {
  sitesprenId: string;
  sitesprenBase: string;
  currentScreenshotUrl?: string | null;
  screenshotStatus?: string | null;
  screenshotError?: string | null;
  onScreenshotUpdate?: (data: {
    screenshot_url: string;
    screenshot_status: string;
    screenshot_taken_at: string;
  }) => void;
}

interface ScreenshotState {
  loading: boolean;
  error: string | null;
  imageUrl: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export default function ScreenshotPreview({ 
  sitesprenId, 
  sitesprenBase, 
  currentScreenshotUrl,
  screenshotStatus,
  screenshotError,
  onScreenshotUpdate 
}: ScreenshotPreviewProps) {
  const [state, setState] = useState<ScreenshotState>({
    loading: false,
    error: screenshotError || null,
    imageUrl: currentScreenshotUrl || null,
    status: currentScreenshotUrl ? 'success' : 'idle'
  });

  // Reset component state when sitesprenId changes (when switching column pages)
  useEffect(() => {
    setState({
      loading: false,
      error: screenshotError || null,
      imageUrl: currentScreenshotUrl || null,
      status: currentScreenshotUrl ? 'success' : 'idle'
    });
  }, [sitesprenId, currentScreenshotUrl, screenshotError]);

  const captureScreenshot = useCallback(async (forceRefresh = false) => {
    setState(prev => ({
      ...prev,
      loading: true,
      status: 'loading',
      error: null
    }));

    try {
      const response = await fetch('/api/capture-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sitespren_id: sitesprenId,
          sitespren_base: sitesprenBase,
          force_refresh: forceRefresh
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      if (result.success && result.image_url) {
        console.log('🖼️ Screenshot captured successfully:', {
          imageUrl: result.image_url,
          sitesprenBase,
          timestamp: new Date().toISOString()
        });

        setState({
          loading: false,
          error: null,
          imageUrl: result.image_url,
          status: 'success'
        });

        // Notify parent component of the update
        if (onScreenshotUpdate) {
          onScreenshotUpdate({
            screenshot_url: result.image_url,
            screenshot_status: 'completed',
            screenshot_taken_at: new Date().toISOString()
          });
        }
      } else {
        throw new Error(result.error || 'Failed to capture screenshot');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({
        loading: false,
        error: errorMessage,
        imageUrl: null,
        status: 'error'
      });
    }
  }, [sitesprenId, sitesprenBase, onScreenshotUpdate]);

  const handleImageClick = useCallback(() => {
    if (!state.loading) {
      captureScreenshot(true); // Always force refresh on click
    }
  }, [state.loading, captureScreenshot]);

  const renderContent = () => {
    // Loading state
    if (state.loading) {
      return (
        <div className="flex items-center justify-center h-full bg-blue-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-xs text-blue-600">Capturing...</div>
          </div>
        </div>
      );
    }

    // Error state
    if (state.error) {
      return (
        <div 
          className="flex items-center justify-center h-full bg-red-50 cursor-pointer hover:bg-red-100 transition-colors"
          onClick={handleImageClick}
          title="Click to retry screenshot capture"
        >
          <div className="text-center p-2">
            <div className="text-red-600 text-xs mb-1">❌ Capture Failed</div>
            <div className="text-xs text-red-500 mb-2 break-words">
              {state.error.length > 50 ? `${state.error.substring(0, 50)}...` : state.error}
            </div>
            <div className="text-xs text-red-600 font-medium">Click to retry</div>
          </div>
        </div>
      );
    }

    // Success state with image
    if (state.imageUrl) {
      return (
        <div 
          className="relative h-full cursor-pointer group"
          onClick={handleImageClick}
          title="Click to refresh screenshot"
        >
          <img
            src={state.imageUrl}
            alt={`Screenshot of ${sitesprenBase}`}
            className="w-full h-full object-cover rounded"
            onLoad={() => {
              console.log('✅ Image loaded successfully:', state.imageUrl);
            }}
            onError={(e) => {
              console.error('❌ Image failed to load:', {
                imageUrl: state.imageUrl,
                sitesprenBase,
                error: e,
                timestamp: new Date().toISOString()
              });
              setState(prev => ({
                ...prev,
                error: 'Failed to load image',
                status: 'error'
              }));
            }}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-xs font-medium bg-black bg-opacity-75 px-2 py-1 rounded">
              Click to refresh
            </div>
          </div>
        </div>
      );
    }

    // Initial state - no screenshot yet
    return (
      <div 
        className="flex items-center justify-center h-full bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors border-2 border-dashed border-gray-300"
        onClick={handleImageClick}
        title="Click to capture first screenshot"
      >
        <div className="text-center p-2">
          <div className="text-2xl mb-2">📸</div>
          <div className="text-xs text-gray-600 font-medium">Click to capture</div>
          <div className="text-xs text-gray-500">website screenshot</div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      {renderContent()}

    </div>
  );
}