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
    
    // Get user's DB id and settings
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, background_processing_settings')
      .eq('auth_id', session.user.id)
      .single();
      
    if (userError || !userData) {
      return NextResponse.json({ success: false, message: 'Could not find user record' }, { status: 400 });
    }
    
    // Return settings or defaults
    const defaultSettings = {
      enabled: false,
      delayBetweenImages: 2000,
      delayBetweenPlans: 1000,
      maxConcurrentJobs: 1,
      retryAttempts: 3,
      autoRetry: true
    };
    
    const settings = userData.background_processing_settings || defaultSettings;
    
    return NextResponse.json({ success: true, settings });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 