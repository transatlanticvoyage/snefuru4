import { SyncMethodInterface, SyncConfig, SyncResult, SyncCapabilities, WordPressContent } from '../types';

export class PluginApiSync implements SyncMethodInterface {
  name = 'plugin_api' as const;
  
  capabilities: SyncCapabilities = {
    canAccessPrivate: true,
    canAccessDrafts: true,
    canAccessMeta: true,
    hasRateLimit: false,
    maxPostsPerRequest: 1000,
    requiresAuth: true,
  };

  validateConfig(config: SyncConfig): boolean {
    return !!(config.siteUrl && config.apiKey);
  }

  async sync(config: SyncConfig): Promise<SyncResult> {
    try {
      if (!this.validateConfig(config)) {
        return {
          success: false,
          message: 'Invalid configuration: Missing site URL or API key',
          method: 'plugin_api'
        };
      }

      // Fetch content using our plugin's custom endpoint
      const response = await fetch(`${config.siteUrl}/wp-json/snefuru/v1/posts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Plugin API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Plugin API returned error');
      }

      // Transform and save the content
      const posts = data.data || [];
      const savedCount = await this.saveContent(posts, config);

      return {
        success: true,
        message: `Successfully synced ${savedCount} items via Plugin API`,
        method: 'plugin_api',
        count: savedCount,
        data: {
          posts: posts.filter((p: any) => p.post_type === 'post').length,
          pages: posts.filter((p: any) => p.post_type === 'page').length,
          failed: posts.length - savedCount,
        }
      };

    } catch (error) {
      console.error('Plugin API sync error:', error);
      return {
        success: false,
        message: `Plugin API sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        method: 'plugin_api',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async saveContent(posts: any[], config: SyncConfig): Promise<number> {
    try {
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
      const supabase = createClientComponentClient();

      let savedCount = 0;

      for (const post of posts) {
        try {
          const contentData = {
            site_url: config.siteUrl,
            post_id: post.ID,
            post_title: post.post_title,
            post_content: post.post_content,
            post_excerpt: post.post_excerpt,
            post_status: post.post_status,
            post_type: post.post_type,
            post_date: post.post_date,
            post_modified: post.post_modified,
            post_author: parseInt(post.post_author),
            post_slug: post.post_name,
            sync_method: 'plugin_api',
            raw_metadata: {
              featured_media: post.featured_media,
              categories: post.categories,
              tags: post.tags,
              meta: post.meta || {},
              guid: post.guid,
              comment_status: post.comment_status,
              ping_status: post.ping_status,
            }
          };

          // Upsert (insert or update) based on site_url and post_id
          const { error } = await supabase
            .from('ywp_content')
            .upsert(contentData, {
              onConflict: 'site_url,post_id',
              ignoreDuplicates: false
            });

          if (error) {
            console.error('Error saving post:', post.ID, error);
          } else {
            savedCount++;
          }
        } catch (postError) {
          console.error('Error processing post:', post.ID, postError);
        }
      }

      return savedCount;
    } catch (error) {
      console.error('Error in saveContent:', error);
      return 0;
    }
  }
} 