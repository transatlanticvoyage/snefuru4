import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Checking for pending SERP fetches...');
    
    // Get DataForSEO credentials
    const username = process.env.DFS_USERNAME;
    const password = process.env.DFS_PASSWORD;
    
    if (!username || !password) {
      return NextResponse.json({ error: 'DataForSEO credentials not configured' }, { status: 400 });
    }

    // Find all pending fetches (where items_count is '0' and task_id exists)
    const { data: pendingFetches, error: fetchError } = await supabase
      .from('zhe_serp_fetches')
      .select('fetch_id, rel_keyword_id, api_response_json')
      .eq('items_count', '0')
      .not('api_response_json->task_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10); // Process up to 10 pending fetches at a time

    if (fetchError) {
      console.error('Error finding pending fetches:', fetchError);
      return NextResponse.json({ error: 'Failed to find pending fetches' }, { status: 500 });
    }

    if (!pendingFetches || pendingFetches.length === 0) {
      console.log('No pending fetches found');
      return NextResponse.json({ 
        success: true, 
        message: 'No pending fetches to process',
        processed: 0 
      });
    }

    console.log(`Found ${pendingFetches.length} pending fetches to check`);
    
    let processedCount = 0;
    let completedCount = 0;
    const results = [];

    for (const fetch of pendingFetches) {
      const taskId = fetch.api_response_json?.task_id;
      if (!taskId) continue;

      processedCount++;
      console.log(`Checking fetch_id ${fetch.fetch_id}, task_id: ${taskId}`);

      try {
        // Check if DataForSEO task is ready
        const serpResultResponse = await fetch(`https://api.dataforseo.com/v3/serp/google/organic/task_get/regular/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!serpResultResponse.ok) {
          console.error(`API error for task ${taskId}:`, serpResultResponse.status);
          continue;
        }

        const serpResultData = await serpResultResponse.json();
        
        if (serpResultData.tasks && serpResultData.tasks[0] && serpResultData.tasks[0].result) {
          const serpResults = serpResultData.tasks[0].result[0];
          console.log(`✅ Results ready for fetch_id ${fetch.fetch_id}`);
          
          // Update fetch record with results
          const { error: updateError } = await supabase
            .from('zhe_serp_fetches')
            .update({
              se_results_count: serpResults.items?.length?.toString() || '0',
              items_count: serpResults.items?.filter((item: any) => item.type === 'organic').length?.toString() || '0',
              api_response_json: serpResults
            })
            .eq('fetch_id', fetch.fetch_id);

          if (updateError) {
            console.error(`Error updating fetch ${fetch.fetch_id}:`, updateError);
            continue;
          }

          // Store organic results
          const organicResults = serpResults.items?.filter((item: any) => item.type === 'organic') || [];
          if (organicResults.length > 0) {
            const resultsToInsert = organicResults.map((item: any) => ({
              rel_fetch_id: fetch.fetch_id,
              result_type: 'organic',
              rank_in_group: item.rank_group?.toString() || null,
              rank_absolute: item.rank_absolute?.toString() || null,
              domain: item.domain || null,
              title: item.title || null,
              description: item.description || null,
              url: item.url || null,
              breadcrumb: item.breadcrumb || null,
              is_match_emd_stamp: false
            }));

            const { error: insertError } = await supabase
              .from('zhe_serp_results')
              .insert(resultsToInsert);

            if (insertError) {
              console.error(`Error inserting results for fetch ${fetch.fetch_id}:`, insertError);
            } else {
              completedCount++;
              results.push({
                fetch_id: fetch.fetch_id,
                keyword_id: fetch.rel_keyword_id,
                results_stored: organicResults.length
              });
            }
          }
        } else if (serpResultData.tasks && serpResultData.tasks[0] && serpResultData.tasks[0].status_code === 20000) {
          // Still processing
          console.log(`⏳ Task ${taskId} still processing`);
          
          // Update status
          await supabase
            .from('zhe_serp_fetches')
            .update({
              api_response_json: {
                ...fetch.api_response_json,
                status: 'processing',
                last_checked: new Date().toISOString(),
                message: 'DataForSEO task still processing'
              }
            })
            .eq('fetch_id', fetch.fetch_id);
        }
      } catch (error) {
        console.error(`Error processing fetch ${fetch.fetch_id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${processedCount} pending fetches, completed ${completedCount}`,
      processed: processedCount,
      completed: completedCount,
      results
    });

  } catch (error) {
    console.error('Background check error:', error);
    return NextResponse.json({ 
      error: 'Background check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to manually trigger the check
export async function GET() {
  return POST(new NextRequest('http://localhost'));
}