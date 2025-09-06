import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for database queries
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  // CORS headers for extension - More permissive for debugging
  const origin = request.headers.get('origin');
  const extensionId = request.headers.get('x-extension-id');
  
  // Allow specific extension or localhost for development
  const corsHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Extension-ID, Cookie, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Expose-Headers': 'Set-Cookie',
  };

  if (origin && origin.startsWith('chrome-extension://')) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  } else {
    // For development/debugging - be more permissive
    corsHeaders['Access-Control-Allow-Origin'] = '*';
  }

  // Add CORS headers to response
  const response = (data: any, status: number = 200) => {
    const res = NextResponse.json(data, { status });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
    return res;
  };

  // Add some logging for debugging
  console.log('Sonar API called:', {
    method: request.method,
    origin: request.headers.get('origin'),
    extensionId: request.headers.get('x-extension-id'),
    userAgent: request.headers.get('user-agent'),
  });

  try {
    // Get domain from query params
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    
    if (!domain) {
      return response({ success: false, error: 'Domain parameter required' }, 400);
    }

    // Initialize Supabase client for session handling
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.log('Session error:', sessionError);
      return response({ success: false, error: 'Not logged in to Tregnar account' }, 401);
    }

    // Get user's internal ID from users table
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !userData) {
      console.log('User lookup error:', userError);
      return response({ success: false, error: 'User record not found' }, 404);
    }

    const userInternalId = userData.id;
    console.log(`🔍 Sonar API: Looking up domain "${domain}" for user ${userInternalId}`);

    // Remove www. if present (already done in extension, but double-check)
    const cleanDomain = domain.replace(/^www\./, '');

    // Check rate limiting (simple implementation - 500 calls per day)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const rateLimitKey = `sonar_rate_limit_${userInternalId}_${today}`;
    
    // Get current call count from a simple tracking method
    // Note: In production, consider using Redis or a proper rate limiting solution
    const { data: rateLimitData } = await supabaseService
      .from('api_usage_tracking')
      .select('call_count')
      .eq('user_id', userInternalId)
      .eq('api_endpoint', 'sonar_site_data')
      .eq('date', today)
      .single();

    const currentCalls = rateLimitData?.call_count || 0;
    if (currentCalls >= 500) {
      return response({ success: false, error: 'Daily rate limit exceeded (500 calls/day)' }, 429);
    }

    // Query sitespren_unified_view for ownership verification (same as /sitejar4)
    const { data: sitesprenData, error: sitesprenError } = await supabaseService
      .from('sitespren_unified_view')
      .select('sitespren_base, fk_users_id')
      .eq('sitespren_base', cleanDomain)
      .eq('fk_users_id', userInternalId)
      .single();

    if (sitesprenError || !sitesprenData) {
      console.log('Domain ownership check failed:', sitesprenError);
      return response({ success: false, error: 'Site not found in your account' }, 404);
    }

    // Query sitesglub for IP address (ONLY source for IP as requested)
    const { data: sitesglubData, error: sitesglubError } = await supabaseService
      .from('sitesglub')
      .select('glub_ip_address')
      .eq('glub_sitesglub_base', cleanDomain)
      .single();

    // Update rate limiting counter
    await supabaseService
      .from('api_usage_tracking')
      .upsert({
        user_id: userInternalId,
        api_endpoint: 'sonar_site_data',
        date: today,
        call_count: currentCalls + 1,
        updated_at: new Date().toISOString()
      });

    // Return data with pseudo names for security
    const responseData = {
      success: true,
      data: {
        sitesprivate_base: sitesprenData.sitespren_base || '', // Pseudo name for frontend
        sitesglobal_ip_address: sitesglubData?.glub_ip_address || '', // ONLY use sitesglub IP
        // Future: Add other metrics with pseudo names when requested
        // sitesglobal_mj_tf: sitesglubData?.mj_tf || '',
        // sitesglobal_mj_cf: sitesglubData?.mj_cf || '',
        // sitesglobal_mj_rd: sitesglubData?.mj_rd || '',
      }
    };

    console.log(`✅ Sonar API: Successfully returned data for ${cleanDomain}`);
    return response(responseData);

  } catch (error) {
    console.error('Sonar API error:', error);
    return response({ success: false, error: 'Internal server error' }, 500);
  }
}

export async function OPTIONS(request: NextRequest) {
  // Handle preflight CORS requests
  const origin = request.headers.get('origin');
  
  const corsHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Extension-ID, Cookie, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (origin && origin.startsWith('chrome-extension://')) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  } else {
    corsHeaders['Access-Control-Allow-Origin'] = '*';
  }

  const response = new NextResponse(null, { status: 200 });
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}