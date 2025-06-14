import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// URL cleaning functions (moved here to avoid import issues)
function cleanUrl(url: string): string {
  if (!url) return '';
  
  let cleaned = url.trim();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./, '');
  
  return cleaned;
}

function processUrlList(urlList: string): string[] {
  return urlList
    .split('\n')
    .map(line => cleanUrl(line))
    .filter(url => url.length > 0);
}

function isValidCleanedUrl(url: string): boolean {
  if (!url || url.length === 0) return false;
  if (!url.includes('.')) return false;
  
  const invalidChars = /[<>"\s]/;
  if (invalidChars.test(url)) return false;
  
  return true;
}

export async function POST(request: NextRequest) {
  try {
    console.log('API route called');
    
    // Get the request body
    const { user_internal_id, sites_list } = await request.json();
    
    console.log('Received request:', { user_internal_id, sites_list });
    
    // Initialize Supabase client for server-side use
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    console.log('Supabase client initialized');
    
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
    console.log('Cleaned URLs:', cleanedUrls);
    
    if (cleanedUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid URLs provided' },
        { status: 400 }
      );
    }

    // Filter out invalid URLs
    const validUrls = cleanedUrls.filter(url => isValidCleanedUrl(url));
    console.log('Valid URLs:', validUrls);
    
    if (validUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid URLs found after cleaning' },
        { status: 400 }
      );
    }

    // Test with just the first URL for now
    const testUrl = validUrls[0];
    
    // Prepare one record for insertion
    const siteToInsert = {
      sitespren_base: testUrl,
      fk_users_id: user_internal_id
    };

    console.log('Attempting to insert single site:', siteToInsert);

    // Insert single site first
    const { data: insertedSites, error: insertError } = await supabase
      .from('sitespren')
      .insert([siteToInsert])
      .select();

    if (insertError) {
      console.error('Error inserting sites:', insertError);
      console.error('Error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });
      
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
        { 
          success: false, 
          error: 'Failed to create sites',
          details: insertError.message || 'Unknown database error'
        },
        { status: 500 }
      );
    }

    const sitesCreated = insertedSites?.length || 0;

    return NextResponse.json({
      success: true,
      data: {
        sitesCreated,
        sitesRequested: 1, // Testing with one site for now
        invalidUrls: 0,
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