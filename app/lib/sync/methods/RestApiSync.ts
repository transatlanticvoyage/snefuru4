import { SyncMethodInterface, SyncConfig, SyncResult, SyncCapabilities, WordPressContent } from '../types';

export class RestApiSync implements SyncMethodInterface {
  name = 'rest_api' as const;
  
  capabilities: SyncCapabilities = {
    canAccessPrivate: false,
    canAccessDrafts: false,
    canAccessMeta: false,
    hasRateLimit: true,
    maxPostsPerRequest: 100,
    requiresAuth: false,
  };

  validateConfig(config: SyncConfig): boolean {
    return !!config.siteUrl;
  }

  async sync(config: SyncConfig): Promise<SyncResult> {
    try {
      if (!this.validateConfig(config)) {
        return {
          success: false,
          message: 'Invalid configuration: Missing site URL',
          method: 'rest_api'
        };
      }

      const allPosts = [];
      let page = 1;
      let hasMore = true;

      // Fetch all posts with pagination
      while (hasMore) {
        const posts = await this.fetchPostsPage(config.siteUrl, page);
        
        if (posts.length === 0) {
          hasMore = false;
        } else {
          allPosts.push(...posts);
          page++;
          
          // Respect rate limits
          await this.delay(500);
        }

        // Safety limit to prevent infinite loops
        if (page > 50) break;
      }

      // Fetch all pages
      page = 1;
      hasMore = true;
      
      while (hasMore) {
        const pages = await this.fetchPagesPage(config.siteUrl, page);
        
        if (pages.length === 0) {
          hasMore = false;
        } else {
          allPosts.push(...pages);
          page++;
          
          // Respect rate limits
          await this.delay(500);
        }

        // Safety limit to prevent infinite loops
        if (page > 50) break;
      }

      const savedCount = await this.saveContent(allPosts, config);

      return {
        success: true,
        message: `Successfully synced ${savedCount} items via REST API`,
        method: 'rest_api',
        count: savedCount,
        data: {
          posts: allPosts.filter(p => p.type === 'post').length,
          pages: allPosts.filter(p => p.type === 'page').length,
          failed: allPosts.length - savedCount,
        }
      };

    } catch (error) {
      console.error('REST API sync error:', error);
      return {
        success: false,
        message: `REST API sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        method: 'rest_api',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async fetchPostsPage(siteUrl: string, page: number): Promise<any[]> {
    const url = `${siteUrl}/wp-json/wp/v2/posts?page=${page}&per_page=100`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 400 && page > 1) {
        // No more pages
        return [];
      }
      throw new Error(`REST API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async fetchPagesPage(siteUrl: string, page: number): Promise<any[]> {
    const url = `${siteUrl}/wp-json/wp/v2/pages?page=${page}&per_page=100`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 400 && page > 1) {
        // No more pages
        return [];
      }
      throw new Error(`REST API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
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
            post_id: post.id,
            post_title: post.title?.rendered || post.title || '',
            post_content: post.content?.rendered || post.content || '',
            post_excerpt: post.excerpt?.rendered || post.excerpt || '',
            post_status: post.status,
            post_type: post.type,
            post_date: post.date,
            post_modified: post.modified,
            post_author: post.author || 1,
            post_slug: post.slug,
            sync_method: 'rest_api',
            raw_metadata: {
              featured_media: post.featured_media,
              categories: post.categories || [],
              tags: post.tags || [],
              meta: {},
              guid: post.guid?.rendered || post.guid || '',
              link: post.link,
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
            console.error('Error saving post:', post.id, error);
          } else {
            savedCount++;
          }
        } catch (postError) {
          console.error('Error processing post:', post.id, postError);
        }
      }

      return savedCount;
    } catch (error) {
      console.error('Error in saveContent:', error);
      return 0;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 