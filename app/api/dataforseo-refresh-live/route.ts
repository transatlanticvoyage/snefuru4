import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  console.log('🟦 [API LIVE] Endpoint called at', new Date().toISOString());
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { keyword_id } = await request.json();
    console.log('🟦 [API LIVE] Request body:', { keyword_id });

    if (!keyword_id) {
      return NextResponse.json(
        { error: 'keyword_id is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Refreshing DataForSEO data (LIVE) for keyword_id: ${keyword_id}`);

    // Get the keyword record
    console.log('🟦 [API LIVE] Fetching keyword from database...');
    const { data: keywordRecord, error: keywordError } = await supabase
      .from('keywordshub')
      .select('*')
      .eq('keyword_id', keyword_id)
      .single();

    console.log('🟦 [API LIVE] Database query result:', {
      found: !!keywordRecord,
      error: keywordError,
      keyword_datum: keywordRecord?.keyword_datum,
      rel_dfs_location_code: keywordRecord?.rel_dfs_location_code,
      language_code: keywordRecord?.language_code,
      current_search_volume: keywordRecord?.search_volume,
      current_cpc: keywordRecord?.cpc
    });

    if (keywordError || !keywordRecord) {
      console.error('🟦 [API LIVE] Keyword not found in database');
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    // Validate required fields for DataForSEO
    if (!keywordRecord.keyword_datum) {
      return NextResponse.json(
        { error: 'keyword_datum is required' },
        { status: 400 }
      );
    }

    if (!keywordRecord.rel_dfs_location_code) {
      return NextResponse.json(
        { error: 'rel_dfs_location_code is required. Please set location first.' },
        { status: 400 }
      );
    }

    if (!keywordRecord.language_code) {
      return NextResponse.json(
        { error: 'language_code is required. Please set language first.' },
        { status: 400 }
      );
    }

    // Get DataForSEO credentials from environment (fallback method)
    let username = process.env.DFS_USERNAME;
    let password = process.env.DFS_PASSWORD;
    console.log('🟦 [API LIVE] Checking for credentials...', {
      env_credentials_found: !!(username && password)
    });

    // Try to get credentials from clevnar3 API key system
    if (!username || !password) {
      console.log('🔍 Looking for DataForSEO credentials in clevnar3 system...');
      
      // Find DataForSEO slot in api_key_slots
      const { data: dfsSlot, error: slotError } = await supabase
        .from('api_key_slots')
        .select('*')
        .ilike('slot_name', '%dataforseo%')
        .eq('slot_publicly_shown', true)
        .single();

      if (!slotError && dfsSlot) {
        console.log(`📋 Found DataForSEO slot: ${dfsSlot.slot_name}`);
        
        // Get user's API key for this slot
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', request.headers.get('user-auth-id'))
          .single();

        if (userData) {
          const { data: userApiKey } = await supabase
            .from('api_keys_t3')
            .select('*')
            .eq('fk_user_id', userData.id)
            .eq('fk_slot_id', dfsSlot.slot_id)
            .single();

          if (userApiKey && userApiKey.m1datum && userApiKey.m2datum) {
            username = userApiKey.m1datum; // Assuming m1 is username
            password = userApiKey.m2datum; // Assuming m2 is password
            console.log('✅ Using credentials from clevnar3 system');
          }
        }
      }
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: 'DataForSEO credentials not configured. Please set up in /clevnar3 or environment variables.' },
        { status: 400 }
      );
    }

    console.log('📡 Making DataForSEO LIVE API request...');
    const requestPayload = [{
      keywords: [keywordRecord.keyword_datum],
      location_code: keywordRecord.rel_dfs_location_code,
      language_code: keywordRecord.language_code
    }];
    console.log('🟦 [API LIVE] DataForSEO request payload:', JSON.stringify(requestPayload, null, 2));

    // Make DataForSEO LIVE API request (synchronous)
    const dfsResponse = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });
    
    console.log('🟦 [API LIVE] DataForSEO response status:', dfsResponse.status, dfsResponse.statusText);

    if (!dfsResponse.ok) {
      const errorText = await dfsResponse.text();
      console.error('DataForSEO API Error:', errorText);
      return NextResponse.json(
        { error: `DataForSEO API error: ${dfsResponse.status} ${dfsResponse.statusText}`, details: errorText },
        { status: dfsResponse.status }
      );
    }

    const dfsData = await dfsResponse.json();
    console.log('📊 DataForSEO LIVE response received:', JSON.stringify(dfsData, null, 2));
    console.log('🟦 [API LIVE] Response structure:', {
      has_tasks: !!dfsData.tasks,
      task_count: dfsData.tasks?.length,
      first_task_status: dfsData.tasks?.[0]?.status_code,
      first_task_result_count: dfsData.tasks?.[0]?.result?.length
    });

    // Extract data from response
    if (!dfsData.tasks || !dfsData.tasks[0] || dfsData.tasks[0].status_code !== 20000) {
      console.error('DataForSEO task failed:', dfsData);
      return NextResponse.json(
        { error: 'DataForSEO task failed', details: dfsData },
        { status: 500 }
      );
    }

    const task = dfsData.tasks[0];
    
    // Extract keyword data from live response
    let updateData: any = {
      api_fetched_at: new Date().toISOString()
    };

    if (task.result && task.result.length > 0) {
      const keywordData = task.result[0];
      console.log('🟦 [API LIVE] Extracted keyword data from response:', keywordData);
      
      updateData = {
        search_volume: keywordData.search_volume || null,
        cpc: keywordData.cpc || null,
        competition: keywordData.competition || null,
        competition_index: keywordData.competition_index || null,
        low_top_of_page_bid: keywordData.low_top_of_page_bid || null,
        high_top_of_page_bid: keywordData.high_top_of_page_bid || null,
        api_fetched_at: new Date().toISOString()
      };
      console.log('🟦 [API LIVE] Prepared update data:', updateData);
    } else {
      console.warn('🟦 [API LIVE] No result data found in task response');
    }

    // Update the keyword record
    console.log('🟦 [API LIVE] Updating database with new data...');
    const { data: updatedRecord, error: updateError } = await supabase
      .from('keywordshub')
      .update(updateData)
      .eq('keyword_id', keyword_id)
      .select()
      .single();

    if (updateError) {
      console.error('🟦 [API LIVE] Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update keyword data', details: updateError },
        { status: 500 }
      );
    }

    console.log('🟦 [API LIVE] Database update successful. Updated record:', {
      keyword_id: updatedRecord?.keyword_id,
      new_search_volume: updatedRecord?.search_volume,
      new_cpc: updatedRecord?.cpc,
      api_fetched_at: updatedRecord?.api_fetched_at
    });
    console.log('✅ Keyword data refreshed successfully (LIVE)');

    return NextResponse.json({
      success: true,
      message: 'Keyword data refreshed successfully using live endpoint',
      data: updateData
    });

  } catch (error) {
    console.error('❌ DataForSEO live refresh failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refresh keyword data', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}