import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SyncManager } from '@/app/lib/sync/SyncManager';
import { SyncConfig, SyncResult, SyncMethod } from '@/app/lib/sync/types';

interface SiteSyncOptions {
  siteId: string;
  siteUrl: string;
  method?: SyncMethod;
  fallbackEnabled?: boolean;
}

export async function cfunc_sync_site(options: SiteSyncOptions): Promise<SyncResult> {
  try {
    const supabase = createClientComponentClient();
    
    // Get current session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      return {
        success: false,
        message: 'Authentication required',
        method: options.method || 'plugin_api'
      };
    }

    // Get user record to verify ownership
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        message: 'User record not found',
        method: options.method || 'plugin_api'
      };
    }

    // Get site record with API key
    const { data: siteData, error: siteError } = await supabase
      .from('ywp_sites')
      .select('*')
      .eq('id', options.siteId)
      .eq('fk_user_id', userData.id)
      .single();

    if (siteError || !siteData) {
      return {
        success: false,
        message: 'Site not found or access denied',
        method: options.method || 'plugin_api'
      };
    }

    // Prepare sync configuration
    const syncConfig: SyncConfig = {
      siteId: options.siteId,
      siteUrl: options.siteUrl,
      preferredMethod: options.method || 'plugin_api',
      fallbackEnabled: options.fallbackEnabled !== false, // Default to true
      apiKey: siteData.api_key,
    };

    // Initialize sync manager and perform sync
    const syncManager = new SyncManager();
    const result = await syncManager.syncSite(syncConfig);

    // Update last sync timestamp if successful
    if (result.success) {
      const { error: updateError } = await supabase
        .from('ywp_sites')
        .update({ 
          last_sync_at: new Date().toISOString(),
          sync_enabled: true 
        })
        .eq('id', options.siteId);

      if (updateError) {
        console.error('Failed to update last sync timestamp:', updateError);
      }
    }

    return result;

  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      method: options.method || 'plugin_api',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
} 