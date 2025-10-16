import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  let keyword_id: number | undefined;
  
  try {
    console.log('🚀 F400 LIVE - Direct SERP Fetch starting...');
    
    const body = await request.json();
    keyword_id = body.keyword_id;

    if (!keyword_id) {
      return NextResponse.json({ error: 'keyword_id is required' }, { status: 400 });
    }

    // Get keyword data
    const { data: keywordData, error: keywordError } = await supabase
      .from('keywordshub')
      .select('*')
      .eq('keyword_id', keyword_id)
      .single();

    if (keywordError || !keywordData) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    console.log(`📋 Keyword: "${keywordData.keyword_datum}"`);
    console.log(`🌍 Location: ${keywordData.rel_dfs_location_code}`);

    // Use LIVE endpoint instead of task_post
    const username = process.env.DFS_USERNAME;
    const password = process.env.DFS_PASSWORD;
    
    if (!username || !password) {
      return NextResponse.json({ error: 'DataForSEO credentials not configured' }, { status: 400 });
    }

    console.log('📡 Using LIVE endpoint for immediate results...');
    
    const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        keyword: keywordData.keyword_datum,
        location_code: keywordData.rel_dfs_location_code || 2840,
        language_code: keywordData.language_code || 'en',
        depth: 100,
        device: 'desktop',
        os: 'windows'
      }])
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DataForSEO error:', errorText);
      return NextResponse.json({ 
        error: 'DataForSEO API error',
        details: errorText 
      }, { status: 500 });
    }

    const data = await response.json();
    
    if (!data.tasks || !data.tasks[0] || !data.tasks[0].result) {
      return NextResponse.json({ 
        error: 'No results from DataForSEO',
        raw_response: data
      }, { status: 500 });
    }

    const serpResults = data.tasks[0].result[0];
    console.log(`✅ Got ${serpResults.items?.length || 0} items immediately`);

    // Update keywordshub with pending status (brief moment before completion)
    await supabase
      .from('keywordshub')
      .update({ 
        serp_fetch_status: 'pending',
        serp_last_fetched_at: new Date().toISOString()
      })
      .eq('keyword_id', keyword_id);

    // Create fetch record
    const { data: fetchRecord, error: fetchError } = await supabase
      .from('zhe_serp_fetches')
      .insert({
        rel_keyword_id: keyword_id,
        se_domain: 'google.com',
        check_url: serpResults.check_url || `https://www.google.com/search?q=${encodeURIComponent(keywordData.keyword_datum)}`,
        fetched_at: new Date().toISOString(),
        se_results_count: serpResults.se_results_count?.toString() || '0',
        items_count: serpResults.items?.filter(item => item.type === 'organic').length?.toString() || '0',
        api_response_json: serpResults
      })
      .select('fetch_id')
      .single();

    if (fetchError) {
      console.error('Error creating fetch record:', fetchError);
    }

    const fetchId = fetchRecord?.fetch_id || null;

    // Store organic results
    const organicResults = serpResults.items?.filter((item: any) => item.type === 'organic') || [];
    let storedCount = 0;
    
    if (organicResults.length > 0 && fetchId) {
      const resultsToInsert = organicResults.map((item: any) => ({
        rel_fetch_id: fetchId,
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

      const { data: insertedResults, error: insertError } = await supabase
        .from('zhe_serp_results')
        .insert(resultsToInsert)
        .select('result_id');

      if (!insertError) {
        storedCount = insertedResults?.length || 0;
        console.log(`💾 Stored ${storedCount} organic results`);
      } else {
        console.error('Error storing results:', insertError);
      }
    }

    // Update keywordshub with completed status
    await supabase
      .from('keywordshub')
      .update({ 
        serp_results_count: storedCount,
        serp_fetch_status: 'completed',
        serp_last_fetched_at: new Date().toISOString()
      })
      .eq('keyword_id', keyword_id);
    console.log(`📋 Updated keyword status to completed with ${storedCount} results`);

    return NextResponse.json({
      success: true,
      message: `F400 LIVE fetch completed successfully`,
      keyword_id: keyword_id,
      keyword_datum: keywordData.keyword_datum,
      fetch_id: fetchId,
      total_items: serpResults.items?.length || 0,
      organic_results_stored: storedCount,
      se_results_count: serpResults.se_results_count,
      cost: data.tasks[0].cost || 0.002
    });

  } catch (error) {
    console.error('F400 LIVE error:', error);
    
    // Update keywordshub with error status if we have keyword_id
    if (keyword_id) {
      await supabase
        .from('keywordshub')
        .update({ 
          serp_fetch_status: 'error',
          serp_last_fetched_at: new Date().toISOString()
        })
        .eq('keyword_id', keyword_id);
    }
    
    return NextResponse.json({ 
      error: 'F400 LIVE fetch failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}