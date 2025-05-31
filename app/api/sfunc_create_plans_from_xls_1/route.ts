import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { records } = await request.json();
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
    // 1. Create a new batch row
    const { data: batchData, error: batchError } = await supabase
      .from('images_plans_batches')
      .insert({ rel_users_id: userData.id })
      .select('id')
      .single();
    if (batchError || !batchData) {
      return NextResponse.json({ success: false, message: 'Failed to create batch: ' + (batchError?.message || 'Unknown error') }, { status: 500 });
    }
    const batchId = batchData.id;
    // 2. Insert all images_plans rows with rel_images_plans_batches_id set
    const recordsToInsert = records.map((rec: any) => ({ ...rec, rel_users_id: userData.id, rel_images_plans_batches_id: batchId }));
    const { data, error } = await supabase
      .from('images_plans')
      .insert(recordsToInsert)
      .select();
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: `Inserted ${data.length} rows in batch ${batchId}.`, batch_id: batchId, inserted: data });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 