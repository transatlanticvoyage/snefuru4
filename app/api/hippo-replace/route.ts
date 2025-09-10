import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  validateImageUrls,
  createElementorBackup,
  restoreFromBackup,
  type ImageUploadResult,
  type ReplacementMap,
  type UpdateResult
} from '../shared/rhino-safety-lib';

interface HippoReplaceRequest {
  gcon_piece_id: string;
  narpi_push_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gcon_piece_id, narpi_push_id }: HippoReplaceRequest = body;

    if (!gcon_piece_id) {
      return NextResponse.json(
        { error: 'Missing required field: gcon_piece_id' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get user data with API key
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData || !userData.ruplin_api_key_1) {
      throw new Error('User not found or API key missing');
    }

    console.log(`🦛 Hippo: Starting Gutenberg image replacement for gcon_piece: ${gcon_piece_id}`);

    const hippoResult = await performHippoReplacement(
      supabase,
      gcon_piece_id,
      userData.ruplin_api_key_1,
      narpi_push_id
    );

    if (!hippoResult.success) {
      return NextResponse.json({
        success: false,
        error: hippoResult.error,
        phase: 'gutenberg_replacement'
      }, { status: 500 });
    }

    console.log(`✅ Hippo Complete: Gutenberg replacement completed`);

    return NextResponse.json({
      success: true,
      message: 'Hippo Gutenberg replacement completed successfully',
      method: 'hippo',
      results: {
        image_replacement: {
          images_replaced: hippoResult.images_replaced,
          page_updated: hippoResult.page_updated,
          cache_cleared: hippoResult.cache_cleared,
          backup_created: hippoResult.backup_id
        }
      }
    });

  } catch (error) {
    console.error('🦛 Hippo CRITICAL ERROR:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Hippo replacement failed'
    }, { status: 500 });
  }
}

/**
 * Hippo: Replace images in Gutenberg post content
 */
