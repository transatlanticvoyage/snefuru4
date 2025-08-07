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
    const { user_internal_id, sites_list, additional_fields } = await request.json();
    
    console.log('Received request:', { user_internal_id, sites_list, additional_fields });
    
    // Initialize Supabase client with service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
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

    // Limit to 300 URLs maximum
    const urlsToProcess = validUrls.slice(0, 300);
    
    if (urlsToProcess.length !== validUrls.length) {
      console.log(`Limited to 300 URLs, processing ${urlsToProcess.length} out of ${validUrls.length}`);
    }
    
    // Prepare records for insertion
    const sitesToInsert = urlsToProcess.map(url => ({
      sitespren_base: url,
      fk_users_id: user_internal_id,
      ...additional_fields // Spread the additional fields
    }));

    console.log(`Attempting to insert ${sitesToInsert.length} sites:`, sitesToInsert);

    // Insert all sites
    const { data: insertedSites, error: insertError } = await supabase
      .from('sitespren')
      .insert(sitesToInsert)
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
    const invalidCount = cleanedUrls.length - validUrls.length;
    const limitedCount = validUrls.length - urlsToProcess.length;

    let message = `Successfully created ${sitesCreated} site(s)`;
    if (limitedCount > 0) {
      message += ` (${limitedCount} sites were skipped due to 300 limit)`;
    }
    if (invalidCount > 0) {
      message += ` (${invalidCount} invalid URLs were skipped)`;
    }

    return NextResponse.json({
      success: true,
      data: {
        sitesCreated,
        sitesRequested: cleanedUrls.length,
        invalidUrls: invalidCount,
        limitedUrls: limitedCount,
        message
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