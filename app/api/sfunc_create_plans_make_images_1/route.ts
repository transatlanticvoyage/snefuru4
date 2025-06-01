import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sfunc_create_image_with_openai } from './sfunc_create_image_with_openai';
import JSZip from 'jszip';
import sharp from 'sharp';

// Mock image generation function
async function generateImage({ plan, aiModel }: { plan: any; aiModel: string }) {
  // In a real implementation, call your AI image generation API here
  // For now, just return a mock image object
  return {
    img_file_url1: `https://dummyimage.com/512x512/000/fff&text=${encodeURIComponent(plan.e_prompt1 || 'AI')}`,
    img_file_extension: 'png',
    img_file_size: 123456,
    width: 512,
    height: 512,
    prompt1: plan.e_prompt1 || '',
    status: 'completed',
    function_used_to_fetch_the_image: aiModel,
  };
}

export async function POST(request: Request) {
  try {
    const { records, qty, aiModel, generateZip, wipeMeta } = await request.json();
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, message: 'No records provided' }, { status: 400 });
    }
    const supabase = createRouteHandlerClient({ cookies });
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
    }
    // Get user's DB id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();
    if (userError || !userData) {
      return NextResponse.json({ success: false, message: 'Could not find user record' }, { status: 400 });
    }
    // 1. Create a new batch row
    const { data: batchData, error: batchError } = await supabase
      .from('images_plans_batches')
      .insert({ rel_users_id: userData.id })
      .select('id')
      .single();
    if (batchError || !batchData) {
      return NextResponse.json({ success: false, message: 'Failed to create batch: ' + (batchError?.message || 'Unknown error') }, { status: 500 });
    }
    const batchId = batchData.id;

    // Get batch creation date and sequence number for the day
    // Fetch the batch row to get created_at
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

    // 2. Insert all images_plans rows with rel_images_plans_batches_id set
    //    and collect their ids for later update
    const recordsToInsert = records.map((rec: any) => ({ ...rec, rel_users_id: userData.id, rel_images_plans_batches_id: batchId }));
    const { data: plansData, error: plansError } = await supabase
      .from('images_plans')
      .insert(recordsToInsert)
      .select();
    if (plansError) {
      return NextResponse.json({ success: false, message: plansError.message }, { status: 500 });
    }

    // 3. For each plan, generate images, insert them, and update the plan with fk_imageX_id
    const updatedPlans = [];
    for (let i = 0; i < plansData.length; i++) {
      const plan = plansData[i];
      const imageIds: (string | null)[] = [];
      // Plan folder: SEQ - FILENAME
      const seq = i + 1;
      let baseFileName = plan.e_file_name1 && typeof plan.e_file_name1 === 'string' && plan.e_file_name1.trim() ? plan.e_file_name1.trim() : `image_${seq}.png`;
      // Ensure the filename is safe
      baseFileName = baseFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const planFolder = `${seq} - ${baseFileName}`;
      for (let j = 0; j < Math.min(qty, 4); j++) {
        // Generate image using OpenAI
        let prompt = plan.e_prompt1 || plan.e_more_instructions1 || plan.e_file_name1 || 'AI Image';
        // Image file name: FILENAME, FILENAME-2, FILENAME-3, ...
        let imageFileName = baseFileName;
        if (j > 0) {
          const extIdx = baseFileName.lastIndexOf('.');
          if (extIdx > 0) {
            imageFileName = baseFileName.slice(0, extIdx) + `-${j + 1}` + baseFileName.slice(extIdx);
          } else {
            imageFileName = baseFileName + `-${j + 1}`;
          }
        }
        const imageResult = await sfunc_create_image_with_openai({ prompt, userId: userData.id, batchFolder: `${batchFolder}/${planFolder}`, fileName: imageFileName });
        if (!imageResult.success) {
          imageIds.push(null);
          continue;
        }
        // Insert image into images table
        const { data: imageInsert, error: imageError } = await supabase
          .from('images')
          .insert({
            rel_users_id: userData.id,
            rel_images_plans_id: plan.id,
            img_file_url1: imageResult.url,
            img_file_extension: 'png',
            img_file_size: null,
            width: 1024,
            height: 1024,
            prompt1: prompt,
            status: 'completed',
            function_used_to_fetch_the_image: aiModel,
          })
          .select('id')
          .single();
        if (imageError || !imageInsert) {
          imageIds.push(null);
        } else {
          imageIds.push(imageInsert.id);
        }
      }
      // Prepare update object for fk_image1_id ... fk_image4_id
      const updateObj: Record<string, string | null> = {};
      for (let k = 0; k < 4; k++) {
        updateObj[`fk_image${k + 1}_id`] = imageIds[k] || null;
      }
      // Update the plan row
      await supabase
        .from('images_plans')
        .update(updateObj)
        .eq('id', plan.id);
      updatedPlans.push({ ...plan, ...updateObj });
    }

    // After all images are uploaded, if generateZip is true, create a zip file in the batch folder
    if (generateZip) {
      // List all plan folders in the batch folder
      const { data: planFolders, error: listError } = await supabase.storage
        .from('bucket-images-b1')
        .list(`barge1/${batchFolder}`, { limit: 100, offset: 0 });
      if (!listError && planFolders && planFolders.length > 0) {
        const zip = new JSZip();
        let firstPlanFolder = '';
        for (let idx = 0; idx < planFolders.length; idx++) {
          const planFolder = planFolders[idx];
          if (planFolder && planFolder.name) {
            if (idx === 0) firstPlanFolder = planFolder.name;
            // List all files in this plan folder
            const { data: files } = await supabase.storage
              .from('bucket-images-b1')
              .list(`barge1/${batchFolder}/${planFolder.name}`, { limit: 20, offset: 0 });
            if (files && files.length > 0) {
              for (const file of files) {
                // Download file
                const { data: fileData } = await supabase.storage
                  .from('bucket-images-b1')
                  .download(`barge1/${batchFolder}/${planFolder.name}/${file.name}`);
                if (fileData) {
                  const arrayBuffer = await fileData.arrayBuffer();
                  // @ts-ignore - Buffer type mismatch in serverless environment
                  let buffer = Buffer.from(new Uint8Array(arrayBuffer));
                  // @ts-ignore - Buffer type mismatch in serverless environment
                  if (wipeMeta) {
                    // Use sharp to strip metadata
                    buffer = await sharp(buffer).toBuffer();
                  }
                  // Add to zip under the correct folder
                  zip.file(`${planFolder.name}/${file.name}`, buffer);
                }
              }
            }
          }
        }
        if (firstPlanFolder) {
          // Generate the zip file
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const zipFileName = `${batchFolder}-${firstPlanFolder}.zip`;
          const zipPath = `barge1/${batchFolder}/${zipFileName}`;
          // Upload zip to Supabase Storage
          await supabase.storage
            .from('bucket-images-b1')
            .upload(zipPath, zipBlob, {
              contentType: 'application/zip',
              upsert: true,
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Inserted ${plansData.length} plans and generated images for each in batch ${batchId}.`,
      batch_id: batchId,
      updated: updatedPlans,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
} 