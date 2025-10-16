import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fetch_id } = body;

    if (!fetch_id) {
      return NextResponse.json({ error: 'fetch_id is required' }, { status: 400 });
    }

    console.log(`🔍 Completing pending fetch_id: ${fetch_id}`);

    // Step 1: Get the fetch record to extract the task_id
    const { data: fetchRecord, error: fetchError } = await supabase
      .from('zhe_serp_fetches')
      .select('*')
      .eq('fetch_id', fetch_id)
      .single();

    if (fetchError || !fetchRecord) {
      console.error('Fetch record not found:', fetchError);
      return NextResponse.json({ error: 'Fetch record not found' }, { status: 404 });
    }

    const apiResponseJson = fetchRecord.api_response_json as any;
    if (!apiResponseJson?.task_id) {
      return NextResponse.json({ error: 'No DataForSEO task_id found in fetch record' }, { status: 400 });
    }

    const taskId = apiResponseJson.task_id;
    console.log(`📡 Retrieving results for DataForSEO task: ${taskId}`);

    // Step 2: Get DataForSEO credentials
    let username: string | undefined;
    let password: string | undefined;

    // First check environment variables
    username = process.env.DFS_USERNAME;
    password = process.env.DFS_PASSWORD;

    if (!username || !password) {
      const { data: dfsSlot, error: slotError } = await supabase
        .from('api_key_slots')
        .select('*')
        .ilike('slot_name', '%dataforseo%')
        .eq('slot_publicly_shown', true)
        .single();

      if (!slotError && dfsSlot) {
        const { data: userApiKeys } = await supabase
          .from('api_keys_t3')
          .select('*')
          .eq('fk_slot_id', dfsSlot.slot_id)
          .not('m1datum', 'is', null)
          .not('m2datum', 'is', null)
          .limit(1);

        if (userApiKeys && userApiKeys.length > 0) {
          const userApiKey = userApiKeys[0];
          username = userApiKey.m1datum;
          password = userApiKey.m2datum;
        }
      }
    }

    if (!username || !password) {
      return NextResponse.json({ error: 'DataForSEO credentials not found' }, { status: 400 });
    }

    // Step 3: Get results from DataForSEO
    const serpResultResponse = await fetch(`https://api.dataforseo.com/v3/serp/google/organic/task_get/regular/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!serpResultResponse.ok) {
      const errorText = await serpResultResponse.text();
      return NextResponse.json({ 
        error: `DataForSEO API error: ${serpResultResponse.status}`,
        details: errorText 
      }, { status: 500 });
    }

    const serpResultData = await serpResultResponse.json();
    
    if (!serpResultData.tasks || !serpResultData.tasks[0] || !serpResultData.tasks[0].result) {
      return NextResponse.json({ 
        error: 'No results available yet',
        status_code: serpResultData.tasks?.[0]?.status_code,
        status_message: serpResultData.tasks?.[0]?.status_message
      }, { status: 400 });
    }

    const serpResults = serpResultData.tasks[0].result[0];
    const organicItems = serpResults.items?.filter((item: any) => item.type === 'organic') || [];

    console.log(`✅ Retrieved ${serpResults.items?.length || 0} total items, ${organicItems.length} organic`);

    // Step 4: Update fetch record with results
    const { error: updateError } = await supabase
      .from('zhe_serp_fetches')
      .update({
        se_results_count: serpResults.items?.length?.toString() || '0',
        items_count: organicItems.length.toString(),
        api_response_json: serpResults
      })
      .eq('fetch_id', fetch_id);

    if (updateError) {
      console.error('Error updating fetch record:', updateError);
      return NextResponse.json({ error: 'Failed to update fetch record' }, { status: 500 });
    }

    // Step 5: Store organic results
    const resultsToInsert = [];
    
    for (const item of organicItems) {
      resultsToInsert.push({
        rel_fetch_id: fetch_id,
        result_type: 'organic',
        rank_in_group: item.rank_group?.toString() || null,
        rank_absolute: item.rank_absolute?.toString() || null,
        domain: item.domain || null,
        title: item.title || null,
        description: item.description || null,
        url: item.url || null,
        breadcrumb: item.breadcrumb || null,
        is_match_emd_stamp: false
      });
    }

    if (resultsToInsert.length > 0) {
      const { data: insertedResults, error: insertError } = await supabase
        .from('zhe_serp_results')
        .insert(resultsToInsert)
        .select('result_id');

      if (insertError) {
        console.error('Error storing SERP results:', insertError);
        return NextResponse.json({ 
          error: 'Failed to store SERP results',
          details: insertError.message 
        }, { status: 500 });
      }

      console.log(`✅ Stored ${insertedResults?.length || 0} organic results`);

      // Update keywordshub with completed status
      await supabase
        .from('keywordshub')
        .update({ 
          serp_results_count: insertedResults?.length || 0,
          serp_fetch_status: 'completed',
          serp_last_fetched_at: new Date().toISOString()
        })
        .eq('keyword_id', fetchRecord.rel_keyword_id);
      console.log(`📋 Updated keyword status to completed with ${insertedResults?.length || 0} results`);

      return NextResponse.json({
        success: true,
        message: `Successfully completed pending fetch and stored ${insertedResults?.length || 0} organic results.`,
        fetch_id: fetch_id,
        organic_results_stored: insertedResults?.length || 0,
        total_results_found: serpResults.items?.length || 0,
        dataforseo_task_id: taskId
      });
    } else {
      // Update keywordshub with completed status (0 results)
      await supabase
        .from('keywordshub')
        .update({ 
          serp_results_count: 0,
          serp_fetch_status: 'completed',
          serp_last_fetched_at: new Date().toISOString()
        })
        .eq('keyword_id', fetchRecord.rel_keyword_id);

      return NextResponse.json({
        success: true,
        message: 'Fetch completed but no organic results found.',
        fetch_id: fetch_id,
        organic_results_stored: 0,
        total_results_found: serpResults.items?.length || 0,
        dataforseo_task_id: taskId
      });
    }

  } catch (error) {
    console.error('❌ F400-complete function error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}