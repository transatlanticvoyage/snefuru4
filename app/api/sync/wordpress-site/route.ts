import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, method = 'plugin_api', fallbackEnabled = true } = body;

    // Validate input
    if (!siteId) {
      return NextResponse.json(
        { success: false, message: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User record not found' },
        { status: 404 }
      );
    }

    // Get site record
    const { data: siteData, error: siteError } = await supabase
      .from('ywp_sites')
      .select('*')
      .eq('id', siteId)
      .eq('fk_user_id', userData.id)
      .single();

    if (siteError || !siteData) {
      return NextResponse.json(
        { success: false, message: 'Site not found or access denied' },
        { status: 404 }
      );
    }

    let syncResult;

    // Try Plugin API first
    if (method === 'plugin_api' || fallbackEnabled) {
      console.log(`🔄 Attempting Plugin API sync for ${siteData.site_url}`);
      syncResult = await syncViaPluginApi(siteData.site_url, siteData.api_key);
      
      if (syncResult.success) {
        console.log(`✅ Plugin API sync successful`);
        const savedCount = await saveContentToDatabase(syncResult.data, siteData.site_url, 'plugin_api', supabase);
        
        // Update last sync timestamp
        await supabase
          .from('ywp_sites')
          .update({ 
            last_sync_at: new Date().toISOString(),
            sync_enabled: true 
          })
          .eq('id', siteId);

        return NextResponse.json({
          success: true,
          message: `Successfully synced ${savedCount} items via Plugin API`,
          method: 'plugin_api',
          count: savedCount,
          data: {
            posts: syncResult.data.filter((p: any) => p.post_type === 'post').length,
            pages: syncResult.data.filter((p: any) => p.post_type === 'page').length,
            failed: syncResult.data.length - savedCount,
          }
        });
      } else {
        console.log(`❌ Plugin API failed: ${syncResult.message}`);
      }
    }

    // Try REST API if Plugin API failed or is specifically requested
    if (method === 'rest_api' || (fallbackEnabled && (!syncResult || !syncResult.success))) {
      console.log(`🔄 Attempting REST API sync for ${siteData.site_url}`);
      syncResult = await syncViaRestApi(siteData.site_url);
      
      if (syncResult.success) {
        console.log(`✅ REST API sync successful`);
        const savedCount = await saveContentToDatabase(syncResult.data, siteData.site_url, 'rest_api', supabase);
        
        // Update last sync timestamp
        await supabase
          .from('ywp_sites')
          .update({ 
            last_sync_at: new Date().toISOString(),
            sync_enabled: true 
          })
          .eq('id', siteId);

        // Create clearer fallback message
        let message = `Successfully synced ${savedCount} items via REST API`;
        if (method === 'plugin_api' && fallbackEnabled) {
          message += ` (Plugin API unavailable, used REST API as fallback)`;
        }
        
        return NextResponse.json({
          success: true,
          message: message,
          method: 'rest_api',
          count: savedCount,
          data: {
            posts: syncResult.data.filter((p: any) => p.type === 'post').length,
            pages: syncResult.data.filter((p: any) => p.type === 'page').length,
            failed: syncResult.data.length - savedCount,
          }
        });
      } else {
        console.log(`❌ REST API failed: ${syncResult.message}`);
      }
    }

    // Both methods failed
    return NextResponse.json({
      success: false,
      message: `Sync failed with both methods. Plugin API: ${syncResult?.message || 'Not attempted'}`,
      method: method,
      errors: [syncResult?.message || 'Unknown error']
    }, { status: 500 });

  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

// Plugin API sync method
async function syncViaPluginApi(siteUrl: string, apiKey: string) {
  try {
    const endpoint = `${siteUrl}/wp-json/snefuru/v1/posts`;
    console.log(`🔗 Plugin API endpoint: ${endpoint}`);
    console.log(`🔑 Using API key: ${apiKey.substring(0, 8)}...`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Snefuru-NextJS-App/1.0'
      },
    });

    console.log(`📡 Plugin API response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`❌ Plugin API error response: ${responseText}`);
      throw new Error(`Plugin API request failed: ${response.status} ${response.statusText}. Response: ${responseText}`);
    }

    const data = await response.json();
    console.log(`📊 Plugin API response data:`, { 
      success: data.success, 
      total: data.total, 
      message: data.message,
      dataLength: data.data?.length 
    });
    
    if (!data.success) {
      throw new Error(data.message || 'Plugin API returned error');
    }

    return {
      success: true,
      data: data.data || [],
      message: `Retrieved ${data.total || data.data?.length || 0} items`
    };

  } catch (error) {
    console.error('💥 Plugin API sync error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: []
    };
  }
}

// REST API sync method
async function syncViaRestApi(siteUrl: string) {
  try {
    const allPosts = [];
    
    // Fetch posts
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= 50) { // Safety limit
      const postsUrl = `${siteUrl}/wp-json/wp/v2/posts?page=${page}&per_page=100`;
      const response = await fetch(postsUrl, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Snefuru-NextJS-App/1.0'
        }
      });
      
      if (response.ok) {
        const posts = await response.json();
        if (posts.length === 0) {
          hasMore = false;
        } else {
          allPosts.push(...posts);
          page++;
        }
      } else {
        hasMore = false;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Fetch pages
    page = 1;
    hasMore = true;
    
    while (hasMore && page <= 50) { // Safety limit
      const pagesUrl = `${siteUrl}/wp-json/wp/v2/pages?page=${page}&per_page=100`;
      const response = await fetch(pagesUrl, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Snefuru-NextJS-App/1.0'
        }
      });
      
      if (response.ok) {
        const pages = await response.json();
        if (pages.length === 0) {
          hasMore = false;
        } else {
          allPosts.push(...pages);
          page++;
        }
      } else {
        hasMore = false;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return {
      success: true,
      data: allPosts,
      message: `Retrieved ${allPosts.length} items`
    };

  } catch (error) {
    console.error('REST API sync error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: []
    };
  }
}

// Save content to database
async function saveContentToDatabase(posts: any[], siteUrl: string, syncMethod: string, supabase: any): Promise<number> {
  let savedCount = 0;

  for (const post of posts) {
    try {
      let contentData;
      
      if (syncMethod === 'plugin_api') {
        // Plugin API format
        contentData = {
          site_url: siteUrl,
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
      } else {
        // REST API format
        contentData = {
          site_url: siteUrl,
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
      }

      // Upsert content
      const { error } = await supabase
        .from('ywp_content')
        .upsert(contentData, {
          onConflict: 'site_url,post_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error saving post:', post.ID || post.id, error);
      } else {
        savedCount++;
      }
    } catch (postError) {
      console.error('Error processing post:', post.ID || post.id, postError);
    }
  }

  return savedCount;
} 