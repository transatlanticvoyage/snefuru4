import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sfunc_create_image_with_openai } from '../../sfunc_create_plans_make_images_1/sfunc_create_image_with_openai';

export async function POST(request: Request) {
  try {
    const { settings } = await request.json();
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
      return NextResponse.json({ success: false, message: jobsError.message }, { status: 500 });
    }
    
    let processedJobs = 0;
    let failedJobs = 0;
    
    for (const job of jobs) {
      try {
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
          
          const prompt = plan.e_prompt1 || plan.e_more_instructions1 || plan.e_file_name1 || 'AI Image';
          
          const imageResult = await sfunc_create_image_with_openai({
            prompt,
            userId: userData.id,
            batchFolder,
            fileName
          });
          
          if (imageResult.success) {
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
              // Update the plan with the new image
              await supabase
                .from('images_plans')
                .update({ [`fk_image${imageSlot}_id`]: imageInsert.id })
                .eq('id', plan.id);
                
              result = { imageId: imageInsert.id, url: imageResult.url };
            } else {
              throw new Error(imageError?.message || 'Failed to save image');
            }
          } else {
            throw new Error(imageResult.error || 'Failed to generate image');
          }
        }
        
        // Mark job as completed
        await supabase
          .from('background_jobs')
          .update({ 
            status: 'completed',
            result: result,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
          
        processedJobs++;
        
        // Add delay between jobs if specified
        if (settings?.delayBetweenImages && processedJobs < jobs.length) {
          await new Promise(resolve => setTimeout(resolve, settings.delayBetweenImages));
        }
        
      } catch (error) {
        // Mark job as failed
        const attempts = (job.attempts || 0) + 1;
        const shouldRetry = attempts < (job.max_attempts || 3);
        
        await supabase
          .from('background_jobs')
          .update({ 
            status: shouldRetry ? 'pending' : 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            attempts: attempts,
            updated_at: new Date().toISOString(),
            scheduled_for: shouldRetry ? 
              new Date(Date.now() + (attempts * 60000)).toISOString() : // Exponential backoff
              job.scheduled_for
          })
          .eq('id', job.id);
          
        if (!shouldRetry) {
          failedJobs++;
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      processedJobs, 
      failedJobs,
      message: `Processed ${processedJobs} jobs, ${failedJobs} failed` 
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 