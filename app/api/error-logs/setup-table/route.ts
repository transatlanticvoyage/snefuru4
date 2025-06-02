import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user (admin check could be added here)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required' 
      }, { status: 401 });
    }

    // Check if table exists
    const { error: tableCheckError } = await supabase
      .from('error_logs')
      .select('id')
      .limit(1);

    if (!tableCheckError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Error logs table already exists' 
      });
    }

    // Create the error_logs table
    const createTableSQL = `
      -- Create error_logs table
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

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
      CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
      CREATE INDEX IF NOT EXISTS idx_error_logs_batch_id ON error_logs(batch_id);
      CREATE INDEX IF NOT EXISTS idx_error_logs_plan_id ON error_logs(plan_id);
      CREATE INDEX IF NOT EXISTS idx_error_logs_job_id ON error_logs(job_id);

      -- Enable RLS (Row Level Security)
      ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      CREATE POLICY "Users can view their own error logs" ON error_logs
        FOR SELECT USING (auth.uid()::text = (
          SELECT auth_id FROM users WHERE id = error_logs.user_id
        ));

      CREATE POLICY "Users can insert their own error logs" ON error_logs
        FOR INSERT WITH CHECK (auth.uid()::text = (
          SELECT auth_id FROM users WHERE id = error_logs.user_id
        ));

      CREATE POLICY "Users can delete their own error logs" ON error_logs
        FOR DELETE USING (auth.uid()::text = (
          SELECT auth_id FROM users WHERE id = error_logs.user_id
        ));
    `;

    // Execute the SQL using a stored procedure (if available) or direct execution
    try {
      // Try using rpc first
      const { error: rpcError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (rpcError) {
        throw rpcError;
      }
    } catch (rpcError) {
      // If rpc fails, provide manual instructions
      return NextResponse.json({ 
        success: false, 
        message: 'Could not create table automatically. Please run the following SQL in your Supabase SQL editor:',
        sql: createTableSQL 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Error logs table created successfully with all indexes and security policies' 
    });

  } catch (error) {
    console.error('Error setting up error_logs table:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to set up error logs table' 
    }, { status: 500 });
  }
} 