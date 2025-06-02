import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sfunc_create_image_with_openai } from '../../sfunc_create_plans_make_images_1/sfunc_create_image_with_openai';

// Helper function to log errors directly to database
async function logToDatabase(params: {
  level: 'error' | 'warning' | 'info' | 'debug';
  category: string;
  message: string;
  details?: any;
  stack_trace?: string;
  batch_id?: string;
  plan_id?: string;
  job_id?: string;
  user_id?: string;
}) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/error-logs/add-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      console.error('Failed to log to database:', await response.text());
    }
  } catch (err) {
    console.error('Failed to send log to database:', err);
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    const { settings } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    await logToDatabase({
      level: 'info',
      category: 'background_processor',
      message: 'Background job processing started',
      details: { settings }
    });
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      await logToDatabase({
        level: 'error',
        category: 'background_processor',
        message: 'User authentication failed',
        details: { sessionError }
      });
      return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
    }
    
    // Get user's DB id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();
      
    if (userError || !userData) {
      await logToDatabase({
        level: 'error',
        category: 'background_processor',
        message: 'Could not find user record',
        details: { userError, auth_id: session.user.id }
      });
      return NextResponse.json({ success: false, message: 'Could not find user record' }, { status: 400 });
    }

    userId = userData.id;
    
    await logToDatabase({
      level: 'info',
      category: 'background_processor',
      message: 'User authenticated successfully',
      details: { user_id: userId },
      user_id: userId
    });
    
    // Get pending jobs for this user
    const { data: jobs, error: jobsError } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('user_id', userData.id)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(settings?.maxConcurrentJobs || 1);
      
    if (jobsError) {
      await logToDatabase({
        level: 'error',
        category: 'background_processor',
        message: 'Failed to fetch pending jobs',
        details: { jobsError },
        user_id: userId
      });
      return NextResponse.json({ success: false, message: jobsError.message }, { status: 500 });
    }

    await logToDatabase({
      level: 'info',
      category: 'background_processor',
      message: `Found ${jobs.length} pending jobs to process`,
      details: { jobCount: jobs.length, maxConcurrent: settings?.maxConcurrentJobs || 1 },
      user_id: userId
    });
    
    let processedJobs = 0;
    let failedJobs = 0;
    
    for (const job of jobs) {
      const jobStartTime = Date.now();
      
      try {
        await logToDatabase({
          level: 'info',
          category: 'background_processor',
          message: `Starting job processing`,
          details: { 
            jobType: job.job_type, 
            jobId: job.id, 
            attempt: (job.attempts || 0) + 1,
            priority: job.priority 
          },
          user_id: userId,
          job_id: job.id
        });
        
        // Mark job as processing
        await supabase
          .from('background_jobs')
          .update({ 
            status: 'processing', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', job.id);
        
        // Process the job based on type
        let result = null;
        
        if (job.job_type === 'generate_image') {
          const { plan, imageSlot, batchFolder, fileName } = job.data;
          
          await logToDatabase({
            level: 'info',
            category: 'image_generation',
            message: `Starting image generation`,
            details: { 
              planId: plan.id, 
              imageSlot, 
              batchFolder, 
              fileName,
              prompt: plan.e_prompt1 || plan.e_more_instructions1 || plan.e_file_name1 
            },
            user_id: userId,
            job_id: job.id,
            plan_id: plan.id,
            batch_id: plan.rel_images_plans_batches_id
          });
          
          const prompt = plan.e_prompt1 || plan.e_more_instructions1 || plan.e_file_name1 || 'AI Image';
          
          const imageGenStartTime = Date.now();
          const imageResult = await sfunc_create_image_with_openai({
            prompt,
            userId: userData.id,
            batchFolder,
            fileName
          });
          const imageGenDuration = Date.now() - imageGenStartTime;
          
          if (imageResult.success) {
            await logToDatabase({
              level: 'info',
              category: 'image_generation',
              message: `Image generation completed successfully`,
              details: { 
                duration: imageGenDuration,
                url: imageResult.url,
                fileName 
              },
              user_id: userId,
              job_id: job.id,
              plan_id: plan.id,
              batch_id: plan.rel_images_plans_batches_id
            });
            
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
                function_used_to_fetch_the_image: 'background_processor',
              })
              .select('id')
              .single();
              
            if (imageInsert && !imageError) {
              await logToDatabase({
                level: 'info',
                category: 'database',
                message: `Image record created successfully`,
                details: { 
                  imageId: imageInsert.id,
                  imageSlot 
                },
                user_id: userId,
                job_id: job.id,
                plan_id: plan.id,
                batch_id: plan.rel_images_plans_batches_id
              });
              
              // Update the plan with the new image
              const { error: updateError } = await supabase
                .from('images_plans')
                .update({ [`fk_image${imageSlot}_id`]: imageInsert.id })
                .eq('id', plan.id);
                
              if (updateError) {
                throw new Error(`Failed to update plan with image: ${updateError.message}`);
              }
              
              await logToDatabase({
                level: 'info',
                category: 'database',
                message: `Plan updated with new image reference`,
                details: { 
                  planId: plan.id,
                  imageSlot,
                  imageId: imageInsert.id 
                },
                user_id: userId,
                job_id: job.id,
                plan_id: plan.id,
                batch_id: plan.rel_images_plans_batches_id
              });
                
              result = { imageId: imageInsert.id, url: imageResult.url };
            } else {
              throw new Error(imageError?.message || 'Failed to save image to database');
            }
          } else {
            throw new Error(imageResult.error || 'Failed to generate image');
          }
        } else {
          throw new Error(`Unknown job type: ${job.job_type}`);
        }
        
        // Mark job as completed
        const { error: completeError } = await supabase
          .from('background_jobs')
          .update({ 
            status: 'completed',
            result: result,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
          
        if (completeError) {
          throw new Error(`Failed to mark job as completed: ${completeError.message}`);
        }
        
        const jobDuration = Date.now() - jobStartTime;
        await logToDatabase({
          level: 'info',
          category: 'background_processor',
          message: `Job completed successfully`,
          details: { 
            jobId: job.id,
            duration: jobDuration,
            result 
          },
          user_id: userId,
          job_id: job.id
        });
          
        processedJobs++;
        
        // Add delay between jobs if specified
        if (settings?.delayBetweenImages && processedJobs < jobs.length) {
          await logToDatabase({
            level: 'debug',
            category: 'background_processor',
            message: `Applying delay between jobs`,
            details: { 
              delayMs: settings.delayBetweenImages,
              jobsRemaining: jobs.length - processedJobs 
            },
            user_id: userId
          });
          
          await new Promise(resolve => setTimeout(resolve, settings.delayBetweenImages));
        }
        
      } catch (error) {
        const jobDuration = Date.now() - jobStartTime;
        const errorObj = error instanceof Error ? error : new Error(String(error));
        
        await logToDatabase({
          level: 'error',
          category: 'background_processor',
          message: `Job failed: ${errorObj.message}`,
          details: { 
            jobId: job.id,
            jobType: job.job_type,
            duration: jobDuration,
            attempt: (job.attempts || 0) + 1,
            jobData: job.data 
          },
          stack_trace: errorObj.stack,
          user_id: userId,
          job_id: job.id
        });
        
        // Mark job as failed
        const attempts = (job.attempts || 0) + 1;
        const shouldRetry = attempts < (job.max_attempts || 3);
        
        await logToDatabase({
          level: shouldRetry ? 'warning' : 'error',
          category: 'background_processor',
          message: shouldRetry ? `Job will be retried (attempt ${attempts})` : `Job failed permanently after ${attempts} attempts`,
          details: { 
            jobId: job.id,
            attempts,
            maxAttempts: job.max_attempts || 3,
            willRetry: shouldRetry 
          },
          user_id: userId,
          job_id: job.id
        });
        
        const { error: updateError } = await supabase
          .from('background_jobs')
          .update({ 
            status: shouldRetry ? 'pending' : 'failed',
            error_message: errorObj.message,
            attempts: attempts,
            updated_at: new Date().toISOString(),
            scheduled_for: shouldRetry ? 
              new Date(Date.now() + (attempts * 60000)).toISOString() : // Exponential backoff
              job.scheduled_for
          })
          .eq('id', job.id);
          
        if (updateError) {
          await logToDatabase({
            level: 'error',
            category: 'background_processor',
            message: `Failed to update job status after error`,
            details: { 
              jobId: job.id,
              updateError: updateError.message 
            },
            user_id: userId,
            job_id: job.id
          });
        }
          
        if (!shouldRetry) {
          failedJobs++;
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    await logToDatabase({
      level: 'info',
      category: 'background_processor',
      message: `Background processing completed`,
      details: { 
        totalJobs: jobs.length,
        processedJobs,
        failedJobs,
        duration: totalDuration 
      },
      user_id: userId
    });
    
    return NextResponse.json({ 
      success: true, 
      processedJobs, 
      failedJobs,
      message: `Processed ${processedJobs} jobs, ${failedJobs} failed` 
    });
    
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    await logToDatabase({
      level: 'error',
      category: 'background_processor',
      message: `Background processing failed: ${errorObj.message}`,
      details: { 
        duration: totalDuration,
        stack: errorObj.stack 
      },
      stack_trace: errorObj.stack,
      user_id: userId
    });
    
    return NextResponse.json({ 
      success: false, 
      message: errorObj.message 
    }, { status: 500 });
  }
} 