import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// DataForSEO API configuration
const DFS_API_BASE = 'https://api.dataforseo.com/v3';

// Helper function to get admin settings for autofetch
async function getAutofetchSettings(supabase: any): Promise<string[]> {
  try {
    const { data: settings, error } = await supabase
      .from('dfs_autofetch_settings')
      .select('column_name')
      .eq('is_enabled', true);

    if (error) {
      console.error('Error fetching autofetch settings:', error);
      return []; // Return empty array if settings table doesn't exist yet
    }

    return settings?.map(s => s.column_name) || [];
  } catch (error) {
    console.error('Error in getAutofetchSettings:', error);
    return [];
  }
}

// Helper function to call DataForSEO API
async function callDataForSEOAPI(domain: string) {
  try {
    const auth = Buffer.from(`${process.env.DFS_USERNAME}:${process.env.DFS_PASSWORD}`).toString('base64');
    
    const response = await fetch(`${DFS_API_BASE}/domain_analytics/whois/overview/live`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        target: domain,
        limit: 1
      }])
    });

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('DataForSEO API response:', data);

    // Extract the domain data from the response
    if (data.tasks && data.tasks[0] && data.tasks[0].result && data.tasks[0].result[0] && data.tasks[0].result[0].items && data.tasks[0].result[0].items[0]) {
      return {
        success: true,
        data: data.tasks[0].result[0].items[0],
        cost: data.tasks[0].cost || 0
      };
    } else {
      throw new Error('No data returned from DataForSEO API');
    }
  } catch (error) {
    console.error('DataForSEO API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown API error'
    };
  }
}

