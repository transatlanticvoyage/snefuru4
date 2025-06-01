import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Create background_jobs table
    const { error: createTableError } = await supabase.rpc('create_background_jobs_table');
    
    if (createTableError) {
      // If RPC doesn't exist, create the table directly using raw SQL
      const { error: sqlError } = await supabase.from('background_jobs').select('id').limit(1);
      
      if (sqlError && sqlError.message.includes('relation "background_jobs" does not exist')) {
        return NextResponse.json({
          success: false,
          message: 'Background jobs table needs to be created manually in Supabase',
          sql: `
            CREATE TABLE IF NOT EXISTS background_jobs (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id UUID REFERENCES users(id),
              job_type VARCHAR(50) NOT NULL,
              status VARCHAR(20) DEFAULT 'pending',
              priority INTEGER DEFAULT 0,
              data JSONB NOT NULL,
              result JSONB,
              error_message TEXT,
              attempts INTEGER DEFAULT 0,
              max_attempts INTEGER DEFAULT 3,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);
            CREATE INDEX IF NOT EXISTS idx_background_jobs_user_id ON background_jobs(user_id);
            CREATE INDEX IF NOT EXISTS idx_background_jobs_scheduled_for ON background_jobs(scheduled_for);
          `
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true, message: 'Background jobs table ready' });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 