import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fetch_id, task_id } = body;
    
    if (!fetch_id || !task_id) {
      return NextResponse.json({ error: 'fetch_id and task_id are required' }, { status: 400 });
    }
    
    console.log(`🔍 Force completing fetch_id: ${fetch_id}, task_id: ${task_id}`);
    
    const username = process.env.DFS_USERNAME;
    const password = process.env.DFS_PASSWORD;
    
    if (!username || !password) {
      return NextResponse.json({ error: 'DataForSEO credentials not configured' }, { status: 400 });
    }
    
    // Try to get the task results from DataForSEO
    const taskUrl = `https://api.dataforseo.com/v3/serp/google/organic/task_get/regular/${task_id}`;
    console.log(`📡 Fetching from: ${taskUrl}`);
    
    const response = await fetch(taskUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseText = await response.text();
    console.log(`Response status: ${response.status}`);
    console.log(`Response text (first 500 chars): ${responseText.substring(0, 500)}`);
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'DataForSEO API error',
        status: response.status,
        statusText: response.statusText,
        details: responseText.substring(0, 1000)
      }, { status: 500 });
    }
    
    const data = JSON.parse(responseText);
    console.log('DataForSEO response structure:', {
      has_tasks: !!data.tasks,
      tasks_count: data.tasks?.length,
      first_task_status: data.tasks?.[0]?.status_code,
      first_task_status_message: data.tasks?.[0]?.status_message,
      has_result: !!data.tasks?.[0]?.result
    });
    
    // Check if task is ready
    if (!data.tasks || !data.tasks[0]) {
      return NextResponse.json({
        error: 'No task data returned',
        raw_response: data
      }, { status: 404 });
    }
    
    const task = data.tasks[0];
    
    // Check task status
    if (task.status_code === 40501) {
      return NextResponse.json({
        error: 'Task not found at DataForSEO',
        message: 'This task ID may have expired or been deleted',
        status_code: task.status_code,
        status_message: task.status_message
      }, { status: 404 });
    }
    
    if (task.status_code === 20000) {
      return NextResponse.json({
        error: 'Task still processing',
        message: 'DataForSEO is still processing this task. Try again in a few minutes.',
        status_code: task.status_code,
        status_message: task.status_message
      }, { status: 202 });
    }
    
    if (!task.result || task.result.length === 0) {
      return NextResponse.json({
        error: 'No results in task',
        task_status: task.status_code,
        task_message: task.status_message
      }, { status: 404 });
    }
    
    const serpResults = task.result[0];
    console.log(`✅ Got results: ${serpResults.items?.length || 0} items`);
    
    // Update the fetch record with results
    const { error: updateError } = await supabase
      .from('zhe_serp_fetches')
      .update({
        se_results_count: serpResults.items?.length?.toString() || '0',
        items_count: serpResults.items?.filter((item: any) => item.type === 'organic').length?.toString() || '0',
        api_response_json: serpResults
      })
      .eq('fetch_id', fetch_id);
    
    if (updateError) {
      console.error('Error updating fetch record:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update fetch record',
        details: updateError 
      }, { status: 500 });
    }
    
    // Store the organic results
    const organicResults = serpResults.items?.filter((item: any) => item.type === 'organic') || [];
    console.log(`💾 Storing ${organicResults.length} organic results`);
    
    if (organicResults.length > 0) {
      const resultsToInsert = organicResults.map((item: any) => ({
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
      }));
      
      const { data: insertedResults, error: insertError } = await supabase
        .from('zhe_serp_results')
        .insert(resultsToInsert)
        .select('result_id');
      
      if (insertError) {
        console.error('Error inserting results:', insertError);
        return NextResponse.json({ 
          error: 'Failed to insert SERP results',
          details: insertError 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: `Successfully stored ${organicResults.length} results`,
        fetch_id,
        task_id,
        organic_results_count: organicResults.length,
        total_items_count: serpResults.items?.length || 0,
        results_stored: insertedResults?.length || 0
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'No organic results found in SERP data',
      fetch_id,
      task_id,
      total_items_count: serpResults.items?.length || 0
    });
    
  } catch (error) {
    console.error('Force complete error:', error);
    return NextResponse.json({ 
      error: 'Force complete failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}