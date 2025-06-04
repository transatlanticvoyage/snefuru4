import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ZWP Bulk Posts Interface
interface ZWPBulkPostsRequest {
  api_key: string;
  posts: Array<{
    wp_post_id: number;
    post_author?: number;
    post_date?: string;
    post_date_gmt?: string;
    post_content: string;
    post_title: string;
    post_excerpt?: string;
    post_status?: string;
    comment_status?: string;
    ping_status?: string;
    post_password?: string;
    post_name?: string;
    post_modified?: string;
    post_modified_gmt?: string;
    post_content_filtered?: string;
    post_parent?: number;
    guid?: string;
    menu_order?: number;
    post_type?: string;
    post_mime_type?: string;
    comment_count?: number;
    featured_image_url?: string;
    seo_title?: string;
    seo_description?: string;
    post_meta?: Array<{
      meta_key: string;
      meta_value: string;
    }>;
    taxonomies?: Array<{
      taxonomy: string;
      term_id: number;
      name: string;
      slug: string;
    }>;
  }>;
  operation?: 'create' | 'update' | 'upsert'; // Default: upsert
}

interface ZWPApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  zwp_sync_id?: string;
}

interface ZWPBulkResult {
  total_posts: number;
  processed: number;
  created: number;
  updated: number;
  failed: number;
  results: Array<{
    wp_post_id: number;
    status: 'created' | 'updated' | 'failed';
    post_id?: string;
    error?: string;
  }>;
  sync_log_id: string;
}

// Validate ZWP API Key format
function validateZWPApiKey(apiKey: string): boolean {
  return apiKey.startsWith('zwp_') && apiKey.length > 10;
}

// Authenticate site by API key
async function authenticateZWPSite(apiKey: string, supabase: any) {
  const { data: site, error } = await supabase
    .from('ywp_sites')
    .select('*')
    .eq('api_key', apiKey)
    .eq('sync_enabled', true)
    .single();

  if (error || !site) {
    return null;
  }

  return site;
}

