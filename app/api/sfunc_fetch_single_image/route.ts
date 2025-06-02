import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
    const { plan_id, image_slot, prompt, aiModel } = await request.json();
    console.log('📥 Request data:', { plan_id, image_slot, prompt: prompt?.substring(0, 100) + '...', aiModel });
    
    if (!plan_id || !image_slot || !prompt) {
      console.error('❌ Missing required fields:', { plan_id, image_slot, prompt: !!prompt });
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: plan_id, image_slot, prompt' 
      }, { status: 400 });
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
      .select('id, fk_image1_id, fk_image2_id, fk_image3_id, fk_image4_id')
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

    console.log('🎨 Generating image with OpenAI...');
    console.log('Model:', aiModel || 'dall-e-3');
    console.log('Prompt:', prompt);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
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
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('🎨 OpenAI response status:', imageResponse.status);

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error('❌ OpenAI API error:', errorText);
        return NextResponse.json({ 
          success: false, 
          message: `OpenAI API error: ${errorText}` 
        }, { status: 500 });
      }

      const imageData = await imageResponse.json();
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

      // Step 2: Download the image from OpenAI
      console.log('📥 Downloading image from OpenAI...');
      const downloadController = new AbortController();
      const downloadTimeoutId = setTimeout(() => downloadController.abort(), 30000); // 30 second timeout

      const imageDownloadResponse = await fetch(imageUrl, {
        signal: downloadController.signal
      });
      clearTimeout(downloadTimeoutId);

      if (!imageDownloadResponse.ok) {
        console.error('❌ Failed to download image from OpenAI');
        return NextResponse.json({ 
          success: false, 
          message: `Failed to download image from OpenAI: ${imageDownloadResponse.statusText}` 
        }, { status: 500 });
      }

      const imageBuffer = await imageDownloadResponse.arrayBuffer();
      console.log('✅ Image downloaded successfully, size:', imageBuffer.byteLength);

      // Step 3: Create proper folder structure and upload to Supabase Storage
      // Get the plan data and batch info to recreate exact same folder structure as bulk generation
      const { data: fullPlanData, error: planDetailsError } = await supabase
        .from('images_plans')
        .select('rel_images_plans_batches_id, e_file_name1, e_prompt1')
        .eq('id', plan_id)
        .single();

      if (planDetailsError || !fullPlanData) {
        console.error('❌ Failed to get plan details for folder structure');
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to get plan details for storage' 
        }, { status: 500 });
      }

      const batchId = fullPlanData.rel_images_plans_batches_id;
      if (!batchId) {
        console.error('❌ Plan has no batch ID');
        return NextResponse.json({ 
          success: false, 
          message: 'Plan has no associated batch' 
        }, { status: 500 });
      }

      // Get batch creation date and sequence number for the day (same as bulk generation)
      const { data: batchRow } = await supabase
        .from('images_plans_batches')
        .select('created_at')
        .eq('id', batchId)
        .single();

      let batchDate = 'unknown_date';
      let batchSeq = 1;
      if (batchRow && batchRow.created_at) {
        const dateObj = new Date(batchRow.created_at);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        batchDate = `${yyyy}_${mm}_${dd}`;
        
        // Count how many batches exist for this user on this date (including this one)
        const { count } = await supabase
          .from('images_plans_batches')
          .select('id', { count: 'exact', head: true })
          .eq('rel_users_id', userData.id)
          .gte('created_at', `${yyyy}-${mm}-${dd}T00:00:00.000Z`)
          .lte('created_at', `${yyyy}-${mm}-${dd}T23:59:59.999Z`);
        batchSeq = (count || 1);
      }
      const batchFolder = `${batchDate} - ${batchSeq}`;

      // Get the plan's sequence number within the batch (same as bulk generation)
      const { data: allPlansInBatch, error: plansError } = await supabase
        .from('images_plans')
        .select('id, created_at')
        .eq('rel_images_plans_batches_id', batchId)
        .order('created_at', { ascending: true });

      if (plansError || !allPlansInBatch) {
        console.error('❌ Failed to get plans in batch for sequence number');
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to determine plan sequence' 
        }, { status: 500 });
      }

      // Find the sequence number (1-based index) of this plan in the batch
      const planIndex = allPlansInBatch.findIndex(p => p.id === plan_id);
      const seq = planIndex + 1; // 1-based sequence

      // Create base filename (same logic as bulk generation)
      let baseFileName = fullPlanData.e_file_name1 && typeof fullPlanData.e_file_name1 === 'string' && fullPlanData.e_file_name1.trim() 
        ? fullPlanData.e_file_name1.trim() 
        : `image_${seq}.png`;
      
      // Ensure the filename is safe (no path traversal)
      baseFileName = baseFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      // Create plan folder name: SEQ - FILENAME (same as bulk generation)
      const planFolder = `${seq} - ${baseFileName}`;
      
      // Create image filename with slot suffix if not slot 1 (same as bulk generation)
      let imageFileName = baseFileName;
      if (image_slot > 1) {
        const extIdx = baseFileName.lastIndexOf('.');
        if (extIdx > 0) {
          imageFileName = baseFileName.slice(0, extIdx) + `-${image_slot}` + baseFileName.slice(extIdx);
        } else {
          imageFileName = baseFileName + `-${image_slot}`;
        }
      }

      // Full storage path: barge1/${batchFolder}/${planFolder}/${imageFileName}
      const storagePath = `barge1/${batchFolder}/${planFolder}/${imageFileName}`;
      
      console.log('📁 Uploading to storage path:', storagePath);
      console.log('📁 Batch folder:', batchFolder);
      console.log('📁 Plan folder:', planFolder);
      console.log('📁 Image filename:', imageFileName);

      // Step 4: Upload to Supabase Storage
      const uploadController = new AbortController();
      const uploadTimeoutId = setTimeout(() => uploadController.abort(), 20000); // 20 second timeout

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bucket-images-b1')
        .upload(storagePath, imageBuffer, {
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
        img_file_size: imageBuffer.byteLength,
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
          img_file_size: imageBuffer.byteLength,
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
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('❌ OpenAI request timed out');
        return NextResponse.json({ 
          success: false, 
          message: 'OpenAI request timed out (60s)' 
        }, { status: 500 });
      }
      
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