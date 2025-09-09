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
      .select('id, ruplin_api_key_1')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User record not found' },
        { status: 404 }
      );
    }

    if (!userData.ruplin_api_key_1) {
      return NextResponse.json(
        { success: false, message: 'API key not configured for user' },
        { status: 400 }
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

    // Check Harbor plugin version
    const versionResult = await checkHarborPluginVersion(siteData.site_url, userData.ruplin_api_key_1);

    return NextResponse.json({
      success: versionResult.success,
      message: versionResult.message,
      data: versionResult.data
    });

  } catch (error) {
    console.error('Check Harbor Plugin Version API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

async function checkHarborPluginVersion(siteUrl: string, apiKey: string) {
  try {
    const endpoint = `${siteUrl}/wp-json/harbor/v1/version`;
    console.log(`🔍 Checking Harbor plugin version: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Snefuru-NextJS-App/1.0'
      },
    });

    console.log(`📡 Harbor version check response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`❌ Harbor version check error response: ${responseText}`);
      
      if (response.status === 401) {
        return {
          success: false,
          message: 'Harbor plugin authentication failed. Check API key.',
          data: { status: response.status, error: responseText }
        };
      } else if (response.status === 404) {
        return {
          success: false,
          message: 'Harbor plugin not found. Please install and activate the Harbor plugin.',
          data: { status: response.status, error: responseText }
        };
      } else {
        return {
          success: false,
          message: `Harbor plugin version check failed: ${response.status} ${response.statusText}`,
          data: { status: response.status, error: responseText }
        };
      }
    }

    const data = await response.json();
    console.log(`✅ Harbor version check successful:`, data);

    return {
      success: true,
      message: `Harbor plugin version: ${data.version || 'Unknown'}`,
      data: data
    };

  } catch (error) {
    console.error('💥 Harbor version check error:', error);
    return {
      success: false,
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null
    };
  }
}