/**
 * API Route: Sync XPage Metadata
 * 
 * POST /api/sync-xpage-metadata
 * Fetches metadata from database and updates static cache file
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting XPage metadata sync...');
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch all xpages with metadata
    const { data: xpages, error } = await supabase
      .from('xpages')
      .select('xpage_id, title1, meta_title, main_url, pagepath_url, updated_at')
      .not('xpage_id', 'is', null)
      .order('xpage_id');

    if (error) {
      console.error('[API] Database error:', error);
      return NextResponse.json(
        { success: false, message: `Database error: ${error.message}`, updatedPages: 0 },
        { status: 500 }
      );
    }

    if (!xpages || xpages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No xpages found in database', updatedPages: 0 },
        { status: 404 }
      );
    }

    // Build cache object
    const cache: { [key: string]: any } = {};
    const currentTime = new Date().toISOString();

    for (const xpage of xpages) {
      const title = xpage.meta_title || xpage.title1 || `Page ${xpage.xpage_id}`;
      const description = `${xpage.title1 || 'Page'} - Snefuru Application`;
      const url = xpage.main_url || xpage.pagepath_url || `/page/${xpage.xpage_id}`;

      cache[xpage.xpage_id.toString()] = {
        title,
        description,
        url,
        lastSync: currentTime
      };
    }

    // Write cache to file
    const cacheFilePath = path.join(process.cwd(), 'app/metadata/xpage-cache.json');
    const cacheDir = path.dirname(cacheFilePath);
    
    // Ensure directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2));

    console.log(`[API] Successfully synced ${xpages.length} pages to cache`);
    console.log('[API] Cache file written to:', cacheFilePath);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synced ${xpages.length} pages`, 
      updatedPages: xpages.length 
    });

  } catch (error) {
    console.error('[API] Sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        updatedPages: 0 
      },
      { status: 500 }
    );
  }
}