import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RhinoReplaceRequest {
  gcon_piece_id: string;
  selected_plan_ids: string[];
  batch_id: string;
  sitespren_id: string;
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
    const { gcon_piece_id, selected_plan_ids, batch_id, sitespren_id }: RhinoReplaceRequest = body;

    if (!gcon_piece_id || !selected_plan_ids || !batch_id || !sitespren_id) {
      return NextResponse.json(
        { error: 'Missing required fields: gcon_piece_id, selected_plan_ids, batch_id, sitespren_id' },
        { status: 400 }
      );
    }

    if (!Array.isArray(selected_plan_ids) || selected_plan_ids.length === 0) {
      return NextResponse.json(
        { error: 'selected_plan_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log(`🦏 Rhino Replace: Starting process for gcon_piece: ${gcon_piece_id}`);
    console.log(`📸 Selected images: ${selected_plan_ids.length} plans`);

    // PHASE 1: Narpi Push Record & Upload
    console.log(`📤 Phase 1: Starting Narpi Push...`);
    
    const narpiResult = await performNarpiPush(
      supabase, 
      batch_id, 
      sitespren_id, 
      selected_plan_ids, 
      user.id
    );

    if (!narpiResult.success) {
      return NextResponse.json({
        success: false,
        phase: 'narpi_push',
        error: narpiResult.error,
        message: 'Narpi Push failed'
      }, { status: 500 });
    }

    console.log(`✅ Phase 1 Complete: ${narpiResult.uploaded_images.length} images uploaded`);

    // PHASE 2: Cliff Arrangement  
    console.log(`🏔️ Phase 2: Starting Cliff Arrangement...`);
    
    const cliffResult = await performCliffArrangement(
      supabase,
      gcon_piece_id,
      narpiResult.uploaded_images,
      user.id
    );

    if (!cliffResult.success) {
      return NextResponse.json({
        success: false,
        phase: 'cliff_arrangement',
        error: cliffResult.error,
        message: 'Cliff Arrangement failed',
        narpi_results: narpiResult
      }, { status: 500 });
    }

    console.log(`✅ Phase 2 Complete: Page updated with new images`);

    return NextResponse.json({
      success: true,
      message: 'Rhino Replace completed successfully',
      results: {
        narpi_push: {
          images_uploaded: narpiResult.uploaded_images.length,
          upload_details: narpiResult.uploaded_images
        },
        cliff_arrangement: {
          images_replaced: cliffResult.replacements_made,
          page_updated: cliffResult.page_updated,
          elementor_data_updated: cliffResult.elementor_updated
        }
      }
    });

  } catch (error) {
    console.error('🚨 Rhino Replace CRITICAL ERROR:', error);
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

// Phase 1: Perform Narpi Push (reusing existing logic)
async function performNarpiPush(
  supabase: any, 
  batch_id: string, 
  sitespren_id: string, 
  selected_plan_ids: string[], 
  user_id: string
) {
  try {
    // Call the existing sfunc_63_push_images logic
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/bin45/sfunc_63_push_images`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user_id}` // Pass user context
      },
      body: JSON.stringify({
        batch_id,
        sitespren_id,
        selected_plan_ids,
        push_method: 'rhino_replace_push'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Narpi Push failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      uploaded_images: result.successful_uploads || [],
      narpi_record_id: result.nupload_record_id
    };

  } catch (error) {
    console.error('💥 Narpi Push error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Narpi push failed'
    };
  }
}

// Phase 2: Perform Cliff Arrangement
async function performCliffArrangement(
  supabase: any,
  gcon_piece_id: string,
  uploaded_images: ImageUploadResult[],
  user_id: string
) {
  try {
    // Get user internal ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, ruplin_api_key_1')
      .eq('auth_id', user_id)
      .single();

    if (userError || !userData || !userData.ruplin_api_key_1) {
      throw new Error('User not found or API key missing');
    }

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
      .eq('fk_users_id', userData.id)
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

    // Create replacement mapping
    const replacementMap = createImageReplacementMap(imagesToReplace, uploaded_images);
    console.log(`🗺️ Created replacement map for ${Object.keys(replacementMap).length} images`);

    // Update Elementor data with new images
    let updatedElementorData = gconPiece.pelementor_cached;
    let replacementsMade = 0;

    if (updatedElementorData) {
      const updateResult = replaceImagesInElementorData(
        updatedElementorData, 
        replacementMap
      );
      updatedElementorData = updateResult.data;
      replacementsMade = updateResult.replacements_made;

      console.log(`🔧 Made ${replacementsMade} image replacements in Elementor data`);
    }

    // Update the WordPress page via Snefuruplin API
    let pageUpdated = false;
    if (replacementsMade > 0 && gconPiece.g_post_id) {
      pageUpdated = await updateWordPressPage(
        gconPiece.asn_sitespren_base,
        gconPiece.g_post_id,
        updatedElementorData,
        userData.ruplin_api_key_1
      );
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
    console.error('🏔️ Cliff Arrangement error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cliff arrangement failed'
    };
  }
}

// Helper: Create image replacement mapping
function createImageReplacementMap(
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

// Helper: Replace images in Elementor data
function replaceImagesInElementorData(
  elementorData: any,
  replacementMap: Record<string, ImageUploadResult>
): { data: any, replacements_made: number } {
  let replacementsMade = 0;
  const dataString = JSON.stringify(elementorData);
  let updatedDataString = dataString;

  // Replace URLs in the serialized data
  Object.keys(replacementMap).forEach(oldUrl => {
    const newImage = replacementMap[oldUrl];
    if (newImage.img_url_returned && newImage.wp_img_id_returned) {
      // Replace URL
      const urlRegex = new RegExp(escapeRegExp(oldUrl), 'g');
      const urlMatches = (updatedDataString.match(urlRegex) || []).length;
      updatedDataString = updatedDataString.replace(urlRegex, newImage.img_url_returned);
      
      // Replace attachment ID if present
      const idMatches = elementorData.toString().includes(String(newImage.wp_img_id_returned));
      if (!idMatches) {
        // Find and replace old attachment IDs
        const idRegex = /"id":\s*\d+/g;
        updatedDataString = updatedDataString.replace(idRegex, (match) => {
          replacementsMade++;
          return `"id": ${newImage.wp_img_id_returned}`;
        });
      }
      
      replacementsMade += urlMatches;
      console.log(`🔄 Replaced ${urlMatches} instances of ${oldUrl}`);
    }
  });

  try {
    return {
      data: JSON.parse(updatedDataString),
      replacements_made: replacementsMade
    };
  } catch (e) {
    // Fallback to original data if parsing fails
    return {
      data: elementorData,
      replacements_made: 0
    };
  }
}

// Helper: Update WordPress page via Snefuruplin API
async function updateWordPressPage(
  siteUrl: string,
  postId: number,
  elementorData: any,
  apiKey: string
): Promise<boolean> {
  try {
    const endpoint = `https://${siteUrl}/wp-json/snefuru/v1/update-elementor`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Snefuru-RhinoReplace/1.0'
      },
      body: JSON.stringify({
        post_id: postId,
        elementor_data: elementorData
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ WordPress update failed: ${response.status} ${response.statusText}`);
      console.error(`Response: ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log(`✅ WordPress page updated successfully:`, result);
    return true;

  } catch (error) {
    console.error('💥 WordPress update error:', error);
    return false;
  }
}

// Helper: Escape string for regex
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}