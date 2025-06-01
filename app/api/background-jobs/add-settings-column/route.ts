import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if column already exists by trying to select it
    const { error: columnCheckError } = await supabase
      .from('users')
      .select('background_processing_settings')
      .limit(1);
    
    if (!columnCheckError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Column already exists' 
      });
    }
    
    // Column doesn't exist, so we need to add it
    // Note: This will fail in Supabase if we don't have direct SQL access
    // The column needs to be added manually in the Supabase dashboard
    return NextResponse.json({
      success: false,
      message: 'Column needs to be added manually in Supabase dashboard',
      instruction: 'Add a JSONB column named "background_processing_settings" to the "users" table',
      sql: 'ALTER TABLE users ADD COLUMN background_processing_settings JSONB;'
    }, { status: 500 });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 