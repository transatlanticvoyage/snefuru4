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
        message: 'Column already exists',
        action: 'none'
      });
    }
    
    // Try to add the column using SQL
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN background_processing_settings JSONB;'
    });

    if (addColumnError) {
      // Fallback: provide manual instructions
      return NextResponse.json({
        success: false,
        message: 'Could not add column automatically. Please add manually.',
        instruction: 'Go to Supabase Dashboard → Table Editor → users table → Add Column',
        columnDetails: {
          name: 'background_processing_settings',
          type: 'jsonb',
          nullable: true,
          default: null
        },
        sql: 'ALTER TABLE users ADD COLUMN background_processing_settings JSONB;'
      }, { status: 500 });
    }

    // Verify the column was added
    const { error: verifyError } = await supabase
      .from('users')
      .select('background_processing_settings')
      .limit(1);

    if (verifyError) {
      return NextResponse.json({
        success: false,
        message: 'Column creation uncertain. Please verify manually.',
        sql: 'ALTER TABLE users ADD COLUMN background_processing_settings JSONB;'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Column added successfully!',
      action: 'added'
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 