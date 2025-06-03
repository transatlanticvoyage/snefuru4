import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sfunc_create_image_with_openai } from './sfunc_create_image_with_openai';
import JSZip from 'jszip';
import sharp from 'sharp';
import { logger } from '@/lib/error-logger';

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
    const { records, qty, aiModel, generateZip, wipeMeta, throttle1, gridData } = await request.json();
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
    
    // Prepare the original submission data for storage
    const originalSubmissionData = {
      headers: gridData && gridData.length > 0 ? gridData[0] : [],
      rows: gridData && gridData.length > 1 ? gridData.slice(1).filter((row: string[]) => row.some(cell => cell.trim() !== '')) : [],
      metadata: {
        submitted_at: new Date().toISOString(),
        total_rows: gridData && gridData.length > 1 ? gridData.slice(1).filter((row: string[]) => row.some(cell => cell.trim() !== '')).length : 0,
        total_columns: gridData && gridData.length > 0 ? gridData[0].length : 0,
        processed_records_count: records.length,
        function_used: 'sfunc_create_plans_make_images_1',
        generation_settings: {
          qty_per_plan: qty,
          ai_model: aiModel,
          generate_zip: generateZip,
          wipe_meta: wipeMeta,
          throttle1_enabled: throttle1?.enabled || false,
          throttle1_settings: throttle1?.enabled ? {
            delay_between_images: throttle1.delayBetweenImages,
            delay_between_plans: throttle1.delayBetweenPlans
          } : null
        }
      }
    };
    
    // 1. Create a new batch row with original submission data
    const { data: batchData, error: batchError } = await supabase
      .from('images_plans_batches')
      .insert({ 
        rel_users_id: userData.id,
        xlslike_original_submission: originalSubmissionData
      })
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
    const recordsToInsert = records.map((rec: any, index: number) => ({ 
      ...rec, 
      rel_users_id: userData.id, 
      rel_images_plans_batches_id: batchId,
      submission_order: index + 1  // Store 1-based submission order (index 0 = spreadsheet row 2, index 1 = spreadsheet row 3, etc.)
    }));
    const { data: plansData, error: plansError } = await supabase
      .from('images_plans')
      .insert(recordsToInsert)
      .select();
    if (plansError) {
      return NextResponse.json({ success: false, message: plansError.message }, { status: 500 });
    }

    // 3. For each plan, generate images, insert them, and update the plan with fk_imageX_id
    const updatedPlans = [];
    
    // Helper function for throttling delays
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Log throttling configuration if enabled
    if (throttle1?.enabled) {
      await logger.info({
        category: 'throttle_system',
        message: `Throttle1 enabled for batch ${batchId}`,
        details: {
          delayBetweenImages: throttle1.delayBetweenImages,
          delayBetweenPlans: throttle1.delayBetweenPlans,
          totalPlans: plansData.length,
          qtyPerPlan: qty,
          estimatedTotalTime: (plansData.length * throttle1.delayBetweenPlans + plansData.length * qty * throttle1.delayBetweenImages) / 1000
        },
        batch_id: batchId
      });
    }
    
    // Log the start of bulk image generation
    await logger.info({
      category: 'bulk_generation',
      message: `Starting bulk image generation for batch ${batchId}`,
      details: {
        totalPlans: plansData.length,
        qtyPerPlan: qty,
        batchFolder: batchFolder,
        userId: userData.id,
        totalImagesToGenerate: plansData.length * Math.min(qty, 4)
      },
      batch_id: batchId
    });
    
    for (let i = 0; i < plansData.length; i++) {
      const plan = plansData[i];
      const imageIds: (string | null)[] = [];
      // Plan folder: SEQ - FILENAME
      // Use the stored submission_order instead of array index to ensure correct sequencing
      const seq = plan.submission_order || (i + 1); // Fallback to index + 1 if no submission_order
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
        
        // Log individual image generation attempt
        await logger.info({
          category: 'image_generation',
          message: `Generating image ${j + 1}/${Math.min(qty, 4)} for plan ${seq}`,
          details: { 
            prompt: prompt.substring(0, 100) + '...',
            imageFileName,
            planId: plan.id
          },
          batch_id: batchId,
          plan_id: plan.id
        });
        
        try {
          const imageResult = await sfunc_create_image_with_openai({ 
            prompt, 
            userId: userData.id, 
            batchFolder: `${batchFolder}/${planFolder}`, 
            fileName: imageFileName 
          });
          
          if (!imageResult.success) {
            await logger.error({
              category: 'image_generation',
              message: `Failed to generate image ${j + 1} for plan ${seq}`,
              details: { 
                error: imageResult.error,
                prompt: prompt.substring(0, 100) + '...',
                imageFileName,
                batchFolder: `${batchFolder}/${planFolder}`,
                planId: plan.id,
                imageSlot: j + 1
              },
              batch_id: batchId,
              plan_id: plan.id
            });
            
            imageIds.push(null);
            // Add throttle delay even for failed images to maintain consistent pacing
            if (throttle1?.enabled && throttle1.delayBetweenImages > 0 && j < Math.min(qty, 4) - 1) {
              await delay(throttle1.delayBetweenImages);
            }
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
            await logger.error({
              category: 'database',
              message: `Failed to insert image ${j + 1} into database for plan ${seq}`,
              details: { 
                error: imageError?.message || 'No insert data returned',
                imageUrl: imageResult.url,
                planId: plan.id,
                imageSlot: j + 1,
                databaseRecord: {
                  rel_users_id: userData.id,
                  rel_images_plans_id: plan.id,
                  img_file_url1: imageResult.url,
                  prompt1: prompt.substring(0, 100) + '...'
                }
              },
              batch_id: batchId,
              plan_id: plan.id
            });
            imageIds.push(null);
          } else {
            await logger.info({
              category: 'image_generation',
              message: `Successfully generated and saved image ${j + 1} for plan ${seq}`,
              details: { 
                imageId: imageInsert.id,
                imageUrl: imageResult.url,
                planId: plan.id,
                imageSlot: j + 1,
                storagePath: `Expected: barge1/${batchFolder}/${planFolder}/${imageFileName}`
              },
              batch_id: batchId,
              plan_id: plan.id
            });
            imageIds.push(imageInsert.id);
          }
          
        } catch (error) {
          await logger.error({
            category: 'image_generation',
            message: `Unexpected error generating image ${j + 1} for plan ${seq}`,
            details: { 
              error: error instanceof Error ? error.message : String(error),
              prompt: prompt.substring(0, 100) + '...',
              imageFileName
            },
            batch_id: batchId,
            plan_id: plan.id,
            stack_trace: error instanceof Error ? error.stack : undefined
          });
          imageIds.push(null);
        }
        
        // Throttle1: Add delay between images (but not after the last image in the plan)
        if (throttle1?.enabled && throttle1.delayBetweenImages > 0 && j < Math.min(qty, 4) - 1) {
          await delay(throttle1.delayBetweenImages);
        }
      }
      
      // Prepare update object for fk_image1_id ... fk_image4_id
      const updateObj: Record<string, string | null> = {};
      for (let k = 0; k < 4; k++) {
        updateObj[`fk_image${k + 1}_id`] = imageIds[k] || null;
      }
      
      // Set int fields based on qty (mark intended images)
      // QTY = 1: int1 = "yes"
      // QTY = 2: int1 = "yes", int2 = "yes"  
      // QTY = 3: int1 = "yes", int2 = "yes", int3 = "yes"
      // QTY = 4: int1 = "yes", int2 = "yes", int3 = "yes", int4 = "yes"
      for (let m = 1; m <= Math.min(qty, 4); m++) {
        updateObj[`int${m}`] = 'yes';
      }
      
      // Update the plan row with error handling
      const { error: updateError } = await supabase
        .from('images_plans')
        .update(updateObj)
        .eq('id', plan.id);
        
      if (updateError) {
        await logger.error({
          category: 'database',
          message: `Failed to update plan ${seq} with int values and fk_image ids`,
          details: { 
            error: updateError.message,
            planId: plan.id,
            updateData: updateObj,
            seq: seq
          },
          batch_id: batchId,
          plan_id: plan.id
        });
        // Continue processing other plans even if one fails
      } else {
        await logger.info({
          category: 'database',
          message: `Successfully updated plan ${seq} with int values and fk_image ids`,
          details: { 
            planId: plan.id,
            intValuesSet: Object.keys(updateObj).filter(key => key.startsWith('int')).map(key => `${key}=${updateObj[key]}`),
            imageIdsSet: Object.keys(updateObj).filter(key => key.startsWith('fk_image')).length,
            seq: seq
          },
          batch_id: batchId,
          plan_id: plan.id
        });
      }
      
      updatedPlans.push({ ...plan, ...updateObj });
      
      // Throttle1: Add delay between plans (but not after the last plan)
      if (throttle1?.enabled && throttle1.delayBetweenPlans > 0 && i < plansData.length - 1) {
        await delay(throttle1.delayBetweenPlans);
      }
    }

    // Log completion if throttling was used
    if (throttle1?.enabled) {
      await logger.info({
        category: 'throttle_system',
        message: `Throttled image generation completed for batch ${batchId}`,
        details: {
          totalPlansProcessed: plansData.length,
          totalImagesGenerated: updatedPlans.reduce((acc, plan) => {
            return acc + [plan.fk_image1_id, plan.fk_image2_id, plan.fk_image3_id, plan.fk_image4_id].filter(Boolean).length;
          }, 0)
        },
        batch_id: batchId
      });
    }

    // BACKUP: Ensure ALL plans in this batch have their int values set correctly
    // This is a safety net in case any individual updates failed
    const bulkIntUpdate: Record<string, string> = {};
    for (let m = 1; m <= Math.min(qty, 4); m++) {
      bulkIntUpdate[`int${m}`] = 'yes';
    }
    
    const { error: bulkUpdateError } = await supabase
      .from('images_plans')
      .update(bulkIntUpdate)
      .eq('rel_images_plans_batches_id', batchId);
      
    if (bulkUpdateError) {
      await logger.error({
        category: 'database',
        message: `Failed bulk update of int values for batch ${batchId}`,
        details: { 
          error: bulkUpdateError.message,
          batchId: batchId,
          updateData: bulkIntUpdate,
          totalPlansInBatch: plansData.length
        },
        batch_id: batchId
      });
    } else {
      await logger.info({
        category: 'database',
        message: `Successfully bulk updated int values for all plans in batch ${batchId}`,
        details: { 
          batchId: batchId,
          intValuesSet: Object.keys(bulkIntUpdate).map(key => `${key}=${bulkIntUpdate[key]}`),
          totalPlansUpdated: plansData.length
        },
        batch_id: batchId
      });
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
                  if (wipeMeta) {
                    // Use sharp to strip metadata
                    // @ts-ignore - Buffer type mismatch in serverless environment
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