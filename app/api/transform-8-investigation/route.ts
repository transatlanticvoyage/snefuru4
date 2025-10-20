import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const results = [];
    
    // Step 1: Get exact timestamps from baobab_transform_attempts
    console.log("🔍 Step 1: Getting Transform #8 exact timestamps...");
    const { data: transformData, error: transformError } = await supabase
      .from('baobab_transform_attempts')
      .select('*')
      .eq('baobab_attempt_id', 8)
      .single();
    
    if (transformError) {
      return NextResponse.json({ 
        error: 'Could not fetch Transform #8 data', 
        details: transformError.message 
      }, { status: 500 });
    }
    
    results.push({
      step: 'Transform #8 Details',
      data: transformData
    });
    
    // Step 2: Check all release #3 records (ignore time for now)
    console.log("🔍 Step 2: Checking all release #3 records...");
    const { data: release3Data, error: release3Error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          'All leadsmart_transformed records with release_id = 3' as description,
          COUNT(*) as total_count,
          COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) as null_baobab_attempt_id,
          COUNT(*) FILTER (WHERE baobab_attempt_id IS NOT NULL) as non_null_baobab_attempt_id,
          COUNT(*) FILTER (WHERE baobab_attempt_id = 8) as already_has_attempt_8,
          MIN(created_at) as earliest_created,
          MAX(created_at) as latest_created,
          MIN(updated_at) as earliest_updated,
          MAX(updated_at) as latest_updated
        FROM leadsmart_transformed 
        WHERE jrel_release_id = 3;
      `
    });
    
    if (release3Error) {
      console.error("Error in release #3 query:", release3Error);
    } else {
      results.push({
        step: 'Release #3 Records Analysis',
        data: release3Data
      });
    }
    
    // Step 3: Check if there are ANY records in the Transform #8 time window
    console.log("🔍 Step 3: Checking records in Transform #8 time window...");
    const { data: timeWindowData, error: timeWindowError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          'ANY leadsmart_transformed records in Transform 8 time window' as description,
          COUNT(*) as total_count,
          MIN(created_at) as earliest_created,
          MAX(created_at) as latest_created,
          MIN(updated_at) as earliest_updated,
          MAX(updated_at) as latest_updated
        FROM leadsmart_transformed 
        WHERE (created_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp)
           OR (updated_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp);
      `
    });
    
    if (timeWindowError) {
      console.error("Error in time window query:", timeWindowError);
    } else {
      results.push({
        step: 'Transform #8 Time Window Records',
        data: timeWindowData
      });
    }
    
    // Step 4: Check NULL baobab_attempt_id records by release
    console.log("🔍 Step 4: Checking NULL baobab_attempt_id by release...");
    const { data: nullByReleaseData, error: nullByReleaseError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          'NULL baobab_attempt_id records by release' as analysis_type,
          jrel_release_id,
          COUNT(*) as null_records_count
        FROM leadsmart_transformed 
        WHERE baobab_attempt_id IS NULL
        GROUP BY jrel_release_id
        ORDER BY null_records_count DESC;
      `
    });
    
    if (nullByReleaseError) {
      console.error("Error in NULL by release query:", nullByReleaseError);
    } else {
      results.push({
        step: 'NULL Records by Release',
        data: nullByReleaseData
      });
    }
    
    // Step 5: Check records already with baobab_attempt_id = 8
    console.log("🔍 Step 5: Checking existing records with attempt_id = 8...");
    const { data: existing8Data, error: existing8Error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          'Records already with baobab_attempt_id = 8' as check_type,
          COUNT(*) as records_with_attempt_8
        FROM leadsmart_transformed 
        WHERE baobab_attempt_id = 8;
      `
    });
    
    if (existing8Error) {
      console.error("Error in existing 8 query:", existing8Error);
    } else {
      results.push({
        step: 'Existing Records with Attempt ID 8',
        data: existing8Data
      });
    }
    
    // Step 6: Final summary for decision making
    console.log("🔍 Step 6: Creating summary for decision making...");
    const { data: summaryData, error: summaryError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          'SUMMARY for decision making' as summary_type,
          'release_3_null_count' as metric,
          COUNT(*) as value
        FROM leadsmart_transformed 
        WHERE jrel_release_id = 3 AND baobab_attempt_id IS NULL
        
        UNION ALL
        
        SELECT 
          'SUMMARY for decision making' as summary_type,
          'existing_attempt_8_count' as metric,
          COUNT(*) as value
        FROM leadsmart_transformed 
        WHERE baobab_attempt_id = 8
        
        UNION ALL
        
        SELECT 
          'SUMMARY for decision making' as summary_type,
          'total_release_3_count' as metric,
          COUNT(*) as value
        FROM leadsmart_transformed 
        WHERE jrel_release_id = 3;
      `
    });
    
    if (summaryError) {
      console.error("Error in summary query:", summaryError);
    } else {
      results.push({
        step: 'Decision Making Summary',
        data: summaryData
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Transform #8 investigation completed',
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Investigation error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error during investigation' 
    }, { status: 500 });
  }
}