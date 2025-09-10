import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  createElementorBackup,
  validateElementorDataStructure,
  updateWordPressSafe,
  restoreFromBackup,
  type UpdateResult
} from '../shared/rhino-safety-lib';

interface AranyaRequest {
  gcon_piece_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gcon_piece_id }: AranyaRequest = body;

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

    console.log(`🗑️ Aranya: Starting image removal for gcon_piece: ${gcon_piece_id}`);

    const aranyaResult = await performAranyaRemoval(
      supabase,
      gcon_piece_id,
      userData.ruplin_api_key_1
    );

    if (!aranyaResult.success) {
      return NextResponse.json({
        success: false,
        error: aranyaResult.error,
        phase: 'image_removal'
      }, { status: 500 });
    }

    console.log(`✅ Aranya Complete: Image removal completed`);

    return NextResponse.json({
      success: true,
      message: 'Aranya image removal completed successfully',
      method: 'aranya',
      results: {
        image_removal: {
          images_removed: aranyaResult.images_removed,
          page_updated: aranyaResult.page_updated,
          cache_cleared: aranyaResult.cache_cleared,
          backup_created: aranyaResult.backup_id
        }
      }
    });

  } catch (error) {
    console.error('🗑️ Aranya CRITICAL ERROR:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Aranya removal failed'
    }, { status: 500 });
  }
}

/**
 * Aranya: Remove all images from Elementor page
 */
async function performAranyaRemoval(
  supabase: any,
  gcon_piece_id: string,
  apiKey: string
): Promise<UpdateResult> {
  let backup_id: string | undefined;

  try {
    console.log(`🗑️ ARANYA: Starting image removal for gcon_piece: ${gcon_piece_id}`);

    // Get gcon_pieces data
    const { data: gconPiece, error: gconError } = await supabase
      .from('gcon_pieces')
      .select('*')
      .eq('id', gcon_piece_id)
      .single();

    if (gconError || !gconPiece) {
      throw new Error(`Gcon piece not found: ${gcon_piece_id}`);
    }

    console.log(`🗑️ ARANYA: Processing page: ${gconPiece.meta_title} (${gconPiece.asn_sitespren_base})`);
    console.log(`🎯 WordPress Post ID: ${gconPiece.g_post_id}`);

    // Get FRESH Elementor data directly from WordPress
    console.log(`🔄 ARANYA: Fetching fresh Elementor data from WordPress`);
    
    const freshPostResponse = await fetch(
      `https://${gconPiece.asn_sitespren_base}/wp-json/wp/v2/pages/${gconPiece.g_post_id}`,
      {
        headers: {
          'User-Agent': 'Aranya-ImageRemoval/1.0'
        }
      }
    );

    if (!freshPostResponse.ok) {
      throw new Error(`Failed to fetch fresh post data: ${freshPostResponse.status}`);
    }

    const freshPost = await freshPostResponse.json();
    let currentElementorData = freshPost.meta?._elementor_data;
    
    if (!currentElementorData) {
      // Try alternate approach
      const postsResponse = await fetch(
        `https://${gconPiece.asn_sitespren_base}/wp-json/snefuru/v1/posts`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'Aranya-ImageRemoval/1.0'
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
        console.log(`📄 ARANYA: Parsed fresh Elementor data from WordPress`);
      } catch (e) {
        throw new Error('Failed to parse fresh Elementor data from WordPress');
      }
    }

    // Create backup before removal
    backup_id = await createElementorBackup(
      supabase,
      gcon_piece_id,
      currentElementorData,
      'aranya_pre_removal'
    );

    // Extract ALL images from current Elementor data
    const currentImages = extractAllImagesFromElementorData(currentElementorData);
    console.log(`🔍 ARANYA: Found ${currentImages.length} images to remove`);

    // Log the images we found
    currentImages.forEach((img, index) => {
      console.log(`🖼️ Image ${index + 1}: ${img.url}`);
    });

    if (currentImages.length === 0) {
      console.log(`⚠️ ARANYA: No images found - no update needed`);
      return {
        success: true,
        images_removed: 0,
        backup_id,
        page_updated: false,
        cache_cleared: false
      };
    }

    // Validate Elementor data structure before modification
    if (!validateElementorDataStructure(currentElementorData)) {
      throw new Error('Invalid Elementor data structure');
    }

    // Create deep copy for modification
    const elementorDataCopy = JSON.parse(JSON.stringify(currentElementorData));
    
    // Remove ALL images from Elementor data
    console.log(`🗑️ ARANYA: Starting image removal process...`);
    const imagesRemoved = removeAllImagesFromElements(elementorDataCopy);
    console.log(`🗑️ ARANYA: Removed ${imagesRemoved} images`);
    
    if (imagesRemoved === 0) {
      console.log(`⚠️ ARANYA: No images were removed - no WordPress update needed`);
      return {
        success: true,
        images_removed: 0,
        backup_id,
        page_updated: false,
        cache_cleared: false
      };
    }

    // Update WordPress with image-free Elementor data
    const pageUpdated = await updateWordPressSafe(
      gconPiece.asn_sitespren_base,
      parseInt(gconPiece.g_post_id),
      elementorDataCopy,
      apiKey
    );

    if (!pageUpdated) {
      console.error(`❌ ARANYA: WordPress update failed - performing rollback`);
      const rollbackSuccess = await restoreFromBackup(supabase, backup_id!, gconPiece.asn_sitespren_base, parseInt(gconPiece.g_post_id), apiKey);
      
      return {
        success: false,
        images_removed: 0,
        error: 'WordPress update failed',
        backup_id,
        rollback_performed: rollbackSuccess
      };
    }

    console.log(`✅ ARANYA: WordPress update completed successfully`);
    console.log(`🌐 Check page at: https://${gconPiece.asn_sitespren_base}/?p=${gconPiece.g_post_id}`);

    return {
      success: true,
      images_removed: imagesRemoved,
      backup_id,
      page_updated: true,
      cache_cleared: true,
      update_method: 'aranya_image_removal'
    };

  } catch (error) {
    console.error('🗑️ ARANYA: Critical error:', error);
    
    // Attempt rollback if we have a backup
    if (backup_id) {
      console.log(`🔄 Attempting emergency rollback...`);
      await restoreFromBackup(supabase, backup_id, '', 0, '');
    }
    
    return {
      success: false,
      images_removed: 0,
      error: error instanceof Error ? error.message : 'Aranya removal failed'
    };
  }
}

