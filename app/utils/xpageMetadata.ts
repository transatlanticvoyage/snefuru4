/**
 * XPage Metadata Utilities
 * 
 * Functions to sync page metadata between database and static files
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface XPageMetadata {
  xpage_id: number;
  title1?: string;
  meta_title?: string;
  main_url?: string;
  pagepath_url?: string;
  updated_at?: string;
}

/**
 * Fetch metadata for a specific page from the database
 */
export async function getXPageMetadata(xpageId: number): Promise<XPageMetadata | null> {
  try {
    console.log(`[XPage Metadata] Creating Supabase client for ID ${xpageId}`);
    const supabase = createClientComponentClient();
    
    console.log(`[XPage Metadata] Querying xpages table for ID ${xpageId}`);
    const { data, error } = await supabase
      .from('xpages')
      .select('xpage_id, title1, meta_title, main_url, pagepath_url, updated_at')
      .eq('xpage_id', xpageId)
      .single();

    if (error) {
      console.warn(`[XPage Metadata] No xpage found for ID ${xpageId}:`, error.message);
      return null;
    }

    console.log(`[XPage Metadata] Successfully fetched data for ID ${xpageId}:`, data);
    return data;
  } catch (error) {
    console.error('Error fetching xpage metadata:', error);
    return null;
  }
}

/**
 * Fetch metadata for multiple pages
 */
export async function getMultipleXPageMetadata(xpageIds: number[]): Promise<XPageMetadata[]> {
  try {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('xpages')
      .select('xpage_id, title1, meta_title, main_url, pagepath_url, updated_at')
      .in('xpage_id', xpageIds);

    if (error) {
      console.error('Error fetching multiple xpage metadata:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching multiple xpage metadata:', error);
    return [];
  }
}

/**
 * Generate Next.js metadata object from xpage data
 */
export function generateNextMetadata(xpageData: XPageMetadata | null, fallbackTitle?: string) {
  const title = xpageData?.meta_title || xpageData?.title1 || fallbackTitle || 'Snefuru';
  
  return {
    title,
    description: `${xpageData?.title1 || 'Page'} - Snefuru Application`,
    openGraph: {
      title,
      type: 'website',
    },
  };
}

import { useState, useEffect } from 'react';

/**
 * Hook to use xpage metadata in a component (for testing)
 */
export function useXPageMetadata(xpageId: number) {
  const [metadata, setMetadata] = useState<XPageMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetadata() {
      console.log(`[XPage Metadata] Fetching metadata for xpageId: ${xpageId}`);
      const data = await getXPageMetadata(xpageId);
      console.log(`[XPage Metadata] Result for ${xpageId}:`, data);
      setMetadata(data);
      setLoading(false);
    }

    fetchMetadata();
  }, [xpageId]);

  return { metadata, loading };
}

// For server-side usage (build time)
export async function getXPageMetadataSSR(xpageId: number): Promise<XPageMetadata | null> {
  // This would use a server-side Supabase client in a real implementation
  // For now, return null to avoid client-side calls during build
  console.log(`Build time: Would fetch metadata for xpage_id ${xpageId}`);
  return null;
}