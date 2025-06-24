import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface ImageUploadResult {
  nupload_id: number;
  nupload_status1: string;
  img_url_returned: string;
  wp_img_id_returned: number | null;
}

interface ImageRecord {
  id: string;
  image_url: string;
  file_name: string | null;
}

interface PlanRecord {
  id: string;
  fk_image1_id: string;
  images1: ImageRecord | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batch_id, sitespren_id, selected_plan_ids, push_method } = body;

    if (!batch_id || !sitespren_id || !selected_plan_ids || !push_method) {
      return NextResponse.json(
        { error: 'Missing required fields: batch_id, sitespren_id, selected_plan_ids, push_method' },
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

    // Get the authenticated user to satisfy RLS policy
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log('🔍 Debug - Authenticated user:', { id: user.id, email: user.email });

    // Get the database user ID and API key for authentication
    const { data: dbUser, error: dbUserError } = await supabase
      .from('users')
      .select('id, ruplin_api_key_1')
      .eq('auth_id', user.id)
      .single();

    if (dbUserError || !dbUser) {
      console.error('Database user lookup error:', dbUserError);
      return NextResponse.json(
        { error: 'Database user record not found' },
        { status: 404 }
      );
    }

    if (!dbUser.ruplin_api_key_1) {
      return NextResponse.json(
        { error: 'User API key not configured' },
        { status: 401 }
      );
    }

    console.log('🔍 Debug - Database user:', { auth_id: user.id, db_id: dbUser.id, has_api_key: !!dbUser.ruplin_api_key_1 });

    // Step 1: Get sitespren data for the target site
    const { data: sitesprenData, error: sitesprenError } = await supabase
      .from('sitespren')
      .select('id, sitespren_base, true_root_domain')
      .eq('id', sitespren_id)
      .single();

    if (sitesprenError || !sitesprenData) {
      console.error('Supabase sitespren query error:', sitesprenError);
      return NextResponse.json(
        { error: `Sitespren site not found or access denied: ${sitesprenError?.message || 'Unknown error'}` },
        { status: 404 }
      );
    }

    // Step 2: Validate batch exists and user has access
    const { data: batchData, error: batchError } = await supabase
      .from('images_plans_batches')
      .select('id, rel_users_id')
      .eq('id', batch_id)
      .eq('rel_users_id', dbUser.id)
      .single();

    if (batchError || !batchData) {
      console.error('Supabase batch query error:', batchError);
      return NextResponse.json(
        { error: `Batch not found or access denied: ${batchError?.message || 'Unknown error'}` },
        { status: 404 }
      );
    }

    // Step 3: Get selected images_plans (image 1 only) 
    const { data: plansData, error: plansError } = await supabase
      .from('images_plans')
      .select('id, fk_image1_id, e_file_name1')
      .eq('rel_images_plans_batches_id', batch_id)
      .in('id', selected_plan_ids)
      .not('fk_image1_id', 'is', null);

    if (plansError) {
      console.error('Supabase plans query error:', plansError);
      return NextResponse.json(
        { error: `Failed to fetch plans data: ${plansError.message || plansError.code || 'Unknown error'}` },
        { status: 500 }
      );
    }

    if (!plansData || plansData.length === 0) {
      return NextResponse.json(
        { error: 'No images found for the selected plans' },
        { status: 404 }
      );
    }

    if (plansData.length !== selected_plan_ids.length) {
      console.warn(`⚠️ Warning: Found ${plansData.length} plans but expected ${selected_plan_ids.length}`);
    }

    // Step 2b: Get the image details for each plan
    const imageIds = plansData.map(plan => plan.fk_image1_id);
    const { data: imagesData, error: imagesError } = await supabase
      .from('images')
      .select('id, img_file_url1')
      .in('id', imageIds);

    if (imagesError) {
      console.error('Supabase images query error:', imagesError);
      return NextResponse.json(
        { error: `Failed to fetch images data: ${imagesError.message || imagesError.code || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Combine plans with their images
    const plansWithImages = plansData.map(plan => {
      const image = imagesData?.find(img => img.id === plan.fk_image1_id);
      return {
        ...plan,
        images1: image ? {
          id: image.id,
          image_url: image.img_file_url1,
          file_name: plan.e_file_name1 || null // Use e_file_name1 from images_plans
        } : null
      };
    });

    const typedPlansData = plansWithImages as unknown as PlanRecord[];

    // Debug logging to understand the data structure
    console.log('🔍 Debug - Push data structure:', {
      batch_id: batchData.id,
      sitespren_id: sitesprenData.id,
      sitespren_base: sitesprenData.sitespren_base,
      true_root_domain: sitesprenData.true_root_domain,
      selected_plans_count: selected_plan_ids.length,
      found_plans_count: plansData.length,
      has_api_key: !!dbUser.ruplin_api_key_1
    });

    // Step 4: Create narpi_pushes record
    const insertData = {
      push_name: `Push ${new Date().toISOString().split('T')[0]} - ${sitesprenData.sitespren_base}`,
      push_desc: `Automated image push to ${sitesprenData.sitespren_base} using ${push_method} method (${selected_plan_ids.length} selected images)`,
      push_status1: 'processing',
      fk_batch_id: batch_id,
      kareench1: []
    };

    console.log('🔍 Debug - narpi_pushes insert data:', insertData);

    const { data: newPush, error: pushError } = await supabase
      .from('narpi_pushes')
      .insert(insertData)
      .select()
      .single();

    if (pushError || !newPush) {
      console.error('Supabase narpi_pushes insert error:', pushError);
      return NextResponse.json(
        { error: `Failed to create push record: ${pushError?.message || pushError?.code || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Step 5: Upload images to WordPress
    const uploadResults: ImageUploadResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < typedPlansData.length; i++) {
      const plan = typedPlansData[i];
      const image = plan.images1;

      if (!image || !image.image_url) {
        const failResult: ImageUploadResult = {
          nupload_id: i + 1,
          nupload_status1: 'failed',
          img_url_returned: '',
          wp_img_id_returned: null
        };
        uploadResults.push(failResult);
        failureCount++;
        continue;
      }

      try {
        // Upload image to WordPress using sitespren data
        const uploadResult = await uploadImageToWordPress(
          image.image_url,
          image.file_name || `image-${i + 1}.jpg`,
          sitesprenData,
          dbUser.ruplin_api_key_1,
          push_method
        );

        const result: ImageUploadResult = {
          nupload_id: i + 1,
          nupload_status1: uploadResult.success ? 'success' : 'failed',
          img_url_returned: uploadResult.wp_url || image.image_url,
          wp_img_id_returned: uploadResult.wp_image_id || null
        };

        // Add error message to failed uploads for debugging
        if (!uploadResult.success && uploadResult.error) {
          console.error(`Upload ${i + 1} failed:`, uploadResult.error);
          // Add error to the result (we'll need to update the interface)
          (result as any).error_message = uploadResult.error;
        }

        uploadResults.push(result);

        if (uploadResult.success) {
          successCount++;
        } else {
          failureCount++;
        }

      } catch (error) {
        const failResult: ImageUploadResult = {
          nupload_id: i + 1,
          nupload_status1: 'failed',
          img_url_returned: image.image_url,
          wp_img_id_returned: null
        };
        
        // Add error message for debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Upload ${i + 1} exception:`, errorMessage);
        (failResult as any).error_message = errorMessage;
        
        uploadResults.push(failResult);
        failureCount++;
      }
    }

    // Step 6: Update narpi_pushes record with results
    const finalStatus = failureCount === 0 ? 'completed' : (successCount === 0 ? 'failed' : 'partial');
    
    const { error: updateError } = await supabase
      .from('narpi_pushes')
      .update({
        push_status1: finalStatus,
        kareench1: uploadResults
      })
      .eq('id', newPush.id);

    if (updateError) {
      console.error('Failed to update push record:', updateError);
    }

    // Step 7: Return results
    return NextResponse.json({
      success: true,
      message: `Image push completed: ${successCount} successful, ${failureCount} failed`,
      push_id: newPush.id,
      results: {
        total_images: typedPlansData.length,
        successful_uploads: successCount,
        failed_uploads: failureCount,
        final_status: finalStatus,
        upload_details: uploadResults
      }
    });

  } catch (error) {
    console.error('Error in func_63_push_images:', error);
    return NextResponse.json(
      { error: 'Internal server error during image push process' },
      { status: 500 }
    );
  }
}

// Helper function to upload image to WordPress
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

    if (pushMethod === 'wp_plugin' || pushMethod === 'tebnar2_sitespren_push') {
      // Use WordPress plugin connection with user API key
      return await uploadViaWordPressPlugin(imageUrl, fileName, siteUrl, apiKey);

    } else {
      return { success: false, error: 'Invalid push method specified. Only wp_plugin method is supported for sitespren pushes.' };
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown upload error' 
    };
  }
}

// Upload via WordPress plugin connection
async function uploadViaWordPressPlugin(
  imageUrl: string,
  fileName: string,
  siteUrl: string,
  apiKey: string
): Promise<{ success: boolean; wp_url?: string; wp_image_id?: number; error?: string }> {
  try {
    console.log(`🔄 Starting WordPress Plugin upload: ${fileName} to ${siteUrl}`);

    // Step 1: Download the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return { 
        success: false, 
        error: `Failed to download image: ${imageResponse.status} ${imageResponse.statusText}` 
      };
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    console.log(`✅ Downloaded image: ${imageBuffer.byteLength} bytes`);

    // Step 2: Prepare WordPress plugin upload endpoint
    const wpPluginUrl = `${siteUrl}/wp-json/snefuru/v1/upload-image`;
    
    // Step 3: Create FormData for multipart upload
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, fileName);
    formData.append('filename', fileName);
    
    // Add metadata if available
    // These would come from the calling function's context
    // formData.append('batch_id', batchId);
    // formData.append('plan_id', planId);

    console.log(`🔄 Uploading to WordPress Plugin: ${wpPluginUrl}`);
    console.log(`🔑 Using API key: ${apiKey?.substring(0, 8)}...`);

    // Step 4: Upload to WordPress via plugin
    const uploadResponse = await fetch(wpPluginUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'Snefuru-NextJS-App/1.0'
        // Don't set Content-Type - let the browser set it with boundary for FormData
      }
    });

    const responseText = await uploadResponse.text();
    console.log(`📝 WordPress Plugin Response Status: ${uploadResponse.status}`);
    console.log(`📝 WordPress Plugin Response: ${responseText.substring(0, 500)}...`);

    // Step 5: Handle response
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

    // Step 6: Parse successful response
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