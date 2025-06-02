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
      // Create the error_logs table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS error_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          level TEXT NOT NULL CHECK (level IN ('error', 'warning', 'info', 'debug')),
          category TEXT NOT NULL,
          message TEXT NOT NULL,
          details JSONB,
          stack_trace TEXT,
          batch_id TEXT,
          plan_id TEXT,
          job_id TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
        CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createTableQuery 
      });

      if (createError) {
        console.error('Failed to create error_logs table:', createError);
        return NextResponse.json({ 
          success: false, 
          message: 'Database table missing. Please create error_logs table in Supabase.' 
        }, { status: 500 });
      }
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