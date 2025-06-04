import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import sharp from 'sharp';

// Helper function to create a timeout promise
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

// Helper function for retry logic
const withRetry = async <T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3, 
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Retry attempt ${attempt}/${maxRetries} failed, waiting ${delay}ms before next retry`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Unknown retry error');
};

// Helper function for metadata stripping
const processMetadataStripping = async (imageBuffer: ArrayBuffer): Promise<ArrayBuffer> => {
  const inputBuffer = Buffer.from(imageBuffer);
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();
  
  console.log('📊 Original image metadata:', {
    format: metadata.format,
    hasExif: !!metadata.exif,
    hasIcc: !!metadata.icc,
    hasIptc: !!metadata.iptc,
    hasXmp: !!metadata.xmp,
    originalSize: inputBuffer.length
  });
  
  // Reprocess the image based on its format to strip metadata
  let outputBuffer: Buffer;
  if (metadata.format === 'jpeg') {
    outputBuffer = await image.jpeg().toBuffer();
  } else if (metadata.format === 'png') {
    outputBuffer = await image.png().toBuffer();
  } else if (metadata.format === 'webp') {
    outputBuffer = await image.webp().toBuffer();
  } else {
    // Default to PNG for unknown formats
    outputBuffer = await image.png().toBuffer();
  }
  
  const processedBuffer = outputBuffer.buffer.slice(outputBuffer.byteOffset, outputBuffer.byteOffset + outputBuffer.byteLength) as ArrayBuffer;
  
  console.log('✅ Metadata stripped successfully:', {
    originalSize: inputBuffer.length,
    processedSize: outputBuffer.length,
    reduction: inputBuffer.length - outputBuffer.length,
    format: metadata.format
  });
  
  return processedBuffer;
};

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting sfunc_fetch_single_image API call');
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required' 
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Get request data
    const { plan_id, image_slot, prompt, aiModel, wipeMeta = true } = await request.json();
    console.log('📥 Request data:', { plan_id, image_slot, prompt: prompt?.substring(0, 100) + '...', aiModel, wipeMeta });
    console.log('🧹 WIPE META DEBUG:', {
      wipeMeta,
      timestamp: new Date().toISOString(),
      plan_id,
      imageSlot: image_slot
    });
    
    if (!plan_id || !image_slot || !prompt) {
      console.error('❌ Missing required fields:', { plan_id, image_slot, prompt: !!prompt });
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: plan_id, image_slot, prompt' 
      }, { status: 400 });
    }

    // Check for recent generation to avoid duplicates
    const { data: recentImage } = await supabase
      .from('images')
      .select('created_at')
      .eq('rel_images_plans_id', plan_id)
      .gte('created_at', new Date(Date.now() - 30000).toISOString()) // Last 30 seconds
      .limit(1);
      
    if (recentImage && recentImage.length > 0) {
      console.log('⏳ Recent image generation detected, skipping duplicate request');
      return NextResponse.json({ 
        success: false, 
        message: 'Image was recently generated, please wait 30 seconds before retrying' 
      }, { status: 429 });
    }

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      console.error('❌ User not found in database:', userError);
      return NextResponse.json({ 
        success: false, 
        message: 'User not found in database' 
      }, { status: 404 });
    }

    console.log('✅ User database ID:', userData.id);

    // Verify the plan belongs to this user
    const { data: planData, error: planError } = await supabase
      .from('images_plans')
      .select('id, fk_image1_id, fk_image2_id, fk_image3_id, fk_image4_id, rel_images_plans_batches_id, e_file_name1, submission_order')
      .eq('id', plan_id)
      .eq('rel_users_id', userData.id)
      .single();

    if (planError || !planData) {
      console.error('❌ Plan not found or access denied:', planError);
      return NextResponse.json({ 
        success: false, 
        message: 'Plan not found or access denied' 
      }, { status: 404 });
    }

    console.log('✅ Plan found:', planData);

    // Check if image already exists for this slot (with proper typing)
    const imageField = image_slot === 1 ? planData.fk_image1_id :
                      image_slot === 2 ? planData.fk_image2_id :
                      image_slot === 3 ? planData.fk_image3_id :
                      image_slot === 4 ? planData.fk_image4_id : null;
                      
    if (imageField) {
      console.log('⚠️ Image already exists for slot:', image_slot);
      return NextResponse.json({ 
        success: false, 
        message: `Image already exists for slot ${image_slot}` 
      }, { status: 400 });
    }

    // Generate a single image using OpenAI
    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
      console.error('❌ OpenAI API key not configured');
      return NextResponse.json({ 
        success: false, 
        message: 'OpenAI API key not configured' 
      }, { status: 500 });
    }

    console.log('🎨 Generating image with OpenAI (with retry logic)...');
    console.log('Model:', aiModel || 'dall-e-3');
    console.log('Prompt:', prompt);

    try {
      // Step 2: Generate image with OpenAI (with timeout and retry)
      const imageData = await withRetry(async () => {
        return await withTimeout(
          fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: aiModel === 'openai' ? 'dall-e-3' : 'dall-e-3', // Map openai to dall-e-3
              prompt: prompt,
              n: 1,
              size: '1024x1024',
              quality: 'standard',
              response_format: 'url'
            })
          }).then(async (response) => {
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
            }
            return response.json();
          }),
          60000 // 60 second timeout for OpenAI API
        );
      }, 3, 2000); // 3 retries with 2s base delay

      console.log('🎨 OpenAI response data:', imageData);
      
      const imageUrl = imageData.data[0]?.url;

      if (!imageUrl) {
        console.error('❌ No image URL returned from OpenAI');
        return NextResponse.json({ 
          success: false, 
          message: 'No image URL returned from OpenAI' 
        }, { status: 500 });
      }

      console.log('✅ Image generated successfully:', imageUrl);

      // Step 2.5: Download the image from OpenAI (with timeout and retry)
      console.log('📥 Downloading image from OpenAI (with retry logic)...');
      const imageBuffer = await withRetry(async () => {
        const imageRes = await withTimeout(
          fetch(imageUrl),
          30000 // 30 second timeout for image download
        );
        
        if (!imageRes.ok) {
          throw new Error(`Failed to download image: ${imageRes.status} ${imageRes.statusText}`);
        }
        
        return await withTimeout(
          imageRes.arrayBuffer(),
          30000 // 30 second timeout for reading buffer
        );
      }, 3, 1000); // 3 retries with 1s base delay

      console.log('✅ Image downloaded successfully, size:', imageBuffer.byteLength);

      // Step 2.6: Strip metadata if requested (with retry and timeout)
      let processedBuffer = imageBuffer;
      if (wipeMeta) {
        console.log('🧹 Stripping metadata from downloaded image (with retry logic)...');
        try {
          processedBuffer = await withRetry(async () => {
            return await withTimeout(
              processMetadataStripping(imageBuffer),
              30000 // 30 second timeout for metadata processing
            );
          }, 2, 1000); // 2 retries with 1s base delay
          
          console.log('✅ Metadata stripping completed successfully');
        } catch (metadataError) {
          console.error('⚠️ Failed to strip metadata after retries, using original image:', metadataError);
          // Continue with original buffer if metadata stripping fails after retries
        }
      } else {
        console.log('⏭️ Skipping metadata stripping (wipeMeta=false)');
      }

      // Step 3: Find the existing folder structure in Supabase Storage
      // The folder should have already been created during bulk generation
      const batchId = planData.rel_images_plans_batches_id;
      if (!batchId) {
        console.error('❌ Plan has no batch ID');
        return NextResponse.json({ 
          success: false, 
          message: 'Plan has no associated batch' 
        }, { status: 500 });
      }

      console.log('🔍 Searching for existing folder structure for batch:', batchId);

      // First, get all plans from this batch
      const { data: batchPlans, error: batchPlansError } = await supabase
        .from('images_plans')
        .select('id')
        .eq('rel_images_plans_batches_id', batchId);

      if (batchPlansError) {
        console.error('❌ Failed to query plans in batch:', batchPlansError);
        console.error('❌ Full error details:', JSON.stringify(batchPlansError, null, 2));
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to query plans in batch for folder detection' 
        }, { status: 500 });
      }

      if (!batchPlans || batchPlans.length === 0) {
        console.error('❌ No plans found in batch:', batchId);
        return NextResponse.json({ 
          success: false, 
          message: 'No plans found in the specified batch' 
        }, { status: 500 });
      }

      console.log('✅ Found', batchPlans.length, 'plans in batch');

      // Extract plan IDs
      const planIds = batchPlans.map(p => p.id);
      console.log('🔍 Looking for existing images from plan IDs:', planIds);

      // Find existing images from any plan in this batch
      const { data: existingImages, error: existingImagesError } = await supabase
        .from('images')
        .select('img_file_url1')
        .in('rel_images_plans_id', planIds)
        .not('img_file_url1', 'is', null)
        .limit(1);

      if (existingImagesError) {
        console.error('❌ Failed to query existing images:', existingImagesError);
        console.error('❌ Full error details:', JSON.stringify(existingImagesError, null, 2));
        console.error('❌ Query details - planIds:', planIds);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to query existing images for batch folder detection' 
        }, { status: 500 });
      }

      console.log('✅ Existing images query result:', existingImages?.length || 0, 'images found');

      let foundBatchFolder = null;
      let foundPlanFolder = null;

      if (existingImages && existingImages.length > 0) {
        // Extract batch folder from the first existing image URL
        const imageUrl = existingImages[0].img_file_url1;
        console.log('📁 Found existing image URL:', imageUrl);
        
        // Parse the URL to extract the batch folder
        // Expected format: .../bucket-images-b1/barge1/BATCH_FOLDER/PLAN_FOLDER/image.png
        const match = imageUrl.match(/barge1\/([^\/]+)\//);
        if (match) {
          // Decode URL-encoded characters in the folder name
          foundBatchFolder = decodeURIComponent(match[1]);
          console.log('✅ Extracted and decoded batch folder from existing image:', foundBatchFolder);
        } else {
          console.error('❌ Could not parse batch folder from image URL:', imageUrl);
          return NextResponse.json({ 
            success: false, 
            message: 'Could not parse batch folder from existing image URL' 
          }, { status: 500 });
        }
      } else {
        console.error('❌ No existing images found for batch:', batchId);
        return NextResponse.json({ 
          success: false, 
          message: 'Could not find existing batch folder. Make sure some images were generated in the original batch.' 
        }, { status: 500 });
      }

      // Now find the specific plan folder for this plan by checking existing images
      const { data: planImages } = await supabase
        .from('images')
        .select('img_file_url1')
        .eq('rel_images_plans_id', plan_id)
        .not('img_file_url1', 'is', null)
        .limit(1);

      if (planImages && planImages.length > 0) {
        // Extract plan folder from existing image for this plan
        const planImageUrl = planImages[0].img_file_url1;
        console.log('📁 Found existing image URL for this plan:', planImageUrl);
        
        // Parse the URL to extract the plan folder
        // Expected format: .../barge1/BATCH_FOLDER/PLAN_FOLDER/image.png
        const planMatch = planImageUrl.match(/barge1\/[^\/]+\/([^\/]+)\//);
        if (planMatch) {
          // Decode URL-encoded characters in the folder name
          foundPlanFolder = decodeURIComponent(planMatch[1]);
          console.log('✅ Found and decoded existing plan folder:', foundPlanFolder);
        }
      }

      // If we still haven't found the plan folder, we need to determine it from the plan sequence
      if (!foundPlanFolder) {
        console.log('📂 Plan folder not found, determining from stored submission order...');
        
        // Use the stored submission_order directly (this is the original submission order)
        let seq = planData.submission_order;
        
        // Fallback for plans created before submission_order feature
        if (!seq) {
          console.log('📂 No submission_order found, calculating from batch position (fallback for old plans)...');
          
          // Get all plans in this batch to determine sequence (fallback method)
          const { data: allPlansInBatch, error: plansError } = await supabase
            .from('images_plans')
            .select('id, created_at')
            .eq('rel_images_plans_batches_id', batchId)
            .order('created_at', { ascending: true });

          if (plansError || !allPlansInBatch) {
            console.error('❌ Failed to get plans in batch for sequence calculation');
            return NextResponse.json({ 
              success: false, 
              message: 'Failed to determine plan sequence (both submission_order and fallback method failed)' 
            }, { status: 500 });
          }

          // Find the sequence number (1-based index) of this plan in the batch
          const planIndex = allPlansInBatch.findIndex(p => p.id === plan_id);
          if (planIndex === -1) {
            console.error('❌ Plan not found in batch');
            return NextResponse.json({ 
              success: false, 
              message: 'Plan not found in its associated batch' 
            }, { status: 500 });
          }
          
          seq = planIndex + 1; // 1-based sequence
          console.log('📂 Calculated sequence from position:', seq);
        } else {
          console.log('📂 Using stored submission_order:', seq);
        }

        // Create base filename (same logic as bulk generation)
        let baseFileName = planData.e_file_name1 && typeof planData.e_file_name1 === 'string' && planData.e_file_name1.trim() 
          ? planData.e_file_name1.trim() 
          : `image_${seq}.png`;
        
        // Ensure the filename is safe (no path traversal)
        baseFileName = baseFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        // Create plan folder name: SEQ - FILENAME (same as bulk generation)
        foundPlanFolder = `${seq} - ${baseFileName}`;
        console.log('📂 Determined plan folder:', foundPlanFolder);
      }

      // Sanitize folder names to prevent invalid storage paths
      foundBatchFolder = foundBatchFolder.replace(/[<>:"/\\|?*%]/g, '_');
      foundPlanFolder = foundPlanFolder.replace(/[<>:"/\\|?*%]/g, '_');
      
      console.log('📂 Sanitized folder names:');
      console.log('📂 Batch folder:', foundBatchFolder);
      console.log('📂 Plan folder:', foundPlanFolder);

      // Create image filename with slot suffix if not slot 1 (same as bulk generation)
      let baseFileName = planData.e_file_name1 && typeof planData.e_file_name1 === 'string' && planData.e_file_name1.trim() 
        ? planData.e_file_name1.trim() 
        : `image_${image_slot}.png`;
      baseFileName = baseFileName.replace(/[^a-zA-Z0-9._-]/g, '_');

      let imageFileName = baseFileName;
      if (image_slot > 1) {
        const extIdx = baseFileName.lastIndexOf('.');
        if (extIdx > 0) {
          imageFileName = baseFileName.slice(0, extIdx) + `-${image_slot}` + baseFileName.slice(extIdx);
        } else {
          imageFileName = baseFileName + `-${image_slot}`;
        }
      }

      // Full storage path using the EXISTING folder structure
      const storagePath = `barge1/${foundBatchFolder}/${foundPlanFolder}/${imageFileName}`;
      
      console.log('📁 Using existing folder structure:');
      console.log('📁 Batch folder:', foundBatchFolder);
      console.log('📁 Plan folder:', foundPlanFolder);
      console.log('📁 Image filename:', imageFileName);
      console.log('📁 Full storage path:', storagePath);

      // Step 4: Upload to Supabase Storage
      const uploadController = new AbortController();
      const uploadTimeoutId = setTimeout(() => uploadController.abort(), 20000); // 20 second timeout

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bucket-images-b1')
        .upload(storagePath, processedBuffer, {
          contentType: 'image/png',
          upsert: false,
        });

      clearTimeout(uploadTimeoutId);

      if (uploadError) {
        console.error('❌ Failed to upload to Supabase Storage:', uploadError);
        return NextResponse.json({ 
          success: false, 
          message: `Failed to upload to storage: ${uploadError.message}` 
        }, { status: 500 });
      }

      // Step 5: Get the public URL from Supabase Storage
      const { data: publicUrlData } = supabase.storage
        .from('bucket-images-b1')
        .getPublicUrl(storagePath);

      const finalImageUrl = publicUrlData.publicUrl;
      console.log('✅ Image uploaded to storage successfully:', finalImageUrl);

      // Create image record in database
      console.log('💾 Saving image to database...');
      console.log('Image data to insert:', {
        rel_users_id: userData.id,
        rel_images_plans_id: plan_id,
        img_file_url1: finalImageUrl,
        prompt1: prompt,
        status: 'generated',
        img_file_extension: 'png',
        img_file_size: processedBuffer.byteLength,
        width: 1024,
        height: 1024
      });
      
      const { data: newImage, error: imageError } = await supabase
        .from('images')
        .insert({
          rel_users_id: userData.id,
          rel_images_plans_id: plan_id,
          img_file_url1: finalImageUrl,
          prompt1: prompt,
          status: 'generated',
          img_file_extension: 'png',
          img_file_size: processedBuffer.byteLength,
          width: 1024,
          height: 1024
        })
        .select()
        .single();

      if (imageError || !newImage) {
        console.error('❌ Failed to save image to database:', imageError);
        console.error('❌ Detailed error:', JSON.stringify(imageError, null, 2));
        return NextResponse.json({ 
          success: false, 
          message: `Failed to save image to database: ${imageError?.message || 'Unknown error'}`,
          details: imageError
        }, { status: 500 });
      }

      console.log('✅ Image saved to database:', newImage.id);

      // Update the plan with the new image
      const updateField = image_slot === 1 ? 'fk_image1_id' :
                         image_slot === 2 ? 'fk_image2_id' :
                         image_slot === 3 ? 'fk_image3_id' :
                         'fk_image4_id';

      console.log('🔗 Updating plan with new image...');
      const { error: updateError } = await supabase
        .from('images_plans')
        .update({ [updateField]: newImage.id })
        .eq('id', plan_id);

      if (updateError) {
        console.error('❌ Failed to update plan with new image:', updateError);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to update plan with new image' 
        }, { status: 500 });
      }

      console.log('✅ Plan updated successfully');

      return NextResponse.json({ 
        success: true, 
        message: `Image ${image_slot} generated successfully`,
        image_id: newImage.id,
        image_url: finalImageUrl
      });

    } catch (fetchError) {
      console.error('❌ OpenAI fetch error:', fetchError);
      return NextResponse.json({ 
        success: false, 
        message: `OpenAI fetch error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in sfunc_fetch_single_image:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
} 