import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  validateImageUrls,
  createElementorBackup,
  validateElementorDataStructure,
  type ImageUploadResult,
  type ReplacementMap
} from '../shared/rhino-safety-lib';

interface BoulderDebugRequest {
  gcon_piece_id: string;
  narpi_push_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gcon_piece_id, narpi_push_id }: BoulderDebugRequest = body;

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

    console.log(`🔍 BOULDER DEBUG: Starting analysis for gcon_piece: ${gcon_piece_id}, narpi_push: ${narpi_push_id}`);

    const debugResult = await performBoulderDebug(
      supabase,
      gcon_piece_id,
      narpi_push_id,
      userData.ruplin_api_key_1
    );

    return NextResponse.json({
      success: true,
      debug_info: debugResult
    });

  } catch (error) {
    console.error('🔍 BOULDER DEBUG ERROR:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Boulder debug failed'
    }, { status: 500 });
  }
}

async function performBoulderDebug(
  supabase: any,
  gcon_piece_id: string,
  narpi_push_id: string,
  apiKey: string
) {
  const debug = {
    step1_gcon_data: null as any,
    step2_narpi_data: null as any,
    step3_current_images: [] as any[],
    step4_replacement_map: {} as any,
    step5_elementor_before: null as any,
    step6_elementor_after: null as any,
    step7_structure_validation: {
      before: false,
      after: false
    },
    step8_size_analysis: {
      before: 0,
      after: 0,
      change: 0
    }
  };

  try {
    // STEP 1: Get gcon_pieces data
    console.log(`🔍 DEBUG Step 1: Getting gcon_pieces data`);
    const { data: gconPiece, error: gconError } = await supabase
      .from('gcon_pieces')
      .select('*')
      .eq('id', gcon_piece_id)
      .single();

    if (gconError || !gconPiece) {
      throw new Error(`Gcon piece not found: ${gcon_piece_id}`);
    }

    debug.step1_gcon_data = {
      id: gconPiece.id,
      meta_title: gconPiece.meta_title,
      g_post_id: gconPiece.g_post_id,
      asn_sitespren_base: gconPiece.asn_sitespren_base,
      has_elementor_data: !!gconPiece.pelementor_cached,
      elementor_data_type: typeof gconPiece.pelementor_cached,
      elementor_data_size: gconPiece.pelementor_cached ? JSON.stringify(gconPiece.pelementor_cached).length : 0
    };

    // STEP 2: Get narpi push data
    console.log(`🔍 DEBUG Step 2: Getting narpi push data`);
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

    const uploaded_images = narpiPushData.kareench1.filter((upload: any) => 
      upload.nupload_status1 === 'success' && upload.wp_img_id_returned
    );

    debug.step2_narpi_data = {
      total_uploads: narpiPushData.kareench1.length,
      successful_uploads: uploaded_images.length,
      upload_urls: uploaded_images.map(img => img.img_url_returned)
    };

    // STEP 3: Extract current images from Elementor data
    console.log(`🔍 DEBUG Step 3: Extracting current images`);
    const currentElementorData = gconPiece.pelementor_cached;
    
    if (!currentElementorData) {
      throw new Error('No Elementor data found in pelementor_cached');
    }

    debug.step5_elementor_before = JSON.parse(JSON.stringify(currentElementorData)); // Deep copy
    debug.step7_structure_validation.before = validateElementorDataStructure(currentElementorData);
    debug.step8_size_analysis.before = JSON.stringify(currentElementorData).length;

    const currentImages = extractAllImagesFromElementorDataDebug(currentElementorData);
    debug.step3_current_images = currentImages;

    // STEP 4: Create replacement map
    console.log(`🔍 DEBUG Step 4: Creating replacement map`);
    const replacementMap: ReplacementMap = {};
    currentImages.forEach((currentImg, index) => {
      if (index < uploaded_images.length && uploaded_images[index].wp_img_id_returned) {
        replacementMap[currentImg.url] = uploaded_images[index];
      }
    });

    debug.step4_replacement_map = {
      total_mappings: Object.keys(replacementMap).length,
      mappings: Object.entries(replacementMap).map(([oldUrl, newImg]) => ({
        old_url: oldUrl,
        new_url: newImg.img_url_returned,
        wp_id: newImg.wp_img_id_returned
      }))
    };

    // STEP 5: Perform image replacement with detailed tracking
    console.log(`🔍 DEBUG Step 5: Performing image replacement with tracking`);
    const replacementResult = replaceImagesInElementsDebug(currentElementorData, replacementMap);
    
    debug.step6_elementor_after = JSON.parse(JSON.stringify(currentElementorData)); // Deep copy after changes
    debug.step7_structure_validation.after = validateElementorDataStructure(currentElementorData);
    debug.step8_size_analysis.after = JSON.stringify(currentElementorData).length;
    debug.step8_size_analysis.change = debug.step8_size_analysis.after - debug.step8_size_analysis.before;

    // Log critical findings
    console.log(`🔍 DEBUG SUMMARY:`);
    console.log(`- Found ${debug.step3_current_images.length} current images`);
    console.log(`- Created ${debug.step4_replacement_map.total_mappings} mappings`);
    console.log(`- Made ${replacementResult.total_replacements} replacements`);
    console.log(`- Structure valid before: ${debug.step7_structure_validation.before}`);
    console.log(`- Structure valid after: ${debug.step7_structure_validation.after}`);
    console.log(`- Size change: ${debug.step8_size_analysis.change} bytes`);

    return {
      ...debug,
      replacement_details: replacementResult
    };

  } catch (error) {
    console.error('🔍 DEBUG ERROR:', error);
    return {
      ...debug,
      error: error instanceof Error ? error.message : 'Debug failed'
    };
  }
}

