import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RhinoCliffOnlyRequest {
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
    const { gcon_piece_id, narpi_push_id }: RhinoCliffOnlyRequest = body;

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

    console.log(`🦏 Rhino Cliff-Only: Starting process for gcon_piece: ${gcon_piece_id}, narpi_push: ${narpi_push_id}`);

    // Get user internal ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, ruplin_api_key_1')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData || !userData.ruplin_api_key_1) {
      throw new Error('User not found or API key missing');
    }

    // Get the narpi push data
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

    console.log(`📸 Using ${successfulUploads.length} successful uploads from narpi push`);

    // Perform Cliff Arrangement using the existing uploads
    const cliffResult = await performCliffArrangementOnly(
      supabase,
      gcon_piece_id,
      successfulUploads,
      userData.id,
      userData.ruplin_api_key_1
    );

    if (!cliffResult.success) {
      return NextResponse.json({
        success: false,
        phase: 'cliff_arrangement',
        error: cliffResult.error,
        message: 'Cliff Arrangement failed'
      }, { status: 500 });
    }

    console.log(`✅ Rhino Cliff-Only Complete: Page updated with existing images`);

    return NextResponse.json({
      success: true,
      message: 'Rhino Cliff-Only completed successfully',
      results: {
        narpi_push: {
          id: narpi_push_id,
          images_used: successfulUploads.length
        },
        cliff_arrangement: {
          images_replaced: cliffResult.replacements_made,
          page_updated: cliffResult.page_updated,
          elementor_data_updated: cliffResult.elementor_updated
        }
      }
    });

  } catch (error) {
    console.error('🚨 Rhino Cliff-Only CRITICAL ERROR:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        phase: 'system_error'
      },
      { status: 500 }
    );
  }
}

// Perform Cliff Arrangement Only (using existing narpi push data)
async function performCliffArrangementOnly(
  supabase: any,
  gcon_piece_id: string,
  uploaded_images: ImageUploadResult[],
  user_internal_id: string,
  ruplin_api_key: string
) {
  try {
    // Get gcon piece with regolith data and site info
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

    if (!gconPiece.discovered_images_regolith) {
      throw new Error('No regolith data found - run f331 first');
    }

    console.log(`📄 Processing page: ${gconPiece.meta_title} (${gconPiece.asn_sitespren_base})`);
    console.log(`🎯 WordPress Post ID: ${gconPiece.g_post_id}`);

    // Parse regolith data to find images to replace
    let regolithData;
    try {
      regolithData = typeof gconPiece.discovered_images_regolith === 'string' 
        ? JSON.parse(gconPiece.discovered_images_regolith)
        : gconPiece.discovered_images_regolith;
    } catch (e) {
      throw new Error('Invalid regolith data format');
    }

    const imagesToReplace = regolithData.discovered_images || [];
    console.log(`🔄 Found ${imagesToReplace.length} images to replace`);

    if (imagesToReplace.length === 0) {
      return {
        success: true,
        replacements_made: 0,
        page_updated: false,
        elementor_updated: false,
        message: 'No images found to replace'
      };
    }

    // Create replacement mapping using existing uploaded images
    const replacementMap = createImageReplacementMapFromNarpi(imagesToReplace, uploaded_images);
    console.log(`🗺️ Created replacement map for ${Object.keys(replacementMap).length} images`);

    // Update Elementor data with new images
    let updatedElementorData = gconPiece.pelementor_cached;
    let replacementsMade = 0;

    if (updatedElementorData) {
      const updateResult = replaceImagesInElementorData(
        updatedElementorData, 
        replacementMap,
        imagesToReplace
      );
      updatedElementorData = updateResult.data;
      replacementsMade = updateResult.replacements_made;

      console.log(`🔧 Made ${replacementsMade} image replacements in Elementor data`);
    }

    // Update the WordPress page via Snefuruplin API - ONLY if actual replacements were made
    let pageUpdated = false;
    if (replacementsMade > 0 && gconPiece.g_post_id) {
      console.log(`🚀 Sending updated Elementor data to WordPress (${replacementsMade} replacements made)`);
      pageUpdated = await updateWordPressPage(
        gconPiece.asn_sitespren_base,
        gconPiece.g_post_id,
        updatedElementorData,
        ruplin_api_key
      );
    } else if (replacementsMade === 0) {
      console.log(`⚠️ Skipping WordPress update - no image replacements were made to avoid corrupting page`);
    } else {
      console.log(`⚠️ Skipping WordPress update - missing post ID (${gconPiece.g_post_id})`);
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
      elementor_updated: replacementsMade > 0,
      replacement_details: Object.keys(replacementMap).map(oldUrl => ({
        old_url: oldUrl,
        new_wp_id: replacementMap[oldUrl].wp_img_id_returned,
        new_url: replacementMap[oldUrl].img_url_returned
      }))
    };

  } catch (error) {
    console.error('🏔️ Cliff Arrangement Only error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cliff arrangement failed'
    };
  }
}

