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

// Helper function to get or create sitesglub record
async function getOrCreateSitesglub(supabase: any, domain: string): Promise<{ sitesglub_id: number } | null> {
  try {
    // First, check if sitesglub record already exists
    const { data: existingSitesglub, error: selectError } = await supabase
      .from('sitesglub')
      .select('sitesglub_id')
      .eq('sitesglub_base', domain)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing sitesglub:', selectError);
      return null;
    }

    // If exists, return the existing record
    if (existingSitesglub) {
      console.log(`Using existing sitesglub record for domain: ${domain}, ID: ${existingSitesglub.sitesglub_id}`);
      return existingSitesglub;
    }

    // Create new sitesglub record
    console.log(`Creating new sitesglub record for domain: ${domain}`);
    const { data: newSitesglub, error: insertError } = await supabase
      .from('sitesglub')
      .insert({
        sitesglub_base: domain,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('sitesglub_id')
      .single();

    if (insertError) {
      console.error('Error creating sitesglub record:', insertError);
      return null;
    }

    console.log(`Created new sitesglub record for domain: ${domain}, ID: ${newSitesglub.sitesglub_id}`);
    return newSitesglub;

  } catch (error) {
    console.error('Error in getOrCreateSitesglub:', error);
    return null;
  }
}

// Helper function to get or create sitesdfs record
async function getOrCreateSitesdfs(supabase: any, domain: string): Promise<{ sitesdfs_id: number } | null> {
  try {
    // First, check if sitesdfs record already exists
    const { data: existingSitesdfs, error: selectError } = await supabase
      .from('sitesdfs')
      .select('sitesdfs_id')
      .eq('sitesdfs_base', domain)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing sitesdfs:', selectError);
      return null;
    }

    // If exists, return the existing record
    if (existingSitesdfs) {
      console.log(`Using existing sitesdfs record for domain: ${domain}, ID: ${existingSitesdfs.sitesdfs_id}`);
      return existingSitesdfs;
    }

    // Create new sitesdfs record
    console.log(`Creating new sitesdfs record for domain: ${domain}`);
    const { data: newSitesdfs, error: insertError } = await supabase
      .from('sitesdfs')
      .insert({
        sitesdfs_base: domain,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('sitesdfs_id')
      .single();

    if (insertError) {
      console.error('Error creating sitesdfs record:', insertError);
      return null;
    }

    console.log(`Created new sitesdfs record for domain: ${domain}, ID: ${newSitesdfs.sitesdfs_id}`);
    
    // Trigger the AutomaticFetchOfDFSMetricsOnSiteAdd background process
    try {
      console.log(`Triggering AutomaticFetchOfDFSMetricsOnSiteAdd for domain: ${domain}`);
      fetch('/api/autofetch-dfs-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: domain,
          sitesdfs_id: newSitesdfs.sitesdfs_id
        })
      }).catch(err => {
        console.error('Error triggering DFS autofetch (non-blocking):', err);
      });
    } catch (triggerError) {
      console.error('Error triggering DFS autofetch (non-blocking):', triggerError);
    }
    
    return newSitesdfs;

  } catch (error) {
    console.error('Error in getOrCreateSitesdfs:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('f71_createsite API route called');
    
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
    
    // Process each URL to get/create sitesglub and sitesdfs records and prepare sitespren records
    const sitesToInsert = [];
    const sitesglubProcessed = [];
    const sitesdfsProcessed = [];
    const errors = [];

    for (const url of urlsToProcess) {
      try {
        // Get or create sitesglub record for this domain
        const sitesglubRecord = await getOrCreateSitesglub(supabase, url);
        
        if (sitesglubRecord) {
          // Get or create sitesdfs record for this domain
          const sitesdfsRecord = await getOrCreateSitesdfs(supabase, url);
          
          if (sitesdfsRecord) {
            // Link sitesglub to sitesdfs if not already linked
            const { error: linkError } = await supabase
              .from('sitesglub')
              .update({ fk_sitesdfs_id: sitesdfsRecord.sitesdfs_id })
              .eq('sitesglub_id', sitesglubRecord.sitesglub_id)
              .is('fk_sitesdfs_id', null);
            
            if (linkError) {
              console.error('Error linking sitesglub to sitesdfs:', linkError);
            } else {
              console.log(`Linked sitesglub ${sitesglubRecord.sitesglub_id} to sitesdfs ${sitesdfsRecord.sitesdfs_id}`);
            }
            
            sitesdfsProcessed.push({
              domain: url,
              sitesdfs_id: sitesdfsRecord.sitesdfs_id,
              action: 'processed'
            });
          }
          
          // Prepare sitespren record with foreign key to sitesglub
          sitesToInsert.push({
            sitespren_base: url,
            fk_users_id: user_internal_id,
            fk_sitesglub_id: sitesglubRecord.sitesglub_id, // Link to sitesglub
            ...additional_fields // Spread the additional fields
          });
          
          sitesglubProcessed.push({
            domain: url,
            sitesglub_id: sitesglubRecord.sitesglub_id,
            action: 'processed'
          });
        } else {
          errors.push(`Failed to create/get sitesglub record for domain: ${url}`);
          console.error(`Failed to create/get sitesglub record for domain: ${url}`);
        }
      } catch (error) {
        errors.push(`Error processing domain ${url}: ${error}`);
        console.error(`Error processing domain ${url}:`, error);
      }
    }

    console.log(`Attempting to insert ${sitesToInsert.length} sitespren records:`, sitesToInsert);
    console.log(`Sitesglub records processed:`, sitesglubProcessed);

    if (sitesToInsert.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No sites could be processed successfully',
          details: errors.length > 0 ? errors.join('; ') : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Insert all sitespren records
    const { data: insertedSites, error: insertError } = await supabase
      .from('sitespren')
      .insert(sitesToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting sitespren records:', insertError);
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
    const sitesglubCreated = sitesglubProcessed.length;
    const sitesdfsCreated = sitesdfsProcessed.length;

    let message = `Successfully created ${sitesCreated} site(s) with ${sitesglubCreated} sitesglub and ${sitesdfsCreated} sitesdfs record(s) processed`;
    if (limitedCount > 0) {
      message += ` (${limitedCount} sites were skipped due to 300 limit)`;
    }
    if (invalidCount > 0) {
      message += ` (${invalidCount} invalid URLs were skipped)`;
    }
    if (errors.length > 0) {
      message += ` (${errors.length} errors occurred)`;
    }

    return NextResponse.json({
      success: true,
      data: {
        sitesCreated,
        sitesRequested: cleanedUrls.length,
        invalidUrls: invalidCount,
        limitedUrls: limitedCount,
        sitesglubProcessed: sitesglubCreated,
        sitesdfsProcessed: sitesdfsCreated,
        errors: errors.length > 0 ? errors : undefined,
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