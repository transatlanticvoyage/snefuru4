import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId } = body;

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

    // Get site record
    const { data: siteData, error: siteError } = await supabase
      .from('ywp_sites')
      .select('*')
      .eq('id', siteId)
      .eq('fk_user_id', userData.id)
      .single();

    if (siteError || !siteData) {
      return NextResponse.json(
        { success: false, message: 'Site not found or access denied' },
        { status: 404 }
      );
    }

    // Test both status and posts endpoints
    const results: {
      site_url: string;
      tests: Record<string, {
        status: number;
        available: boolean;
        message: string;
        data?: any;
      }>;
    } = {
      site_url: siteData.site_url,
      tests: {}
    };

    // Test 1: WordPress REST API availability
    try {
      const wpApiUrl = `${siteData.site_url}/wp-json/wp/v2`;
      const wpResponse = await fetch(wpApiUrl);
      results.tests['wordpress_rest_api'] = {
        status: wpResponse.status,
        available: wpResponse.ok,
        message: wpResponse.ok ? 'WordPress REST API available' : `Failed: ${wpResponse.status}`
      };
    } catch (error) {
      results.tests['wordpress_rest_api'] = {
        status: 0,
        available: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    // Test 2: Plugin status endpoint
    try {
      const statusUrl = `${siteData.site_url}/wp-json/snefuru/v1/status`;
      const statusResponse = await fetch(`${statusUrl}?api_key=${encodeURIComponent(siteData.api_key)}`);
      const statusData = statusResponse.ok ? await statusResponse.json() : null;
      
      results.tests['plugin_status_endpoint'] = {
        status: statusResponse.status,
        available: statusResponse.ok,
        message: statusResponse.ok ? 'Plugin status endpoint working' : `Failed: ${statusResponse.status}`,
        data: statusData
      };
    } catch (error) {
      results.tests['plugin_status_endpoint'] = {
        status: 0,
        available: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    // Test 3: Plugin posts endpoint
    try {
      const postsUrl = `${siteData.site_url}/wp-json/snefuru/v1/posts`;
      const postsResponse = await fetch(postsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${siteData.api_key}`,
          'Content-Type': 'application/json',
        },
      });
      const postsData = postsResponse.ok ? await postsResponse.json() : await postsResponse.text();
      
      results.tests['plugin_posts_endpoint'] = {
        status: postsResponse.status,
        available: postsResponse.ok,
        message: postsResponse.ok ? 'Plugin posts endpoint working' : `Failed: ${postsResponse.status}`,
        data: postsResponse.ok ? { 
          success: postsData.success, 
          total: postsData.total,
          message: postsData.message 
        } : postsData
      };
    } catch (error) {
      results.tests['plugin_posts_endpoint'] = {
        status: 0,
        available: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    // Determine overall status
    const allTests = Object.values(results.tests);
    const successfulTests = allTests.filter(test => test.available).length;
    const totalTests = allTests.length;

    return NextResponse.json({
      success: true,
      message: `Plugin test completed: ${successfulTests}/${totalTests} tests passed`,
      results: results,
      recommendations: generateRecommendations(results.tests)
    });

  } catch (error) {
    console.error('Plugin test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(tests: Record<string, { status: number; available: boolean; message: string; data?: any }>) {
  const recommendations = [];

  if (!tests.wordpress_rest_api?.available) {
    recommendations.push('WordPress REST API is not available. Check if WordPress is running and accessible.');
  }

  if (!tests.plugin_status_endpoint?.available) {
    recommendations.push('Snefuru plugin status endpoint not working. Plugin may not be installed or activated.');
  }

  if (!tests.plugin_posts_endpoint?.available) {
    recommendations.push('Snefuru plugin posts endpoint not working. Check API key configuration in WordPress admin.');
  }

  if (tests.plugin_status_endpoint?.available && !tests.plugin_posts_endpoint?.available) {
    recommendations.push('Plugin is installed but posts endpoint failing. This is likely an API key mismatch.');
  }

  if (recommendations.length === 0) {
    recommendations.push('All tests passed! Plugin should work correctly for syncing.');
  }

  return recommendations;
} 