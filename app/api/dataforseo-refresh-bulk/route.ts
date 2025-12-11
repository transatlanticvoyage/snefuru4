import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log(`🔄 [${new Date().toISOString()}] Starting bulk refresh API request...`);
    
    const { keyword_ids, field, retry_report_id, tag_id, tag_name } = await request.json();
    const parseTime = Date.now() - startTime;
    console.log(`📋 Request parsed in ${parseTime}ms - ${keyword_ids?.length || 0} keyword IDs received`);

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

    // Add safety limits and warnings for large batches
    const MAX_RECOMMENDED_KEYWORDS = 200;
    const MAX_ABSOLUTE_KEYWORDS = 1000;
    
    if (keyword_ids.length > MAX_ABSOLUTE_KEYWORDS) {
      return NextResponse.json(
        { error: `Too many keywords. Maximum allowed: ${MAX_ABSOLUTE_KEYWORDS}, received: ${keyword_ids.length}. Please split into smaller batches.` },
        { status: 400 }
      );
    }
    
    if (keyword_ids.length > MAX_RECOMMENDED_KEYWORDS) {
      console.log(`⚠️  Large batch warning: Processing ${keyword_ids.length} keywords (recommended max: ${MAX_RECOMMENDED_KEYWORDS})`);
      console.log(`   This may cause timeouts or performance issues. Consider splitting into smaller batches.`);
    }

    console.log(`🔄 Starting bulk DataForSEO refresh for ${keyword_ids.length} keywords (${field})`);

    // Create DFS fetch report entry
    let reportId: number | null = null;
    if (!retry_report_id) {
      try {
        console.log('📝 Creating DFS fetch report entry...');
        const { data: reportData, error: reportError } = await supabase
          .from('dfs_fetch_reports')
          .insert({
            tag_id: tag_id || null,
            tag_name: tag_name || null,
            total_keywords: keyword_ids.length,
            keywords_submitted: keyword_ids.map(String),
            status: 'pending',
            submitted_at: new Date().toISOString(),
            processing_started_at: new Date().toISOString()
          })
          .select('report_id')
          .single();

        if (reportError) {
          console.error('❌ Error creating report entry:', reportError);
        } else {
          reportId = reportData?.report_id;
          console.log(`✅ Created DFS fetch report with ID: ${reportId}`);
        }
      } catch (err) {
        console.error('❌ Error creating report entry:', err);
      }
    } else {
      reportId = retry_report_id;
      console.log(`🔄 Using existing report ID for retry: ${reportId}`);
      
      // Update existing report for retry
      await supabase
        .from('dfs_fetch_reports')
        .update({
          status: 'processing',
          processing_started_at: new Date().toISOString(),
          keywords_processed: 0,
          keywords_succeeded: 0,
          keywords_failed: 0,
          error_details: null
        })
        .eq('report_id', reportId);
    }

    // Set keyword status to pending before starting DFS fetch
    console.log(`📝 Setting ${keyword_ids.length} keywords to pending status...`);
    await supabase
      .from('keywordshub')
      .update({ dfs_fetch_status: 'pending' })
      .in('keyword_id', keyword_ids);

    // Get the keyword records
    const dbStartTime = Date.now();
    const { data: keywordRecords, error: keywordError } = await supabase
      .from('keywordshub')
      .select('*')
      .in('keyword_id', keyword_ids);
    
    const dbTime = Date.now() - dbStartTime;
    console.log(`💾 Database query completed in ${dbTime}ms - Retrieved ${keywordRecords?.length || 0} records`);

    if (keywordError || !keywordRecords) {
      return NextResponse.json(
        { error: 'Failed to fetch keyword records' },
        { status: 404 }
      );
    }

    // Validate all records have required fields
    const invalidRecords = keywordRecords.filter(record => 
      !record.keyword_datum || !record.rel_dfs_location_code || !record.language_code
    );

    if (invalidRecords.length > 0) {
      return NextResponse.json(
        { 
          error: `${invalidRecords.length} keywords missing required fields (keyword_datum, rel_dfs_location_code, language_code)`,
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
      const key = `${record.rel_dfs_location_code}-${record.language_code}`;
      if (!locationGroups.has(key)) {
        locationGroups.set(key, {
          location_code: record.rel_dfs_location_code,
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
    
    // Configuration for batch processing
    const MAX_CONCURRENT_REQUESTS = 3; // Limit concurrent API calls
    const MAX_KEYWORDS_PER_REQUEST = 50; // Chunk large groups
    
    // Split large groups into smaller chunks
    const chunkedGroups = [];
    for (const [key, group] of locationGroups) {
      if (group.keywords.length <= MAX_KEYWORDS_PER_REQUEST) {
        chunkedGroups.push({ key, group });
      } else {
        // Split large group into chunks
        for (let i = 0; i < group.keywords.length; i += MAX_KEYWORDS_PER_REQUEST) {
          const chunkKeywords = group.keywords.slice(i, i + MAX_KEYWORDS_PER_REQUEST);
          const chunkKeywordIds = group.keyword_ids.slice(i, i + MAX_KEYWORDS_PER_REQUEST);
          chunkedGroups.push({
            key: `${key}-chunk-${Math.floor(i / MAX_KEYWORDS_PER_REQUEST) + 1}`,
            group: {
              location_code: group.location_code,
              language_code: group.language_code,
              keywords: chunkKeywords,
              keyword_ids: chunkKeywordIds
            }
          });
        }
      }
    }
    
    console.log(`📦 Split into ${chunkedGroups.length} chunks (max ${MAX_KEYWORDS_PER_REQUEST} keywords each)`);

    // Process chunks with limited concurrency
    const processChunk = async ({ key, group }: { key: string, group: any }) => {
      try {
        console.log(`🚀 Processing chunk ${key} with ${group.keywords.length} keywords...`);
        
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
          console.error(`DataForSEO API Error for chunk ${key}:`, errorText);
          return { success: false, error: { group: key, error: `API error: ${dfsResponse.status}`, details: errorText } };
        }

        const dfsData = await dfsResponse.json();
        console.log(`📊 DataForSEO response for chunk ${key}: Status ${dfsData.tasks?.[0]?.status_code}`);

        if (dfsData.tasks && dfsData.tasks[0] && dfsData.tasks[0].status_code === 20100) {
          const taskId = dfsData.tasks[0].id;
          console.log(`✅ Task created for chunk ${key}: ${taskId}`);
          return {
            success: true,
            task: {
              task_id: taskId,
              group_key: key,
              keyword_ids: group.keyword_ids,
              keywords: group.keywords
            }
          };
        } else {
          console.error(`Task creation failed for chunk ${key}:`, dfsData);
          return { success: false, error: { group: key, error: 'Task creation failed', details: dfsData } };
        }
      } catch (error) {
        console.error(`Exception for chunk ${key}:`, error);
        return { success: false, error: { group: key, error: error instanceof Error ? error.message : 'Unknown error' } };
      }
    };

    // Process chunks with concurrency limit
    const processingStartTime = Date.now();
    console.log(`🚀 Starting to process ${chunkedGroups.length} chunks in batches of ${MAX_CONCURRENT_REQUESTS}...`);
    
    const processingPromises = [];
    for (let i = 0; i < chunkedGroups.length; i += MAX_CONCURRENT_REQUESTS) {
      const batchStartTime = Date.now();
      const batch = chunkedGroups.slice(i, i + MAX_CONCURRENT_REQUESTS);
      console.log(`📦 Processing batch ${Math.floor(i / MAX_CONCURRENT_REQUESTS) + 1}/${Math.ceil(chunkedGroups.length / MAX_CONCURRENT_REQUESTS)} with ${batch.length} chunks...`);
      
      const batchPromises = batch.map(processChunk);
      const batchResults = await Promise.allSettled(batchPromises);
      
      const batchTime = Date.now() - batchStartTime;
      console.log(`⏱️ Batch completed in ${batchTime}ms (${(batchTime / 1000).toFixed(1)}s)`);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            taskIds.push(result.value.task);
          } else {
            errors.push(result.value.error);
          }
        } else {
          const chunkKey = batch[index].key;
          console.error(`Promise rejected for chunk ${chunkKey}:`, result.reason);
          errors.push({ group: chunkKey, error: 'Promise rejected', details: result.reason });
        }
      });
      
      // Small delay between batches to avoid overwhelming the API
      if (i + MAX_CONCURRENT_REQUESTS < chunkedGroups.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const processingTime = Date.now() - processingStartTime;
    const totalTime = Date.now() - startTime;
    
    // Mark keywords from failed chunks as failed
    if (errors.length > 0) {
      const failedKeywordIds = [];
      errors.forEach((error) => {
        // Find the chunk that failed
        const failedChunk = chunkedGroups.find(chunk => chunk.key === error.group);
        if (failedChunk) {
          failedKeywordIds.push(...failedChunk.group.keyword_ids);
        }
      });
      
      if (failedKeywordIds.length > 0) {
        try {
          await supabase
            .from('keywordshub')
            .update({ dfs_fetch_status: 'failed' })
            .in('keyword_id', failedKeywordIds);
          console.log(`❌ Marked ${failedKeywordIds.length} keywords as failed due to task creation errors`);
        } catch (dbError) {
          console.error(`❌ Error updating failed status for failed chunks:`, dbError);
        }
      }
    }

    // Store task information for later retrieval (optional - could be in a separate table)
    console.log(`📋 API Processing Summary:`);
    console.log(`   - Created ${taskIds.length} DataForSEO tasks, ${errors.length} errors`);
    console.log(`   - Processing time: ${processingTime}ms (${(processingTime / 1000).toFixed(1)}s)`);
    console.log(`   - Total API time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);

    // Update report status based on initial results
    if (reportId) {
      const status = errors.length === 0 ? 'processing' : 
                    taskIds.length === 0 ? 'failed' : 'partial';
      
      await supabase
        .from('dfs_fetch_reports')
        .update({
          status: status,
          keywords_processed: taskIds.length > 0 ? 0 : keyword_ids.length,
          keywords_succeeded: 0,
          keywords_failed: errors.length > 0 ? keyword_ids.length - taskIds.reduce((sum, t) => sum + t.keyword_ids.length, 0) : 0,
          dfs_task_ids: taskIds.map(t => t.task_id),
          dfs_credits_used: taskIds.length * 0.004, // Estimate: $0.004 per keyword
          error_details: errors.length > 0 ? Object.fromEntries(
            errors.map((err, index) => [`error_${index}`, err])
          ) : null,
          updated_at: new Date().toISOString()
        })
        .eq('report_id', reportId);
    }

    // Start a background process to check and update results
    setTimeout(async () => {
      console.log('🔄 Starting background task result retrieval...');
      await retrieveAndUpdateResults(taskIds, supabase, username!, password!, reportId);
    }, 10000); // Check after 10 seconds

    return NextResponse.json({
      success: true,
      message: `Bulk refresh started for ${keywordRecords.length} keywords in ${chunkedGroups.length} chunks (max 50 keywords per chunk)`,
      stats: {
        total_keywords: keywordRecords.length,
        total_chunks: chunkedGroups.length,
        tasks_created: taskIds.length,
        errors: errors.length,
        task_ids: taskIds.map(t => t.task_id),
        processing_info: {
          max_keywords_per_chunk: MAX_KEYWORDS_PER_REQUEST,
          max_concurrent_requests: MAX_CONCURRENT_REQUESTS,
          background_retrieval_started: true,
          timing: {
            total_time_ms: totalTime,
            processing_time_ms: processingTime,
            total_time_seconds: (totalTime / 1000).toFixed(1),
            processing_time_seconds: (processingTime / 1000).toFixed(1)
          }
        }
      },
      errors: errors.length > 0 ? errors : undefined,
      report_id: reportId
    });

  } catch (error) {
    console.error('❌ DataForSEO bulk refresh failed:', error);
    
    // Update report status to failed if we created one
    if (reportId) {
      try {
        await supabase
          .from('dfs_fetch_reports')
          .update({
            status: 'failed',
            error_details: {
              error: 'Bulk refresh startup failed',
              details: error instanceof Error ? error.message : 'Unknown error'
            },
            updated_at: new Date().toISOString()
          })
          .eq('report_id', reportId);
      } catch (updateError) {
        console.error('❌ Failed to update report status on error:', updateError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to start bulk refresh', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Background function to retrieve results with retry logic
async function retrieveAndUpdateResults(
  taskIds: Array<{task_id: string, group_key: string, keyword_ids: number[], keywords: string[]}>,
  supabase: any,
  username: string,
  password: string,
  reportId?: number | null,
  maxRetries: number = 3
) {
  console.log(`🔍 [BULK BACKGROUND] Retrieving results for ${taskIds.length} tasks...`);
  console.log(`🔍 [BULK BACKGROUND] Task IDs:`, taskIds.map(t => ({ 
    task_id: t.task_id, 
    keywords_count: t.keywords.length,
    keywords: t.keywords 
  })));
  
  const MAX_CONCURRENT_RETRIEVALS = 5; // Limit concurrent result retrievals
  const pendingTasks = [...taskIds];
  let completedCount = 0;
  let retryCount = 0;
  
  // Process results with concurrency control and retry logic
  while (pendingTasks.length > 0 && retryCount <= maxRetries) {
    console.log(`🔄 Retry ${retryCount + 1}/${maxRetries + 1}: Processing ${pendingTasks.length} remaining tasks...`);
    
    const stillPending = [];
    
    // Process tasks in batches
    for (let i = 0; i < pendingTasks.length; i += MAX_CONCURRENT_RETRIEVALS) {
      const batch = pendingTasks.slice(i, i + MAX_CONCURRENT_RETRIEVALS);
      
      const retrievalPromises = batch.map(async (taskInfo) => {
        try {
          console.log(`📋 Checking task ${taskInfo.task_id} (${taskInfo.keywords.length} keywords)...`);
          
          console.log(`🟧 [BULK BACKGROUND] Fetching results for task ${taskInfo.task_id}`);
          const resultsResponse = await fetch(`https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/task_get/${taskInfo.task_id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`🟧 [BULK BACKGROUND] Response status for task ${taskInfo.task_id}:`, resultsResponse.status);

          if (!resultsResponse.ok) {
            console.error(`Results API Error for task ${taskInfo.task_id}: ${resultsResponse.status}`);
            return { taskInfo, status: 'error', error: `API Error: ${resultsResponse.status}` };
          }

          const resultsData = await resultsResponse.json();
          console.log(`🟧 [BULK BACKGROUND] Task ${taskInfo.task_id} response data:`, {
            has_tasks: !!resultsData.tasks,
            task_status: resultsData.tasks?.[0]?.status_code,
            has_result: !!resultsData.tasks?.[0]?.result,
            result_count: resultsData.tasks?.[0]?.result?.length
          });
          
          if (resultsData.tasks && resultsData.tasks[0]) {
            const task = resultsData.tasks[0];
            
            if (task.result && Array.isArray(task.result)) {
              const results = task.result;
              console.log(`📈 Got ${results.length} results for task ${taskInfo.task_id}`);
              console.log(`🟧 [BULK BACKGROUND] First 3 results data:`, results.slice(0, 3));
              
              // Batch update database entries
              const updates = [];
              for (let j = 0; j < results.length && j < taskInfo.keyword_ids.length; j++) {
                const keywordData = results[j];
                const keywordId = taskInfo.keyword_ids[j];
                const keyword = taskInfo.keywords[j];
                
                console.log(`🟧 [BULK BACKGROUND] Processing update for keyword "${keyword}" (ID: ${keywordId}):`, {
                  search_volume: keywordData.search_volume,
                  cpc: keywordData.cpc,
                  competition: keywordData.competition
                });
                
                // Determine fetch status based on data availability
                const hasValidData = keywordData.search_volume !== null || keywordData.cpc !== null;
                const fetchStatus = hasValidData ? 'completed' : 'failed';
                
                const updateData = {
                  search_volume: keywordData.search_volume || null,
                  cpc: keywordData.cpc || null,
                  competition: keywordData.competition || null,
                  competition_index: keywordData.competition_index || null,
                  low_top_of_page_bid: keywordData.low_top_of_page_bid || null,
                  high_top_of_page_bid: keywordData.high_top_of_page_bid || null,
                  api_fetched_at: new Date().toISOString(),
                  dfs_fetch_status: fetchStatus
                };
                
                updates.push(
                  supabase
                    .from('keywordshub')
                    .update(updateData)
                    .eq('keyword_id', keywordId)
                    .select()
                );
              }
              
              // Execute all updates concurrently
              console.log(`🟧 [BULK BACKGROUND] Executing ${updates.length} database updates...`);
              const updateResults = await Promise.allSettled(updates);
              
              // Log update results
              const successful = updateResults.filter(r => r.status === 'fulfilled' && r.value?.data).length;
              const failed = updateResults.filter(r => r.status === 'rejected' || r.value?.error).length;
              
              console.log(`🟧 [BULK BACKGROUND] Database update results:`, {
                total_updates: updates.length,
                successful: successful,
                failed: failed
              });
              
              // Log sample of updated records
              const successfulUpdate = updateResults.find(r => r.status === 'fulfilled' && r.value?.data);
              if (successfulUpdate && successfulUpdate.status === 'fulfilled' && successfulUpdate.value?.data) {
                console.log(`🟧 [BULK BACKGROUND] Sample updated record:`, successfulUpdate.value.data);
              }
              
              console.log(`✅ Updated ${successful} keywords from task ${taskInfo.task_id}`);
              
              return { taskInfo, status: 'completed', updatedCount: updates.length };
            } else if (task.status_code === 20100) {
              // Task is still processing
              console.log(`⏳ Task ${taskInfo.task_id} still processing (status: ${task.status_code})`);
              return { taskInfo, status: 'pending' };
            } else {
              // Task failed - mark keywords as failed
              console.error(`Task ${taskInfo.task_id} failed with status: ${task.status_code}`);
              
              // Mark all keywords in this task as failed
              try {
                await supabase
                  .from('keywordshub')
                  .update({ dfs_fetch_status: 'failed' })
                  .in('keyword_id', taskInfo.keyword_ids);
                console.log(`❌ Marked ${taskInfo.keyword_ids.length} keywords as failed for task ${taskInfo.task_id}`);
              } catch (error) {
                console.error(`❌ Error updating failed status for task ${taskInfo.task_id}:`, error);
              }
              
              return { taskInfo, status: 'failed', error: `Task failed with status: ${task.status_code}` };
            }
          } else {
            console.log(`⏳ Task ${taskInfo.task_id} not ready yet`);
            return { taskInfo, status: 'pending' };
          }
        } catch (error) {
          console.error(`Exception retrieving results for task ${taskInfo.task_id}:`, error);
          
          // Mark keywords as failed due to exception
          try {
            await supabase
              .from('keywordshub')
              .update({ dfs_fetch_status: 'failed' })
              .in('keyword_id', taskInfo.keyword_ids);
            console.log(`❌ Marked ${taskInfo.keyword_ids.length} keywords as failed due to exception`);
          } catch (dbError) {
            console.error(`❌ Error updating failed status:`, dbError);
          }
          
          return { taskInfo, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });
      
      const batchResults = await Promise.allSettled(retrievalPromises);
      
      // Process batch results
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { taskInfo, status } = result.value;
          if (status === 'completed') {
            completedCount++;
          } else if (status === 'pending') {
            stillPending.push(taskInfo);
          } else {
            console.error(`Task ${taskInfo.task_id} failed:`, result.value.error);
          }
        } else {
          console.error('Promise rejected:', result.reason);
        }
      });
      
      // Delay between batches
      if (i + MAX_CONCURRENT_RETRIEVALS < pendingTasks.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Update pending tasks for next retry
    pendingTasks.length = 0;
    pendingTasks.push(...stillPending);
    
    if (pendingTasks.length > 0) {
      retryCount++;
      if (retryCount <= maxRetries) {
        console.log(`⏱️ Waiting 30 seconds before retry ${retryCount + 1}/${maxRetries + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  }
  
  console.log(`🎉 [BULK BACKGROUND] Processing complete! Updated ${completedCount}/${taskIds.length} tasks successfully.`);
  if (pendingTasks.length > 0) {
    console.log(`⚠️ [BULK BACKGROUND] ${pendingTasks.length} tasks still pending after ${maxRetries + 1} attempts.`);
    console.log(`⚠️ [BULK BACKGROUND] Pending tasks:`, pendingTasks.map(t => ({ 
      task_id: t.task_id, 
      keywords: t.keywords 
    })));
  }

  // Update final report status
  if (reportId) {
    const totalKeywords = taskIds.reduce((sum, t) => sum + t.keyword_ids.length, 0);
    const keywordsSucceeded = completedCount;
    const keywordsFailed = totalKeywords - completedCount;
    
    let finalStatus: 'completed' | 'failed' | 'partial';
    if (completedCount === taskIds.length) {
      finalStatus = 'completed';
    } else if (completedCount === 0) {
      finalStatus = 'failed';
    } else {
      finalStatus = 'partial';
    }

    const processingEndTime = new Date().toISOString();
    
    try {
      // Get the processing start time to calculate duration
      const { data: reportData } = await supabase
        .from('dfs_fetch_reports')
        .select('processing_started_at')
        .eq('report_id', reportId)
        .single();
      
      let durationMs = null;
      if (reportData?.processing_started_at) {
        const startTime = new Date(reportData.processing_started_at).getTime();
        durationMs = Date.now() - startTime;
      }
      
      await supabase
        .from('dfs_fetch_reports')
        .update({
          status: finalStatus,
          keywords_processed: totalKeywords,
          keywords_succeeded: keywordsSucceeded,
          keywords_failed: keywordsFailed,
          processing_completed_at: processingEndTime,
          processing_duration_ms: durationMs,
          updated_at: processingEndTime
        })
        .eq('report_id', reportId);
      
      console.log(`📊 [BULK BACKGROUND] Updated report ${reportId} with final status: ${finalStatus}`);
      console.log(`📊 [BULK BACKGROUND] Final stats: ${keywordsSucceeded}/${totalKeywords} succeeded, ${keywordsFailed} failed`);
      if (durationMs) {
        console.log(`📊 [BULK BACKGROUND] Processing duration: ${(durationMs / 1000).toFixed(1)}s`);
      }
    } catch (error) {
      console.error(`❌ [BULK BACKGROUND] Failed to update final report status:`, error);
    }
  }
}