import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ZWP Site Status Interface
interface ZWPSiteStatusRequest {
  site_id?: string;
  api_key?: string;
  site_url?: string;
}

interface ZWPApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  zwp_sync_id?: string;
}

interface ZWPSiteStatus {
  site_id: string;
  site_url: string;
  site_name: string;
  sync_enabled: boolean;
  last_sync_at: string | null;
  total_posts: number;
  total_users: number;
  total_media: number;
  recent_sync_logs: any[];
  sync_health: 'healthy' | 'warning' | 'error';
}

// Validate ZWP API Key format
function validateZWPApiKey(apiKey: string): boolean {
  return apiKey.startsWith('zwp_') && apiKey.length > 10;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting ZWP site status check');
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const site_id = searchParams.get('site_id');
    const api_key = searchParams.get('api_key');
    const site_url = searchParams.get('site_url');

    console.log('📥 Status request:', { site_id, api_key: api_key ? 'provided' : 'missing', site_url });

    // Validate input - need at least one identifier
    if (!site_id && !api_key && !site_url) {
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Missing required parameter: site_id, api_key, or site_url required'
      }, { status: 400 });
    }

    // Validate API key format if provided
    if (api_key && !validateZWPApiKey(api_key)) {
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Invalid ZWP API key format'
      }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build query to find site
    let siteQuery = supabase
      .from('ywp_sites')
      .select('*');

    if (site_id) {
      siteQuery = siteQuery.eq('id', site_id);
    } else if (api_key) {
      siteQuery = siteQuery.eq('api_key', api_key);
    } else if (site_url) {
      siteQuery = siteQuery.eq('site_url', site_url);
    }

    const { data: site, error: siteError } = await siteQuery.single();

    if (siteError || !site) {
      console.error('❌ Site not found:', siteError);
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Site not found'
      }, { status: 404 });
    }

    console.log('✅ Site found:', site.id);

    // Get content counts
    const [postsResult, usersResult, mediaResult, logsResult] = await Promise.all([
      // Count posts
      supabase
        .from('ywp_posts')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', site.id),
      
      // Count users
      supabase
        .from('ywp_users')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', site.id),
      
      // Count media
      supabase
        .from('ywp_media')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', site.id),
      
      // Get recent sync logs
      supabase
        .from('ywp_sync_log')
        .select('*')
        .eq('site_id', site.id)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // Determine sync health based on recent activity
    let syncHealth: 'healthy' | 'warning' | 'error' = 'healthy';
    
    if (logsResult.data && logsResult.data.length > 0) {
      const recentErrors = logsResult.data.filter(log => log.status === 'failed').length;
      const totalRecent = logsResult.data.length;
      
      if (recentErrors > totalRecent * 0.5) {
        syncHealth = 'error';
      } else if (recentErrors > totalRecent * 0.2) {
        syncHealth = 'warning';
      }
    } else if (!site.last_sync_at) {
      syncHealth = 'warning';
    }

    const statusData: ZWPSiteStatus = {
      site_id: site.id,
      site_url: site.site_url,
      site_name: site.site_name,
      sync_enabled: site.sync_enabled,
      last_sync_at: site.last_sync_at,
      total_posts: postsResult.count || 0,
      total_users: usersResult.count || 0,
      total_media: mediaResult.count || 0,
      recent_sync_logs: logsResult.data || [],
      sync_health: syncHealth
    };

    console.log('✅ Site status retrieved successfully');

    return NextResponse.json<ZWPApiResponse<ZWPSiteStatus>>({
      success: true,
      data: statusData,
      zwp_sync_id: site.id
    });

  } catch (error) {
    console.error('❌ ZWP site status error:', error);
    return NextResponse.json<ZWPApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting ZWP site status check via POST');
    
    // Get request data
    const requestData: ZWPSiteStatusRequest = await request.json();
    console.log('📥 Status request:', {
      site_id: requestData.site_id,
      api_key: requestData.api_key ? 'provided' : 'missing',
      site_url: requestData.site_url
    });

    // Validate input
    if (!requestData.site_id && !requestData.api_key && !requestData.site_url) {
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Missing required field: site_id, api_key, or site_url required'
      }, { status: 400 });
    }

    // Convert to GET-style query and reuse logic
    const queryParams = new URLSearchParams();
    if (requestData.site_id) queryParams.set('site_id', requestData.site_id);
    if (requestData.api_key) queryParams.set('api_key', requestData.api_key);
    if (requestData.site_url) queryParams.set('site_url', requestData.site_url);

    const getUrl = `${request.nextUrl.origin}${request.nextUrl.pathname}?${queryParams.toString()}`;
    const getRequest = new NextRequest(getUrl, { method: 'GET' });
    
    return await GET(getRequest);

  } catch (error) {
    console.error('❌ ZWP site status POST error:', error);
    return NextResponse.json<ZWPApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 