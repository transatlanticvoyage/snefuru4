import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ZWP Site Registration Interface
interface ZWPSiteRegistrationRequest {
  site_url: string;
  site_name: string;
  admin_email?: string;
  wp_version?: string;
}

interface ZWPApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  zwp_sync_id?: string;
}

// Generate ZWP API Key
function generateZWPApiKey(): string {
  const prefix = 'zwp_';
  const randomPart = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
  return prefix + randomPart;
}

// Validate ZWP Site URL
function validateZWPSiteUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting ZWP site registration');
    
    // Get request data
    const requestData: ZWPSiteRegistrationRequest = await request.json();
    console.log('📥 Registration request:', {
      site_url: requestData.site_url,
      site_name: requestData.site_name,
      admin_email: requestData.admin_email,
      wp_version: requestData.wp_version
    });

    // Validate required fields
    if (!requestData.site_url || !requestData.site_name) {
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Missing required fields: site_url and site_name are required'
      }, { status: 400 });
    }

    // Validate site URL format
    if (!validateZWPSiteUrl(requestData.site_url)) {
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Invalid site URL format'
      }, { status: 400 });
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if site already exists
    const { data: existingSite, error: checkError } = await supabase
      .from('ywp_sites')
      .select('id, site_url, api_key')
      .eq('site_url', requestData.site_url)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing site:', checkError);
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Database error while checking site'
      }, { status: 500 });
    }

    // If site exists, return existing data
    if (existingSite) {
      console.log('✅ Site already registered, returning existing data');
      return NextResponse.json<ZWPApiResponse<any>>({
        success: true,
        data: {
          site_id: existingSite.id,
          site_url: existingSite.site_url,
          api_key: existingSite.api_key,
          status: 'existing'
        },
        zwp_sync_id: existingSite.id
      });
    }

    // Generate new API key
    const apiKey = generateZWPApiKey();
    
    // Insert new site
    const { data: newSite, error: insertError } = await supabase
      .from('ywp_sites')
      .insert({
        site_url: requestData.site_url,
        site_name: requestData.site_name,
        admin_email: requestData.admin_email,
        wp_version: requestData.wp_version,
        api_key: apiKey,
        sync_enabled: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting new site:', insertError);
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Failed to register site'
      }, { status: 500 });
    }

    console.log('✅ Site registered successfully:', newSite.id);

    // Log registration in sync log
    const { error: logError } = await supabase
      .from('ywp_sync_log')
      .insert({
        site_id: newSite.id,
        sync_type: 'site_registration',
        operation: 'create',
        status: 'success',
        records_processed: 1,
        records_total: 1,
        sync_data: {
          site_name: requestData.site_name,
          wp_version: requestData.wp_version
        }
      });

    if (logError) {
      console.warn('⚠️ Failed to log registration:', logError);
    }

    return NextResponse.json<ZWPApiResponse<any>>({
      success: true,
      data: {
        site_id: newSite.id,
        site_url: newSite.site_url,
        api_key: newSite.api_key,
        status: 'registered'
      },
      zwp_sync_id: newSite.id
    });

  } catch (error) {
    console.error('❌ ZWP site registration error:', error);
    return NextResponse.json<ZWPApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 