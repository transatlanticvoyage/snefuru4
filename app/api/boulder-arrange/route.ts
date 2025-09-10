import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  validateImageUrls,
  createElementorBackup,
  validateElementorDataStructure,
  replaceImagesInElementsFixed,
  restoreFromBackup,
  updateWordPressSafe,
  type ImageUploadResult,
  type ReplacementMap,
  type ValidationResult,
  type UpdateResult
} from '../shared/rhino-safety-lib';

interface BoulderArrangeRequest {
  gcon_piece_id: string;
  narpi_push_id: string;
}

interface ImageUploadResult {
  nupload_id: number;
  nupload_status1: string;
  img_url_returned: string;
  wp_img_id_returned: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gcon_piece_id, narpi_push_id }: BoulderArrangeRequest = body;

    if (!gcon_piece_id || !narpi_push_id) {
      return NextResponse.json(
        { error: 'Missing required fields: gcon_piece_id, narpi_push_id' },
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

    console.log(`🪨 Boulder Arrange: Starting regolith-free arrangement for gcon_piece: ${gcon_piece_id}, narpi_push: ${narpi_push_id}`);

    // NO REGOLITH REFRESH - Skip to enhanced arrangement

    // PHASE 1: Enhanced Boulder Arrangement using native WordPress methods
    console.log(`🪨 Boulder Phase 1: Starting regolith-free arrangement...`);
    
    const boulderResult = await performBoulderArrangement(
      supabase,
      gcon_piece_id,
      narpi_push_id,
      userData.ruplin_api_key_1
    );

    if (!boulderResult.success) {
      return NextResponse.json({
        success: false,
        error: boulderResult.error,
        phase: 'boulder_arrangement'
      }, { status: 500 });
    }

    console.log(`✅ Boulder Phase 1 Complete: Enhanced arrangement completed`);

    return NextResponse.json({
      success: true,
      message: 'Boulder Arrange completed successfully',
      method: 'boulder',
      results: {
        boulder_arrangement: {
          images_replaced: boulderResult.replacements_made,
          page_updated: boulderResult.page_updated,
          cache_cleared: boulderResult.cache_cleared,
          method_used: boulderResult.update_method
        }
      }
    });

  } catch (error) {
    console.error('🪨 Boulder Arrange CRITICAL ERROR:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Boulder arrangement failed'
    }, { status: 500 });
  }
}

/**
 * Boulder Arrangement: Regolith-free image replacement
 * Extracts images directly from current Elementor data and replaces ALL found images
 */