/**
 * Extract all images from Elementor data
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

  traverse(elementorData, 'root');
  
  // Remove duplicates
  const uniqueImages = images.filter((img, index, self) => 
    index === self.findIndex(i => i.url === img.url)
  );

  return uniqueImages;
}

/**
 * Remove ALL images from Elementor elements
 */
function removeAllImagesFromElements(elements: any): number {
  let removedCount = 0;

  function traverseAndRemove(obj: any, context: string = 'unknown'): void {
    if (Array.isArray(obj)) {
      obj.forEach(item => traverseAndRemove(item, context));
    } else if (typeof obj === 'object' && obj !== null) {
      
      // Remove image objects with URLs
      if (obj.url && typeof obj.url === 'string' && obj.url.includes('/wp-content/uploads/')) {
        console.log(`🗑️ ARANYA: Removing image: ${obj.url}`);
        delete obj.url;
        delete obj.id;
        if ('alt' in obj) delete obj.alt;
        if ('size' in obj) delete obj.size;
        if ('source' in obj) delete obj.source;
        if ('sizes' in obj) delete obj.sizes;
        removedCount++;
      }

      // Remove carousel images
      if (obj.carousel && Array.isArray(obj.carousel)) {
        obj.carousel = obj.carousel.map((item: any) => {
          if (item?.url && item.url.includes('/wp-content/uploads/')) {
            console.log(`🗑️ ARANYA: Removing carousel image: ${item.url}`);
            removedCount++;
            return {}; // Replace with empty object
          }
          return item;
        });
      }

      // Remove gallery images
      if (obj.gallery && Array.isArray(obj.gallery)) {
        obj.gallery = obj.gallery.map((item: any) => {
          if (item?.url && item.url.includes('/wp-content/uploads/')) {
            console.log(`🗑️ ARANYA: Removing gallery image: ${item.url}`);
            removedCount++;
            return {}; // Replace with empty object
          }
          return item;
        });
      }

      // Recursively process all other properties
      Object.keys(obj).forEach(key => {
        if (key !== 'carousel' && key !== 'gallery') {
          traverseAndRemove(obj[key], `${context}.${key}`);
        }
      });
    }
  }

  traverseAndRemove(elements, 'root');
  return removedCount;
}