async function performHippoReplacement(
  supabase: any,
  gcon_piece_id: string,
  apiKey: string,
  narpi_push_id?: string
): Promise<UpdateResult> {
  let backup_id: string | undefined;

  try {
    console.log(`🦛 HIPPO: Starting Gutenberg replacement for gcon_piece: ${gcon_piece_id}`);

    // Get gcon_pieces data
    const { data: gconPiece, error: gconError } = await supabase
      .from('gcon_pieces')
      .select('*')
      .eq('id', gcon_piece_id)
      .single();

    if (gconError || !gconPiece) {
      throw new Error(`Gcon piece not found: ${gcon_piece_id}`);
    }

    console.log(`🦛 HIPPO: Processing Gutenberg page: ${gconPiece.meta_title} (${gconPiece.asn_sitespren_base})`);
    console.log(`🎯 WordPress Post ID: ${gconPiece.g_post_id}`);

    // Get FRESH post content directly from WordPress
    console.log(`🔄 HIPPO: Fetching fresh Gutenberg content from WordPress`);
    
    const freshPostResponse = await fetch(
      `https://${gconPiece.asn_sitespren_base}/wp-json/wp/v2/posts/${gconPiece.g_post_id}`,
      {
        headers: {
          'User-Agent': 'Hippo-GutenbergReplace/1.0'
        }
      }
    );

    if (!freshPostResponse.ok) {
      throw new Error(`Failed to fetch fresh post data: ${freshPostResponse.status}`);
    }

    const freshPost = await freshPostResponse.json();
    let currentContent = freshPost.content?.rendered || freshPost.content?.raw || '';
    
    if (!currentContent) {
      // Try alternate approach for Gutenberg content
      const postsResponse = await fetch(
        `https://${gconPiece.asn_sitespren_base}/wp-json/snefuru/v1/posts`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'Hippo-GutenbergReplace/1.0'
          }
        }
      );
      
      if (postsResponse.ok) {
        const allPosts = await postsResponse.json();
        const targetPost = allPosts.data?.find((p: any) => p.ID === parseInt(gconPiece.g_post_id));
        currentContent = targetPost?.post_content || '';
      }
    }
    
    if (!currentContent) {
      throw new Error('No Gutenberg content found from WordPress API');
    }

    // Create backup before replacement
    backup_id = await createElementorBackup(
      supabase,
      gcon_piece_id,
      { gutenberg_content: currentContent },
      'hippo_pre_replacement'
    );

    // Get replacement images from narpi_push if provided
    let replacementMap: ReplacementMap = {};
    
    if (narpi_push_id) {
      console.log(`🔍 HIPPO: Getting replacement images from narpi_push: ${narpi_push_id}`);
      
      const { data: narpiUploads, error: narpiError } = await supabase
        .from('narpi_uploads')
        .select('*')
        .eq('narpi_push_id', narpi_push_id)
        .eq('nupload_status1', 'completed');

      if (narpiError || !narpiUploads || narpiUploads.length === 0) {
        throw new Error('No completed narpi uploads found');
      }

      // Create replacement map from narpi uploads
      narpiUploads.forEach((upload: any, index: number) => {
        if (upload.img_url_returned) {
          replacementMap[`image_${index + 1}`] = upload.img_url_returned;
        }
      });

      console.log(`📋 HIPPO: Found ${Object.keys(replacementMap).length} replacement images`);
    }

    // Extract current images from Gutenberg content
    const currentImages = extractImagesFromGutenbergContent(currentContent);
    console.log(`🔍 HIPPO: Found ${currentImages.length} images in Gutenberg content`);

    if (currentImages.length === 0) {
      console.log(`⚠️ HIPPO: No images found - no update needed`);
      return {
        success: true,
        images_replaced: 0,
        backup_id,
        page_updated: false,
        cache_cleared: false
      };
    }

    // Replace images in Gutenberg content
    console.log(`🔄 HIPPO: Starting Gutenberg image replacement...`);
    const { updatedContent, imagesReplaced } = replaceImagesInGutenbergContent(
      currentContent, 
      Object.values(replacementMap)
    );
    
    console.log(`🔄 HIPPO: Replaced ${imagesReplaced} images`);
    
    if (imagesReplaced === 0) {
      console.log(`⚠️ HIPPO: No images were replaced - no WordPress update needed`);
      return {
        success: true,
        images_replaced: 0,
        backup_id,
        page_updated: false,
        cache_cleared: false
      };
    }

    // Update WordPress with new Gutenberg content
    const pageUpdated = await updateWordPressGutenbergContent(
      gconPiece.asn_sitespren_base,
      parseInt(gconPiece.g_post_id),
      updatedContent,
      apiKey
    );

    if (!pageUpdated) {
      console.error(`❌ HIPPO: WordPress update failed - performing rollback`);
      const rollbackSuccess = await restoreFromBackup(supabase, backup_id!, gconPiece.asn_sitespren_base, parseInt(gconPiece.g_post_id), apiKey);
      
      return {
        success: false,
        images_replaced: 0,
        error: 'WordPress update failed',
        backup_id,
        rollback_performed: rollbackSuccess
      };
    }

    console.log(`✅ HIPPO: WordPress update completed successfully`);
    console.log(`🌐 Check page at: https://${gconPiece.asn_sitespren_base}/?p=${gconPiece.g_post_id}`);

    return {
      success: true,
      images_replaced: imagesReplaced,
      backup_id,
      page_updated: true,
      cache_cleared: true,
      update_method: 'hippo_gutenberg_replacement'
    };

  } catch (error) {
    console.error('🦛 HIPPO: Critical error:', error);
    
    // Attempt rollback if we have a backup
    if (backup_id) {
      console.log(`🔄 Attempting emergency rollback...`);
      await restoreFromBackup(supabase, backup_id, '', 0, '');
    }
    
    return {
      success: false,
      images_replaced: 0,
      error: error instanceof Error ? error.message : 'Hippo replacement failed'
    };
  }
}

