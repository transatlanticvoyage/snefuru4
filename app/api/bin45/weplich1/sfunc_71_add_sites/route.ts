import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Generate API Key for WordPress sites
function generateApiKey(): string {
  const prefix = 'zwp_';
  const randomPart = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
  return prefix + randomPart;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting sfunc_71_add_sites');
    
    // Get request data
    const { sites } = await request.json();
    
    if (!sites || !Array.isArray(sites) || sites.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Sites array is required and cannot be empty'
      }, { status: 400 });
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Initialize Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired authentication token'
      }, { status: 401 });
    }

    // Get user's internal ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        message: 'User record not found'
      }, { status: 404 });
    }

    console.log('✅ User authenticated:', userData.id);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each site
    for (const siteInput of sites) {
      const siteUrl = siteInput.trim();
      
      if (!siteUrl) {
        results.push({
          site_url: siteInput,
          status: 'failed',
          error: 'Empty site URL'
        });
        failureCount++;
        continue;
      }

      // Basic URL validation
      let validatedUrl;
      try {
        // Add https:// if no protocol specified
        if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
          validatedUrl = 'https://' + siteUrl;
        } else {
          validatedUrl = siteUrl;
        }
        
        // Validate URL format
        new URL(validatedUrl);
      } catch (urlError) {
        results.push({
          site_url: siteInput,
          status: 'failed',
          error: 'Invalid URL format'
        });
        failureCount++;
        continue;
      }

      try {
        // Check if site already exists for this user
        const { data: existingSite, error: checkError } = await supabase
          .from('ywp_sites')
          .select('id, site_url')
          .eq('site_url', validatedUrl)
          .eq('fk_user_id', userData.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing site:', checkError);
          results.push({
            site_url: siteInput,
            status: 'failed',
            error: 'Database error while checking site'
          });
          failureCount++;
          continue;
        }

        if (existingSite) {
          results.push({
            site_url: siteInput,
            status: 'skipped',
            message: 'Site already exists'
          });
          continue;
        }

        // Generate API key for the site
        const apiKey = generateApiKey();
        
        // Derive site name from URL
        const siteName = new URL(validatedUrl).hostname.replace('www.', '');

        // Insert new site
        const { data: newSite, error: insertError } = await supabase
          .from('ywp_sites')
          .insert({
            site_url: validatedUrl,
            site_name: siteName,
            api_key: apiKey,
            sync_enabled: true,
            fk_user_id: userData.id
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting site:', insertError);
          results.push({
            site_url: siteInput,
            status: 'failed',
            error: 'Failed to create site record'
          });
          failureCount++;
          continue;
        }

        console.log('✅ Site created successfully:', newSite.id);
        
        results.push({
          site_url: siteInput,
          status: 'success',
          site_id: newSite.id,
          api_key: apiKey
        });
        successCount++;

      } catch (error) {
        console.error('Error processing site:', siteInput, error);
        results.push({
          site_url: siteInput,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failureCount++;
      }
    }

    console.log('✅ Completed processing sites:', { successCount, failureCount });

    return NextResponse.json({
      success: true,
      message: `Processed ${sites.length} sites: ${successCount} added, ${failureCount} failed`,
      count: successCount,
      results: results,
      stats: {
        total: sites.length,
        added: successCount,
        failed: failureCount,
        skipped: results.filter(r => r.status === 'skipped').length
      }
    });

  } catch (error) {
    console.error('❌ Error in sfunc_71_add_sites:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
} 