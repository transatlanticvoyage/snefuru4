import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { keyword_id } = await request.json();

    if (!keyword_id) {
      return NextResponse.json(
        { error: 'keyword_id is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Refreshing DataForSEO data for keyword_id: ${keyword_id}`);

    // Get the keyword record
    const { data: keywordRecord, error: keywordError } = await supabase
      .from('keywordshub')
      .select('*')
      .eq('keyword_id', keyword_id)
      .single();

    if (keywordError || !keywordRecord) {
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

    if (!keywordRecord.location_code) {
      return NextResponse.json(
        { error: 'location_code is required. Please set location first.' },
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

    console.log('📡 Making DataForSEO API request...');

    // Make DataForSEO API request
    const dfsResponse = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/task_post', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        keywords: [keywordRecord.keyword_datum],
        location_code: keywordRecord.location_code,
        language_code: keywordRecord.language_code
      }])
    });

    if (!dfsResponse.ok) {
      const errorText = await dfsResponse.text();
      console.error('DataForSEO API Error:', errorText);
      return NextResponse.json(
        { error: `DataForSEO API error: ${dfsResponse.status} ${dfsResponse.statusText}`, details: errorText },
        { status: dfsResponse.status }
      );
    }

    const dfsData = await dfsResponse.json();
    console.log('📊 DataForSEO response received:', JSON.stringify(dfsData, null, 2));

    // Extract data from response
    if (!dfsData.tasks || !dfsData.tasks[0] || dfsData.tasks[0].status_code !== 20000) {
      console.error('DataForSEO task failed:', dfsData);
      return NextResponse.json(
        { error: 'DataForSEO task failed', details: dfsData },
        { status: 500 }
      );
    }

    const task = dfsData.tasks[0];
    const taskId = task.id;

    // For search volume API, we need to get the results from task_get endpoint
    console.log('📋 Getting task results...');
    
    const resultsResponse = await fetch(`https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/task_get/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!resultsResponse.ok) {
      const errorText = await resultsResponse.text();
      console.error('DataForSEO Results API Error:', errorText);
      return NextResponse.json(
        { error: `DataForSEO Results API error: ${resultsResponse.status}`, details: errorText },
        { status: resultsResponse.status }
      );
    }

    const resultsData = await resultsResponse.json();
    console.log('📈 DataForSEO results received:', JSON.stringify(resultsData, null, 2));

    // Extract keyword data
    let updateData: any = {
      api_fetched_at: new Date().toISOString()
    };

    if (resultsData.tasks && resultsData.tasks[0] && resultsData.tasks[0].result && resultsData.tasks[0].result.length > 0) {
      const keywordData = resultsData.tasks[0].result[0];
      
      updateData = {
        search_volume: keywordData.search_volume || null,
        cpc: keywordData.cpc || null,
        competition: keywordData.competition || null,
        competition_index: keywordData.competition_index || null,
        low_top_of_page_bid: keywordData.low_top_of_page_bid || null,
        high_top_of_page_bid: keywordData.high_top_of_page_bid || null,
        api_fetched_at: new Date().toISOString()
      };
    }

    // Update the keyword record
    const { error: updateError } = await supabase
      .from('keywordshub')
      .update(updateData)
      .eq('keyword_id', keyword_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update keyword data', details: updateError },
        { status: 500 }
      );
    }

    console.log('✅ Keyword data refreshed successfully');

    return NextResponse.json({
      success: true,
      message: 'Keyword data refreshed successfully',
      data: updateData
    });

  } catch (error) {
    console.error('❌ DataForSEO refresh failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refresh keyword data', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}