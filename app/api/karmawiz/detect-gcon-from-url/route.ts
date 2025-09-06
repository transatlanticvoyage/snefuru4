import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface DetectionResult {
  g_post_id: string;
  pageslug: string;
  pageurl: string;
  meta_title: string;
  matchType: 'post_id' | 'pageslug';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's internal ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { rawUrl } = await request.json();

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Parse the URL to extract potential post ID and slug
    const extractedData = extractPostDataFromUrl(rawUrl);
    
    const results: DetectionResult[] = [];

    // Search by post ID if found
    if (extractedData.postId) {
      const { data: postIdMatches, error: postIdError } = await supabase
        .from('gcon_pieces')
        .select('g_post_id, pageslug, pageurl, meta_title, h1title')
        .eq('fk_users_id', userData.id)
        .eq('g_post_id', extractedData.postId)
        .not('g_post_id', 'is', null);

      if (!postIdError && postIdMatches) {
        postIdMatches.forEach(match => {
          results.push({
            g_post_id: match.g_post_id || '',
            pageslug: match.pageslug || '',
            pageurl: match.pageurl || '',
            meta_title: match.meta_title || match.h1title || '',
            matchType: 'post_id'
          });
        });
      }
    }

    // Search by page slug if found
    if (extractedData.slug) {
      const { data: slugMatches, error: slugError } = await supabase
        .from('gcon_pieces')
        .select('g_post_id, pageslug, pageurl, meta_title, h1title')
        .eq('fk_users_id', userData.id)
        .eq('pageslug', extractedData.slug)
        .not('pageslug', 'is', null);

      if (!slugError && slugMatches) {
        slugMatches.forEach(match => {
          // Avoid duplicates if we already found this by post_id
          const alreadyExists = results.some(r => 
            r.g_post_id === match.g_post_id && r.pageslug === match.pageslug
          );
          
          if (!alreadyExists) {
            results.push({
              g_post_id: match.g_post_id || '',
              pageslug: match.pageslug || '',
              pageurl: match.pageurl || '',
              meta_title: match.meta_title || match.h1title || '',
              matchType: 'pageslug'
            });
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      extractedData,
      results,
      totalMatches: results.length
    });

  } catch (error) {
    console.error('Error in SilverFunctionDetectGconRowFromRawURLs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function extractPostDataFromUrl(rawUrl: string): { postId: string | null, slug: string | null } {
  const result = { postId: null as string | null, slug: null as string | null };
  
  try {
    // Clean the URL
    const cleanUrl = rawUrl.trim();
    
    // Extract post ID from WordPress admin URLs
    // Pattern: wp-admin/post.php?post=826&action=edit
    // Pattern: wp-admin/post.php?post=826&action=elementor
    const postIdMatch = cleanUrl.match(/[?&]post=(\d+)/);
    if (postIdMatch) {
      result.postId = postIdMatch[1];
    }
    
    // Extract slug from pretty permalinks
    // Pattern: https://example.com/some-page-slug/
    // Pattern: https://example.com/category/some-page-slug/
    try {
      const url = new URL(cleanUrl);
      const pathname = url.pathname;
      
      // Remove leading and trailing slashes
      const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
      
      if (cleanPath) {
        // Split by slashes and take the last segment as the potential slug
        const segments = cleanPath.split('/');
        const lastSegment = segments[segments.length - 1];
        
        // Only consider it a slug if it doesn't look like an admin path
        if (lastSegment && !lastSegment.includes('wp-admin') && !lastSegment.includes('.php')) {
          result.slug = lastSegment;
        }
      }
    } catch (urlError) {
      // If URL parsing fails, try to extract slug manually
      const parts = cleanUrl.split('/');
      const nonEmptyParts = parts.filter(part => part.trim() !== '');
      
      if (nonEmptyParts.length > 0) {
        const lastPart = nonEmptyParts[nonEmptyParts.length - 1];
        
        // Only consider it a slug if it doesn't look like an admin path or file
        if (lastPart && 
            !lastPart.includes('wp-admin') && 
            !lastPart.includes('.php') && 
            !lastPart.includes('?') &&
            !lastPart.includes('=')) {
          result.slug = lastPart;
        }
      }
    }
    
  } catch (error) {
    console.error('Error parsing URL:', error);
  }
  
  return result;
}