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
    
    // Add job to queue
    const { data: jobData, error: jobError } = await supabase
      .from('background_jobs')
      .insert({
        user_id: userData.id,
        job_type: jobType,
        data: data,
        priority: priority,
        status: 'pending'
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