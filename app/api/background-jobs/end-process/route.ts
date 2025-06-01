import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { batchId } = await request.json();
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

    // Verify the batch belongs to this user
    const { data: batchData, error: batchError } = await supabase
      .from('images_plans_batches')
      .select('id, note1')
      .eq('id', batchId)
      .eq('rel_users_id', userData.id)
      .single();
    
    if (batchError || !batchData) {
      return NextResponse.json({ success: false, message: 'Batch not found or access denied' }, { status: 404 });
    }

    // Cancel all pending and processing background jobs related to plans in this batch
    const { data: plansInBatch } = await supabase
      .from('images_plans')
      .select('id')
      .eq('rel_images_plans_batches_id', batchId);

    if (plansInBatch && plansInBatch.length > 0) {
      // Get all background jobs that are for plans in this batch
      const { data: jobsToCancel } = await supabase
        .from('background_jobs')
        .select('id, data')
        .eq('user_id', userData.id)
        .in('status', ['pending', 'processing']);

      if (jobsToCancel) {
        const planIds = plansInBatch.map(p => p.id);
        const jobsToUpdate = jobsToCancel.filter(job => {
          return job.data?.plan?.id && planIds.includes(job.data.plan.id);
        });

        if (jobsToUpdate.length > 0) {
          const jobIds = jobsToUpdate.map(job => job.id);
          await supabase
            .from('background_jobs')
            .update({
              status: 'cancelled',
              error_message: 'Process ended by user',
              updated_at: new Date().toISOString()
            })
            .in('id', jobIds);
        }
      }
    }

    // Add a note to the batch indicating it was manually stopped
    await supabase
      .from('images_plans_batches')
      .update({
        note1: (batchData.note1 || '') + ' [Process ended by user]'
      })
      .eq('id', batchId);

    return NextResponse.json({ 
      success: true, 
      message: `Process ended for batch ${batchId}. All pending background jobs have been cancelled.` 
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 