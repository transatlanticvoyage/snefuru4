import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log('🔍 Checking dfs_locations table schema...');

    // Try to get table information from PostgreSQL system tables
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'dfs_locations' 
        ORDER BY ordinal_position;
      `
    });

    if (error) {
      // Fallback: try to select from the table to see what columns exist
      console.log('RPC failed, trying direct select...');
      const { data: sampleData, error: selectError } = await supabase
        .from('dfs_locations')
        .select('*')
        .limit(1);

      if (selectError) {
        return NextResponse.json({
          error: 'Cannot access dfs_locations table',
          details: selectError,
          suggestion: 'Table might not exist or have permission issues'
        }, { status: 500 });
      }

      // If we get here, table exists but we can't get schema info
      const columns = sampleData && sampleData.length > 0 
        ? Object.keys(sampleData[0])
        : ['No data to determine schema'];

      return NextResponse.json({
        success: true,
        method: 'direct_select',
        columns: columns,
        sample_data: sampleData?.[0] || null,
        note: 'Could not get schema info, but table exists'
      });
    }

    return NextResponse.json({
      success: true,
      method: 'schema_query',
      schema: data,
      table_exists: true
    });

  } catch (error) {
    console.error('❌ Schema check failed:', error);
    return NextResponse.json(
      { 
        error: 'Schema check failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}