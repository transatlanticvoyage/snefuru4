import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { processUrlList, isValidCleanedUrl, extractDomainParts } from '@/app/(protected)/sitejar4/utils/urlCleaner';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientComponentClient();
    
    // Get the request body
    const { user_internal_id, sites_list } = await request.json();
    
    if (!user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!sites_list || typeof sites_list !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Sites list is required' },
        { status: 400 }
      );
    }

    // Process the URL list
    const cleanedUrls = processUrlList(sites_list);
    
    if (cleanedUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid URLs provided' },
        { status: 400 }
      );
    }

    // Filter out invalid URLs
    const validUrls = cleanedUrls.filter(url => isValidCleanedUrl(url));
    
    if (validUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid URLs found after cleaning' },
        { status: 400 }
      );
    }

    // Prepare records for insertion
    const sitesToInsert = validUrls.map(url => {
      const domainParts = extractDomainParts(url);
      
      return {
        sitespren_base: url,
        fk_users_id: user_internal_id,
        true_root_domain: domainParts.true_root_domain || null,
        full_subdomain: domainParts.full_subdomain || null,
        webproperty_type: domainParts.webproperty_type || null,
        wpuser1: null,
        wppass1: null,
        wp_plugin_installed1: null,
        wp_plugin_connected2: null,
        fk_domreg_hostaccount: null,
        is_wp_site: null
      };
    });

    // Insert sites in batch
    const { data: insertedSites, error: insertError } = await supabase
      .from('sitespren')
      .insert(sitesToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting sites:', insertError);
      
      // Check if it's a duplicate key error
      if (insertError.message?.includes('duplicate')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Some sites already exist. Please check and try again.',
            details: insertError.message 
          },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create sites' },
        { status: 500 }
      );
    }

    const sitesCreated = insertedSites?.length || 0;
    const invalidCount = cleanedUrls.length - validUrls.length;

    return NextResponse.json({
      success: true,
      data: {
        sitesCreated,
        sitesRequested: cleanedUrls.length,
        invalidUrls: invalidCount,
        message: `Successfully created ${sitesCreated} site(s)`
      }
    });

  } catch (error) {
    console.error('f71_createsite API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}