/**
 * Extract all images from Gutenberg content (HTML/blocks)
 */
function extractImagesFromGutenbergContent(content: string): Array<{url: string, context: string}> {
  const images: Array<{url: string, context: string}> = [];
  
  // Match img tags in HTML
  const imgTagRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  let match;
  
  while ((match = imgTagRegex.exec(content)) !== null) {
    const url = match[1];
    if (url && (url.includes('/wp-content/uploads/') || url.includes('/uploads/'))) {
      images.push({ url, context: 'img_tag' });
    }
  }
  
  // Match Gutenberg image blocks
  const blockImageRegex = /"url":"([^"]+)"/g;
  while ((match = blockImageRegex.exec(content)) !== null) {
    const url = match[1].replace(/\\\//g, '/'); // Unescape forward slashes
    if (url && (url.includes('/wp-content/uploads/') || url.includes('/uploads/'))) {
      images.push({ url, context: 'gutenberg_block' });
    }
  }
  
  // Remove duplicates
  const uniqueImages = images.filter((img, index, self) => 
    index === self.findIndex(i => i.url === img.url)
  );

  return uniqueImages;
}

/**
 * Replace images in Gutenberg content
 */
function replaceImagesInGutenbergContent(
  content: string, 
  newImageUrls: string[]
): { updatedContent: string, imagesReplaced: number } {
  let updatedContent = content;
  let imagesReplaced = 0;
  let newImageIndex = 0;

  // Replace img tag sources
  updatedContent = updatedContent.replace(/<img([^>]+)src="([^"]+)"([^>]*>)/g, (match, before, oldUrl, after) => {
    if ((oldUrl.includes('/wp-content/uploads/') || oldUrl.includes('/uploads/')) && newImageIndex < newImageUrls.length) {
      const newUrl = newImageUrls[newImageIndex++];
      console.log(`🔄 HIPPO: Replacing image: ${oldUrl} → ${newUrl}`);
      imagesReplaced++;
      return `<img${before}src="${newUrl}"${after}`;
    }
    return match;
  });

  // Reset index for Gutenberg blocks
  newImageIndex = 0;

  // Replace Gutenberg block image URLs
  updatedContent = updatedContent.replace(/"url":"([^"]+)"/g, (match, oldUrl) => {
    const unescapedUrl = oldUrl.replace(/\\\//g, '/');
    if ((unescapedUrl.includes('/wp-content/uploads/') || unescapedUrl.includes('/uploads/')) && newImageIndex < newImageUrls.length) {
      const newUrl = newImageUrls[newImageIndex++].replace(/\//g, '\\/'); // Re-escape for JSON
      console.log(`🔄 HIPPO: Replacing block image: ${unescapedUrl} → ${newUrl.replace(/\\\//g, '/')}`);
      return `"url":"${newUrl}"`;
    }
    return match;
  });

  return { updatedContent, imagesReplaced };
}

/**
 * Update WordPress post content (Gutenberg)
 */
async function updateWordPressGutenbergContent(
  siteBase: string,
  postId: number,
  newContent: string,
  apiKey: string
): Promise<boolean> {
  try {
    console.log(`🔄 HIPPO: Updating WordPress post ${postId} with new Gutenberg content`);

    const response = await fetch(
      `https://${siteBase}/wp-json/wp/v2/posts/${postId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Hippo-GutenbergUpdate/1.0'
        },
        body: JSON.stringify({
          content: newContent,
          status: 'publish'
        })
      }
    );

    if (response.ok) {
      console.log(`✅ HIPPO: WordPress post ${postId} updated successfully`);
      return true;
    } else {
      console.error(`❌ HIPPO: WordPress update failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('🦛 HIPPO: Error updating WordPress:', error);
    return false;
  }
}