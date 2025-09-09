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
      user.id,
      request.headers.get('cookie') || undefined
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
          images_uploaded: narpiResult.successful_uploads || 0,
          total_uploads: narpiResult.total_uploads || 0,
          upload_details: narpiResult.uploaded_images || []
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

// Phase 1: Perform Narpi Push (direct implementation to avoid auth issues)
async function performNarpiPush(
  supabase: any, 
  batch_id: string, 
  sitespren_id: string, 
  selected_plan_ids: string[], 
  user_id: string,
  cookieHeader?: string
) {
  try {
    console.log('🔍 Direct Narpi Push: Getting database user');
    
    // Get the database user ID and API key for authentication  
    const { data: dbUser, error: dbUserError } = await supabase
      .from('users')
      .select('id, ruplin_api_key_1')
      .eq('auth_id', user_id)
      .single();

    if (dbUserError || !dbUser || !dbUser.ruplin_api_key_1) {
      throw new Error('Database user record not found or API key missing');
    }

    console.log('🔍 Direct Narpi Push: Getting sitespren data');
    
    // Get sitespren data for the target site
    const { data: sitesprenData, error: sitesprenError } = await supabase
      .from('sitespren')
      .select('id, sitespren_base, true_root_domain')
      .eq('id', sitespren_id)
      .single();

    if (sitesprenError || !sitesprenData) {
      throw new Error(`Sitespren site not found: ${sitesprenError?.message || 'Unknown error'}`);
    }

    console.log('🔍 Direct Narpi Push: Getting plans and images');
    
    // Get selected images_plans (image 1 only)
    const { data: plansData, error: plansError } = await supabase
      .from('images_plans')
      .select('id, fk_image1_id, e_file_name1')
      .eq('rel_images_plans_batches_id', batch_id)
      .in('id', selected_plan_ids)
      .not('fk_image1_id', 'is', null);

    if (plansError) {
      throw new Error(`Failed to fetch plans data: ${plansError.message}`);
    }

    if (!plansData || plansData.length === 0) {
      throw new Error('No images found for the selected plans');
    }

    // Get the image details for each plan
    const imageIds = plansData.map(plan => plan.fk_image1_id);
    const { data: imagesData, error: imagesError } = await supabase
      .from('images')
      .select('id, img_file_url1')
      .in('id', imageIds);

    if (imagesError) {
      throw new Error(`Failed to fetch images data: ${imagesError.message}`);
    }

    // Combine plans with their images
    const plansWithImages = plansData.map(plan => {
      const image = imagesData?.find(img => img.id === plan.fk_image1_id);
      return {
        ...plan,
        images1: image ? {
          id: image.id,
          image_url: image.img_file_url1,
          file_name: plan.e_file_name1 || null
        } : null
      };
    });

    console.log('🔍 Direct Narpi Push: Creating narpi_pushes record');
    
    // Create narpi_pushes record
    const { data: newPush, error: pushError } = await supabase
      .from('narpi_pushes')
      .insert({
        push_name: `Rhino Replace Push ${new Date().toISOString().split('T')[0]} - ${sitesprenData.sitespren_base}`,
        push_desc: `Rhino Replace automated image push to ${sitesprenData.sitespren_base} (${selected_plan_ids.length} selected images)`,
        push_status1: 'processing',
        fk_batch_id: batch_id,
        kareench1: []
      })
      .select()
      .single();

    if (pushError || !newPush) {
      throw new Error(`Failed to create push record: ${pushError?.message}`);
    }

    console.log('🔍 Direct Narpi Push: Starting image uploads');
    
    // Upload images to WordPress
    const uploadResults: ImageUploadResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < plansWithImages.length; i++) {
      const plan = plansWithImages[i];
      const image = plan.images1;

      if (!image || !image.image_url) {
        uploadResults.push({
          nupload_id: i + 1,
          nupload_status1: 'failed',
          img_url_returned: '',
          wp_img_id_returned: null
        });
        failureCount++;
        continue;
      }

      try {
        // Upload image to WordPress using direct logic
        const uploadResult = await uploadImageToWordPress(
          image.image_url,
          image.file_name || `rhino-image-${i + 1}.jpg`,
          sitesprenData,
          dbUser.ruplin_api_key_1,
          'rhino_replace_push'
        );

        const result: ImageUploadResult = {
          nupload_id: i + 1,
          nupload_status1: uploadResult.success ? 'success' : 'failed',
          img_url_returned: uploadResult.wp_url || image.image_url,
          wp_img_id_returned: uploadResult.wp_image_id || null
        };

        uploadResults.push(result);

        if (uploadResult.success) {
          successCount++;
        } else {
          failureCount++;
          console.error(`🔴 Upload ${i + 1} failed:`, uploadResult.error);
        }

      } catch (error) {
        uploadResults.push({
          nupload_id: i + 1,
          nupload_status1: 'failed',
          img_url_returned: image.image_url,
          wp_img_id_returned: null
        });
        failureCount++;
        console.error(`🔴 Upload ${i + 1} exception:`, error);
      }
    }

    // Update narpi_pushes record with results
    const finalStatus = failureCount === 0 ? 'completed' : (successCount === 0 ? 'failed' : 'partial');
    
    await supabase
      .from('narpi_pushes')
      .update({
        push_status1: finalStatus,
        kareench1: uploadResults
      })
      .eq('id', newPush.id);

    console.log(`✅ Direct Narpi Push completed: ${successCount} successful, ${failureCount} failed`);
    
    return {
      success: true,
      uploaded_images: uploadResults.filter(r => r.nupload_status1 === 'success'),
      narpi_record_id: newPush.id,
      total_uploads: uploadResults.length,
      successful_uploads: successCount,
      failed_uploads: failureCount
    };

  } catch (error) {
    console.error('💥 Direct Narpi Push error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Narpi push failed'
    };
  }
}

