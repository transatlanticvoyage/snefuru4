import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { tbn2_sfunc_create_image_with_openai } from './tbn2_sfunc_create_image_with_openai';
import sharp from 'sharp';
import { logger } from '@/lib/error-logger';

export async function POST(request: Request) {
  try {
    const { plan_id, image_slot, prompt, aiModel = 'openai', wipeMeta = true } = await request.json();
    
    // Validate required parameters
    if (!plan_id || !image_slot || !prompt) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required parameters: plan_id, image_slot, or prompt' 
      }, { status: 400 });
    }

    if (image_slot < 1 || image_slot > 4) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid image_slot. Must be between 1 and 4.' 
      }, { status: 400 });
    }

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Prompt must be a non-empty string' 
      }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not authenticated' 
      }, { status: 401 });
    }

    // Get user's DB id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();
      
    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Could not find user record' 
      }, { status: 400 });
    }

    // Get the plan and verify ownership
    const { data: planData, error: planError } = await supabase
      .from('images_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('rel_users_id', userData.id)
      .single();
      
    if (planError || !planData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Plan not found or access denied' 
      }, { status: 404 });
    }

    // Check if this image slot already has an image
    const imageFieldName = `fk_image${image_slot}_id`;
    if (planData[imageFieldName]) {
      return NextResponse.json({ 
        success: false, 
        message: `Image slot ${image_slot} already has an image` 
      }, { status: 400 });
    }

    // Check for recent generation attempts (prevent duplicates within 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    const { data: recentImages, error: recentError } = await supabase
      .from('images')
      .select('id')
      .eq('rel_images_plans_id', plan_id)
      .gte('created_at', thirtySecondsAgo)
      .limit(1);
      
    if (!recentError && recentImages && recentImages.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please wait 30 seconds between image generation attempts' 
      }, { status: 429 });
    }

    // Log the fetch single image attempt
    await logger.info({
      category: 'tbn2_single_image_fetch',
      message: `Starting single image fetch for plan ${plan_id}, slot ${image_slot}`,
      details: {
        planId: plan_id,
        imageSlot: image_slot,
        prompt: prompt.substring(0, 100) + '...',
        aiModel: aiModel,
        wipeMeta: wipeMeta,
        userId: userData.id
      },
      plan_id: plan_id
    });

    // Determine batch folder and plan folder structure
    let batchFolder = 'single_fetch_batch';
    let planFolder = `plan_${plan_id}`;
    
    // Try to find existing batch folder from related images
    const { data: existingImages } = await supabase
      .from('images')
      .select('img_file_url1')
      .eq('rel_images_plans_id', plan_id)
      .limit(1);
      
    if (existingImages && existingImages.length > 0) {
      const existingUrl = existingImages[0].img_file_url1;
      if (existingUrl && typeof existingUrl === 'string') {
        // Extract batch folder from existing URL
        // Expected format: .../barge1/BATCH_FOLDER/PLAN_FOLDER/filename
        const urlParts = existingUrl.split('/');
        const bargeIndex = urlParts.findIndex(part => part === 'barge1');
        if (bargeIndex >= 0 && bargeIndex + 2 < urlParts.length) {
          batchFolder = urlParts[bargeIndex + 1];
          planFolder = urlParts[bargeIndex + 2];
        }
      }
    } else {
      // No existing images, create folder based on plan data
      if (planData.submission_order) {
        const baseFileName = planData.e_file_name1 && typeof planData.e_file_name1 === 'string' && planData.e_file_name1.trim() 
          ? planData.e_file_name1.trim().replace(/[^a-zA-Z0-9._-]/g, '_')
          : `image_${planData.submission_order}.png`;
        planFolder = `${planData.submission_order} - ${baseFileName}`;
      }
    }

    // Generate unique filename for this image slot
    let imageFileName = planData.e_file_name1 && typeof planData.e_file_name1 === 'string' && planData.e_file_name1.trim()
      ? planData.e_file_name1.trim().replace(/[^a-zA-Z0-9._-]/g, '_')
      : `image_${plan_id}_slot_${image_slot}.png`;
      
    // Add slot suffix if not slot 1
    if (image_slot > 1) {
      const extIdx = imageFileName.lastIndexOf('.');
      if (extIdx > 0) {
        imageFileName = imageFileName.slice(0, extIdx) + `-${image_slot}` + imageFileName.slice(extIdx);
      } else {
        imageFileName = imageFileName + `-${image_slot}`;
      }
    }

    try {
      // Generate image using the specified AI model
      const imageResult = await tbn2_sfunc_create_image_with_openai({
        prompt: prompt.trim(),
        userId: userData.id,
        batchFolder: `${batchFolder}/${planFolder}`,
        fileName: imageFileName,
        aiModel: aiModel,
        wipeMeta: wipeMeta
      });

      if (!imageResult.success) {
        await logger.error({
          category: 'tbn2_single_image_fetch',
          message: `Failed to generate image for plan ${plan_id}, slot ${image_slot}`,
          details: {
            error: imageResult.error,
            planId: plan_id,
            imageSlot: image_slot,
            prompt: prompt.substring(0, 100) + '...',
            batchFolder: `${batchFolder}/${planFolder}`,
            fileName: imageFileName
          },
          plan_id: plan_id
        });
        
        return NextResponse.json({ 
          success: false, 
          message: `Failed to generate image: ${imageResult.error}` 
        }, { status: 500 });
      }

      // Insert image into images table
      const { data: imageInsert, error: imageError } = await supabase
        .from('images')
        .insert({
          rel_users_id: userData.id,
          rel_images_plans_id: plan_id,
          img_file_url1: imageResult.url,
          img_file_extension: 'png',
          img_file_size: null,
          width: 1024,
          height: 1024,
          prompt1: prompt.trim(),
          status: 'completed',
          function_used_to_fetch_the_image: aiModel,
        })
        .select('id')
        .single();
        
      if (imageError || !imageInsert) {
        await logger.error({
          category: 'tbn2_single_image_fetch',
          message: `Failed to insert image record for plan ${plan_id}, slot ${image_slot}`,
          details: {
            error: imageError?.message || 'No insert data returned',
            imageUrl: imageResult.url,
            planId: plan_id,
            imageSlot: image_slot
          },
          plan_id: plan_id
        });
        
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to save image record to database' 
        }, { status: 500 });
      }

      // Update the plan with the new image ID
      const updateObj = { [imageFieldName]: imageInsert.id };
      const { error: updateError } = await supabase
        .from('images_plans')
        .update(updateObj)
        .eq('id', plan_id);
        
      if (updateError) {
        await logger.error({
          category: 'tbn2_single_image_fetch',
          message: `Failed to update plan ${plan_id} with image ID for slot ${image_slot}`,
          details: {
            error: updateError.message,
            planId: plan_id,
            imageSlot: image_slot,
            imageId: imageInsert.id,
            updateField: imageFieldName
          },
          plan_id: plan_id
        });
        
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to update plan with image reference' 
        }, { status: 500 });
      }

      await logger.info({
        category: 'tbn2_single_image_fetch',
        message: `Successfully generated and saved image for plan ${plan_id}, slot ${image_slot}`,
        details: {
          planId: plan_id,
          imageSlot: image_slot,
          imageId: imageInsert.id,
          imageUrl: imageResult.url,
          storagePath: `barge1/${batchFolder}/${planFolder}/${imageFileName}`
        },
        plan_id: plan_id
      });

      return NextResponse.json({
        success: true,
        message: `Image ${image_slot} generated successfully`,
        image_id: imageInsert.id,
        image_url: imageResult.url,
        plan_id: plan_id,
        image_slot: image_slot
      });

    } catch (generationError) {
      await logger.error({
        category: 'tbn2_single_image_fetch',
        message: `Unexpected error during image generation for plan ${plan_id}, slot ${image_slot}`,
        details: {
          error: generationError instanceof Error ? generationError.message : String(generationError),
          planId: plan_id,
          imageSlot: image_slot,
          prompt: prompt.substring(0, 100) + '...'
        },
        plan_id: plan_id,
        stack_trace: generationError instanceof Error ? generationError.stack : undefined
      });
      
      return NextResponse.json({ 
        success: false, 
        message: `Unexpected error during image generation: ${generationError instanceof Error ? generationError.message : 'Unknown error'}` 
      }, { status: 500 });
    }

  } catch (error) {
    await logger.error({
      category: 'tbn2_single_image_fetch',
      message: 'Failed to process single image fetch request',
      details: {
        error: error instanceof Error ? error.message : String(error)
      },
      stack_trace: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}