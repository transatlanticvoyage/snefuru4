import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface MasonArrangeRequest {
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
    const { gcon_piece_id, narpi_push_id }: MasonArrangeRequest = body;

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

    console.log(`🏗️ Mason Arrange: Starting enhanced image arrangement for gcon_piece: ${gcon_piece_id}, narpi_push: ${narpi_push_id}`);

    // Get user internal ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, ruplin_api_key_1')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData || !userData.ruplin_api_key_1) {
      throw new Error('User not found or API key missing');
    }

    // PHASE 1: Refresh regolith data to ensure we have current page state
    console.log(`🔄 Mason Phase 1: Refreshing regolith data to avoid staleness...`);
    
    const regolithRefreshResult = await refreshRegolithData(
      supabase,
      gcon_piece_id,
      userData.id,
      userData.ruplin_api_key_1
    );

    if (!regolithRefreshResult.success) {
      return NextResponse.json({
        success: false,
        phase: 'regolith_refresh',
        error: regolithRefreshResult.error,
        message: 'Failed to refresh regolith data'
      }, { status: 500 });
    }

    console.log(`✅ Mason Phase 1 Complete: Regolith data refreshed`);

    // PHASE 2: Enhanced Mason Arrangement using native WordPress methods
    console.log(`🏗️ Mason Phase 2: Starting enhanced arrangement...`);
    
    const masonResult = await performMasonArrangement(
      supabase,
      gcon_piece_id,
      narpi_push_id,
      userData.id,
      userData.ruplin_api_key_1
    );

    if (!masonResult.success) {
      return NextResponse.json({
        success: false,
        phase: 'mason_arrangement',
        error: masonResult.error,
        message: 'Mason Arrangement failed'
      }, { status: 500 });
    }

    console.log(`✅ Mason Arrange Complete: Page updated with enhanced method`);

    return NextResponse.json({
      success: true,
      message: 'Mason Arrange completed successfully',
      method: 'mason',
      results: {
        regolith_refresh: {
          images_discovered: regolithRefreshResult.images_count,
          data_refreshed: true
        },
        mason_arrangement: {
          images_replaced: masonResult.replacements_made,
          page_updated: masonResult.page_updated,
          cache_cleared: masonResult.cache_cleared,
          method_used: masonResult.update_method
        }
      }
    });

  } catch (error) {
    console.error('🚨 Mason Arrange CRITICAL ERROR:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        phase: 'system_error',
        method: 'mason'
      },
      { status: 500 }
    );
  }
}

