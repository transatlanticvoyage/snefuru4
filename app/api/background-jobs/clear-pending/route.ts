import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function DELETE(request: Request) {
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
    
    // Count pending jobs before deletion
    const { count: pendingCount } = await supabase
      .from('background_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userData.id)
      .eq('status', 'pending');
    
    // Delete all pending jobs for this user
    const { error: deleteError } = await supabase
      .from('background_jobs')
      .delete()
      .eq('user_id', userData.id)
      .eq('status', 'pending');
      
    if (deleteError) {
      return NextResponse.json({ success: false, message: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Cleared ${pendingCount || 0} pending jobs`,
      clearedCount: pendingCount || 0
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 