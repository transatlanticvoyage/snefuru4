import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { tbn2_sfunc_create_image_with_openai } from '../tbn2_sfunc_fetch_single_image/tbn2_sfunc_create_image_with_openai';
import { logger } from '@/lib/error-logger';

export async function POST(request: Request) {
  try {
    const { records, qty, aiModel, generateZip, wipeMeta, screenshotImages, throttle1, gridData, batchId } = await request.json();
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
    
    // Prepare the original submission data for storage - tbn2 independent version
    const originalSubmissionData = {
      headers: gridData && gridData.length > 0 ? gridData[0] : [],
      rows: gridData && gridData.length > 1 ? gridData.slice(1).filter((row: string[]) => row.some(cell => cell.trim() !== '')) : [],
      metadata: {
        submitted_at: new Date().toISOString(),
        total_rows: gridData && gridData.length > 1 ? gridData.slice(1).filter((row: string[]) => row.some(cell => cell.trim() !== '')).length : 0,
        total_columns: gridData && gridData.length > 0 ? gridData[0].length : 0,
        processed_records_count: records.length,
        function_used: 'tbn2_sfunc_create_plans_make_images_2', // Independent tbn2 identifier
        source_system: 'tebnar2',
        generation_settings: {
          qty_per_plan: qty,
          ai_model: aiModel,
          generate_zip: generateZip,
          wipe_meta: wipeMeta,
          screenshot_images: screenshotImages || false,
          throttle1_enabled: throttle1?.enabled || false,
          throttle1_settings: throttle1?.enabled ? {
            delay_between_images: throttle1.delayBetweenImages,
            delay_between_plans: throttle1.delayBetweenPlans
          } : null
        }
      }
    };
    
    // 1. Validate the provided batch ID exists and belongs to user
    if (!batchId) {
      return NextResponse.json({ success: false, message: 'Batch ID is required' }, { status: 400 });
    }
    
    const { data: batchData, error: batchError } = await supabase
      .from('images_plans_batches')
      .select('id')
      .eq('id', batchId)
      .eq('rel_users_id', userData.id)
      .single();
    if (batchError || !batchData) {
      return NextResponse.json({ success: false, message: 'Batch not found or access denied: ' + (batchError?.message || 'Unknown error') }, { status: 404 });
    }

    // Get batch creation date and sequence number for the day
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
    const batchFolder = `tbn2_${batchDate} - ${batchSeq}`; // Add tbn2 prefix for independence

    // 2. Insert all images_plans rows with rel_images_plans_batches_id set
    const recordsToInsert = records.map((rec: any, index: number) => ({ 
      ...rec, 
      rel_users_id: userData.id, 
      rel_images_plans_batches_id: batchId,
      submission_order: index + 1
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
        category: 'tbn2_throttle_system',
        message: `Tebnar2 Throttle1 enabled for batch ${batchId}`,
        details: {
          delayBetweenImages: throttle1.delayBetweenImages,
          delayBetweenPlans: throttle1.delayBetweenPlans,
          totalPlans: plansData.length,
          qtyPerPlan: qty,
          sourceSystem: 'tebnar2'
        },
        batch_id: batchId
      });
    }
    
    // Log the start of bulk image generation
    await logger.info({
      category: 'tbn2_bulk_generation',
      message: `Tebnar2: Starting bulk image generation for batch ${batchId}`,
      details: {
        totalPlans: plansData.length,
        qtyPerPlan: qty,
        batchFolder: batchFolder,
        userId: userData.id,
        totalImagesToGenerate: plansData.length * Math.min(qty, 4),
        sourceSystem: 'tebnar2'
      },
      batch_id: batchId
    });
    
    for (let i = 0; i < plansData.length; i++) {
      const plan = plansData[i];
      const imageIds: (string | null)[] = [];
      const seq = plan.submission_order || (i + 1);
      let baseFileName = plan.e_file_name1 && typeof plan.e_file_name1 === 'string' && plan.e_file_name1.trim() ? plan.e_file_name1.trim() : `tbn2_image_${seq}.png`;
      // Ensure the filename is safe
      baseFileName = baseFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const planFolder = `${seq} - ${baseFileName}`;
      
      for (let j = 0; j < Math.min(qty, 4); j++) {
        // Generate image using OpenAI
        let prompt = plan.e_prompt1 || plan.e_more_instructions1 || plan.e_file_name1 || 'Tebnar2 AI Image';
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
          category: 'tbn2_image_generation',
          message: `Tebnar2: Generating image ${j + 1}/${Math.min(qty, 4)} for plan ${seq}`,
          details: { 
            prompt: prompt.substring(0, 100) + '...',
            imageFileName,
            planId: plan.id,
            sourceSystem: 'tebnar2'
          },
          batch_id: batchId,
          plan_id: plan.id
        });
        
        try {
          const imageResult = await tbn2_sfunc_create_image_with_openai({ 
            prompt, 
            userId: userData.id, 
            batchFolder: `${batchFolder}/${planFolder}`, 
            fileName: imageFileName,
            aiModel: aiModel,
            wipeMeta: wipeMeta || false
          });
          
          if (!imageResult.success) {
            await logger.error({
              category: 'tbn2_image_generation',
              message: `Tebnar2: Failed to generate image ${j + 1} for plan ${seq}`,
              details: { 
                error: imageResult.error,
                prompt: prompt.substring(0, 100) + '...',
                imageFileName,
                batchFolder: `${batchFolder}/${planFolder}`,
                planId: plan.id,
                imageSlot: j + 1,
                sourceSystem: 'tebnar2'
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
              function_used_to_fetch_the_image: `tbn2_${aiModel}`, // Add tbn2 prefix for independence
            })
            .select('id')
            .single();
            
          if (imageError || !imageInsert) {
            await logger.error({
              category: 'tbn2_database',
              message: `Tebnar2: Failed to insert image ${j + 1} into database for plan ${seq}`,
              details: { 
                error: imageError?.message || 'No insert data returned',
                imageUrl: imageResult.url,
                planId: plan.id,
                imageSlot: j + 1,
                sourceSystem: 'tebnar2'
              },
              batch_id: batchId,
              plan_id: plan.id
            });
            imageIds.push(null);
          } else {
            await logger.info({
              category: 'tbn2_image_generation',
              message: `Tebnar2: Successfully generated and saved image ${j + 1} for plan ${seq}`,
              details: { 
                imageId: imageInsert.id,
                imageUrl: imageResult.url,
                planId: plan.id,
                imageSlot: j + 1,
                sourceSystem: 'tebnar2'
              },
              batch_id: batchId,
              plan_id: plan.id
            });
            imageIds.push(imageInsert.id);
          }
          
        } catch (error) {
          await logger.error({
            category: 'tbn2_image_generation',
            message: `Tebnar2: Unexpected error generating image ${j + 1} for plan ${seq}`,
            details: { 
              error: error instanceof Error ? error.message : String(error),
              prompt: prompt.substring(0, 100) + '...',
              imageFileName,
              sourceSystem: 'tebnar2'
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
          category: 'tbn2_database',
          message: `Tebnar2: Failed to update plan ${seq} with int values and fk_image ids`,
          details: { 
            error: updateError.message,
            planId: plan.id,
            updateData: updateObj,
            seq: seq,
            sourceSystem: 'tebnar2'
          },
          batch_id: batchId,
          plan_id: plan.id
        });
      } else {
        await logger.info({
          category: 'tbn2_database',
          message: `Tebnar2: Successfully updated plan ${seq} with int values and fk_image ids`,
          details: { 
            planId: plan.id,
            intValuesSet: Object.keys(updateObj).filter(key => key.startsWith('int')).map(key => `${key}=${updateObj[key]}`),
            imageIdsSet: Object.keys(updateObj).filter(key => key.startsWith('fk_image')).length,
            seq: seq,
            sourceSystem: 'tebnar2'
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
        category: 'tbn2_throttle_system',
        message: `Tebnar2: Throttled image generation completed for batch ${batchId}`,
        details: {
          totalPlansProcessed: plansData.length,
          totalImagesGenerated: updatedPlans.reduce((acc, plan) => {
            return acc + [plan.fk_image1_id, plan.fk_image2_id, plan.fk_image3_id, plan.fk_image4_id].filter(Boolean).length;
          }, 0),
          sourceSystem: 'tebnar2'
        },
        batch_id: batchId
      });
    }

    // BACKUP: Ensure ALL plans in this batch have their int values set correctly
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
        category: 'tbn2_database',
        message: `Tebnar2: Failed bulk update of int values for batch ${batchId}`,
        details: { 
          error: bulkUpdateError.message,
          batchId: batchId,
          updateData: bulkIntUpdate,
          totalPlansInBatch: plansData.length,
          sourceSystem: 'tebnar2'
        },
        batch_id: batchId
      });
    } else {
      await logger.info({
        category: 'tbn2_database',
        message: `Tebnar2: Successfully bulk updated int values for all plans in batch ${batchId}`,
        details: { 
          batchId: batchId,
          intValuesSet: Object.keys(bulkIntUpdate).map(key => `${key}=${bulkIntUpdate[key]}`),
          totalPlansUpdated: plansData.length,
          sourceSystem: 'tebnar2'
        },
        batch_id: batchId
      });
    }

    // POST-PROCESSING: SabertoothScreenshotImages if enabled
    let screenshotResults: any[] = [];
    if (screenshotImages && screenshotImages === true) {
      await logger.info({
        category: 'tbn2_sabertooth_screenshot',
        message: `Tebnar2: Starting post-processing screenshots for batch ${batchId}`,
        details: {
          totalPlans: updatedPlans.length,
          screenshotEnabled: true,
          sourceSystem: 'tebnar2'
        },
        batch_id: batchId
      });

      try {
        // Import the SabertoothScreenshotImages function
        const { SabertoothScreenshotImages } = await import('@/app/(protected)/bin34/tebnar2/utils/SabertoothScreenshotImages');
        
        // Collect all successfully generated image IDs for screenshot processing
        const imageIdsToProcess: string[] = [];
        updatedPlans.forEach(plan => {
          [plan.fk_image1_id, plan.fk_image2_id, plan.fk_image3_id, plan.fk_image4_id].forEach(imageId => {
            if (imageId && typeof imageId === 'string') {
              imageIdsToProcess.push(imageId);
            }
          });
        });

        if (imageIdsToProcess.length > 0) {
          await logger.info({
            category: 'tbn2_sabertooth_screenshot',
            message: `Tebnar2: Processing ${imageIdsToProcess.length} images for screenshots`,
            details: {
              imageIds: imageIdsToProcess,
              sourceSystem: 'tebnar2'
            },
            batch_id: batchId
          });

          // Process screenshots for all generated images
          for (const imageId of imageIdsToProcess) {
            const screenshotResult = await SabertoothScreenshotImages(imageId, session!.user.id);
            screenshotResults.push({
              imageId: imageId,
              ...screenshotResult
            });

            // Log individual screenshot result
            if (screenshotResult.success) {
              await logger.info({
                category: 'tbn2_sabertooth_screenshot',
                message: `Tebnar2: Successfully processed screenshot for image ${imageId}`,
                details: {
                  imageId: imageId,
                  originalUrl: screenshotResult.originalUrl,
                  screenshotUrl: screenshotResult.screenshotUrl,
                  sourceSystem: 'tebnar2'
                },
                batch_id: batchId
              });
            } else {
              await logger.error({
                category: 'tbn2_sabertooth_screenshot',
                message: `Tebnar2: Failed to process screenshot for image ${imageId}`,
                details: {
                  imageId: imageId,
                  error: screenshotResult.error,
                  sourceSystem: 'tebnar2'
                },
                batch_id: batchId
              });
            }

            // Small delay between screenshots to be gentle on resources
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          const successfulScreenshots = screenshotResults.filter(r => r.success).length;
          await logger.info({
            category: 'tbn2_sabertooth_screenshot',
            message: `Tebnar2: Completed screenshot processing for batch ${batchId}`,
            details: {
              totalImages: imageIdsToProcess.length,
              successfulScreenshots: successfulScreenshots,
              failedScreenshots: imageIdsToProcess.length - successfulScreenshots,
              sourceSystem: 'tebnar2'
            },
            batch_id: batchId
          });
        } else {
          await logger.info({
            category: 'tbn2_sabertooth_screenshot',
            message: `Tebnar2: No images found to process for screenshots in batch ${batchId}`,
            details: {
              sourceSystem: 'tebnar2'
            },
            batch_id: batchId
          });
        }

      } catch (screenshotError) {
        await logger.error({
          category: 'tbn2_sabertooth_screenshot',
          message: `Tebnar2: Error during screenshot processing for batch ${batchId}`,
          details: {
            error: screenshotError instanceof Error ? screenshotError.message : String(screenshotError),
            sourceSystem: 'tebnar2'
          },
          batch_id: batchId,
          stack_trace: screenshotError instanceof Error ? screenshotError.stack : undefined
        });
        // Don't fail the entire operation if screenshot processing fails
      }
    }

    const successfulScreenshots = screenshotResults.filter(r => r.success).length;
    const screenshotMessage = screenshotImages && screenshotResults.length > 0 
      ? ` Screenshots: ${successfulScreenshots}/${screenshotResults.length} processed.`
      : '';

    return NextResponse.json({ 
      success: true, 
      message: `🚀 Tebnar2: Generated ${updatedPlans.length} plans with images in batch ${batchId}.${screenshotMessage}`, 
      batch_id: batchId, 
      plans: updatedPlans,
      source_system: 'tebnar2',
      batch_folder: batchFolder,
      screenshot_results: screenshotImages ? screenshotResults : undefined
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}