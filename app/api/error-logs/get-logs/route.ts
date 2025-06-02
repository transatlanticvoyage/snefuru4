import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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

    // Check if error_logs table exists, if not create it
    const { error: tableCheckError } = await supabase
      .from('error_logs')
      .select('id')
      .limit(1);

    if (tableCheckError && tableCheckError.message.includes('relation "error_logs" does not exist')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error logs table does not exist. Please create it using the "Setup DB Table" button or manually in Supabase dashboard.',
        details: 'Table "error_logs" not found in database'
      }, { status: 404 });
    }

    // Fetch error logs for the user
    const { data: logs, error: logsError } = await supabase
      .from('error_logs')
      .select('*')
      .eq('user_id', userData.id)
      .order('timestamp', { ascending: false })
      .limit(1000); // Limit to last 1000 logs

    if (logsError) {
      console.error('Error fetching logs:', logsError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch error logs' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      logs: logs || [] 
    });

  } catch (error) {
    console.error('Error in get-logs API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 