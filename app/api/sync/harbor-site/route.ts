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
      .select('id, ruplin_api_key_1')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User record not found' },
        { status: 404 }
      );
    }

    if (!userData.ruplin_api_key_1) {
      return NextResponse.json(
        { success: false, message: 'API key not configured for user' },
        { status: 400 }
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

    // Try Harbor Plugin API first
    if (method === 'plugin_api' || fallbackEnabled) {
      console.log(`🏠 Attempting Harbor Plugin API sync for ${siteData.site_url}`);
      syncResult = await syncViaHarborPluginApi(siteData.site_url, userData.ruplin_api_key_1);
      
      if (syncResult.success) {
        console.log(`✅ Harbor Plugin API sync successful`);
        const savedCount = await saveContentToDatabase(syncResult.data, siteData.site_url, 'harbor_plugin_api', supabase);
        
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
          message: `Successfully synced ${savedCount} items via Harbor Plugin API`,
          method: 'harbor_plugin_api',
          count: savedCount,
          data: {
            posts: syncResult.data.filter((p: any) => p.post_type === 'post').length,
            pages: syncResult.data.filter((p: any) => p.post_type === 'page').length,
            failed: syncResult.data.length - savedCount,
          }
        });
      } else {
        console.log(`❌ Harbor Plugin API failed: ${syncResult.message}`);
      }
    }

    // Try REST API if Harbor Plugin API failed or is specifically requested
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
          message += ` (Harbor Plugin API unavailable, used REST API as fallback)`;
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
      message: `Harbor sync failed with both methods. Plugin API: ${syncResult?.message || 'Not attempted'}`,
      method: method,
      errors: [syncResult?.message || 'Unknown error']
    }, { status: 500 });

  } catch (error) {
    console.error('Harbor Sync API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

// Harbor Plugin API sync method
async function syncViaHarborPluginApi(siteUrl: string, apiKey: string) {
  try {
    const endpoint = `${siteUrl}/wp-json/harbor/v1/posts`;
    console.log(`🔗 Harbor Plugin API endpoint: ${endpoint}`);
    console.log(`🔑 Using API key: ${apiKey.substring(0, 8)}...`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Snefuru-NextJS-App/1.0'
      },
    });

    console.log(`📡 Harbor Plugin API response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`❌ Harbor Plugin API error response: ${responseText}`);
      throw new Error(`Harbor Plugin API request failed: ${response.status} ${response.statusText}. Response: ${responseText}`);
    }

    const data = await response.json();
    console.log(`📊 Harbor Plugin API response data:`, { 
      success: data.success, 
      total: data.total, 
      message: data.message,
      dataLength: data.data?.length,
      fullData: data
    });
    
    // More detailed logging for debugging
    if (data.data && Array.isArray(data.data)) {
      console.log(`📝 First few posts sample:`, data.data.slice(0, 3));
      console.log(`📊 Posts by type:`, {
        posts: data.data.filter((p: any) => p.post_type === 'post').length,
        pages: data.data.filter((p: any) => p.post_type === 'page').length,
        published: data.data.filter((p: any) => p.post_status === 'publish').length,
        draft: data.data.filter((p: any) => p.post_status === 'draft').length,
        private: data.data.filter((p: any) => p.post_status === 'private').length
      });
    }
    
    if (!data.success) {
      throw new Error(data.message || 'Harbor Plugin API returned error');
    }

    return {
      success: true,
      data: data.data || [],
      message: `Retrieved ${data.total || data.data?.length || 0} items`
    };

  } catch (error) {
    console.error('💥 Harbor Plugin API sync error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: []
    };
  }
}

// REST API sync method (shared with regular sync)
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
  console.log(`💾 Starting to save ${posts.length} posts to database for ${siteUrl} (Harbor sync)`);

  // First, get the site UUID for the foreign key
  const { data: siteData, error: siteError } = await supabase
    .from('ywp_sites')
    .select('id')
    .eq('site_url', siteUrl)
    .single();
    
  if (siteError || !siteData) {
    console.error(`❌ Could not find site record for ${siteUrl}:`, siteError);
    return 0;
  }
  
  const siteId = siteData.id;
  console.log(`🔗 Using site ID: ${siteId} for ${siteUrl}`);

  for (const post of posts) {
    try {
      let contentData;
      
      if (syncMethod === 'harbor_plugin_api') {
        // Harbor Plugin API format
        contentData = {
          fk_site_id: siteId,  // Use UUID foreign key instead of site_url
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
          post_parent: post.post_parent || 0,
          menu_order: post.menu_order || 0,
          comment_status: post.comment_status,
          ping_status: post.ping_status,
          guid: post.guid,
          post_name: post.post_name,
          sync_method: 'harbor_plugin_api',
          raw_metadata: {
            featured_media: post.featured_media,
            categories: post.categories,
            tags: post.tags,
            meta: post.meta || {},
          }
        };
        console.log(`📝 Processing Harbor Plugin API post: ID=${post.ID}, title="${post.post_title}", type=${post.post_type}, status=${post.post_status}`);
      } else {
        // REST API format
        contentData = {
          fk_site_id: siteId,  // Use UUID foreign key instead of site_url
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
          post_parent: post.parent || 0,
          menu_order: post.menu_order || 0,
          guid: post.guid?.rendered || post.guid || '',
          post_name: post.slug,
          sync_method: 'rest_api',
          raw_metadata: {
            featured_media: post.featured_media,
            categories: post.categories || [],
            tags: post.tags || [],
            meta: {},
            link: post.link,
          }
        };
        console.log(`📝 Processing REST API post: ID=${post.id}, title="${post.title?.rendered || post.title}", type=${post.type}, status=${post.status}`);
      }

      // Upsert content using the correct conflict resolution
      const { error } = await supabase
        .from('ywp_content')
        .upsert(contentData, {
          onConflict: 'fk_site_id,post_id',  // Use correct column names
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`❌ Error saving post ${post.ID || post.id}:`, error);
      } else {
        savedCount++;
        console.log(`✅ Saved post ${post.ID || post.id}: "${contentData.post_title}"`);
      }
    } catch (postError) {
      console.error(`💥 Error processing post ${post.ID || post.id}:`, postError);
    }
  }

  console.log(`💾 Harbor database save complete: ${savedCount}/${posts.length} posts saved successfully`);
  return savedCount;
} 