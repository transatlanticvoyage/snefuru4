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

// Helper function to fetch live Elementor data from WordPress 
async function fetchLiveElementorData(siteUrl: string, postId: number): Promise<any> {
  try {
    const baseUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
    
    // First, try to fetch the current _elementor_data meta key using WordPress REST API
    const wpApiUrl = `${baseUrl}/wp-json/wp/v2/posts/${postId}?context=edit`;
    
    console.log(`🔄 Fetching live Elementor data from: ${wpApiUrl}`);
    
    const response = await fetch(wpApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.log(`❌ WordPress API failed: ${response.status}`);
      return null;
    }
    
    const postData = await response.json();
    
    // Check if the post has Elementor meta data
    if (postData.meta && postData.meta._elementor_data) {
      console.log(`✅ Found live _elementor_data with ${postData.meta._elementor_data.length} characters`);
      
      // Parse the Elementor data
      let elementorData;
      try {
        elementorData = typeof postData.meta._elementor_data === 'string' 
          ? JSON.parse(postData.meta._elementor_data) 
          : postData.meta._elementor_data;
      } catch (parseError) {
        console.log(`❌ Failed to parse live Elementor data:`, parseError);
        return null;
      }
      
      return elementorData;
    } else {
      console.log(`❌ No _elementor_data found in post meta`);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error fetching live Elementor data:', error);
    return null;
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

// Phase 2: ENHANCED CLIFF ARRANGEMENT with Safety Features
async function performCliffArrangement(
  supabase: any,
  gcon_piece_id: string,
  uploaded_images: ImageUploadResult[],
  user_id: string
): Promise<UpdateResult> {
  console.log(`🏔️ CLIFF ENHANCED: Starting safe arrangement for gcon_piece: ${gcon_piece_id}`);
  
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

    // ✅ SAFETY CHECK 1: Validate all image URLs before proceeding
    console.log(`🔍 CLIFF ENHANCED: Validating ${uploaded_images.length} image URLs...`);
    const urlsValid = await validateImageUrls(uploaded_images);
    if (!urlsValid) {
      return {
        success: false,
        replacements_made: 0,
        error: 'Image URL validation failed - aborting to prevent broken images'
      };
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
      return {
        success: false,
        replacements_made: 0,
        error: 'Gcon piece not found'
      };
    }

    // Check if regolith data exists
    if (!gconPiece.discovered_images_regolith) {
      return {
        success: false,
        replacements_made: 0,
        error: 'No regolith data found - please run f331 discovery first'
      };
    }

    console.log(`📄 CLIFF ENHANCED: Processing page: ${gconPiece.meta_title} (${gconPiece.asn_sitespren_base})`);
    console.log(`🎯 WordPress Post ID: ${gconPiece.g_post_id}`);

    // ✅ SAFETY CHECK 2: Create backup before any changes
    console.log(`💾 CLIFF ENHANCED: Creating backup of current Elementor data...`);
    const backup_id = await createElementorBackup(
      supabase,
      gcon_piece_id,
      gconPiece.pelementor_cached,
      'cliff_pre_update'
    );

    // Parse regolith data to find images to replace
    let regolithData;
    try {
      regolithData = typeof gconPiece.discovered_images_regolith === 'string' 
        ? JSON.parse(gconPiece.discovered_images_regolith)
        : gconPiece.discovered_images_regolith;
    } catch (e) {
      return {
        success: false,
        replacements_made: 0,
        error: 'Invalid regolith data format',
        backup_id
      };
    }

    const imagesToReplace = regolithData.discovered_images || [];
    console.log(`🔄 CLIFF ENHANCED: Found ${imagesToReplace.length} images to replace from regolith discovery`);
    
    // Debug: Show what regolith discovered
    imagesToReplace.forEach((img: any, index: number) => {
      console.log(`🔍 Regolith image ${index + 1}: ${img.url}`);
    });

    if (imagesToReplace.length === 0) {
      return {
        success: true,
        replacements_made: 0,
        backup_id,
        error: 'No images found to replace'
      };
    }

    // Create replacement mapping
    const replacementMap = createImageReplacementMap(imagesToReplace, uploaded_images);
    console.log(`🗺️ CLIFF ENHANCED: Created replacement map for ${Object.keys(replacementMap).length} images`);

    // ✅ SAFETY CHECK 3: Validate Elementor data structure before processing
    if (!validateElementorDataStructure(gconPiece.pelementor_cached)) {
      return {
        success: false,
        replacements_made: 0,
        error: 'Invalid Elementor data structure',
        backup_id
      };
    }

    // ✅ ENHANCED IMAGE REPLACEMENT with Fixed Widget Detection
    let updatedElementorData = gconPiece.pelementor_cached;
    let replacementsMade = 0;

    if (updatedElementorData) {
      console.log(`🔧 CLIFF ENHANCED: Starting safe image replacement with fixed widget detection...`);
      
      // Parse Elementor data for processing
      let parsedData;
      try {
        parsedData = typeof updatedElementorData === 'string' 
          ? JSON.parse(updatedElementorData) 
          : JSON.parse(JSON.stringify(updatedElementorData));
      } catch (e) {
        return {
          success: false,
          replacements_made: 0,
          error: 'Failed to parse Elementor data for processing',
          backup_id
        };
      }

      // Use enhanced replacement function with all fixes
      replacementsMade = replaceImagesInElementsFixed(parsedData, replacementMap);
      
      // Convert back to original format
      updatedElementorData = typeof gconPiece.pelementor_cached === 'string' 
        ? JSON.stringify(parsedData) 
        : parsedData;

      console.log(`🔧 CLIFF ENHANCED: Made ${replacementsMade} image replacements with property preservation`);
    }

    // ✅ SAFE WORDPRESS UPDATE with Rollback Protection
    let pageUpdated = false;
    if (replacementsMade > 0 && gconPiece.g_post_id) {
      console.log(`🚀 CLIFF ENHANCED: Performing safe WordPress update (${replacementsMade} replacements made)...`);
      
      pageUpdated = await updateWordPressSafe(
        gconPiece.asn_sitespren_base,
        gconPiece.g_post_id,
        updatedElementorData,
        userData.ruplin_api_key_1
      );
      
      if (!pageUpdated) {
        console.log(`❌ WordPress update failed - performing automatic rollback...`);
        const rollbackSuccess = await restoreFromBackup(
          supabase,
          backup_id,
          gconPiece.asn_sitespren_base,
          gconPiece.g_post_id,
          userData.ruplin_api_key_1
        );
        
        return {
          success: false,
          replacements_made: 0,
          error: 'WordPress update failed',
          backup_id,
          rollback_performed: rollbackSuccess
        };
      }
      
      console.log(`✅ CLIFF ENHANCED: WordPress update completed successfully`);
      console.log(`🌐 Check page at: https://${gconPiece.asn_sitespren_base}/?p=${gconPiece.g_post_id}`);
      
    } else if (replacementsMade === 0) {
      console.log(`⚠️ CLIFF ENHANCED: No image replacements made - no WordPress update needed`);
    } else {
      console.log(`⚠️ CLIFF ENHANCED: Missing post ID (${gconPiece.g_post_id}) - cannot update WordPress`);
    }

    // Update gcon_pieces with new elementor data (only if successful)
    if (replacementsMade > 0 && pageUpdated) {
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
      backup_id,
      replacement_details: Object.keys(replacementMap).map(oldUrl => ({
        old_url: oldUrl,
        new_wp_id: replacementMap[oldUrl].wp_img_id_returned,
        new_url: replacementMap[oldUrl].img_url_returned
      }))
    };

  } catch (error) {
    console.error('🏔️ CLIFF ENHANCED: Critical error:', error);
    
    // Attempt rollback if we have a backup
    if (backup_id) {
      console.log(`🔄 Attempting emergency rollback...`);
      await restoreFromBackup(supabase, backup_id, '', 0, '');
    }
    
    return {
      success: false,
      replacements_made: 0,
      error: error instanceof Error ? error.message : 'Cliff arrangement failed'
    };
  }
}
        
        try {
          // Auto-refresh by rediscovering images from current elementor data
          console.log(`🔍 Extracting current images from live Elementor data...`);
          
          const currentUrls = (updateResult as any).current_urls || [];
          const freshRegolithData = {
            discovered_images: currentUrls.map((url: string, index: number) => ({
              url: url,
              position: index + 1,
              image_metadata: {
                // Extract basic info from URL
                filename: url.split('/').pop() || `image-${index + 1}`,
                discovered_at: new Date().toISOString()
              }
            })),
            discovery_metadata: {
              discovered_at: new Date().toISOString(),
              method: 'auto_refresh_from_stale_detection',
              total_images: currentUrls.length
            }
          };
          
          // Update the regolith data in the database
          const { error: updateError } = await supabase
            .from('gcon_pieces')
            .update({ 
              discovered_images_regolith: freshRegolithData,
              updated_at: new Date().toISOString()
            })
            .eq('id', gcon_piece_id);
          
          if (updateError) {
            throw new Error(`Failed to update regolith data: ${updateError.message}`);
          }
          
          console.log(`✅ Regolith refreshed with ${currentUrls.length} current images`);
          
          // Now retry the replacement with fresh data
          const newReplacementMap = createImageReplacementMap(
            freshRegolithData.discovered_images, 
            uploaded_images
          );
          
          const retryResult = await replaceImagesInElementorData(
            updatedElementorData,
            newReplacementMap,
            freshRegolithData.discovered_images,
            supabase,
            gcon_piece_id,
            gconPiece,  // sitespren data is in gconPiece.asn_sitespren_base
            gconPiece,
            uploaded_images
          );
          
          replacementsMade = retryResult.replacements_made;
          updatedElementorData = retryResult.data;
          
          console.log(`🔧 Retry with fresh regolith: ${replacementsMade} image replacements made`);
          
        } catch (refreshError) {
          console.error('Auto-refresh failed:', refreshError);
          return {
            success: false,
            message: `Stale regolith detected but auto-refresh failed. Please run f331 discovery manually first.`,
            error: `Auto-refresh error: ${refreshError}`,
            stale_regolith_urls: (updateResult as any).regolith_urls,
            current_urls: (updateResult as any).current_urls,
            replacements_made: 0,
            page_updated: false,
            elementor_updated: false
          };
        }
      }
    }

    // Update the WordPress page via Snefuruplin API - ONLY if actual replacements were made
    let pageUpdated = false;
    if (replacementsMade > 0 && gconPiece.g_post_id) {
      console.log(`🚀 Sending updated Elementor data to WordPress (${replacementsMade} replacements made)`);
      
      // Debug: Log what we're sending to WordPress
      const dataPreview = typeof updatedElementorData === 'string' 
        ? updatedElementorData.substring(0, 500)
        : JSON.stringify(updatedElementorData).substring(0, 500);
      console.log(`🔍 WordPress Update Preview: ${dataPreview}...`);
      
      // Check if the replaced URLs are actually in the data we're sending
      const dataString = typeof updatedElementorData === 'string' 
        ? updatedElementorData 
        : JSON.stringify(updatedElementorData);
        
      const newImageUrls = uploaded_images.map(img => img.img_url_returned);
      const foundNewUrls = newImageUrls.filter(url => dataString.includes(url));
      console.log(`🔍 New image URLs in updated data: ${foundNewUrls.length}/${newImageUrls.length}`);
      foundNewUrls.forEach(url => console.log(`  ✅ Found: ${url}`));
      
      const missingUrls = newImageUrls.filter(url => !dataString.includes(url));
      missingUrls.forEach(url => console.log(`  ❌ Missing: ${url}`));
      
      pageUpdated = await updateWordPressPage(
        gconPiece.asn_sitespren_base,
        gconPiece.g_post_id,
        updatedElementorData,
        userData.ruplin_api_key_1
      );
      
      if (pageUpdated) {
        console.log(`✅ WordPress update completed - changes should be visible on frontend`);
        console.log(`🌐 Check page at: https://${gconPiece.asn_sitespren_base}/?p=${gconPiece.g_post_id}`);
      } else {
        console.log(`❌ WordPress update failed - changes will not be visible`);
      }
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

// Helper: Replace images in Elementor data with proper JSON traversal
async function replaceImagesInElementorData(
  elementorData: any,
  replacementMap: Record<string, ImageUploadResult>,
  regolithImages: any[] = [],
  supabase?: any,
  gcon_piece_id?: string,
  sitesprenData?: any,
  gconPieceData?: any,
  uploadedImages?: ImageUploadResult[]
): Promise<{ data: any, replacements_made: number }> {
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

  // Check if regolith data seems stale (few URLs match current data)
  const regolithUrls = Object.keys(replacementMap);
  const matchingUrls = regolithUrls.filter(url => dataString.includes(url));
  const matchPercentage = regolithUrls.length > 0 ? (matchingUrls.length / regolithUrls.length) * 100 : 0;
  
  console.log(`🔍 Regolith match analysis: ${matchingUrls.length}/${regolithUrls.length} URLs match (${matchPercentage.toFixed(1)}%)`);
  
  // If less than 30% of regolith URLs match current data, consider it stale
  if (matchPercentage < 30 && regolithUrls.length > 0) {
    console.log(`⚠️ STALE REGOLITH DETECTED: Only ${matchPercentage.toFixed(1)}% of regolith URLs match current Elementor data`);
    console.log(`🔄 Regolith URLs: ${regolithUrls.join(', ')}`);
    console.log(`🔄 Current URLs sample: ${(urlMatches || []).slice(0, 3).join(', ')}`);
    console.log(`🔄 Matching URLs: ${matchingUrls.join(', ')}`);
    
    // Return early with suggestion to refresh regolith (the live data fetch approach will handle this)
    return {
      data: elementorData,
      replacements_made: 0,
      stale_regolith: true,
      regolith_urls: regolithUrls,
      current_urls: urlMatches || []
    };
  }

  // Alternative approach: If low match rate, try fetching live Elementor data instead of regolith refresh
  if (matchPercentage < 50 && regolithUrls.length > 0) {
    console.log(`⚠️ LOW MATCH RATE DETECTED: Only ${matchPercentage.toFixed(1)}% match - trying live Elementor data fetch`);
    try {
      // Fetch current live Elementor data directly from WordPress
      const liveElementorData = await fetchLiveElementorData(sitesprenData?.asn_sitespren_base || '', gconPieceData?.g_post_id || 0);
      if (liveElementorData) {
        console.log(`✅ Successfully fetched live Elementor data`);
        
        // Extract current image URLs from live data  
        const liveDataString = JSON.stringify(liveElementorData);
        const liveUrlMatches = liveDataString.match(/https?:\/\/[^\\s"',}]+\.(jpg|jpeg|png|gif|webp)/gi);
        
        console.log(`🔍 Live page URLs: ${(liveUrlMatches || []).slice(0, 5).join(', ')}`);
        
        if (liveUrlMatches && liveUrlMatches.length >= uploadedImages.length) {
          // Create new replacement map using live URLs (in order)
          const liveReplacementMap: { [key: string]: ImageUploadResult } = {};
          uploadedImages.forEach((uploadedImage, index) => {
            if (liveUrlMatches[index]) {
              liveReplacementMap[liveUrlMatches[index]] = uploadedImage;
            }
          });
          
          console.log(`🔄 Created live replacement map with ${Object.keys(liveReplacementMap).length} mappings`);
          console.log(`🔄 Live URLs to replace: ${Object.keys(liveReplacementMap).join(', ')}`);
          
          // Use live replacement map instead
          let liveReplacementsMade = 0;
          Object.keys(liveReplacementMap).forEach(oldUrl => {
            const newImage = liveReplacementMap[oldUrl];
            if (!newImage.img_url_returned || !newImage.wp_img_id_returned) {
              console.log(`⚠️ Skipping incomplete replacement for ${oldUrl}`);
              return;
            }

            console.log(`🔄 Processing live replacement: ${oldUrl} -> ${newImage.img_url_returned}`);
            
            const count = replaceImagesInElements(parsedData, oldUrl, newImage, newImage.wp_img_id_returned);
            liveReplacementsMade += count;
            
            console.log(`✅ Made ${count} replacements for ${oldUrl}`);
            
            if (count === 0) {
              console.log(`🔍 No exact matches found for ${oldUrl}, trying fuzzy matching...`);
              const fuzzyCount = tryFuzzyImageReplacement(parsedData, oldUrl, newImage, newImage.wp_img_id_returned);
              liveReplacementsMade += fuzzyCount;
              console.log(`🔍 Fuzzy matching made ${fuzzyCount} additional replacements`);
            }
          });
          
          if (liveReplacementsMade > 0) {
            console.log(`✅ Live data approach successful: ${liveReplacementsMade} replacements made`);
            return {
              data: Array.isArray(parsedData) ? parsedData : [parsedData],
              replacements_made: liveReplacementsMade
            };
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to fetch live Elementor data:`, error);
    }
  }

  // Process each replacement with structured approach (original regolith data)
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
    
    // If no exact matches found, try fuzzy matching
    if (count === 0) {
      console.log(`🔍 No exact matches found for ${oldUrl}, trying fuzzy matching...`);
      const fuzzyCount = tryFuzzyImageReplacement(parsedData, oldUrl, newImage, oldAttachmentId);
      replacementsMade += fuzzyCount;
      console.log(`🔍 Fuzzy matching made ${fuzzyCount} additional replacements`);
    }
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

// CLIFF ENHANCED: Recursive function to replace images in Elementor elements
// FIXES APPLIED:
// 1. Fixed image-carousel detection (carousel vs slides)
// 2. Added complete property preservation for all image objects
// 3. Enhanced logging for troubleshooting
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
    
    // FIXED: Check for image carousel widget (was looking for 'slides' instead of 'carousel')
    if (elements.widgetType === 'image-carousel' && elements.settings?.carousel) {
      if (Array.isArray(elements.settings.carousel)) {
        elements.settings.carousel.forEach((carouselItem: any) => {
          if (carouselItem.url === oldUrl) {
            carouselItem.url = newImage.img_url_returned;
            carouselItem.id = newImage.wp_img_id_returned;
            count++;
            console.log(`🖼️ CLIFF FIXED: Updated carousel image: ${oldUrl} -> ${newImage.img_url_returned}`);
          }
        });
      }
    }
    
    // Check for other slide-based widgets (keeping original logic for non-carousel widgets)
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

// CLIFF ENHANCED: Helper to replace background images in settings
// FIXES APPLIED:
// 1. Complete property preservation (alt, source, size, etc.)
// 2. Enhanced logging for debugging
// 3. Handles all background image variants
function replaceBackgroundImages(
  settings: any, 
  oldUrl: string, 
  newImage: ImageUploadResult,
  oldAttachmentId?: number
): number {
  let count = 0;
  
  // FIXED: Standard background image with property preservation
  if (settings.background_image?.url === oldUrl) {
    const preservedProps = { ...settings.background_image };
    settings.background_image = {
      ...preservedProps,
      url: newImage.img_url_returned,
      id: newImage.wp_img_id_returned
    };
    count++;
    console.log(`🎨 CLIFF FIXED: Updated background image with preserved properties: ${oldUrl} -> ${newImage.img_url_returned}`);
    console.log(`🎨 Preserved properties: ${Object.keys(preservedProps).join(', ')}`);
  }
  
  // FIXED: Section background with property preservation
  if (settings.background_background === 'classic' && settings.background_image?.url === oldUrl) {
    const preservedProps = { ...settings.background_image };
    settings.background_image = {
      ...preservedProps,
      url: newImage.img_url_returned,
      id: newImage.wp_img_id_returned
    };
    count++;
    console.log(`🎨 CLIFF FIXED: Updated section background with preserved properties`);
  }
  
  // FIXED: Overlay background with property preservation
  if (settings.background_overlay_image?.url === oldUrl) {
    const preservedProps = { ...settings.background_overlay_image };
    settings.background_overlay_image = {
      ...preservedProps,
      url: newImage.img_url_returned,
      id: newImage.wp_img_id_returned
    };
    count++;
    console.log(`🎨 CLIFF FIXED: Updated overlay background with preserved properties`);
  }
  
  // FIXED: Check all settings for any image references with property preservation
  Object.keys(settings).forEach(key => {
    if (typeof settings[key] === 'object' && settings[key]?.url === oldUrl) {
      const preservedProps = { ...settings[key] };
      settings[key] = {
        ...preservedProps,
        url: newImage.img_url_returned,
        id: newImage.wp_img_id_returned
      };
      count++;
      console.log(`🔧 CLIFF FIXED: Updated setting ${key} with preserved properties: ${oldUrl} -> ${newImage.img_url_returned}`);
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

// Fuzzy matching function for when exact URL matches fail
function tryFuzzyImageReplacement(
  parsedData: any,
  oldUrl: string,
  newImage: ImageUploadResult,
  oldAttachmentId?: number
): number {
  let count = 0;
  
  // Create variations of the URL to try
  const urlVariations = [
    oldUrl.replace('http://', 'https://'),
    oldUrl.replace('https://', 'http://'),
    oldUrl.replace(/^https?:\/\/[^\/]+/, ''), // Just the path part
    oldUrl.replace(/\/$/, ''), // Remove trailing slash
    oldUrl + '/', // Add trailing slash
    oldUrl.replace(/-\d+x\d+\.(jpg|jpeg|png|gif|webp)/, '.$1'), // Remove size suffix
    oldUrl.replace(/\.(jpg|jpeg|png|gif|webp)$/, '-150x150.$1'), // Try with size suffix
  ];
  
  // Try filename matching (last part of URL)
  const filename = oldUrl.split('/').pop()?.split('.')[0];
  if (filename) {
    const dataString = JSON.stringify(parsedData);
    const filenameRegex = new RegExp(`[^/]*${escapeRegExp(filename)}[^/]*\\.(jpg|jpeg|png|gif|webp)`, 'gi');
    const matches = dataString.match(filenameRegex);
    if (matches) {
      console.log(`🔍 Found potential filename matches: ${matches.join(', ')}`);
      // Try replacing with the first match found
      if (matches[0]) {
        const potentialUrl = matches[0];
        if (potentialUrl.includes('http')) {
          urlVariations.push(potentialUrl);
        }
      }
    }
  }
  
  // Try each variation
  for (const variation of urlVariations) {
    if (variation !== oldUrl) { // Don't retry the exact same URL
      const fuzzyCount = replaceImagesInElements(parsedData, variation, newImage, oldAttachmentId);
      if (fuzzyCount > 0) {
        console.log(`🎯 Fuzzy match successful: ${variation} -> ${newImage.img_url_returned} (${fuzzyCount} replacements)`);
        count += fuzzyCount;
      }
    }
  }
  
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
          'User-Agent': 'Snefuru-RhinoReplace/2.0'
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

// Helper: Escape string for regex
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}