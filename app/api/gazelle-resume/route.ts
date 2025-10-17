import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batch_id, user_id } = body;

    if (!batch_id) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    // Get the batch details
    const { data: batch, error: batchError } = await supabase
      .from('zhe_serp_fetch_batches')
      .select('*')
      .eq('batch_id', batch_id)
      .single();

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Find keywords that failed or are pending
    // These are keywords with fetch records where items_count is 0 or null
    const { data: failedFetches, error: failedError } = await supabase
      .from('zhe_serp_fetches')
      .select('rel_keyword_id, items_count')
      .eq('batch_id', batch_id)
      .or('items_count.eq.0,items_count.is.null');

    if (failedError) {
      return NextResponse.json({ error: 'Failed to fetch pending keywords' }, { status: 500 });
    }

    // Get unique keyword IDs that need processing
    const keywordIdsToProcess = Array.from(new Set((failedFetches || []).map(f => f.rel_keyword_id)));

    if (keywordIdsToProcess.length === 0) {
      return NextResponse.json({ 
        error: 'No pending keywords to process', 
        pending_keywords: 0 
      }, { status: 400 });
    }

    // Return the list of keywords for client-side processing
    // This allows the client to make sequential calls and show real progress
    return NextResponse.json({
      success: true,
      message: 'Keywords identified for processing',
      batch_id: batch_id,
      keyword_ids: keywordIdsToProcess,
      pending_keywords: keywordIdsToProcess.length,
      batch_name: batch.batch_name
    });

  } catch (error) {
    console.error('Gazelle resume error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

