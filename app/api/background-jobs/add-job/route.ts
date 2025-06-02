import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { jobType, data, priority = 0 } = await request.json();
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
    
    // Check for duplicate jobs (for image generation jobs)
    if (jobType === 'generate_image' && data?.plan?.id && data?.imageSlot) {
      const { data: existingJobs, error: checkError } = await supabase
        .from('background_jobs')
        .select('id, status')
        .eq('user_id', userData.id)
        .eq('job_type', 'generate_image')
        .in('status', ['pending', 'processing']) // Only check active jobs
        .contains('data', { 
          plan: { id: data.plan.id },
          imageSlot: data.imageSlot 
        });
        
      if (checkError) {
        console.error('Error checking for duplicate jobs:', checkError);
        // Continue anyway, better to have duplicates than fail
      } else if (existingJobs && existingJobs.length > 0) {
        return NextResponse.json({ 
          success: false, 
          message: `Job already exists for plan ${data.plan.id} image slot ${data.imageSlot}`,
          isDuplicate: true 
        });
      }
    }
    
    // Add job to queue
    const { data: jobData, error: jobError } = await supabase
      .from('background_jobs')
      .insert({
        user_id: userData.id,
        job_type: jobType,
        data: data,
        priority: priority,
        status: 'pending',
        created_at: new Date().toISOString(),
        max_attempts: 3
      })
      .select()
      .single();
      
    if (jobError) {
      return NextResponse.json({ success: false, message: jobError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, job: jobData });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 