// Helper function to update sitesdfs record with selective fields
async function updateSitesdfsRecord(supabase: any, sitesdfs_id: number, dfsData: any, enabledColumns: string[], apiCost: number) {
  try {
    // Map DataForSEO response to our database columns based on enabled settings
    const updateData: any = {
      dataforseo_last_fetched: new Date().toISOString(),
      dataforseo_api_cost: apiCost,
      dataforseo_raw_response: dfsData, // Always store raw response
      updated_at: new Date().toISOString()
    };

    // Only update fields that are enabled in admin settings
    enabledColumns.forEach(columnName => {
      switch (columnName) {
        // Top-level domain fields
        case 'domain':
          updateData.domain = dfsData.domain || null;
          break;
        case 'created_datetime':
          updateData.created_datetime = dfsData.created_datetime ? new Date(dfsData.created_datetime).toISOString() : null;
          break;
        case 'changed_datetime':
          updateData.changed_datetime = dfsData.changed_datetime ? new Date(dfsData.changed_datetime).toISOString() : null;
          break;
        case 'expiration_datetime':
          updateData.expiration_datetime = dfsData.expiration_datetime ? new Date(dfsData.expiration_datetime).toISOString() : null;
          break;
        case 'updated_datetime':
          updateData.updated_datetime = dfsData.updated_datetime ? new Date(dfsData.updated_datetime).toISOString() : null;
          break;
        case 'first_seen':
          updateData.first_seen = dfsData.first_seen ? new Date(dfsData.first_seen).toISOString() : null;
          break;
        case 'tld':
          updateData.tld = dfsData.tld || null;
          break;
        case 'registered':
          updateData.registered = dfsData.registered || false;
          break;
        case 'registrar':
          updateData.registrar = dfsData.registrar || null;
          break;
        case 'epp_status_codes':
          updateData.epp_status_codes = dfsData.epp_status_codes || null;
          break;
        case 'raw_status_codes':
          updateData.raw_status_codes = dfsData.raw_status_codes || null;
          break;

        // Organic search metrics
        case 'organic_pos_1':
          updateData.organic_pos_1 = dfsData.metrics?.organic?.pos_1 || 0;
          break;
        case 'organic_pos_2_3':
          updateData.organic_pos_2_3 = dfsData.metrics?.organic?.pos_2_3 || 0;
          break;
        case 'organic_pos_4_10':
          updateData.organic_pos_4_10 = dfsData.metrics?.organic?.pos_4_10 || 0;
          break;
        case 'organic_pos_11_20':
          updateData.organic_pos_11_20 = dfsData.metrics?.organic?.pos_11_20 || 0;
          break;
        case 'organic_pos_21_30':
          updateData.organic_pos_21_30 = dfsData.metrics?.organic?.pos_21_30 || 0;
          break;
        case 'organic_pos_31_40':
          updateData.organic_pos_31_40 = dfsData.metrics?.organic?.pos_31_40 || 0;
          break;
        case 'organic_pos_41_50':
          updateData.organic_pos_41_50 = dfsData.metrics?.organic?.pos_41_50 || 0;
          break;
        case 'organic_pos_51_60':
          updateData.organic_pos_51_60 = dfsData.metrics?.organic?.pos_51_60 || 0;
          break;
        case 'organic_pos_61_70':
          updateData.organic_pos_61_70 = dfsData.metrics?.organic?.pos_61_70 || 0;
          break;
        case 'organic_pos_71_80':
          updateData.organic_pos_71_80 = dfsData.metrics?.organic?.pos_71_80 || 0;
          break;
        case 'organic_pos_81_90':
          updateData.organic_pos_81_90 = dfsData.metrics?.organic?.pos_81_90 || 0;
          break;
        case 'organic_pos_91_100':
          updateData.organic_pos_91_100 = dfsData.metrics?.organic?.pos_91_100 || 0;
          break;
        case 'organic_etv':
          updateData.organic_etv = dfsData.metrics?.organic?.etv || 0;
          break;
        case 'organic_estimated_paid_traffic_cost':
          updateData.organic_estimated_paid_traffic_cost = dfsData.metrics?.organic?.estimated_paid_traffic_cost || 0;
          break;

        // Paid search metrics
        case 'paid_pos_1':
          updateData.paid_pos_1 = dfsData.metrics?.paid?.pos_1 || 0;
          break;
        case 'paid_pos_2_3':
          updateData.paid_pos_2_3 = dfsData.metrics?.paid?.pos_2_3 || 0;
          break;
        case 'paid_pos_4_10':
          updateData.paid_pos_4_10 = dfsData.metrics?.paid?.pos_4_10 || 0;
          break;
        case 'paid_pos_11_20':
          updateData.paid_pos_11_20 = dfsData.metrics?.paid?.pos_11_20 || 0;
          break;
        case 'paid_pos_21_30':
          updateData.paid_pos_21_30 = dfsData.metrics?.paid?.pos_21_30 || 0;
          break;
        case 'paid_pos_31_40':
          updateData.paid_pos_31_40 = dfsData.metrics?.paid?.pos_31_40 || 0;
          break;
        case 'paid_pos_41_50':
          updateData.paid_pos_41_50 = dfsData.metrics?.paid?.pos_41_50 || 0;
          break;
        case 'paid_pos_51_60':
          updateData.paid_pos_51_60 = dfsData.metrics?.paid?.pos_51_60 || 0;
          break;
        case 'paid_pos_61_70':
          updateData.paid_pos_61_70 = dfsData.metrics?.paid?.pos_61_70 || 0;
          break;
        case 'paid_pos_71_80':
          updateData.paid_pos_71_80 = dfsData.metrics?.paid?.pos_71_80 || 0;
          break;
        case 'paid_pos_81_90':
          updateData.paid_pos_81_90 = dfsData.metrics?.paid?.pos_81_90 || 0;
          break;
        case 'paid_pos_91_100':
          updateData.paid_pos_91_100 = dfsData.metrics?.paid?.pos_91_100 || 0;
          break;
        case 'paid_etv':
          updateData.paid_etv = dfsData.metrics?.paid?.etv || 0;
          break;
        case 'paid_estimated_paid_traffic_cost':
          updateData.paid_estimated_paid_traffic_cost = dfsData.metrics?.paid?.estimated_paid_traffic_cost || 0;
          break;

        // Backlinks data
        case 'referring_domains':
          updateData.referring_domains = dfsData.backlinks_info?.referring_domains || 0;
          break;
        case 'referring_main_domains':
          updateData.referring_main_domains = dfsData.backlinks_info?.referring_main_domains || 0;
          break;
        case 'referring_pages':
          updateData.referring_pages = dfsData.backlinks_info?.referring_pages || 0;
          break;
        case 'backlinks':
          updateData.backlinks = dfsData.backlinks_info?.backlinks || 0;
          break;
        case 'backlinks_spam_score':
          updateData.backlinks_spam_score = dfsData.backlinks_info?.backlinks_spam_score || 0;
          break;
        case 'broken_backlinks':
          updateData.broken_backlinks = dfsData.backlinks_info?.broken_backlinks || 0;
          break;
        case 'broken_pages':
          updateData.broken_pages = dfsData.backlinks_info?.broken_pages || 0;
          break;
        case 'referring_domains_nofollow':
          updateData.referring_domains_nofollow = dfsData.backlinks_info?.referring_domains_nofollow || 0;
          break;
        case 'referring_main_domains_nofollow':
          updateData.referring_main_domains_nofollow = dfsData.backlinks_info?.referring_main_domains_nofollow || 0;
          break;
        case 'referring_ips':
          updateData.referring_ips = dfsData.backlinks_info?.referring_ips || 0;
          break;
        case 'referring_subnets':
          updateData.referring_subnets = dfsData.backlinks_info?.referring_subnets || 0;
          break;
        case 'referring_pages_nofollow':
          updateData.referring_pages_nofollow = dfsData.backlinks_info?.referring_pages_nofollow || 0;
          break;

        // Metadata
        case 'metrics_time_update':
          updateData.metrics_time_update = dfsData.metrics_time_update ? new Date(dfsData.metrics_time_update).toISOString() : null;
          break;
        case 'se_type':
          updateData.se_type = dfsData.se_type || 'google';
          break;
        case 'location_code':
          updateData.location_code = dfsData.location_code || 2840;
          break;
        case 'language_code':
          updateData.language_code = dfsData.language_code || 'en';
          break;

        default:
          console.warn(`Unknown column name in autofetch settings: ${columnName}`);
      }
    });

    // Update the sitesdfs record
    const { error: updateError } = await supabase
      .from('sitesdfs')
      .update(updateData)
      .eq('sitesdfs_id', sitesdfs_id);

    if (updateError) {
      console.error('Error updating sitesdfs record:', updateError);
      return false;
    }

    console.log(`Successfully updated sitesdfs record ${sitesdfs_id} with ${enabledColumns.length} enabled fields`);
    return true;

  } catch (error) {
    console.error('Error in updateSitesdfsRecord:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('AutomaticFetchOfDFSMetricsOnSiteAdd triggered');
    
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get request body
    const { domain, sitesdfs_id } = await request.json();
    
    if (!domain || !sitesdfs_id) {
      return NextResponse.json(
        { success: false, error: 'Domain and sitesdfs_id are required' },
        { status: 400 }
      );
    }

    console.log(`Processing autofetch for domain: ${domain}, sitesdfs_id: ${sitesdfs_id}`);

    // Get autofetch settings to determine which fields to populate
    const enabledColumns = await getAutofetchSettings(supabase);
    
    if (enabledColumns.length === 0) {
      console.log('No autofetch columns enabled, skipping DataForSEO API call');
      return NextResponse.json({
        success: true,
        message: 'No columns enabled for autofetch, skipping API call',
        data: { domain, sitesdfs_id, enabledColumns: [] }
      });
    }

    console.log(`Enabled autofetch columns: ${enabledColumns.join(', ')}`);

    // Call DataForSEO API
    const apiResult = await callDataForSEOAPI(domain);
    
    if (!apiResult.success) {
      console.error(`DataForSEO API failed for domain ${domain}:`, apiResult.error);
      return NextResponse.json(
        { success: false, error: `DataForSEO API failed: ${apiResult.error}` },
        { status: 500 }
      );
    }

    // Update sitesdfs record with fetched data
    const updateSuccess = await updateSitesdfsRecord(
      supabase, 
      sitesdfs_id, 
      apiResult.data, 
      enabledColumns, 
      apiResult.cost || 0
    );

    if (!updateSuccess) {
      return NextResponse.json(
        { success: false, error: 'Failed to update sitesdfs record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully fetched and updated ${enabledColumns.length} fields for domain ${domain}`,
      data: {
        domain,
        sitesdfs_id,
        enabledColumns,
        apiCost: apiResult.cost || 0,
        fieldsUpdated: enabledColumns.length
      }
    });

  } catch (error) {
    console.error('AutomaticFetchOfDFSMetricsOnSiteAdd error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error in autofetch process' },
      { status: 500 }
    );
  }
}