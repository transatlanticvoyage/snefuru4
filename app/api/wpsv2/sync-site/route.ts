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

    // Get user record and API key
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

    // Get site record from sitespren table
    const { data: siteData, error: siteError } = await supabase
      .from('sitespren')
      .select('*')
      .eq('id', siteId)
      .eq('fk_users_id', userData.id)
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
      console.log(`🔄 WPSv2: Attempting Plugin API sync for ${siteData.sitespren_base}`);
      syncResult = await wpsv2SyncViaPluginApi(siteData.sitespren_base, userData.ruplin_api_key_1);
      
      if (syncResult.success) {
        console.log(`✅ WPSv2: Plugin API sync successful`);
        const savedCount = await wpsv2SaveContentToDatabase(syncResult.data, siteData, 'plugin_api', supabase, userData.id);
        
        return NextResponse.json({
          success: true,
          message: `Successfully synced ${savedCount} items via Plugin API (WPSv2)`,
          method: 'plugin_api',
          count: savedCount,
          data: {
            posts: syncResult.data.filter((p: any) => p.post_type === 'post').length,
            pages: syncResult.data.filter((p: any) => p.post_type === 'page').length,
            failed: syncResult.data.length - savedCount,
          }
        });
      } else {
        console.log(`❌ WPSv2: Plugin API failed: ${syncResult.message}`);
      }
    }

    // Try REST API if Plugin API failed or is specifically requested
    if (method === 'rest_api' || (fallbackEnabled && (!syncResult || !syncResult.success))) {
      console.log(`🔄 WPSv2: Attempting REST API sync for ${siteData.sitespren_base}`);
      syncResult = await wpsv2SyncViaRestApi(siteData.sitespren_base, siteData.wp_rest_app_pass);
      
      if (syncResult.success) {
        console.log(`✅ WPSv2: REST API sync successful`);
        const savedCount = await wpsv2SaveContentToDatabase(syncResult.data, siteData, 'rest_api', supabase, userData.id);
        
        // Create clearer fallback message
        let message = `Successfully synced ${savedCount} items via REST API (WPSv2)`;
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
        console.log(`❌ WPSv2: REST API failed: ${syncResult.message}`);
      }
    }

    // Both methods failed
    return NextResponse.json({
      success: false,
      message: `WPSv2 sync failed with both methods. Plugin API: ${syncResult?.message || 'Not attempted'}`,
      method: method,
      errors: [syncResult?.message || 'Unknown error']
    }, { status: 500 });

  } catch (error) {
    console.error('WPSv2 Sync API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `WPSv2 Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

// Plugin API sync method
async function wpsv2SyncViaPluginApi(siteUrl: string, apiKey: string) {
  try {
    const endpoint = `https://${siteUrl}/wp-json/snefuru/v1/posts`;
    console.log(`🔗 WPSv2 Plugin API endpoint: ${endpoint}`);
    console.log(`🔑 WPSv2 Using API key: ${apiKey?.substring(0, 8)}...`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Snefuru-WPSv2/1.0'
      },
    });

    console.log(`📡 WPSv2 Plugin API response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`❌ WPSv2 Plugin API error response: ${responseText}`);
      throw new Error(`WPSv2 Plugin API request failed: ${response.status} ${response.statusText}. Response: ${responseText}`);
    }

    const data = await response.json();
    console.log(`📊 WPSv2 Plugin API response data:`, { 
      success: data.success, 
      total: data.total, 
      message: data.message,
      dataLength: data.data?.length
    });
    
    if (!data.success) {
      throw new Error(data.message || 'WPSv2 Plugin API returned error');
    }

    return {
      success: true,
      data: data.data || [],
      message: `Retrieved ${data.total || data.data?.length || 0} items`
    };

  } catch (error) {
    console.error('💥 WPSv2 Plugin API sync error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: []
    };
  }
}

// REST API sync method
async function wpsv2SyncViaRestApi(siteUrl: string, appPassword?: string) {
  try {
    const allPosts = [];
    
    // Prepare headers with authentication if available
    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'Snefuru-WPSv2/1.0'
    };
    
    // Add authentication if application password is provided
    if (appPassword) {
      console.log(`🔑 WPSv2: Using REST API authentication`);
      headers['Authorization'] = `Basic ${Buffer.from(appPassword).toString('base64')}`;
    } else {
      console.log(`🔓 WPSv2: Using REST API without authentication (public posts only)`);
    }
    
    // Fetch posts
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= 50) { // Safety limit
      const postsUrl = `https://${siteUrl}/wp-json/wp/v2/posts?page=${page}&per_page=100`;
      const response = await fetch(postsUrl, {
        headers: headers
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
      const pagesUrl = `https://${siteUrl}/wp-json/wp/v2/pages?page=${page}&per_page=100`;
      const response = await fetch(pagesUrl, {
        headers: headers
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
    console.error('WPSv2 REST API sync error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: []
    };
  }
}

// Save content to nwpi_content database
async function wpsv2SaveContentToDatabase(posts: any[], siteData: any, syncMethod: string, supabase: any, userInternalId: string): Promise<number> {
  let savedCount = 0;
  console.log(`💾 WPSv2: Starting to save ${posts.length} posts to nwpi_content for ${siteData.sitespren_base}`);

  for (const post of posts) {
    try {
      // DEBUG: Log the raw post data from WordPress
      console.log(`🔍 RAW POST DATA:`, JSON.stringify({
        ID: post.ID || post.id,
        post_name: post.post_name || post.slug,
        post_title: post.post_title || post.title?.rendered || post.title,
        post_status: post.post_status || post.status
      }));
      
      let contentData;
      
      if (syncMethod === 'plugin_api') {
        // Plugin API format
        contentData = {
          fk_users_id: userInternalId,
          fk_sitespren_id: siteData.id,
          fk_sitespren_base: siteData.sitespren_base,
          
          post_id: post.ID,
          post_author: parseInt(post.post_author) || null,
          post_date: post.post_date || null,
          post_date_gmt: post.post_date_gmt || null,
          post_modified: post.post_modified || null,
          
          post_content: post.post_content,
          post_content_filtered: post.post_content_filtered || null,
          post_title: post.post_title,
          post_excerpt: post.post_excerpt,
          post_status: post.post_status,
          post_type: post.post_type,
          // Always store the actual WordPress post_name (slug)
          // This preserves the real slug for both draft and published content
          post_name: post.post_name,
          // TEMP DEBUG: Store raw post_name in i_sync_error_message for debugging
          i_sync_error_message: `DEBUG: WP post_name="${post.post_name}" status="${post.post_status}" title="${post.post_title}"`,
          post_password: post.post_password || null,
          comment_status: post.comment_status,
          ping_status: post.ping_status,
          to_ping: post.to_ping || null,
          pinged: post.pinged || null,
          guid: post.guid,
          post_parent: post.post_parent || 0,
          menu_order: post.menu_order || 0,
          post_mime_type: post.post_mime_type || null,
          comment_count: post.comment_count || 0,
          
          i_raw_metadata: {
            featured_media: post.featured_media,
            categories: post.categories,
            tags: post.tags,
            meta: post.meta || {},
          },
          
          a_elementor_substance: post.elementor_data || null,
          
          i_sync_method: 'plugin_api',
          i_sync_version: 2,
          i_sync_status: 'completed',
          i_sync_started_at: new Date().toISOString(),
          i_sync_completed_at: new Date().toISOString(),
          i_sync_attempt_count: 1
        };
        console.log(`📝 WPSv2: Processing Plugin API post: ID=${post.ID}, title="${post.post_title}", type=${post.post_type}, status=${post.post_status}`);
        console.log(`🔍 WPSv2: post_name debug - from WP: "${post.post_name}", stored as: "${contentData.post_name}"`);
      } else {
        // REST API format
        contentData = {
          fk_users_id: userInternalId,
          fk_sitespren_id: siteData.id,
          fk_sitespren_base: siteData.sitespren_base,
          
          post_id: post.id,
          post_author: post.author || 1,
          post_date: post.date,
          post_modified: post.modified,
          
          post_content: post.content?.rendered || post.content || '',
          post_title: post.title?.rendered || post.title || '',
          post_excerpt: post.excerpt?.rendered || post.excerpt || '',
          post_status: post.status,
          post_type: post.type,
          // Always store the actual WordPress slug
          // This preserves the real slug for both draft and published content
          post_name: post.slug,
          comment_status: 'open', // Default for REST API
          ping_status: 'open', // Default for REST API
          guid: post.guid?.rendered || post.guid || '',
          post_parent: post.parent || 0,
          menu_order: post.menu_order || 0,
          comment_count: 0, // Not available in REST API
          
          i_raw_metadata: {
            featured_media: post.featured_media,
            categories: post.categories || [],
            tags: post.tags || [],
            meta: {},
            link: post.link,
          },
          
          a_elementor_substance: null, // REST API doesn't provide Elementor data
          
          i_sync_method: 'rest_api',
          i_sync_version: 2,
          i_sync_status: 'completed',
          i_sync_started_at: new Date().toISOString(),
          i_sync_completed_at: new Date().toISOString(),
          i_sync_attempt_count: 1
        };
        console.log(`📝 WPSv2: Processing REST API post: ID=${post.id}, title="${post.title?.rendered || post.title}", type=${post.type}, status=${post.status}`);
        console.log(`🔍 WPSv2: post_name debug - from WP: "${post.slug}", stored as: "${contentData.post_name}"`);
      }

      // Upsert content using the correct conflict resolution
      const { error } = await supabase
        .from('nwpi_content')
        .upsert(contentData, {
          onConflict: 'fk_sitespren_id,post_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`❌ WPSv2: Error saving post ${post.ID || post.id}:`, error);
        // Update error tracking
        await supabase
          .from('nwpi_content')
          .upsert({
            ...contentData,
            i_sync_status: 'failed',
            i_sync_error_message: error.message,
            i_sync_attempt_count: (contentData.i_sync_attempt_count || 0) + 1
          }, {
            onConflict: 'fk_sitespren_id,post_id',
            ignoreDuplicates: false
          });
      } else {
        savedCount++;
        console.log(`✅ WPSv2: Saved post ${post.ID || post.id}: "${contentData.post_title}"`);
      }
    } catch (postError) {
      console.error(`💥 WPSv2: Error processing post ${post.ID || post.id}:`, postError);
    }
  }

  console.log(`💾 WPSv2: Database save complete: ${savedCount}/${posts.length} posts saved successfully`);
  return savedCount;
}