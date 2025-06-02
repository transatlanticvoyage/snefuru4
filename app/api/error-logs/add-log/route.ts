import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface LogEntry {
  level: 'error' | 'warning' | 'info' | 'debug';
  category: string;
  message: string;
  details?: any;
  stack_trace?: string;
  batch_id?: string;
  plan_id?: string;
  job_id?: string;
  user_id?: string; // Optional override for system logs
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      level, 
      category, 
      message, 
      details, 
      stack_trace, 
      batch_id, 
      plan_id, 
      job_id,
      user_id: userIdOverride 
    }: LogEntry = body;

    if (!level || !category || !message) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: level, category, message' 
      }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    let userId = userIdOverride;
    
    // If no user ID override, get from authenticated user
    if (!userId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ 
          success: false, 
          message: 'Authentication required or user_id must be provided' 
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

      userId = userData.id;
    }

    // Insert the log entry
    const { error: insertError } = await supabase
      .from('error_logs')
      .insert({
        user_id: userId,
        level,
        category,
        message,
        details: details || null,
        stack_trace: stack_trace || null,
        batch_id: batch_id || null,
        plan_id: plan_id || null,
        job_id: job_id || null,
        timestamp: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting log:', insertError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to insert error log' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Log entry added successfully' 
    });

  } catch (error) {
    console.error('Error in add-log API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 