// Helper: Create image replacement mapping from narpi push data
function createImageReplacementMapFromNarpi(
  imagesToReplace: any[], 
  uploadedImages: ImageUploadResult[]
): Record<string, ImageUploadResult> {
  const map: Record<string, ImageUploadResult> = {};
  
  // Simple 1:1 mapping based on order for now
  // TODO: Could be enhanced with smarter matching based on filename, dimensions, etc.
  imagesToReplace.forEach((regolithImage, index) => {
    if (index < uploadedImages.length && uploadedImages[index].wp_img_id_returned) {
      map[regolithImage.url] = uploadedImages[index];
    }
  });

  return map;
}

// Helper: Replace images in Elementor data with proper JSON traversal
function replaceImagesInElementorData(
  elementorData: any,
  replacementMap: Record<string, ImageUploadResult>,
  regolithImages: any[] = []
): { data: any, replacements_made: number } {
  let replacementsMade = 0;
  const wasString = typeof elementorData === 'string';
  
  // Parse data into workable format
  let parsedData: any;
  try {
    if (wasString) {
      parsedData = JSON.parse(elementorData);
    } else {
      parsedData = JSON.parse(JSON.stringify(elementorData)); // Deep clone
    }
  } catch (e) {
    console.error('🚨 Failed to parse elementor data:', e);
    return { data: elementorData, replacements_made: 0 };
  }

  console.log(`🔍 Enhanced Debug: Processing ${wasString ? 'string' : 'object'} elementor data with ${Object.keys(replacementMap).length} replacements`);
  
  // Debug: Show what URLs we're looking for vs what's in the data
  const dataString = JSON.stringify(parsedData);
  console.log(`🔍 URLs to replace: ${Object.keys(replacementMap).join(', ')}`);
  
  // Extract some sample URLs from the Elementor data to see what's actually there
  const urlMatches = dataString.match(/https?:\/\/[^\s"',}]+\.(jpg|jpeg|png|gif|webp)/gi);
  if (urlMatches && urlMatches.length > 0) {
    const uniqueUrls = [...new Set(urlMatches)].slice(0, 10); // First 10 unique URLs
    console.log(`🔍 Sample URLs found in Elementor data: ${uniqueUrls.join(', ')}`);
  } else {
    console.log(`🔍 No image URLs found in Elementor data`);
  }
  
  // Validate structure
  if (!Array.isArray(parsedData)) {
    console.error('🚨 Invalid Elementor data structure: expected array');
    return { data: elementorData, replacements_made: 0 };
  }

  // Process each replacement with structured approach
  Object.keys(replacementMap).forEach(oldUrl => {
    const newImage = replacementMap[oldUrl];
    if (!newImage.img_url_returned || !newImage.wp_img_id_returned) {
      console.log(`⚠️ Skipping incomplete replacement for ${oldUrl}`);
      return;
    }

    console.log(`🔄 Processing replacement: ${oldUrl} -> ${newImage.img_url_returned}`);
    
    // Find and update attachment ID from regolith data
    const matchingImage = regolithImages.find((img: any) => img.url === oldUrl);
    const oldAttachmentId = matchingImage?.image_metadata?.attachment_id;
    
    const count = replaceImagesInElements(parsedData, oldUrl, newImage, oldAttachmentId);
    replacementsMade += count;
    
    console.log(`✅ Made ${count} replacements for ${oldUrl}`);
  });

  // Return in original format
  try {
    const returnData = wasString ? JSON.stringify(parsedData) : parsedData;
    
    console.log(`🎯 Enhanced replacement completed: ${replacementsMade} total replacements made`);
    
    return {
      data: returnData,
      replacements_made: replacementsMade
    };
  } catch (e) {
    console.error('🚨 Failed to serialize updated data:', e);
    return { data: elementorData, replacements_made: 0 };
  }
}

// Recursive function to replace images in Elementor elements
function replaceImagesInElements(
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
    // Process array of elements
    elements.forEach(element => {
      count += replaceImagesInElements(element, oldUrl, newImage, oldAttachmentId);
    });
  } else if (typeof elements === 'object' && elements !== null) {
    // Process individual element
    
    // Check for image widget
    if (elements.widgetType === 'image' && elements.settings?.image) {
      if (elements.settings.image.url === oldUrl) {
        elements.settings.image.url = newImage.img_url_returned;
        elements.settings.image.id = newImage.wp_img_id_returned;
        count++;
        console.log(`🖼️ Updated image widget: ${oldUrl} -> ${newImage.img_url_returned}`);
      }
    }
    
    // Check for background images in any element settings
    if (elements.settings) {
      count += replaceBackgroundImages(elements.settings, oldUrl, newImage, oldAttachmentId);
    }
    
    // Check for gallery widget
    if (elements.widgetType === 'image-gallery' && elements.settings?.gallery) {
      if (Array.isArray(elements.settings.gallery)) {
        elements.settings.gallery.forEach((galleryItem: any) => {
          if (galleryItem.url === oldUrl) {
            galleryItem.url = newImage.img_url_returned;
            galleryItem.id = newImage.wp_img_id_returned;
            count++;
            console.log(`🖼️ Updated gallery image: ${oldUrl} -> ${newImage.img_url_returned}`);
          }
        });
      }
    }
    
    // Check for carousel and other complex widgets
    if (elements.settings?.slides && Array.isArray(elements.settings.slides)) {
      elements.settings.slides.forEach((slide: any) => {
        count += replaceImagesInElements(slide, oldUrl, newImage, oldAttachmentId);
      });
    }
    
    // Update specific attachment ID references if we have the old ID
    if (oldAttachmentId && typeof elements === 'object') {
      count += replaceAttachmentIds(elements, oldAttachmentId, newImage.wp_img_id_returned);
    }
    
    // Recursively process nested elements
    if (elements.elements && Array.isArray(elements.elements)) {
      count += replaceImagesInElements(elements.elements, oldUrl, newImage, oldAttachmentId);
    }
    
    // Process other nested structures
    Object.keys(elements).forEach(key => {
      if (key !== 'elements' && key !== 'settings') {
        if (typeof elements[key] === 'object') {
          count += replaceImagesInElements(elements[key], oldUrl, newImage, oldAttachmentId);
        }
      }
    });
  }
  
  return count;
}

// Helper to replace background images in settings
function replaceBackgroundImages(
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
    console.log(`🎨 Updated background image: ${oldUrl} -> ${newImage.img_url_returned}`);
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
  
  // Check all settings for any image references
  Object.keys(settings).forEach(key => {
    if (typeof settings[key] === 'object' && settings[key]?.url === oldUrl) {
      settings[key].url = newImage.img_url_returned;
      if (settings[key].hasOwnProperty('id')) {
        settings[key].id = newImage.wp_img_id_returned;
        count++;
        console.log(`🔧 Updated setting ${key}: ${oldUrl} -> ${newImage.img_url_returned}`);
      }
    }
  });
  
  return count;
}

// Helper to replace attachment ID references
function replaceAttachmentIds(obj: any, oldId: number, newId: number): number {
  let count = 0;
  
  if (typeof obj !== 'object' || obj === null) {
    return count;
  }
  
  Object.keys(obj).forEach(key => {
    if (key === 'id' && obj[key] === oldId) {
      obj[key] = newId;
      count++;
      console.log(`🔢 Updated attachment ID: ${oldId} -> ${newId}`);
    } else if (typeof obj[key] === 'object') {
      count += replaceAttachmentIds(obj[key], oldId, newId);
    }
  });
  
  return count;
}

// Helper: Update WordPress page via Enhanced Snefuruplin API
async function updateWordPressPage(
  siteUrl: string,
  postId: number,
  elementorData: any,
  apiKey: string
): Promise<boolean> {
  // Try native method first (most robust), fall back to enhanced method
  const endpoints = [
    { name: 'native', url: `https://${siteUrl}/wp-json/snefuru/v1/posts/${postId}/elementor-native` },
    { name: 'enhanced', url: `https://${siteUrl}/wp-json/snefuru/v1/posts/${postId}/elementor` },
    { name: 'legacy', url: `https://${siteUrl}/wp-json/snefuru/v1/posts/${postId}/elementor-legacy` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 Attempting ${endpoint.name} WordPress update for post ${postId}`);
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Snefuru-RhinoCliffOnly/2.0'
        },
        body: JSON.stringify({
          elementor_data: JSON.stringify(elementorData)
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ WordPress page updated successfully using ${endpoint.name} method:`, result);
        return true;
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ ${endpoint.name} method failed: ${response.status} ${response.statusText}`);
        console.warn(`Response: ${errorText.substring(0, 500)}`);
        
        // If it's the last endpoint, this will be treated as the final error
        if (endpoint === endpoints[endpoints.length - 1]) {
          console.error(`❌ All WordPress update methods failed. Last error: ${errorText}`);
          return false;
        }
      }

    } catch (error) {
      console.warn(`⚠️ ${endpoint.name} method exception:`, error);
      
      // If it's the last endpoint, this will be treated as the final error
      if (endpoint === endpoints[endpoints.length - 1]) {
        console.error('💥 All WordPress update methods failed with exceptions');
        return false;
      }
    }
  }
  
  return false;
}

// Helper: Escape string for regex (copied from rhino-replace)
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}