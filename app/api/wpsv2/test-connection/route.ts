import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId } = body;

    // Validate input
    if (!siteId) {
      return NextResponse.json(
        { success: false, message: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User record not found' },
        { status: 404 }
      );
    }

    // Get site record from sitespren table
    const { data: siteData, error: siteError } = await supabase
      .from('sitespren')
      .select('*')
      .eq('id', siteId)
      .eq('fk_users_id', userData.id)
      .single();

    if (siteError || !siteData) {
      return NextResponse.json(
        { success: false, message: 'Site not found or access denied' },
        { status: 404 }
      );
    }

    console.log(`🔍 WPSv2: Testing connection for ${siteData.sitespren_base}`);

    // Test plugin connection
    const pluginTest = await wpsv2TestPluginConnection(siteData.sitespren_base, siteData.ruplin_apikey);
    
    // Test REST API connection
    const restTest = await wpsv2TestRestConnection(siteData.sitespren_base, siteData.wp_rest_app_pass);

    return NextResponse.json({
      success: true,
      message: 'WPSv2 connection tests completed',
      results: {
        site_url: siteData.sitespren_base,
        plugin_api: pluginTest,
        rest_api: restTest,
        recommendations: generateWpsv2Recommendations(pluginTest, restTest)
      }
    });

  } catch (error) {
    console.error('WPSv2 Test Connection API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `WPSv2 Test error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

// Test Snefuruplin plugin connection
async function wpsv2TestPluginConnection(siteUrl: string, apiKey: string) {
  try {
    console.log(`🔌 WPSv2: Testing plugin connection to ${siteUrl}`);
    
    if (!apiKey) {
      return {
        success: false,
        status: 'no_api_key',
        message: 'No API key configured',
        response_time: 0
      };
    }

    const startTime = Date.now();
    const endpoint = `https://${siteUrl}/wp-json/snefuru/v1/posts`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Snefuru-WPSv2-Test/1.0'
      },
      // Add timeout for testing
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const responseText = await response.text();
      return {
        success: false,
        status: 'connection_failed',
        message: `HTTP ${response.status}: ${response.statusText}`,
        response_time: responseTime,
        error_details: responseText.substring(0, 200)
      };
    }

    const data = await response.json();
    
    if (!data.success) {
      return {
        success: false,
        status: 'plugin_error',
        message: data.message || 'Plugin returned error',
        response_time: responseTime
      };
    }

    return {
      success: true,
      status: 'connected',
      message: `Plugin API working - ${data.total || 0} posts available`,
      response_time: responseTime,
      posts_available: data.total || 0,
      plugin_version: data.plugin_version || 'unknown'
    };

  } catch (error) {
    console.error('🔌 WPSv2 Plugin test error:', error);
    
    if (error instanceof Error && error.name === 'TimeoutError') {
      return {
        success: false,
        status: 'timeout',
        message: 'Connection timeout after 10 seconds',
        response_time: 10000
      };
    }

    return {
      success: false,
      status: 'network_error',
      message: error instanceof Error ? error.message : 'Network error',
      response_time: 0
    };
  }
}

// Test WordPress REST API connection
async function wpsv2TestRestConnection(siteUrl: string, appPassword?: string) {
  try {
    console.log(`🌐 WPSv2: Testing REST API connection to ${siteUrl}`);
    
    // Prepare headers with authentication if available
    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'Snefuru-WPSv2-Test/1.0'
    };
    
    // Add authentication if application password is provided
    if (appPassword) {
      console.log(`🔑 WPSv2: Testing REST API with authentication`);
      headers['Authorization'] = `Basic ${Buffer.from(appPassword).toString('base64')}`;
    } else {
      console.log(`🔓 WPSv2: Testing REST API without authentication (public only)`);
    }
    
    const startTime = Date.now();
    const endpoint = `https://${siteUrl}/wp-json/wp/v2/posts?per_page=1`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: headers,
      // Add timeout for testing
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const responseText = await response.text();
      return {
        success: false,
        status: 'connection_failed',
        message: `HTTP ${response.status}: ${response.statusText}`,
        response_time: responseTime,
        error_details: responseText.substring(0, 200)
      };
    }

    const data = await response.json();
    
    // Check if we got an array (successful response) or error object
    if (!Array.isArray(data)) {
      return {
        success: false,
        status: 'api_error',
        message: 'REST API returned unexpected response format',
        response_time: responseTime
      };
    }

    // Try to get total count from headers
    const totalPosts = response.headers.get('X-WP-Total') || 'unknown';

    const authStatus = appPassword ? ' (authenticated)' : ' (public only)';
    
    return {
      success: true,
      status: 'connected',
      message: `REST API working${authStatus} - ${totalPosts} posts available`,
      response_time: responseTime,
      posts_available: totalPosts,
      authenticated: !!appPassword,
      sample_post: data[0] ? {
        id: data[0].id,
        title: data[0].title?.rendered?.substring(0, 50) + '...',
        type: data[0].type
      } : null
    };

  } catch (error) {
    console.error('🌐 WPSv2 REST test error:', error);
    
    if (error instanceof Error && error.name === 'TimeoutError') {
      return {
        success: false,
        status: 'timeout',
        message: 'Connection timeout after 10 seconds',
        response_time: 10000
      };
    }

    return {
      success: false,
      status: 'network_error',
      message: error instanceof Error ? error.message : 'Network error',
      response_time: 0
    };
  }
}

// Generate recommendations based on test results
function generateWpsv2Recommendations(pluginTest: any, restTest: any): string[] {
  const recommendations = [];

  if (pluginTest.success && restTest.success) {
    recommendations.push('✅ Both Plugin API and REST API are working. Plugin API is recommended for better performance.');
    
    if (pluginTest.response_time < restTest.response_time) {
      recommendations.push(`⚡ Plugin API is faster (${pluginTest.response_time}ms vs ${restTest.response_time}ms)`);
    }
  } else if (pluginTest.success && !restTest.success) {
    recommendations.push('✅ Plugin API is working. Use Plugin API for syncing.');
    recommendations.push('⚠️ REST API is not working. Check WordPress permalinks and REST API settings.');
  } else if (!pluginTest.success && restTest.success) {
    const authMsg = restTest.authenticated ? 'with authentication' : 'without authentication (public posts only)';
    recommendations.push(`✅ REST API is working ${authMsg}. Use REST API for syncing.`);
    recommendations.push('⚠️ Plugin API failed. Check if Snefuruplin plugin is installed and API key is correct.');
    
    if (!restTest.authenticated) {
      recommendations.push('🔑 Consider adding WordPress Application Password for full REST API access to private/draft posts.');
    }
  } else {
    recommendations.push('❌ Both connections failed. Check site URL, hosting, and WordPress configuration.');
    
    if (pluginTest.status === 'no_api_key') {
      recommendations.push('🔑 Configure API key for Plugin API access.');
    }
    
    if (pluginTest.status === 'timeout' || restTest.status === 'timeout') {
      recommendations.push('⏱️ Connection timeouts detected. Check hosting provider and server performance.');
    }
  }

  return recommendations;
}