// Process single post in bulk operation
async function processBulkPost(postData: any, site: any, supabase: any, operation: string): Promise<{
  wp_post_id: number;
  status: 'created' | 'updated' | 'failed';
  post_id?: string;
  error?: string;
}> {
  try {
    // Find author user if provided
    let authorUserId = null;
    if (postData.post_author) {
      const { data: existingUser } = await supabase
        .from('ywp_users')
        .select('id')
        .eq('site_id', site.id)
        .eq('wp_user_id', postData.post_author)
        .single();

      if (existingUser) {
        authorUserId = existingUser.id;
      }
    }

    // Check if post already exists
    const { data: existingPost } = await supabase
      .from('ywp_posts')
      .select('*')
      .eq('site_id', site.id)
      .eq('wp_post_id', postData.wp_post_id)
      .single();

    let result: any;
    let isUpdate = false;

    if (existingPost) {
      if (operation === 'create') {
        return {
          wp_post_id: postData.wp_post_id,
          status: 'failed' as const,
          error: 'Post already exists'
        };
      }

      // Update existing post
      isUpdate = true;
      const updateData = {
        post_author: authorUserId,
        post_date: postData.post_date,
        post_date_gmt: postData.post_date_gmt,
        post_content: postData.post_content,
        post_title: postData.post_title,
        post_excerpt: postData.post_excerpt,
        post_status: postData.post_status || 'draft',
        comment_status: postData.comment_status || 'closed',
        ping_status: postData.ping_status || 'closed',
        post_password: postData.post_password,
        post_name: postData.post_name,
        post_modified: postData.post_modified,
        post_modified_gmt: postData.post_modified_gmt,
        post_content_filtered: postData.post_content_filtered,
        post_parent: postData.post_parent || 0,
        guid: postData.guid,
        menu_order: postData.menu_order || 0,
        post_type: postData.post_type || 'post',
        post_mime_type: postData.post_mime_type,
        comment_count: postData.comment_count || 0,
        featured_image_url: postData.featured_image_url,
        seo_title: postData.seo_title,
        seo_description: postData.seo_description,
        updated_at: new Date().toISOString()
      };

      const { data: updatedPost, error: updateError } = await supabase
        .from('ywp_posts')
        .update(updateData)
        .eq('id', existingPost.id)
        .select()
        .single();

      if (updateError) throw updateError;
      result = updatedPost;

    } else {
      if (operation === 'update') {
        return {
          wp_post_id: postData.wp_post_id,
          status: 'failed' as const,
          error: 'Post not found for update'
        };
      }

      // Create new post
      const insertData = {
        site_id: site.id,
        wp_post_id: postData.wp_post_id,
        post_author: authorUserId,
        post_date: postData.post_date,
        post_date_gmt: postData.post_date_gmt,
        post_content: postData.post_content,
        post_title: postData.post_title,
        post_excerpt: postData.post_excerpt,
        post_status: postData.post_status || 'draft',
        comment_status: postData.comment_status || 'closed',
        ping_status: postData.ping_status || 'closed',
        post_password: postData.post_password,
        post_name: postData.post_name,
        post_modified: postData.post_modified,
        post_modified_gmt: postData.post_modified_gmt,
        post_content_filtered: postData.post_content_filtered,
        post_parent: postData.post_parent || 0,
        guid: postData.guid,
        menu_order: postData.menu_order || 0,
        post_type: postData.post_type || 'post',
        post_mime_type: postData.post_mime_type,
        comment_count: postData.comment_count || 0,
        featured_image_url: postData.featured_image_url,
        seo_title: postData.seo_title,
        seo_description: postData.seo_description
      };

      const { data: newPost, error: insertError } = await supabase
        .from('ywp_posts')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;
      result = newPost;
    }

    // Handle post meta
    if (postData.post_meta && postData.post_meta.length > 0) {
      // Delete existing meta
      await supabase
        .from('ywp_post_meta')
        .delete()
        .eq('post_id', result.id);

      // Insert new meta
      const metaData = postData.post_meta.map((meta: any) => ({
        post_id: result.id,
        site_id: site.id,
        meta_key: meta.meta_key,
        meta_value: meta.meta_value
      }));

      await supabase
        .from('ywp_post_meta')
        .insert(metaData);
    }

    // Handle taxonomies
    if (postData.taxonomies && postData.taxonomies.length > 0) {
      // Delete existing taxonomy relationships
      await supabase
        .from('ywp_post_taxonomies')
        .delete()
        .eq('post_id', result.id);

      // Create new taxonomy relationships
      for (const tax of postData.taxonomies) {
        let { data: existingTerm } = await supabase
          .from('ywp_taxonomies')
          .select('id')
          .eq('site_id', site.id)
          .eq('wp_term_id', tax.term_id)
          .eq('taxonomy', tax.taxonomy)
          .single();

        let taxonomyId = existingTerm?.id;

        if (!existingTerm) {
          const { data: newTerm } = await supabase
            .from('ywp_taxonomies')
            .insert({
              site_id: site.id,
              wp_term_id: tax.term_id,
              name: tax.name,
              slug: tax.slug,
              taxonomy: tax.taxonomy
            })
            .select('id')
            .single();

          taxonomyId = newTerm?.id;
        }

        if (taxonomyId) {
          await supabase
            .from('ywp_post_taxonomies')
            .insert({
              post_id: result.id,
              taxonomy_id: taxonomyId,
              site_id: site.id
            });
        }
      }
    }

    return {
      wp_post_id: postData.wp_post_id,
      status: (isUpdate ? 'updated' : 'created') as 'updated' | 'created',
      post_id: result.id
    };

  } catch (error) {
    console.error('❌ Error processing bulk post:', error);
    return {
      wp_post_id: postData.wp_post_id,
      status: 'failed' as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting ZWP bulk posts sync');
    
    // Get request data
    const requestData: ZWPBulkPostsRequest = await request.json();
    console.log('📥 Bulk posts request:', {
      api_key: requestData.api_key ? 'provided' : 'missing',
      posts_count: requestData.posts?.length || 0,
      operation: requestData.operation || 'upsert'
    });

    // Validate required fields
    if (!requestData.api_key || !requestData.posts || requestData.posts.length === 0) {
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Missing required fields: api_key and posts array are required'
      }, { status: 400 });
    }

    // Validate API key format
    if (!validateZWPApiKey(requestData.api_key)) {
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Invalid ZWP API key format'
      }, { status: 400 });
    }

    // Validate batch size
    if (requestData.posts.length > 100) {
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Maximum batch size is 100 posts'
      }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Authenticate site
    const site = await authenticateZWPSite(requestData.api_key, supabase);
    if (!site) {
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Invalid API key or site not enabled for sync'
      }, { status: 401 });
    }

    console.log('✅ Site authenticated:', site.id);

    // Start sync log
    const { data: syncLog, error: logError } = await supabase
      .from('ywp_sync_log')
      .insert({
        site_id: site.id,
        sync_type: 'post',
        operation: 'bulk',
        status: 'pending',
        records_total: requestData.posts.length,
        records_processed: 0,
        sync_data: {
          operation: requestData.operation || 'upsert',
          batch_size: requestData.posts.length
        }
      })
      .select()
      .single();

    if (logError) {
      console.error('❌ Failed to create sync log:', logError);
    }

    // Process posts
    const operation = requestData.operation || 'upsert';
    const results = [];
    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const postData of requestData.posts) {
      const result = await processBulkPost(postData, site, supabase, operation);
      results.push(result);

      if (result.status === 'created') created++;
      else if (result.status === 'updated') updated++;
      else if (result.status === 'failed') failed++;
    }

    const processed = created + updated + failed;

    // Update sync log
    if (syncLog) {
      await supabase
        .from('ywp_sync_log')
        .update({
          status: failed > 0 ? (processed > failed ? 'partial' : 'failed') : 'success',
          records_processed: processed,
          completed_at: new Date().toISOString(),
          sync_data: {
            operation: requestData.operation || 'upsert',
            batch_size: requestData.posts.length,
            created,
            updated,
            failed,
            error_count: failed
          }
        })
        .eq('id', syncLog.id);
    }

    // Update site last sync time
    await supabase
      .from('ywp_sites')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', site.id);

    const bulkResult: ZWPBulkResult = {
      total_posts: requestData.posts.length,
      processed,
      created,
      updated,
      failed,
      results,
      sync_log_id: syncLog?.id || ''
    };

    console.log('✅ Bulk posts sync completed:', {
      processed,
      created,
      updated,
      failed
    });

    return NextResponse.json<ZWPApiResponse<ZWPBulkResult>>({
      success: true,
      data: bulkResult,
      zwp_sync_id: syncLog?.id || ''
    });

  } catch (error) {
    console.error('❌ ZWP bulk posts sync error:', error);
    return NextResponse.json<ZWPApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 