/**
 * Debug version of image extraction with detailed logging
 */
function extractAllImagesFromElementorDataDebug(elementorData: any): Array<{url: string, context: string, widget_type?: string}> {
  const images: Array<{url: string, context: string, widget_type?: string}> = [];

  function traverse(obj: any, context: string = 'unknown', widgetType?: string): void {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => traverse(item, `${context}[${index}]`, widgetType));
    } else if (typeof obj === 'object' && obj !== null) {
      
      // Track widget type
      const currentWidgetType = obj.widgetType || widgetType;
      
      // Check for image objects with URL
      if (obj.url && typeof obj.url === 'string' && obj.url.includes('/wp-content/uploads/')) {
        images.push({ 
          url: obj.url, 
          context,
          widget_type: currentWidgetType 
        });
        console.log(`🖼️ DEBUG Found image: ${obj.url} in ${context} (${currentWidgetType || 'unknown'})`);
      }

      // Check for carousel arrays
      if (obj.carousel && Array.isArray(obj.carousel)) {
        obj.carousel.forEach((item: any, index: number) => {
          if (item?.url) {
            images.push({ 
              url: item.url, 
              context: `${context}.carousel[${index}]`,
              widget_type: currentWidgetType 
            });
            console.log(`🎠 DEBUG Found carousel image: ${item.url}`);
          }
        });
      }

      // Check for gallery arrays
      if (obj.gallery && Array.isArray(obj.gallery)) {
        obj.gallery.forEach((item: any, index: number) => {
          if (item?.url) {
            images.push({ 
              url: item.url, 
              context: `${context}.gallery[${index}]`,
              widget_type: currentWidgetType 
            });
            console.log(`🖼️ DEBUG Found gallery image: ${item.url}`);
          }
        });
      }

      // Recursively check all other properties
      Object.keys(obj).forEach(key => {
        if (key !== 'carousel' && key !== 'gallery') {
          traverse(obj[key], `${context}.${key}`, currentWidgetType);
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

  return uniqueImages;
}

/**
 * Debug version of image replacement with detailed tracking
 */
function replaceImagesInElementsDebug(elements: any, replacementMap: ReplacementMap) {
  const result = {
    total_replacements: 0,
    replacements_by_type: {} as Record<string, number>,
    replacement_details: [] as any[]
  };

  function performReplacement(obj: any, oldUrl: string, newImageData: ImageUploadResult, context: string) {
    if (obj.url === oldUrl) {
      const oldData = { ...obj };
      
      // Replace URL while preserving other properties
      obj.url = newImageData.img_url_returned;
      if (newImageData.wp_img_id_returned) {
        obj.id = newImageData.wp_img_id_returned;
      }

      result.total_replacements++;
      result.replacement_details.push({
        context,
        old_url: oldUrl,
        new_url: newImageData.img_url_returned,
        old_data: oldData,
        new_data: { ...obj },
        properties_preserved: Object.keys(obj).filter(key => key !== 'url' && key !== 'id')
      });

      console.log(`🔄 DEBUG Replaced: ${oldUrl} -> ${newImageData.img_url_returned} in ${context}`);
      return true;
    }
    return false;
  }

  function traverse(obj: any, context: string = 'unknown'): void {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => traverse(item, `${context}[${index}]`));
    } else if (typeof obj === 'object' && obj !== null) {
      
      // Check for direct image replacement
      Object.entries(replacementMap).forEach(([oldUrl, newImageData]) => {
        performReplacement(obj, oldUrl, newImageData, context);
      });

      // Handle carousel arrays
      if (obj.carousel && Array.isArray(obj.carousel)) {
        obj.carousel.forEach((item: any, index: number) => {
          Object.entries(replacementMap).forEach(([oldUrl, newImageData]) => {
            if (performReplacement(item, oldUrl, newImageData, `${context}.carousel[${index}]`)) {
              result.replacements_by_type['carousel'] = (result.replacements_by_type['carousel'] || 0) + 1;
            }
          });
        });
      }

      // Handle gallery arrays
      if (obj.gallery && Array.isArray(obj.gallery)) {
        obj.gallery.forEach((item: any, index: number) => {
          Object.entries(replacementMap).forEach(([oldUrl, newImageData]) => {
            if (performReplacement(item, oldUrl, newImageData, `${context}.gallery[${index}]`)) {
              result.replacements_by_type['gallery'] = (result.replacements_by_type['gallery'] || 0) + 1;
            }
          });
        });
      }

      // Recursive processing
      Object.keys(obj).forEach(key => {
        if (key !== 'carousel' && key !== 'gallery') {
          traverse(obj[key], `${context}.${key}`);
        }
      });
    }
  }

  traverse(elements, 'root');
  return result;
}