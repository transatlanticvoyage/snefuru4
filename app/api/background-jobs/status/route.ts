import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
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
    
    // Get queue statistics
    const [pendingResult, processingResult, completedResult, failedResult] = await Promise.all([
      supabase.from('background_jobs').select('id', { count: 'exact', head: true }).eq('user_id', userData.id).eq('status', 'pending'),
      supabase.from('background_jobs').select('*').eq('user_id', userData.id).eq('status', 'processing'),
      supabase.from('background_jobs').select('id', { count: 'exact', head: true }).eq('user_id', userData.id).eq('status', 'completed'),
      supabase.from('background_jobs').select('id', { count: 'exact', head: true }).eq('user_id', userData.id).eq('status', 'failed')
    ]);
    
    const currentJob = processingResult.data && processingResult.data.length > 0 ? 
      processingResult.data[0] : null;
    
    return NextResponse.json({
      success: true,
      status: {
        queueLength: pendingResult.count || 0,
        isRunning: !!currentJob,
        currentJob: currentJob ? `${currentJob.job_type} - ${currentJob.data?.plan?.e_file_name1 || 'Unknown'}` : null,
        completedJobs: completedResult.count || 0,
        failedJobs: failedResult.count || 0
      }
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 