// Helper function to upload image to WordPress (copied from sfunc_63_push_images)
async function uploadImageToWordPress(
  imageUrl: string,
  fileName: string,
  sitesprenData: any,
  apiKey: string,
  pushMethod: string
): Promise<{ success: boolean; wp_url?: string; wp_image_id?: number; error?: string }> {
  try {
    if (!sitesprenData || !sitesprenData.sitespren_base) {
      return { success: false, error: 'No sitespren site configured' };
    }

    const siteUrl = sitesprenData.sitespren_base.startsWith('http') 
      ? sitesprenData.sitespren_base 
      : `https://${sitesprenData.sitespren_base}`;

    // Use WordPress plugin connection with user API key
    return await uploadViaWordPressPlugin(imageUrl, fileName, siteUrl, apiKey);

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown upload error' 
    };
  }
}

// Upload via WordPress plugin connection (copied from sfunc_63_push_images)
async function uploadViaWordPressPlugin(
  imageUrl: string,
  fileName: string,
  siteUrl: string,
  apiKey: string
): Promise<{ success: boolean; wp_url?: string; wp_image_id?: number; error?: string }> {
  try {
    console.log(`🔄 WordPress Plugin upload: ${fileName} to ${siteUrl}`);

    // Download the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return { 
        success: false, 
        error: `Failed to download image: ${imageResponse.status} ${imageResponse.statusText}` 
      };
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    console.log(`✅ Downloaded image: ${imageBuffer.byteLength} bytes`);

    // Prepare WordPress plugin upload endpoint
    const wpPluginUrl = `${siteUrl}/wp-json/snefuru/v1/upload-image`;
    
    // Create FormData for multipart upload
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, fileName);
    formData.append('filename', fileName);
    formData.append('api_key', apiKey);

    console.log(`🔄 Uploading to WordPress Plugin: ${wpPluginUrl}`);

    // Upload to WordPress via plugin
    const uploadResponse = await fetch(wpPluginUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Snefuru-RhinoReplace/1.0'
      }
    });

    const responseText = await uploadResponse.text();
    console.log(`📝 WordPress Plugin Response Status: ${uploadResponse.status}`);

    if (!uploadResponse.ok) {
      let errorMessage = `WordPress Plugin API error: ${uploadResponse.status}`;
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.code || errorMessage;
      } catch (e) {
        errorMessage = `${errorMessage} - ${responseText.substring(0, 200)}`;
      }

      return { 
        success: false, 
        error: errorMessage
      };
    }

    // Parse successful response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      return { 
        success: false, 
        error: 'Invalid JSON response from WordPress Plugin API' 
      };
    }

    if (!responseData.success) {
      return {
        success: false,
        error: responseData.message || 'Plugin upload failed for unknown reason'
      };
    }

    console.log(`✅ WordPress Plugin upload successful: ID ${responseData.data.attachment_id}`);

    return {
      success: true,
      wp_url: responseData.data.url,
      wp_image_id: responseData.data.attachment_id
    };

  } catch (error) {
    console.error('WordPress Plugin upload error:', error);
    return {
      success: false,
      error: `Plugin upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
        userData.ruplin_api_key_1
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

// Helper: Update WordPress page via Snefuruplin API
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
        'User-Agent': 'Snefuru-RhinoReplace/1.0'
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

// Helper: Escape string for regex
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}