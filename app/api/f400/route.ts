import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Add timeout protection - kill process after 15 minutes
  const timeoutId = setTimeout(() => {
    console.error('F400 process timed out after 15 minutes');
    throw new Error('F400 process timed out');
  }, 15 * 60 * 1000);

  let keyword_id: number | undefined;

  try {
    console.log('🚀 F400 ZHE SERP Fetch starting...');
    
    const body = await request.json();
    keyword_id = body.keyword_id;
    const batch_id = body.batch_id || null;  // Optional: for batch tracking
    const fetch_source = body.fetch_source || 'manual-serpjar';  // Default to manual
    const initiated_by_user_id = body.initiated_by_user_id || null;  // Optional: user tracking

    if (!keyword_id) {
      return NextResponse.json({ error: 'keyword_id is required' }, { status: 400 });
    }

    console.log(`📋 Processing keyword_id: ${keyword_id}`);

    // Step 1: Get keyword data from keywordshub
    const { data: keywordData, error: keywordError } = await supabase
      .from('keywordshub')
      .select('*')
      .eq('keyword_id', keyword_id)
      .single();

    if (keywordError || !keywordData) {
      console.error('Keyword not found:', keywordError);
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    console.log(`🔍 Keyword: "${keywordData.keyword_datum}"`);
    console.log(`🌍 Location: ${keywordData.location_display_name} (${keywordData.rel_dfs_location_code})`);
    console.log(`🗣️ Language: ${keywordData.language_name} (${keywordData.language_code})`);

    // Validate required fields
    if (!keywordData.keyword_datum || !keywordData.rel_dfs_location_code || !keywordData.language_code) {
      return NextResponse.json({ 
        error: 'Keyword missing required fields (keyword_datum, rel_dfs_location_code, language_code)' 
      }, { status: 400 });
    }

    // Step 2: Get DataForSEO credentials from clevnar3 system
    let username: string | undefined;
    let password: string | undefined;

    console.log('🔐 Looking for DataForSEO credentials...');
    
    // First check environment variables
    username = process.env.DFS_USERNAME;
    password = process.env.DFS_PASSWORD;

    if (!username || !password) {
      console.log('🔍 Environment variables not set, checking clevnar3 system...');
      
      const { data: dfsSlot, error: slotError } = await supabase
        .from('api_key_slots')
        .select('*')
        .ilike('slot_name', '%dataforseo%')
        .eq('slot_publicly_shown', true)
        .single();

      if (!slotError && dfsSlot) {
        console.log(`📋 Found DataForSEO slot: ${dfsSlot.slot_name}`);
        
        // Get the auth header to find the user
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '');
          
          // In a real implementation, you'd decode the JWT token
          // For now, we'll try a different approach using the user context
          console.log('🔍 Looking for user API keys...');
          
          // Get all user API keys for this slot (simplified approach)
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
            console.log('✅ Using credentials from clevnar3 system');
          }
        }
      }
    }

    if (!username || !password) {
      console.error('❌ DataForSEO credentials not found');
      return NextResponse.json(
        { error: 'DataForSEO credentials not configured. Please set up in /clevnar3 or environment variables.' },
        { status: 400 }
      );
    }

    console.log('✅ DataForSEO credentials found');

    // Step 3: Submit SERP task to DataForSEO
    console.log('📡 Submitting SERP task to DataForSEO...');
    
    const serpTaskResponse = await fetch('https://api.dataforseo.com/v3/serp/google/organic/task_post', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        keyword: keywordData.keyword_datum,
        location_code: keywordData.rel_dfs_location_code,
        language_code: keywordData.language_code,
        device: 'desktop',
        os: 'windows',
        depth: 100, // Get up to 100 results
        calculate_rectangles: true
      }])
    });

    if (!serpTaskResponse.ok) {
      const errorText = await serpTaskResponse.text();
      console.error('DataForSEO SERP API Error:', errorText);
      return NextResponse.json({ 
        error: `DataForSEO API error: ${serpTaskResponse.status}`,
        details: errorText 
      }, { status: 500 });
    }

    const serpTaskData = await serpTaskResponse.json();
    console.log('📊 SERP Task response:', serpTaskData);

    if (!serpTaskData.tasks || !serpTaskData.tasks[0] || serpTaskData.tasks[0].status_code !== 20100) {
      console.error('SERP task creation failed:', serpTaskData);
      return NextResponse.json({ 
        error: 'SERP task creation failed',
        details: serpTaskData 
      }, { status: 500 });
    }

    const serpTaskId = serpTaskData.tasks[0].id;
    console.log(`✅ SERP task created: ${serpTaskId}`);

    // Step 4: Create fetch record immediately
    console.log('📋 Creating fetch record...');
    
    const { data: fetchRecord, error: fetchError} = await supabase
      .from('zhe_serp_fetches')
      .insert({
        rel_keyword_id: keyword_id,
        se_domain: 'google.com',
        check_url: `https://www.google.com/search?q=${encodeURIComponent(keywordData.keyword_datum)}`,
        fetched_at: new Date().toISOString(),
        se_results_count: '0', // Will update when results come in
        items_count: '0',
        api_response_json: { task_id: serpTaskId, status: 'pending', message: 'DataForSEO task submitted, waiting for results' },
        batch_id: batch_id,
        fetch_source: fetch_source,
        initiated_by_user_id: initiated_by_user_id
      })
      .select('fetch_id')
      .single();

    if (fetchError) {
      console.error('Error creating fetch record:', fetchError);
    }

    const fetchId = fetchRecord?.fetch_id || null;
    console.log(`📋 Created fetch record: ${fetchId}`);

    // Update fetch versioning system
    if (fetchId) {
      console.log(`📋 F400: Updating fetch versioning for keyword ${keyword_id}, fetch ${fetchId}`);
      const { error: versionError } = await supabase.rpc('update_fetch_versioning', {
        p_keyword_id: keyword_id,
        p_new_fetch_id: fetchId
      });
      
      if (versionError) {
        console.error('Error updating fetch versioning:', versionError);
      } else {
        console.log('✅ F400: Fetch versioning updated');
      }
    }

    // Update keywordshub with pending status
    await supabase
      .from('keywordshub')
      .update({ 
        serp_fetch_status: 'pending',
        serp_last_fetched_at: new Date().toISOString()
      })
      .eq('keyword_id', keyword_id);
    console.log('📋 Updated keyword status to pending');

    // Step 5: Try to get SERP results with extended timeout (10 minutes)
    console.log('⏳ Attempting to retrieve SERP results...');
    
    let serpResults = null;
    let retries = 0;
    const maxRetries = 60; // 10 minutes total (10 seconds * 60)
    const checkInterval = 10000; // Check every 10 seconds
    const quickCheckPeriod = 30; // Quick checks for first 5 minutes (30 * 10s)
    
    while (retries < maxRetries) {
      // Wait before checking (shorter wait time for first 5 minutes)
      const waitTime = retries < quickCheckPeriod ? checkInterval : checkInterval * 2; // 20s intervals after 5 min
      await new Promise(resolve => setTimeout(resolve, waitTime));
      retries++;
      
      const elapsedMinutes = Math.floor((retries * checkInterval) / 60000);
      const elapsedSeconds = ((retries * checkInterval) / 1000) % 60;
      console.log(`🔄 Checking SERP results (attempt ${retries}/${maxRetries}) - ${elapsedMinutes}m ${elapsedSeconds}s elapsed...`);
      
      try {
        const serpResultResponse = await fetch(`https://api.dataforseo.com/v3/serp/google/organic/task_get/regular/${serpTaskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!serpResultResponse.ok) {
          console.error(`SERP results API error (attempt ${retries}):`, serpResultResponse.status);
          // Don't give up immediately on API errors, they might be temporary
          if (retries >= 10) { // Only break after 10 failed attempts
            break;
          }
          continue;
        }

        const serpResultData = await serpResultResponse.json();
        
        if (serpResultData.tasks && serpResultData.tasks[0] && serpResultData.tasks[0].result) {
          serpResults = serpResultData.tasks[0].result[0];
          console.log(`✅ SERP results retrieved successfully after ${elapsedMinutes}m ${elapsedSeconds}s`);
          break;
        } else if (serpResultData.tasks && serpResultData.tasks[0] && serpResultData.tasks[0].status_code === 20000) {
          console.log('⏳ Task still processing...');
          
          // Save intermediate status to database so UI can show progress
          if (fetchId && retries % 6 === 0) { // Update every minute
            await supabase
              .from('zhe_serp_fetches')
              .update({
                api_response_json: { 
                  task_id: serpTaskId, 
                  status: 'processing', 
                  message: `DataForSEO task processing... (${elapsedMinutes}m elapsed)`,
                  last_checked: new Date().toISOString()
                }
              })
              .eq('fetch_id', fetchId);
          }
          continue;
        } else {
          console.error('SERP results retrieval failed:', serpResultData);
          break;
        }
      } catch (error) {
        console.error(`Error checking results (attempt ${retries}):`, error);
        if (retries >= 10) { // Allow some failures before giving up
          break;
        }
        continue;
      }
    }

    // If no results yet, return success with pending status
    if (!serpResults) {
      console.log('⚠️ Results not ready yet, but task was submitted successfully');
      
      return NextResponse.json({
        success: true,
        message: `F400 SERP fetch task submitted successfully. Results will be available shortly.`,
        status: 'pending',
        keyword_id: keyword_id,
        keyword_datum: keywordData.keyword_datum,
        dataforseo_task_id: serpTaskId,
        fetch_id: fetchId,
        note: 'DataForSEO task is processing. Results will appear in the table once ready. The system waited 10 minutes but results are still processing. Please use the "Complete Pending Fetches" button in a few minutes.',
        location: keywordData.location_display_name || `Location ${keywordData.rel_dfs_location_code}`,
        language: keywordData.language_name
      });
    }

    // Step 6: Update fetch record with results
    if (fetchId) {
      const { error: updateError } = await supabase
        .from('zhe_serp_fetches')
        .update({
          se_results_count: serpResults.items?.length?.toString() || '0',
          items_count: serpResults.items?.filter(item => item.type === 'organic').length?.toString() || '0',
          api_response_json: serpResults
        })
        .eq('fetch_id', fetchId);

      if (updateError) {
        console.error('Error updating fetch record:', updateError);
      } else {
        console.log(`📋 Updated fetch record ${fetchId} with results`);
      }
    }

    // Step 7: Process and store organic results
    let storedResultsCount = 0;
    
    if (serpResults.items && serpResults.items.length > 0) {
      console.log(`📊 Processing ${serpResults.items.length} organic results...`);
      
      const resultsToInsert = [];
      
      for (const item of serpResults.items) {
        if (item.type === 'organic') {
          resultsToInsert.push({
            rel_fetch_id: fetchId,
            result_type: 'organic',
            rank_in_group: item.rank_group?.toString() || null,
            rank_absolute: item.rank_absolute?.toString() || null,
            domain: item.domain || null,
            title: item.title || null,
            description: item.description || null,
            url: item.url || null,
            breadcrumb: item.breadcrumb || null,
            is_match_emd_stamp: false // Default value for new column
          });
        }
      }

      if (resultsToInsert.length > 0) {
        console.log(`💾 Storing ${resultsToInsert.length} organic results...`);
        
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

        storedResultsCount = insertedResults?.length || 0;
        console.log(`✅ Stored ${storedResultsCount} SERP results`);
      }
    }

    // Update keywordshub with completed status
    await supabase
      .from('keywordshub')
      .update({ 
        serp_results_count: storedResultsCount,
        serp_fetch_status: 'completed',
        serp_last_fetched_at: new Date().toISOString()
      })
      .eq('keyword_id', keyword_id);
    console.log(`📋 Updated keyword status to completed with ${storedResultsCount} results`);

    // ═══════════════════════════════════════════════════════════
    // Mark old cache as historical and clear relations (new fetch invalidates old cache)
    // ═══════════════════════════════════════════════════════════
    console.log('🧹 F400: Marking old cache as historical and clearing relations (new fetch created)...');
    
    // Set existing cache to is_current = FALSE (preserve history)
    await supabase
      .from('keywordshub_emd_zone_cache')
      .update({ is_current: false })
      .eq('keyword_id', keyword_id)
      .eq('is_current', true);
    
    // Delete old relations (will be rebuilt by F410+F420)
    await supabase
      .from('relations_keywordshub_results_zones')
      .delete()
      .eq('keyword_id', keyword_id);
    
    console.log('✅ F400: Cache marked as historical. Run F410 + F420 to rebuild zone cache.');

    console.log('🎉 F400 ZHE SERP Fetch completed successfully with results!');

    return NextResponse.json({
      success: true,
      message: `F400 SERP fetch completed successfully for keyword "${keywordData.keyword_datum}" with ${storedResultsCount} results stored.`,
      status: 'completed',
      keyword_id: keyword_id,
      keyword_datum: keywordData.keyword_datum,
      dataforseo_task_id: serpTaskId,
      fetch_id: fetchId,
      organic_results_stored: storedResultsCount,
      total_results_found: serpResults.items?.length || 0,
      location: keywordData.location_display_name || `Location ${keywordData.rel_dfs_location_code}`,
      language: keywordData.language_name,
      cache_cleared: true  // Indicate cache was cleared
    });

  } catch (error) {
    console.error('❌ F400 function error:', error);
    
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
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}