async function performBoulderArrangement(
  supabase: any,
  gcon_piece_id: string,
  narpi_push_id: string,
  apiKey: string
): Promise<UpdateResult> {
  let backup_id: string | undefined;

  try {
    console.log(`🪨 BOULDER ENHANCED: Starting regolith-free arrangement for gcon_piece: ${gcon_piece_id}`);

    // Get gcon_pieces data
    const { data: gconPiece, error: gconError } = await supabase
      .from('gcon_pieces')
      .select('*')
      .eq('id', gcon_piece_id)
      .single();

    if (gconError || !gconPiece) {
      throw new Error(`Gcon piece not found: ${gcon_piece_id}`);
    }

    // Get narpi push data
    const { data: narpiPushData, error: narpiError } = await supabase
      .from('narpi_pushes')
      .select('id, kareench1, fk_batch_id')
      .eq('id', narpi_push_id)
      .single();

    if (narpiError || !narpiPushData) {
      throw new Error(`Narpi push not found: ${narpi_push_id}`);
    }

    if (!narpiPushData.kareench1 || !Array.isArray(narpiPushData.kareench1)) {
      throw new Error(`Narpi push has no upload data: ${narpi_push_id}`);
    }

    // Filter successful uploads only
    const uploaded_images = narpiPushData.kareench1.filter((upload: any) => 
      upload.nupload_status1 === 'success' && upload.wp_img_id_returned
    );

    if (uploaded_images.length === 0) {
      throw new Error(`No successful uploads found in narpi push: ${narpi_push_id}`);
    }
    console.log(`🪨 BOULDER ENHANCED: Found ${uploaded_images.length} uploaded images`);

    // PHASE 1: PRE-UPDATE VALIDATION
    const validationResult = await validateImageUrls(uploaded_images);
    if (!validationResult) {
      throw new Error('Image URL validation failed');
    }

    console.log(`🪨 BOULDER ENHANCED: Processing page: ${gconPiece.meta_title} (${gconPiece.asn_sitespren_base})`);
    console.log(`🎯 WordPress Post ID: ${gconPiece.g_post_id}`);

    // BOULDER IS REGOLITH-FREE: Fetch FRESH post data directly from WordPress
    console.log(`🔄 BOULDER: Fetching fresh post data from WordPress (NOT using cached data)`);
    
    const freshPostResponse = await fetch(
      `https://${gconPiece.asn_sitespren_base}/wp-json/wp/v2/pages/${gconPiece.g_post_id}`,
      {
        headers: {
          'User-Agent': 'Boulder-RegolithFree/1.0'
        }
      }
    );

    if (!freshPostResponse.ok) {
      throw new Error(`Failed to fetch fresh post data: ${freshPostResponse.status}`);
    }

    const freshPost = await freshPostResponse.json();
    
    // Get Elementor data from post meta
    let currentElementorData = freshPost.meta?._elementor_data;
    
    if (!currentElementorData) {
      // Try alternate approach - use the posts endpoint with auth
      console.log(`🔄 BOULDER: Trying authenticated posts endpoint for Elementor data`);
      const postsResponse = await fetch(
        `https://${gconPiece.asn_sitespren_base}/wp-json/snefuru/v1/posts`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'Boulder-RegolithFree/1.0'
          }
        }
      );
      
      if (postsResponse.ok) {
        const allPosts = await postsResponse.json();
        const targetPost = allPosts.data?.find((p: any) => p.ID === parseInt(gconPiece.g_post_id));
        currentElementorData = targetPost?.elementor_data;
      }
    }
    
    if (!currentElementorData) {
      throw new Error('No Elementor data found from WordPress API');
    }

    // Parse if string
    if (typeof currentElementorData === 'string') {
      try {
        currentElementorData = JSON.parse(currentElementorData);
        console.log(`📄 BOULDER: Parsed fresh Elementor data from WordPress`);
      } catch (e) {
        throw new Error('Failed to parse fresh Elementor data from WordPress');
      }
    }

    // Create backup of the FRESH data before modification
    backup_id = await createElementorBackup(
      supabase,
      gcon_piece_id,
      currentElementorData,
      'boulder_pre_update'
    );

    // Extract ALL images from current Elementor data
    const currentImages = extractAllImagesFromElementorData(currentElementorData);
    console.log(`🔍 BOULDER ENHANCED: Found ${currentImages.length} images in current page`);

    // Log the images we found
    currentImages.forEach((img, index) => {
      console.log(`🖼️ Image ${index + 1}: ${img.url}`);
    });

    // Create 1:1 replacement map (oldest to newest uploaded images)
    const replacementMap: ReplacementMap = {};
    currentImages.forEach((currentImg, index) => {
      if (index < uploaded_images.length && uploaded_images[index].wp_img_id_returned) {
        replacementMap[currentImg.url] = uploaded_images[index];
        console.log(`🔗 Boulder: Mapped ${currentImg.url} -> ${uploaded_images[index].img_url_returned}`);
      }
    });

    console.log(`🗺️ BOULDER ENHANCED: Created replacement map for ${Object.keys(replacementMap).length} images`);

    // Validate Elementor data structure
    if (!validateElementorDataStructure(currentElementorData)) {
      throw new Error('Invalid Elementor data structure');
    }

    // CRITICAL: Create a deep copy to avoid reference issues
    const elementorDataCopy = JSON.parse(JSON.stringify(currentElementorData));
    
    // Enhanced image replacement with fixed widget detection
    console.log(`🔧 BOULDER ENHANCED: Starting regolith-free image replacement with fixed widget detection...`);
    const replacementsMade = replaceImagesInElementsFixed(elementorDataCopy, replacementMap);
    console.log(`🔧 BOULDER ENHANCED: Made ${replacementsMade} image replacements with property preservation`);
    
    // Use the modified copy for the update
    currentElementorData = elementorDataCopy;

    if (replacementsMade === 0) {
      console.log(`⚠️ BOULDER ENHANCED: No image replacements made - no WordPress update needed`);
      return {
        success: true,
        replacements_made: 0,
        backup_id,
        page_updated: false,
        cache_cleared: false,
        update_method: 'none'
      };
    }

    // Update WordPress with modified Elementor data
    const pageUpdated = await updateWordPressSafe(
      gconPiece.asn_sitespren_base,
      parseInt(gconPiece.g_post_id),
      currentElementorData,
      apiKey
    );

    if (!pageUpdated) {
      console.error(`❌ BOULDER ENHANCED: WordPress update failed - performing rollback`);
      const rollbackSuccess = await restoreFromBackup(supabase, backup_id!, gconPiece.asn_sitespren_base, parseInt(gconPiece.g_post_id), apiKey);
      
      return {
        success: false,
        replacements_made: 0,
        error: 'WordPress update failed',
        backup_id,
        rollback_performed: rollbackSuccess
      };
    }

    console.log(`✅ BOULDER ENHANCED: WordPress update completed successfully`);
    console.log(`🌐 Check page at: https://${gconPiece.asn_sitespren_base}/?p=${gconPiece.g_post_id}`);

    // BOULDER DOES NOT UPDATE pelementor_cached - it's regolith-free!
    // Only cliff/mason should update cached data

    return {
      success: true,
      replacements_made: replacementsMade,
      backup_id,
      page_updated: true,
      cache_cleared: true, // Boulder always tries cache clearing
      update_method: 'boulder_regolith_free'
    };

  } catch (error) {
    console.error('🪨 BOULDER ENHANCED: Critical error:', error);
    
    // Attempt rollback if we have a backup
    if (backup_id) {
      console.log(`🔄 Attempting emergency rollback...`);
      await restoreFromBackup(supabase, backup_id, '', 0, '');
    }
    
    return {
      success: false,
      replacements_made: 0,
      error: error instanceof Error ? error.message : 'Boulder arrangement failed'
    };
  }
}

