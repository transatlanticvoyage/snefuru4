/**
 * Client-side XPage Metadata Sync System
 * 
 * Client utilities for syncing metadata via API
 */

export interface XPageCacheEntry {
  title: string;
  description?: string;
  url: string;
  lastSync: string;
}

export interface XPageCache {
  [xpageId: string]: XPageCacheEntry;
}

/**
 * Client-side version for API routes
 */
export async function syncXPageMetadataAPI(): Promise<{ success: boolean; message: string; updatedPages: number }> {
  try {
    const response = await fetch('/api/sync-xpage-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[Sync API] Error:', error);
    return {
      success: false,
      message: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      updatedPages: 0
    };
  }
}

/**
 * Get metadata from static cache (for use in components)
 */
export function getStaticXPageMetadata(xpageId: number): XPageCacheEntry | null {
  try {
    // This would be replaced with a static import in the actual page
    const cache = require('@/app/metadata/xpage-cache.json') as XPageCache;
    return cache[xpageId.toString()] || null;
  } catch (error) {
    console.warn(`Failed to load static metadata for xpage ${xpageId}:`, error);
    return null;
  }
}