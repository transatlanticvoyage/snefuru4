import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Migration status tracking
interface MigrationStatus {
  total_sitesglub_records: number;
  processed_records: number;
  created_sitesdfs_records: number;
  api_calls_made: number;
  api_calls_failed: number;
  total_cost: number;
  status: 'running' | 'completed' | 'paused' | 'error';
  current_batch: number;
  error_message?: string;
  started_at: string;
  last_updated: string;
}

// Helper function to get or create migration status record
async function getMigrationStatus(supabase: any): Promise<MigrationStatus | null> {
  try {
    const { data, error } = await supabase
      .from('dfs_migration_status')
      .select('*')
      .single();

    if (error && error.code === 'PGRST116') { 
      // No rows found - return default status
      return {
        total_sitesglub_records: 0,
        processed_records: 0,
        created_sitesdfs_records: 0,
        api_calls_made: 0,
        api_calls_failed: 0,
        total_cost: 0,
        status: 'not_started',
        current_batch: 1,
        started_at: '',
        last_updated: new Date().toISOString()
      };
    }

    if (error) {
      console.error('Error fetching migration status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getMigrationStatus:', error);
    return null;
  }
}

// Helper function to update migration status
async function updateMigrationStatus(supabase: any, updates: Partial<MigrationStatus>) {
  try {
    const { error } = await supabase
      .from('dfs_migration_status')
      .upsert({
        id: 1, // Single status record
        ...updates,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error updating migration status:', error);
    }
  } catch (error) {
    console.error('Error in updateMigrationStatus:', error);
  }
}

// Helper function to get next batch of unprocessed sitesglub records
async function getNextBatch(supabase: any, batchSize: number = 10) {
  try {
    // Find sitesglub records that don't have corresponding sitesdfs records
    const { data: sitesglubRecords, error } = await supabase
      .from('sitesglub')
      .select(`
        sitesglub_id,
        sitesglub_base,
        fk_sitesdfs_id
      `)
      .is('fk_sitesdfs_id', null) // Only get records not yet linked to sitesdfs
      .not('sitesglub_base', 'is', null)
      .neq('sitesglub_base', '')
      .limit(batchSize);

    if (error) {
      console.error('Error fetching next batch:', error);
      return [];
    }

    return sitesglubRecords || [];
  } catch (error) {
    console.error('Error in getNextBatch:', error);
    return [];
  }
}

// Helper function to create sitesdfs record and link it
async function createAndLinkSitesdfs(supabase: any, sitesglubRecord: any) {
  try {
    // Create sitesdfs record
    const { data: newSitesdfs, error: createError } = await supabase
      .from('sitesdfs')
      .insert({
        sitesdfs_base: sitesglubRecord.sitesglub_base,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('sitesdfs_id')
      .single();

    if (createError) {
      console.error(`Error creating sitesdfs for ${sitesglubRecord.sitesglub_base}:`, createError);
      return null;
    }

    // Link sitesglub to sitesdfs
    const { error: linkError } = await supabase
      .from('sitesglub')
      .update({ fk_sitesdfs_id: newSitesdfs.sitesdfs_id })
      .eq('sitesglub_id', sitesglubRecord.sitesglub_id);

    if (linkError) {
      console.error(`Error linking sitesglub ${sitesglubRecord.sitesglub_id} to sitesdfs:`, linkError);
      return null;
    }

    console.log(`Created and linked sitesdfs record for ${sitesglubRecord.sitesglub_base}`);
    return newSitesdfs.sitesdfs_id;

  } catch (error) {
    console.error('Error in createAndLinkSitesdfs:', error);
    return null;
  }
}

// Helper function to trigger DFS autofetch with retry logic
async function triggerDFSFetch(domain: string, sitesdfs_id: number, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('/api/autofetch-dfs-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: domain,
          sitesdfs_id: sitesdfs_id
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          cost: result.data?.apiCost || 0
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error(`DFS fetch attempt ${attempt}/${retries} failed for ${domain}:`, error);
      
      if (attempt === retries) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

// Main migration function
async function processBatch(supabase: any) {
  const BATCH_SIZE = 5; // Small batch size to avoid rate limits
  
  // Get current migration status
  let status = await getMigrationStatus(supabase);
  
  if (!status || status.total_sitesglub_records === 0) {
    // Initialize migration status
    const { count, error: countError } = await supabase
      .from('sitesglub')
      .select('*', { count: 'exact', head: true })
      .is('fk_sitesdfs_id', null)
      .not('sitesglub_base', 'is', null)
      .neq('sitesglub_base', '');

    if (countError) {
      console.error('Error counting sitesglub records:', countError);
      return {
        completed: false,
        error: 'Failed to count total records for migration'
      };
    }

    const totalRecords = count || 0;

    status = {
      total_sitesglub_records: totalRecords,
      processed_records: 0,
      created_sitesdfs_records: 0,
      api_calls_made: 0,
      api_calls_failed: 0,
      total_cost: 0,
      status: 'running',
      current_batch: 1,
      started_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    await updateMigrationStatus(supabase, status);
    
    if (totalRecords === 0) {
      await updateMigrationStatus(supabase, {
        status: 'completed',
        last_updated: new Date().toISOString()
      });
      
      return {
        completed: true,
        message: 'No sites found to migrate - all sites already have sitesdfs records'
      };
    }
  }

  // Get next batch
  const batch = await getNextBatch(supabase, BATCH_SIZE);
  
  if (batch.length === 0) {
    // Migration complete
    await updateMigrationStatus(supabase, {
      status: 'completed',
      last_updated: new Date().toISOString()
    });
    
    return {
      completed: true,
      message: 'Migration completed - all sites processed'
    };
  }

  // Process each record in batch
  let batchResults = {
    processed: 0,
    created: 0,
    api_calls: 0,
    api_failures: 0,
    total_cost: 0,
    errors: [] as string[]
  };

  for (const record of batch) {
    try {
      // Create sitesdfs record and link it
      const sitesdfs_id = await createAndLinkSitesdfs(supabase, record);
      
      if (sitesdfs_id) {
        batchResults.created++;
        
        // Trigger DFS fetch
        const fetchResult = await triggerDFSFetch(record.sitesglub_base, sitesdfs_id);
        
        batchResults.api_calls++;
        
        if (fetchResult.success) {
          batchResults.total_cost += fetchResult.cost || 0;
          console.log(`Successfully fetched DFS data for ${record.sitesglub_base}`);
        } else {
          batchResults.api_failures++;
          batchResults.errors.push(`DFS fetch failed for ${record.sitesglub_base}: ${fetchResult.error}`);
        }
      } else {
        batchResults.errors.push(`Failed to create sitesdfs record for ${record.sitesglub_base}`);
      }
      
      batchResults.processed++;
      
      // Small delay between API calls to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
    } catch (error) {
      batchResults.errors.push(`Error processing ${record.sitesglub_base}: ${error}`);
      batchResults.processed++;
    }
  }

  // Update migration status
  await updateMigrationStatus(supabase, {
    processed_records: status.processed_records + batchResults.processed,
    created_sitesdfs_records: status.created_sitesdfs_records + batchResults.created,
    api_calls_made: status.api_calls_made + batchResults.api_calls,
    api_calls_failed: status.api_calls_failed + batchResults.api_failures,
    total_cost: status.total_cost + batchResults.total_cost,
    current_batch: status.current_batch + 1,
    status: 'running'
  });

  return {
    completed: false,
    batchResults,
    remainingRecords: status.total_sitesglub_records - (status.processed_records + batchResults.processed)
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('DFS Migration: Processing batch started');
    
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get request parameters
    const { action } = await request.json();

    if (action === 'status') {
      // Return current migration status
      const status = await getMigrationStatus(supabase);
      return NextResponse.json({
        success: true,
        status: status || { status: 'not_started' }
      });
    }

    if (action === 'reset') {
      // Reset migration status
      await updateMigrationStatus(supabase, {
        processed_records: 0,
        created_sitesdfs_records: 0,
        api_calls_made: 0,
        api_calls_failed: 0,
        total_cost: 0,
        status: 'running',
        current_batch: 1,
        started_at: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: true,
        message: 'Migration status reset'
      });
    }

    // Default action: process next batch
    const result = await processBatch(supabase);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('DFS Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error in migration process' },
      { status: 500 }
    );
  }
}