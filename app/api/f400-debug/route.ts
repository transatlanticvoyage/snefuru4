import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('keyword_id') || '1813';
    
    console.log(`🔍 Debugging F400 for keyword_id: ${keywordId}`);
    
    // 1. Check keyword exists
    const { data: keyword, error: keywordError } = await supabase
      .from('keywordshub')
      .select('*')
      .eq('keyword_id', keywordId)
      .single();
    
    if (keywordError || !keyword) {
      return NextResponse.json({ 
        error: 'Keyword not found',
        keywordError 
      }, { status: 404 });
    }
    
    // 2. Check DataForSEO credentials
    const hasCredentials = !!(process.env.DFS_USERNAME && process.env.DFS_PASSWORD);
    
    // 3. Check existing fetches for this keyword
    const { data: fetches, error: fetchError } = await supabase
      .from('zhe_serp_fetches')
      .select('*')
      .eq('rel_keyword_id', keywordId)
      .order('created_at', { ascending: false });
    
    // 4. Check existing SERP results
    const fetchIds = fetches?.map(f => f.fetch_id) || [];
    const { data: results, error: resultsError } = await supabase
      .from('zhe_serp_results')
      .select('result_id')
      .in('rel_fetch_id', fetchIds.length > 0 ? fetchIds : [-1]);
    
    // 5. Test DataForSEO connection
    let dfsConnectionTest = null;
    if (process.env.DFS_USERNAME && process.env.DFS_PASSWORD) {
      try {
        const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.DFS_USERNAME}:${process.env.DFS_PASSWORD}`).toString('base64')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{
            keyword: 'test',
            location_code: 2840,
            language_code: 'en'
          }])
        });
        
        dfsConnectionTest = {
          status: response.status,
          statusText: response.statusText,
          success: response.ok
        };
        
        if (!response.ok) {
          const errorText = await response.text();
          dfsConnectionTest.error = errorText.substring(0, 500); // Limit error message length
        }
      } catch (error) {
        dfsConnectionTest = {
          error: error instanceof Error ? error.message : 'Connection failed'
        };
      }
    }
    
    // 6. Analyze the most recent fetch
    const latestFetch = fetches && fetches.length > 0 ? fetches[0] : null;
    let fetchAnalysis = null;
    if (latestFetch) {
      fetchAnalysis = {
        fetch_id: latestFetch.fetch_id,
        created_at: latestFetch.created_at,
        items_count: latestFetch.items_count,
        se_results_count: latestFetch.se_results_count,
        has_task_id: !!(latestFetch.api_response_json?.task_id),
        task_id: latestFetch.api_response_json?.task_id || null,
        status: latestFetch.api_response_json?.status || 'unknown',
        message: latestFetch.api_response_json?.message || null
      };
    }
    
    return NextResponse.json({
      debug: true,
      timestamp: new Date().toISOString(),
      keyword: {
        keyword_id: keyword.keyword_id,
        keyword_datum: keyword.keyword_datum,
        location_code: keyword.rel_dfs_location_code,
        location_name: keyword.location_display_name,
        language_code: keyword.language_code,
        language_name: keyword.language_name,
        has_required_fields: !!(keyword.keyword_datum && keyword.rel_dfs_location_code && keyword.language_code)
      },
      credentials: {
        env_vars_set: hasCredentials,
        dfs_username: process.env.DFS_USERNAME ? `${process.env.DFS_USERNAME.substring(0, 5)}...` : 'NOT SET',
        dfs_password: process.env.DFS_PASSWORD ? '***SET***' : 'NOT SET'
      },
      fetches: {
        total_count: fetches?.length || 0,
        latest_fetch: fetchAnalysis,
        all_fetches: fetches?.map(f => ({
          fetch_id: f.fetch_id,
          created_at: f.created_at,
          items_count: f.items_count
        }))
      },
      results: {
        total_count: results?.length || 0,
        has_results: (results?.length || 0) > 0
      },
      dataforseo: {
        connection_test: dfsConnectionTest
      },
      recommendations: generateRecommendations(keyword, fetches, results, hasCredentials, dfsConnectionTest)
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateRecommendations(keyword: any, fetches: any[], results: any[], hasCredentials: boolean, dfsTest: any): string[] {
  const recommendations = [];
  
  // Check credentials
  if (!hasCredentials) {
    recommendations.push('❌ DataForSEO credentials are NOT configured in .env.local');
    recommendations.push('Add DFS_USERNAME and DFS_PASSWORD to your .env.local file');
  } else if (dfsTest && !dfsTest.success) {
    recommendations.push('❌ DataForSEO credentials are set but authentication is failing');
    recommendations.push('Check that your DataForSEO credentials are correct');
  }
  
  // Check keyword data
  if (!keyword.keyword_datum) {
    recommendations.push('❌ Keyword is missing keyword_datum field');
  }
  if (!keyword.rel_dfs_location_code) {
    recommendations.push('❌ Keyword is missing location code - required for DataForSEO');
  }
  if (!keyword.language_code) {
    recommendations.push('❌ Keyword is missing language code - required for DataForSEO');
  }
  
  // Check fetch status
  if (!fetches || fetches.length === 0) {
    recommendations.push('📝 No fetch attempts found for this keyword');
    recommendations.push('Try clicking the F400 button to initiate a fetch');
  } else {
    const latestFetch = fetches[0];
    if (latestFetch.items_count === '0' && latestFetch.api_response_json?.task_id) {
      recommendations.push('⏳ Latest fetch has a task_id but no results yet');
      recommendations.push('DataForSEO task may still be processing');
      recommendations.push('Try using "Complete Pending Fetches" button');
    } else if (latestFetch.items_count !== '0') {
      recommendations.push('✅ Latest fetch has results stored');
      if (!results || results.length === 0) {
        recommendations.push('⚠️ But no SERP results found in zhe_serp_results table');
        recommendations.push('Data inconsistency - results may have been deleted');
      }
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Everything looks configured correctly');
  }
  
  return recommendations;
}