/**
 * Extract ALL images from Elementor data (regolith-free approach)
 */
function extractAllImagesFromElementorData(elementorData: any): Array<{url: string, context: string}> {
  const images: Array<{url: string, context: string}> = [];

  function traverse(obj: any, context: string = 'unknown'): void {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => traverse(item, `${context}[${index}]`));
    } else if (typeof obj === 'object' && obj !== null) {
      // Check for image objects with URL
      if (obj.url && typeof obj.url === 'string' && obj.url.includes('/wp-content/uploads/')) {
        images.push({ url: obj.url, context });
      }

      // Check for carousel arrays
      if (obj.carousel && Array.isArray(obj.carousel)) {
        obj.carousel.forEach((item: any, index: number) => {
          if (item?.url) {
            images.push({ url: item.url, context: `${context}.carousel[${index}]` });
          }
        });
      }

      // Check for gallery arrays
      if (obj.gallery && Array.isArray(obj.gallery)) {
        obj.gallery.forEach((item: any, index: number) => {
          if (item?.url) {
            images.push({ url: item.url, context: `${context}.gallery[${index}]` });
          }
        });
      }

      // Recursively check all other properties
      Object.keys(obj).forEach(key => {
        if (key !== 'carousel' && key !== 'gallery') {
          traverse(obj[key], `${context}.${key}`);
        }
      });
    }
  }

  // Parse if string
  let parsedData = elementorData;
  if (typeof elementorData === 'string') {
    try {
      parsedData = JSON.parse(elementorData);
    } catch (e) {
      console.error('Failed to parse Elementor data:', e);
      return images;
    }
  }

  traverse(parsedData, 'root');
  
  // Remove duplicates
  const uniqueImages = images.filter((img, index, self) => 
    index === self.findIndex(i => i.url === img.url)
  );

  console.log(`🔍 Boulder: Extracted ${uniqueImages.length} unique images from Elementor data`);
  return uniqueImages;
}