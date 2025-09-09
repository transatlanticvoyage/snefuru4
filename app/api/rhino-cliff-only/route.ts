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

// Helper: Replace images in Elementor data (copied from rhino-replace)
function replaceImagesInElementorData(
  elementorData: any,
  replacementMap: Record<string, ImageUploadResult>,
  regolithImages: any[] = []
): { data: any, replacements_made: number } {
  let replacementsMade = 0;
  
  // Handle different data formats - could be string or object
  let dataString: string;
  let parsedData: any;
  
  if (typeof elementorData === 'string') {
    // Data is already a JSON string
    dataString = elementorData;
    try {
      parsedData = JSON.parse(elementorData);
    } catch (e) {
      console.error('🚨 Failed to parse elementor data string:', e);
      return { data: elementorData, replacements_made: 0 };
    }
  } else {
    // Data is an object, need to stringify for URL replacement
    parsedData = elementorData;
    dataString = JSON.stringify(elementorData);
  }
  
  let updatedDataString = dataString;

  console.log(`🔍 Debug: elementorData type: ${typeof elementorData}`);
  console.log(`🔍 Debug: dataString length: ${dataString.length}`);
  console.log(`🔍 Debug: First 500 chars of dataString: ${dataString.substring(0, 500)}`);

  // Replace URLs in the serialized data
  Object.keys(replacementMap).forEach(oldUrl => {
    const newImage = replacementMap[oldUrl];
    if (newImage.img_url_returned && newImage.wp_img_id_returned) {
      console.log(`🔍 Searching for URL: "${oldUrl}"`);
      console.log(`🔍 Replacing with: "${newImage.img_url_returned}"`);
      
      // Replace URL instances - this is the actual image replacement
      const urlRegex = new RegExp(escapeRegExp(oldUrl), 'g');
      const urlMatches = (updatedDataString.match(urlRegex) || []).length;
      
      console.log(`🔍 Found ${urlMatches} matches for URL: ${oldUrl}`);
      
      if (urlMatches > 0) {
        updatedDataString = updatedDataString.replace(urlRegex, newImage.img_url_returned);
        console.log(`✅ Successfully replaced ${urlMatches} instances of ${oldUrl}`);
      } else {
        console.log(`❌ No matches found for ${oldUrl} in elementor data`);
        // Let's check for URL variations
        const variations = [
          oldUrl.replace('http://', 'https://'),
          oldUrl.replace('https://', 'http://'),
          oldUrl.replace(/^https?:\/\/[^\/]+/, ''), // Just the path
          oldUrl.replace(/\//g, '\\/'), // Escaped slashes for JSON
        ];
        
        variations.forEach((variation, index) => {
          const varMatches = (updatedDataString.match(new RegExp(escapeRegExp(variation), 'g')) || []).length;
          console.log(`🔍 Variation ${index + 1} "${variation}": ${varMatches} matches`);
        });
      }
      
      // Count only URL replacements (each URL replacement = 1 image replaced)
      replacementsMade += urlMatches;
      
      // Also update specific attachment IDs from regolith data but don't count them separately
      // We need to be more targeted here - only replace the specific old attachment ID
      const matchingImage = regolithImages.find((img: any) => img.url === oldUrl);
      
      if (matchingImage && matchingImage.image_metadata?.attachment_id) {
        const oldAttachmentId = matchingImage.image_metadata.attachment_id;
        const attachmentIdRegex = new RegExp(`"id":\\s*${oldAttachmentId}\\b`, 'g');
        const idMatches = (updatedDataString.match(attachmentIdRegex) || []).length;
        updatedDataString = updatedDataString.replace(attachmentIdRegex, `"id": ${newImage.wp_img_id_returned}`);
        console.log(`🔧 Updated ${idMatches} attachment ID references from ${oldAttachmentId} to ${newImage.wp_img_id_returned}`);
      }
    }
  });

  try {
    // Parse the updated data string back to object
    const updatedParsedData = JSON.parse(updatedDataString);
    
    // Return the data in the same format it was received
    // If original was a string, return string; if object, return object
    const returnData = typeof elementorData === 'string' ? updatedDataString : updatedParsedData;
    
    return {
      data: returnData,
      replacements_made: replacementsMade
    };
  } catch (e) {
    console.error('🚨 Failed to parse updated data string:', e);
    // Fallback to original data if parsing fails
    return {
      data: elementorData,
      replacements_made: 0
    };
  }
}

// Helper: Update WordPress page via Snefuruplin API (copied from rhino-replace)
async function updateWordPressPage(
  siteUrl: string,
  postId: number,
  elementorData: any,
  apiKey: string
): Promise<boolean> {
  try {
    const endpoint = `https://${siteUrl}/wp-json/snefuru/v1/posts/${postId}/elementor`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Snefuru-RhinoCliffOnly/1.0'
      },
      body: JSON.stringify({
        elementor_data: JSON.stringify(elementorData)
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

// Helper: Escape string for regex (copied from rhino-replace)
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}