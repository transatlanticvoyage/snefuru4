import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { keyword_ids, field } = await request.json();

    if (!keyword_ids || !Array.isArray(keyword_ids) || keyword_ids.length === 0) {
      return NextResponse.json(
        { error: 'keyword_ids array is required' },
        { status: 400 }
      );
    }

    if (!field || !['search_volume', 'cpc'].includes(field)) {
      return NextResponse.json(
        { error: 'field must be either "search_volume" or "cpc"' },
        { status: 400 }
      );
    }

    console.log(`🔄 Starting bulk DataForSEO refresh for ${keyword_ids.length} keywords (${field})`);

    // Get the keyword records
    const { data: keywordRecords, error: keywordError } = await supabase
      .from('keywordshub')
      .select('*')
      .in('keyword_id', keyword_ids);

    if (keywordError || !keywordRecords) {
      return NextResponse.json(
        { error: 'Failed to fetch keyword records' },
        { status: 404 }
      );
    }

    // Validate all records have required fields
    const invalidRecords = keywordRecords.filter(record => 
      !record.keyword_datum || !record.location_code || !record.language_code
    );

    if (invalidRecords.length > 0) {
      return NextResponse.json(
        { 
          error: `${invalidRecords.length} keywords missing required fields (keyword_datum, location_code, language_code)`,
          invalid_keyword_ids: invalidRecords.map(r => r.keyword_id)
        },
        { status: 400 }
      );
    }

    // Get DataForSEO credentials
    let username = process.env.DFS_USERNAME;
    let password = process.env.DFS_PASSWORD;

    if (!username || !password) {
      console.log('🔍 Looking for DataForSEO credentials in clevnar3 system...');
      
      const { data: dfsSlot, error: slotError } = await supabase
        .from('api_key_slots')
        .select('*')
        .ilike('slot_name', '%dataforseo%')
        .eq('slot_publicly_shown', true)
        .single();

      if (!slotError && dfsSlot) {
        console.log(`📋 Found DataForSEO slot: ${dfsSlot.slot_name}`);
        
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
            username = userApiKey.m1datum;
            password = userApiKey.m2datum;
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

    // Prepare keywords for bulk submission
    const keywords = keywordRecords.map(record => record.keyword_datum);
    
    // Group by location and language for optimal API calls
    const locationGroups = new Map();
    keywordRecords.forEach(record => {
      const key = `${record.location_code}-${record.language_code}`;
      if (!locationGroups.has(key)) {
        locationGroups.set(key, {
          location_code: record.location_code,
          language_code: record.language_code,
          keywords: [],
          keyword_ids: []
        });
      }
      locationGroups.get(key).keywords.push(record.keyword_datum);
      locationGroups.get(key).keyword_ids.push(record.keyword_id);
    });

    console.log(`📡 Making bulk DataForSEO API requests for ${locationGroups.size} location/language groups...`);

    const taskIds = [];
    const errors = [];

    // Submit tasks for each location/language group
    for (const [key, group] of locationGroups) {
      try {
        const dfsResponse = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/task_post', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{
            keywords: group.keywords,
            location_code: group.location_code,
            language_code: group.language_code
          }])
        });

        if (!dfsResponse.ok) {
          const errorText = await dfsResponse.text();
          console.error(`DataForSEO API Error for group ${key}:`, errorText);
          errors.push({ group: key, error: `API error: ${dfsResponse.status}` });
          continue;
        }

        const dfsData = await dfsResponse.json();
        console.log(`📊 DataForSEO response for group ${key}:`, JSON.stringify(dfsData, null, 2));

        if (dfsData.tasks && dfsData.tasks[0] && dfsData.tasks[0].status_code === 20100) {
          // Task created successfully
          const taskId = dfsData.tasks[0].id;
          taskIds.push({
            task_id: taskId,
            group_key: key,
            keyword_ids: group.keyword_ids,
            keywords: group.keywords
          });
          console.log(`✅ Task created for group ${key}: ${taskId}`);
        } else {
          console.error(`Task creation failed for group ${key}:`, dfsData);
          errors.push({ group: key, error: 'Task creation failed', details: dfsData });
        }
      } catch (error) {
        console.error(`Exception for group ${key}:`, error);
        errors.push({ group: key, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Store task information for later retrieval (optional - could be in a separate table)
    console.log(`📋 Created ${taskIds.length} DataForSEO tasks, ${errors.length} errors`);

    // Start a background process to check and update results
    // For now, we'll just return the task IDs and let the user refresh manually
    setTimeout(async () => {
      console.log('🔄 Starting background task result retrieval...');
      await retrieveAndUpdateResults(taskIds, supabase, username!, password!);
    }, 10000); // Check after 10 seconds

    return NextResponse.json({
      success: true,
      message: `Bulk refresh started for ${keywordRecords.length} keywords using task-based approach`,
      stats: {
        total_keywords: keywordRecords.length,
        tasks_created: taskIds.length,
        errors: errors.length,
        task_ids: taskIds.map(t => t.task_id)
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ DataForSEO bulk refresh failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start bulk refresh', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Background function to retrieve results
async function retrieveAndUpdateResults(
  taskIds: Array<{task_id: string, group_key: string, keyword_ids: number[], keywords: string[]}>,
  supabase: any,
  username: string,
  password: string
) {
  console.log(`🔍 Retrieving results for ${taskIds.length} tasks...`);
  
  for (const taskInfo of taskIds) {
    try {
      console.log(`📋 Checking task ${taskInfo.task_id}...`);
      
      const resultsResponse = await fetch(`https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/task_get/${taskInfo.task_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!resultsResponse.ok) {
        console.error(`Results API Error for task ${taskInfo.task_id}:`, resultsResponse.status);
        continue;
      }

      const resultsData = await resultsResponse.json();
      
      if (resultsData.tasks && resultsData.tasks[0] && resultsData.tasks[0].result) {
        const results = resultsData.tasks[0].result;
        console.log(`📈 Got ${results.length} results for task ${taskInfo.task_id}`);
        
        // Update database with results
        for (let i = 0; i < results.length && i < taskInfo.keyword_ids.length; i++) {
          const keywordData = results[i];
          const keywordId = taskInfo.keyword_ids[i];
          
          const updateData = {
            search_volume: keywordData.search_volume || null,
            cpc: keywordData.cpc || null,
            competition: keywordData.competition || null,
            competition_index: keywordData.competition_index || null,
            low_top_of_page_bid: keywordData.low_top_of_page_bid || null,
            high_top_of_page_bid: keywordData.high_top_of_page_bid || null,
            api_fetched_at: new Date().toISOString()
          };
          
          await supabase
            .from('keywordshub')
            .update(updateData)
            .eq('keyword_id', keywordId);
          
          console.log(`✅ Updated keyword ${keywordId} with fresh data`);
        }
      } else {
        console.log(`⏳ Task ${taskInfo.task_id} not ready yet, will retry later`);
      }
    } catch (error) {
      console.error(`Exception retrieving results for task ${taskInfo.task_id}:`, error);
    }
  }
}