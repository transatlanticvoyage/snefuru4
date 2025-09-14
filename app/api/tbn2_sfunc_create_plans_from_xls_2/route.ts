import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { records, gridData, batchId } = await request.json();
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, message: 'No records provided' }, { status: 400 });
    }
    const supabase = createRouteHandlerClient({ cookies });
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
    }
    // Get user's DB id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();
    if (userError || !userData) {
      return NextResponse.json({ success: false, message: 'Could not find user record' }, { status: 400 });
    }
    
    // Prepare the original submission data for storage - tbn2 independent version
    const originalSubmissionData = {
      headers: gridData && gridData.length > 0 ? gridData[0] : [],
      rows: gridData && gridData.length > 1 ? gridData.slice(1).filter((row: string[]) => row.some(cell => cell.trim() !== '')) : [],
      metadata: {
        submitted_at: new Date().toISOString(),
        total_rows: gridData && gridData.length > 1 ? gridData.slice(1).filter((row: string[]) => row.some(cell => cell.trim() !== '')).length : 0,
        total_columns: gridData && gridData.length > 0 ? gridData[0].length : 0,
        processed_records_count: records.length,
        function_used: 'tbn2_sfunc_create_plans_from_xls_2', // Independent tbn2 identifier
        source_system: 'tebnar2'
      }
    };
    
    // 1. Validate the provided batch ID exists and belongs to user
    if (!batchId) {
      return NextResponse.json({ success: false, message: 'Batch ID is required' }, { status: 400 });
    }
    
    const { data: batchData, error: batchError } = await supabase
      .from('images_plans_batches')
      .select('id')
      .eq('id', batchId)
      .eq('rel_users_id', userData.id)
      .single();
    if (batchError || !batchData) {
      return NextResponse.json({ success: false, message: 'Batch not found or access denied: ' + (batchError?.message || 'Unknown error') }, { status: 404 });
    }
    // 2. Insert all images_plans rows with rel_images_plans_batches_id set
    const recordsToInsert = records.map((rec: any, index: number) => ({ 
      ...rec, 
      rel_users_id: userData.id, 
      rel_images_plans_batches_id: batchId,
      submission_order: index + 1  // Store 1-based submission order (index 0 = spreadsheet row 2, index 1 = spreadsheet row 3, etc.)
    }));
    const { data, error } = await supabase
      .from('images_plans')
      .insert(recordsToInsert)
      .select();
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ 
      success: true, 
      message: `✅ Tebnar2: Inserted ${data.length} rows in batch ${batchId}.`, 
      batch_id: batchId, 
      inserted: data,
      source_system: 'tebnar2'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}