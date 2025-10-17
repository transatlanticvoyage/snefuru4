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

    // Get all fetches for this batch
    const { data: existingFetches, error: fetchesError } = await supabase
      .from('zhe_serp_fetches')
      .select('rel_keyword_id')
      .eq('batch_id', batch_id);

    if (fetchesError) {
      return NextResponse.json({ error: 'Failed to fetch existing fetches' }, { status: 500 });
    }

    const processedKeywordIds = new Set((existingFetches || []).map(f => f.rel_keyword_id));

    // Determine which keywords need processing based on batch source
    let allKeywordIds: number[] = [];

    if (batch.batch_source === 'bulk-kwjar') {
      // For kwjar batches, we need to find keywords that should be in this batch
      // This is tricky - we need to identify which keywords were part of the original batch
      // The best we can do is look at the existing fetches and identify patterns
      
      // Get all keyword IDs that have at least one fetch in this batch
      const { data: batchKeywords, error: kwError } = await supabase
        .from('zhe_serp_fetches')
        .select('rel_keyword_id')
        .eq('batch_id', batch_id);

      if (kwError) {
        return NextResponse.json({ error: 'Failed to identify batch keywords' }, { status: 500 });
      }

      // These are the keywords that were intended for this batch
      allKeywordIds = Array.from(new Set((batchKeywords || []).map(f => f.rel_keyword_id)));
    }

    // Find pending keywords (those that don't have fetches yet or have failed fetches)
    const { data: failedFetches, error: failedError } = await supabase
      .from('zhe_serp_fetches')
      .select('rel_keyword_id, items_count')
      .eq('batch_id', batch_id)
      .or('items_count.eq.0,items_count.is.null');

    if (failedError) {
      console.error('Error fetching failed keywords:', failedError);
    }

    // Keywords that failed (have fetch records but items_count is 0 or null)
    const failedKeywordIds = (failedFetches || []).map(f => f.rel_keyword_id);

    // Calculate pending: keywords in batch that aren't completed
    const pendingCount = batch.total_keywords - batch.completed_keywords - batch.failed_keywords;

    if (pendingCount === 0 && failedKeywordIds.length === 0) {
      return NextResponse.json({ 
        error: 'No pending keywords to process', 
        pending_keywords: 0 
      }, { status: 400 });
    }

    // Start background processing
    // Note: In a production environment, you'd want to use a job queue
    // For now, we'll trigger the processing and return immediately
    processKeywordsInBackground(batch_id, failedKeywordIds, user_id);

    return NextResponse.json({
      success: true,
      message: 'Batch resume initiated',
      batch_id: batch_id,
      pending_keywords: failedKeywordIds.length || pendingCount,
      note: 'Processing will continue in the background'
    });

  } catch (error) {
    console.error('Gazelle resume error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Background processing function
async function processKeywordsInBackground(
  batchId: number, 
  keywordIds: number[], 
  userId: string | null
) {
  console.log(`🔄 Starting background processing for batch #${batchId} with ${keywordIds.length} keywords`);

  for (const keywordId of keywordIds) {
    try {
      console.log(`Processing keyword ${keywordId} for batch #${batchId}`);

      // Step 1: Run F400 (SERP Fetch) - Use live mode for resume
      const f400Response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/f400-live`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword_id: keywordId,
          batch_id: batchId,
          fetch_source: 'bulk-kwjar',
          initiated_by_user_id: userId
        }),
      });

      const f400Result = await f400Response.json();

      if (!f400Response.ok) {
        throw new Error(f400Result.error || 'F400 failed');
      }

      // Step 2: Run F410 (EMD Stamp Match)
      const f410Response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/f410`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword_id: keywordId,
        }),
      });

      const f410Result = await f410Response.json();

      if (!f410Response.ok) {
        throw new Error(f410Result.error || 'F410 failed');
      }

      // Step 3: Run F420 (Cache Ranking Zones)
      const f420Response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/f420`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword_id: keywordId,
          emd_stamp_method: 'method-1',
        }),
      });

      const f420Result = await f420Response.json();

      if (!f420Response.ok) {
        throw new Error(f420Result.error || 'F420 failed');
      }

      // Update batch progress (success)
      const { data: currentBatch } = await supabase
        .from('zhe_serp_fetch_batches')
        .select('completed_keywords, failed_keywords')
        .eq('batch_id', batchId)
        .single();

      if (currentBatch) {
        await supabase.rpc('update_batch_progress', {
          p_batch_id: batchId,
          p_completed: currentBatch.completed_keywords + 1,
          p_failed: currentBatch.failed_keywords,
          p_status: null // Keep as in_progress
        });
      }

      console.log(`✅ Keyword ${keywordId} processed successfully`);

    } catch (error) {
      console.error(`❌ Error processing keyword ${keywordId}:`, error);

      // Update batch progress (failure)
      const { data: currentBatch } = await supabase
        .from('zhe_serp_fetch_batches')
        .select('completed_keywords, failed_keywords')
        .eq('batch_id', batchId)
        .single();

      if (currentBatch) {
        await supabase.rpc('update_batch_progress', {
          p_batch_id: batchId,
          p_completed: currentBatch.completed_keywords,
          p_failed: currentBatch.failed_keywords + 1,
          p_status: null // Keep as in_progress
        });
      }
    }
  }

  // Mark batch as completed after processing all keywords
  const { data: finalBatch } = await supabase
    .from('zhe_serp_fetch_batches')
    .select('total_keywords, completed_keywords, failed_keywords')
    .eq('batch_id', batchId)
    .single();

  if (finalBatch) {
    const allProcessed = (finalBatch.completed_keywords + finalBatch.failed_keywords) >= finalBatch.total_keywords;
    
    if (allProcessed) {
      const finalStatus = finalBatch.failed_keywords === finalBatch.total_keywords ? 'failed' : 'completed';
      await supabase.rpc('update_batch_progress', {
        p_batch_id: batchId,
        p_status: finalStatus
      });
      console.log(`✅ Batch #${batchId} marked as ${finalStatus}`);
    }
  }

  console.log(`🎉 Background processing complete for batch #${batchId}`);
}