// Phase 1: Refresh regolith data to ensure current page state
async function refreshRegolithData(
  supabase: any,
  gcon_piece_id: string,
  user_internal_id: string,
  ruplin_api_key: string
) {
  try {
    console.log(`🔍 Mason: Refreshing regolith data for current page state`);

    // Call f331 API to refresh regolith data
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
    const response = await fetch(`${baseUrl}/api/f331-discover-elementor-images-regolith`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gconPieceId: gcon_piece_id
      })
    });

    if (!response.ok) {
      throw new Error(`F331 API failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to refresh regolith data');
    }

    console.log(`✅ Mason: Regolith data refreshed - found ${result.images?.length || 0} images`);

    return {
      success: true,
      images_count: result.images?.length || 0,
      regolith_data: result
    };

  } catch (error) {
    console.error('🏗️ Mason regolith refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Regolith refresh failed'
    };
  }
}

// Phase 2: Enhanced Mason Arrangement using native WordPress methods
async function performMasonArrangement(
  supabase: any,
  gcon_piece_id: string,
  narpi_push_id: string,
  user_internal_id: string,
  ruplin_api_key: string
) {
  try {
    // Get gcon piece with fresh regolith data and site info
    const { data: gconPiece, error: gconError } = await supabase
      .from('gcon_pieces')
      .select(`
        id, 
        discovered_images_regolith, 
        pelementor_cached,
        asn_sitespren_base,
        g_post_id,
        meta_title
      `)
      .eq('id', gcon_piece_id)
      .eq('fk_users_id', user_internal_id)
      .single();

    if (gconError || !gconPiece) {
      throw new Error('Gcon piece not found');
    }

    // Get narpi push data
    const { data: narpiPushData, error: narpiError } = await supabase
      .from('narpi_pushes')
      .select('id, kareench1, fk_batch_id')
      .eq('id', narpi_push_id)
      .single();

    if (narpiError || !narpiPushData) {
      throw new Error('Narpi push not found');
    }

    if (!narpiPushData.kareench1 || !Array.isArray(narpiPushData.kareench1)) {
      throw new Error('Narpi push has no upload data');
    }

    // Filter successful uploads only
    const successfulUploads = narpiPushData.kareench1.filter((upload: any) => 
      upload.nupload_status1 === 'success' && upload.wp_img_id_returned
    );

    if (successfulUploads.length === 0) {
      throw new Error('No successful uploads found in narpi push');
    }

    if (!gconPiece.discovered_images_regolith) {
      throw new Error('No regolith data found - refresh was unsuccessful');
    }

    console.log(`🏗️ Mason: Processing page: ${gconPiece.meta_title} (${gconPiece.asn_sitespren_base})`);
    console.log(`🎯 WordPress Post ID: ${gconPiece.g_post_id}`);

    // Parse fresh regolith data
    let regolithData;
    try {
      regolithData = typeof gconPiece.discovered_images_regolith === 'string' 
        ? JSON.parse(gconPiece.discovered_images_regolith)
        : gconPiece.discovered_images_regolith;
    } catch (e) {
      throw new Error('Invalid regolith data format');
    }

    const imagesToReplace = regolithData.discovered_images || [];
    console.log(`🔄 Mason: Found ${imagesToReplace.length} images to replace`);

    if (imagesToReplace.length === 0) {
      return {
        success: true,
        replacements_made: 0,
        page_updated: false,
        cache_cleared: false,
        update_method: 'none',
        message: 'No images found to replace'
      };
    }

    // Create enhanced replacement mapping
    const replacementMap = createEnhancedReplacementMapping(imagesToReplace, successfulUploads);
    console.log(`🗺️ Mason: Created enhanced replacement map for ${Object.keys(replacementMap).length} images`);

    // Update Elementor data with enhanced validation
    let updatedElementorData = gconPiece.pelementor_cached;
    let replacementsMade = 0;

    if (updatedElementorData) {
      const updateResult = performEnhancedImageReplacement(
        updatedElementorData, 
        replacementMap,
        imagesToReplace
      );
      updatedElementorData = updateResult.data;
      replacementsMade = updateResult.replacements_made;

      console.log(`🔧 Mason: Made ${replacementsMade} enhanced image replacements`);
    }

    // Use enhanced WordPress update method - ONLY if actual replacements were made
    let pageUpdated = false;
    let cacheCleared = false;
    let updateMethod = 'none';
    
    if (replacementsMade > 0 && gconPiece.g_post_id) {
      console.log(`🚀 Mason: Sending updated data via enhanced WordPress API (${replacementsMade} replacements made)`);
      
      const updateResult = await updateWordPressPageEnhanced(
        gconPiece.asn_sitespren_base,
        gconPiece.g_post_id,
        updatedElementorData,
        ruplin_api_key
      );
      
      pageUpdated = updateResult.success;
      cacheCleared = updateResult.cache_cleared;
      updateMethod = updateResult.method_used;
      
    } else if (replacementsMade === 0) {
      console.log(`⚠️ Mason: Skipping WordPress update - no image replacements were made`);
    } else {
      console.log(`⚠️ Mason: Skipping WordPress update - missing post ID (${gconPiece.g_post_id})`);
    }

    // Update gcon_pieces with new pelementor_cached data
    if (replacementsMade > 0) {
      await supabase
        .from('gcon_pieces')
        .update({ 
          pelementor_cached: updatedElementorData,
          updated_at: new Date().toISOString()
        })
        .eq('id', gcon_piece_id);
    }

    return {
      success: true,
      replacements_made: replacementsMade,
      page_updated: pageUpdated,
      cache_cleared: cacheCleared,
      update_method: updateMethod,
      replacement_details: Object.keys(replacementMap).map(oldUrl => ({
        old_url: oldUrl,
        new_wp_id: replacementMap[oldUrl].wp_img_id_returned,
        new_url: replacementMap[oldUrl].img_url_returned
      }))
    };

  } catch (error) {
    console.error('🏗️ Mason Arrangement error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Mason arrangement failed'
    };
  }
}

// Enhanced replacement mapping with smarter matching
function createEnhancedReplacementMapping(
  imagesToReplace: any[], 
  uploadedImages: ImageUploadResult[]
): Record<string, ImageUploadResult> {
  const map: Record<string, ImageUploadResult> = {};
  
  console.log(`🧠 Mason: Using enhanced mapping algorithm`);
  
  // Enhanced 1:1 mapping with potential for future smart matching
  // TODO: Could be enhanced with filename similarity, dimensions, etc.
  imagesToReplace.forEach((regolithImage, index) => {
    if (index < uploadedImages.length && uploadedImages[index].wp_img_id_returned) {
      map[regolithImage.url] = uploadedImages[index];
      console.log(`🔗 Mason: Mapped ${regolithImage.url} -> ${uploadedImages[index].img_url_returned}`);
    }
  });

  return map;
}

// Enhanced image replacement with better validation
function performEnhancedImageReplacement(
  elementorData: any,
  replacementMap: Record<string, ImageUploadResult>,
  regolithImages: any[] = []
): { data: any, replacements_made: number } {
  let replacementsMade = 0;
  const wasString = typeof elementorData === 'string';
  
  // Parse data with enhanced validation
  let parsedData: any;
  try {
    if (wasString) {
      parsedData = JSON.parse(elementorData);
    } else {
      parsedData = JSON.parse(JSON.stringify(elementorData)); // Deep clone
    }
  } catch (e) {
    console.error('🚨 Mason: Failed to parse elementor data:', e);
    return { data: elementorData, replacements_made: 0 };
  }

  console.log(`🔍 Mason: Enhanced processing ${wasString ? 'string' : 'object'} elementor data with ${Object.keys(replacementMap).length} replacements`);
  
  // Enhanced validation
  if (!Array.isArray(parsedData)) {
    console.error('🚨 Mason: Invalid Elementor data structure: expected array');
    return { data: elementorData, replacements_made: 0 };
  }

  // Process each replacement with enhanced logic
  Object.keys(replacementMap).forEach(oldUrl => {
    const newImage = replacementMap[oldUrl];
    if (!newImage.img_url_returned || !newImage.wp_img_id_returned) {
      console.log(`⚠️ Mason: Skipping incomplete replacement for ${oldUrl}`);
      return;
    }

    console.log(`🔄 Mason: Enhanced processing replacement: ${oldUrl} -> ${newImage.img_url_returned}`);
    
    // Find and update with enhanced attachment handling
    const matchingImage = regolithImages.find((img: any) => img.url === oldUrl);
    const oldAttachmentId = matchingImage?.image_metadata?.attachment_id;
    
    const count = replaceImagesInElementsEnhanced(parsedData, oldUrl, newImage, oldAttachmentId);
    replacementsMade += count;
    
    console.log(`✅ Mason: Made ${count} enhanced replacements for ${oldUrl}`);
  });

  // Return in original format with enhanced serialization
  try {
    const returnData = wasString ? JSON.stringify(parsedData) : parsedData;
    
    console.log(`🎯 Mason: Enhanced replacement completed: ${replacementsMade} total replacements made`);
    
    return {
      data: returnData,
      replacements_made: replacementsMade
    };
  } catch (e) {
    console.error('🚨 Mason: Failed to serialize updated data:', e);
    return { data: elementorData, replacements_made: 0 };
  }
}

// Enhanced recursive function to replace images (same logic as cliff but with better logging)
function replaceImagesInElementsEnhanced(
  elements: any, 
  oldUrl: string, 
  newImage: ImageUploadResult,
  oldAttachmentId?: number
): number {
  if (!Array.isArray(elements) && typeof elements !== 'object') {
    return 0;
  }
  
  let count = 0;
  
  if (Array.isArray(elements)) {
    elements.forEach(element => {
      count += replaceImagesInElementsEnhanced(element, oldUrl, newImage, oldAttachmentId);
    });
  } else if (typeof elements === 'object' && elements !== null) {
    // Enhanced image widget handling
    if (elements.widgetType === 'image' && elements.settings?.image) {
      if (elements.settings.image.url === oldUrl) {
        elements.settings.image.url = newImage.img_url_returned;
        elements.settings.image.id = newImage.wp_img_id_returned;
        count++;
        console.log(`🖼️ Mason: Updated image widget: ${oldUrl} -> ${newImage.img_url_returned}`);
      }
    }
    
    // Enhanced background image handling
    if (elements.settings) {
      count += replaceBackgroundImagesEnhanced(elements.settings, oldUrl, newImage, oldAttachmentId);
    }
    
    // Enhanced gallery widget handling
    if (elements.widgetType === 'image-gallery' && elements.settings?.gallery) {
      if (Array.isArray(elements.settings.gallery)) {
        elements.settings.gallery.forEach((galleryItem: any) => {
          if (galleryItem.url === oldUrl) {
            galleryItem.url = newImage.img_url_returned;
            galleryItem.id = newImage.wp_img_id_returned;
            count++;
            console.log(`🖼️ Mason: Updated gallery image: ${oldUrl} -> ${newImage.img_url_returned}`);
          }
        });
      }
    }
    
    // Enhanced carousel handling
    if (elements.settings?.slides && Array.isArray(elements.settings.slides)) {
      elements.settings.slides.forEach((slide: any) => {
        count += replaceImagesInElementsEnhanced(slide, oldUrl, newImage, oldAttachmentId);
      });
    }
    
    // Enhanced attachment ID replacement
    if (oldAttachmentId && typeof elements === 'object') {
      count += replaceAttachmentIdsEnhanced(elements, oldAttachmentId, newImage.wp_img_id_returned);
    }
    
    // Enhanced recursive processing
    if (elements.elements && Array.isArray(elements.elements)) {
      count += replaceImagesInElementsEnhanced(elements.elements, oldUrl, newImage, oldAttachmentId);
    }
    
    // Process other nested structures
    Object.keys(elements).forEach(key => {
      if (key !== 'elements' && key !== 'settings') {
        if (typeof elements[key] === 'object') {
          count += replaceImagesInElementsEnhanced(elements[key], oldUrl, newImage, oldAttachmentId);
        }
      }
    });
  }
  
  return count;
}

// Enhanced background image replacement
function replaceBackgroundImagesEnhanced(
  settings: any, 
  oldUrl: string, 
  newImage: ImageUploadResult,
  oldAttachmentId?: number
): number {
  let count = 0;
  
  // Standard background image
  if (settings.background_image?.url === oldUrl) {
    settings.background_image.url = newImage.img_url_returned;
    settings.background_image.id = newImage.wp_img_id_returned;
    count++;
    console.log(`🎨 Mason: Updated background image: ${oldUrl} -> ${newImage.img_url_returned}`);
  }
  
  // Section background
  if (settings.background_background === 'classic' && settings.background_image?.url === oldUrl) {
    settings.background_image.url = newImage.img_url_returned;
    settings.background_image.id = newImage.wp_img_id_returned;
    count++;
  }
  
  // Overlay background
  if (settings.background_overlay_image?.url === oldUrl) {
    settings.background_overlay_image.url = newImage.img_url_returned;
    settings.background_overlay_image.id = newImage.wp_img_id_returned;
    count++;
  }
  
  // Enhanced: Check all settings for any image references
  Object.keys(settings).forEach(key => {
    if (typeof settings[key] === 'object' && settings[key]?.url === oldUrl) {
      settings[key].url = newImage.img_url_returned;
      if (settings[key].hasOwnProperty('id')) {
        settings[key].id = newImage.wp_img_id_returned;
        count++;
        console.log(`🔧 Mason: Updated setting ${key}: ${oldUrl} -> ${newImage.img_url_returned}`);
      }
    }
  });
  
  return count;
}

// Enhanced attachment ID replacement
function replaceAttachmentIdsEnhanced(obj: any, oldId: number, newId: number): number {
  let count = 0;
  
  if (typeof obj !== 'object' || obj === null) {
    return count;
  }
  
  Object.keys(obj).forEach(key => {
    if (key === 'id' && obj[key] === oldId) {
      obj[key] = newId;
      count++;
      console.log(`🔢 Mason: Updated attachment ID: ${oldId} -> ${newId}`);
    } else if (typeof obj[key] === 'object') {
      count += replaceAttachmentIdsEnhanced(obj[key], oldId, newId);
    }
  });
  
  return count;
}

// Enhanced WordPress page update using native methods
async function updateWordPressPageEnhanced(
  siteUrl: string,
  postId: number,
  elementorData: any,
  apiKey: string
): Promise<{success: boolean, cache_cleared: boolean, method_used: string}> {
  
  // Enhanced endpoints prioritizing native WordPress methods
  const endpoints = [
    { 
      name: 'native-elementor', 
      url: `https://${siteUrl}/wp-json/wp/v2/posts/${postId}`,
      method: 'native_wp_api'
    },
    { 
      name: 'elementor-meta', 
      url: `https://${siteUrl}/wp-json/snefuru/v1/posts/${postId}/elementor-meta`,
      method: 'meta_update'
    },
    { 
      name: 'snefuru-native', 
      url: `https://${siteUrl}/wp-json/snefuru/v1/posts/${postId}/elementor-native`,
      method: 'snefuru_native'
    },
    { 
      name: 'enhanced', 
      url: `https://${siteUrl}/wp-json/snefuru/v1/posts/${postId}/elementor`,
      method: 'snefuru_enhanced'
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 Mason: Attempting ${endpoint.name} WordPress update for post ${postId}`);
      
      let requestBody: any;
      let headers: any = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mason-Arrange/1.0'
      };

      // Different request formats for different endpoints
      if (endpoint.method === 'native_wp_api') {
        // Native WordPress API approach
        requestBody = {
          meta: {
            '_elementor_data': JSON.stringify(elementorData)
          }
        };
      } else if (endpoint.method === 'meta_update') {
        // Meta-specific update
        requestBody = {
          meta_key: '_elementor_data',
          meta_value: JSON.stringify(elementorData),
          clear_cache: true
        };
      } else {
        // Snefuru methods
        requestBody = {
          elementor_data: JSON.stringify(elementorData),
          clear_cache: true,
          validate_data: true
        };
      }
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Mason: WordPress page updated successfully using ${endpoint.name} method:`, result);
        
        // Try to clear cache as a separate call
        let cacheCleared = false;
        try {
          await clearElementorCache(siteUrl, postId, apiKey);
          cacheCleared = true;
        } catch (cacheError) {
          console.warn(`⚠️ Mason: Cache clearing failed, but update succeeded`);
        }
        
        return {
          success: true,
          cache_cleared: cacheCleared,
          method_used: endpoint.name
        };
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Mason: ${endpoint.name} method failed: ${response.status} ${response.statusText}`);
        console.warn(`Response: ${errorText.substring(0, 500)}`);
        
        if (endpoint === endpoints[endpoints.length - 1]) {
          console.error(`❌ Mason: All WordPress update methods failed. Last error: ${errorText}`);
          return {
            success: false,
            cache_cleared: false,
            method_used: 'none'
          };
        }
      }

    } catch (error) {
      console.warn(`⚠️ Mason: ${endpoint.name} method exception:`, error);
      
      if (endpoint === endpoints[endpoints.length - 1]) {
        console.error('💥 Mason: All WordPress update methods failed with exceptions');
        return {
          success: false,
          cache_cleared: false,
          method_used: 'none'
        };
      }
    }
  }
  
  return {
    success: false,
    cache_cleared: false,
    method_used: 'none'
  };
}

// Enhanced cache clearing
async function clearElementorCache(
  siteUrl: string,
  postId: number,
  apiKey: string
): Promise<void> {
  try {
    const cacheEndpoints = [
      `https://${siteUrl}/wp-json/snefuru/v1/posts/${postId}/clear-cache`,
      `https://${siteUrl}/wp-json/snefuru/v1/cache/elementor/clear`
    ];
    
    for (const endpoint of cacheEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mason-Arrange/1.0'
          },
          body: JSON.stringify({ post_id: postId })
        });
        
        if (response.ok) {
          console.log(`🧹 Mason: Cache cleared successfully via ${endpoint}`);
          return;
        }
      } catch (e) {
        // Try next endpoint
      }
    }
    
    throw new Error('All cache clearing methods failed');
    
  } catch (error) {
    console.warn('🧹 Mason: Cache clearing failed:', error);
    throw error;
  }
}