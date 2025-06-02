import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required' 
      }, { status: 401 });
    }

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found in database' 
      }, { status: 404 });
    }

    // Delete all error logs for this user
    const { error: deleteError } = await supabase
      .from('error_logs')
      .delete()
      .eq('user_id', userData.id);

    if (deleteError) {
      console.error('Error clearing logs:', deleteError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to clear error logs' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'All error logs cleared successfully' 
    });

  } catch (error) {
    console.error('Error in clear-logs API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 