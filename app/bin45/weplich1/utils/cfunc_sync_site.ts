import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SyncResult, SyncMethod } from '@/app/lib/sync/types';

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

    // Call our server-side sync API
    const response = await fetch('/api/sync/wordpress-site', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        siteId: options.siteId,
        method: options.method || 'plugin_api',
        fallbackEnabled: options.fallbackEnabled !== false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
      return {
        success: false,
        message: errorData.message || `Server error: ${response.status} ${response.statusText}`,
        method: options.method || 'plugin_api'
      };
    }

    const result = await response.json();
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