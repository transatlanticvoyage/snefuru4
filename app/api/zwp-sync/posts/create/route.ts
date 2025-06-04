import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ZWP Post Creation Interface
interface ZWPPostCreateRequest {
  api_key: string;
  wp_post_id: number;
  post_author?: number; // WordPress user ID
  post_date?: string;
  post_date_gmt?: string;
  post_content: string;
  post_title: string;
  post_excerpt?: string;
  post_status?: string;
  comment_status?: string;
  ping_status?: string;
  post_password?: string;
  post_name?: string; // slug
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
}

interface ZWPApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  zwp_sync_id?: string;
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

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting ZWP post creation');
    
    // Get request data
    const requestData: ZWPPostCreateRequest = await request.json();
    console.log('📥 Post creation request:', {
      api_key: requestData.api_key ? 'provided' : 'missing',
      wp_post_id: requestData.wp_post_id,
      post_title: requestData.post_title,
      post_type: requestData.post_type,
      post_status: requestData.post_status
    });

    // Validate required fields
    if (!requestData.api_key || !requestData.wp_post_id || !requestData.post_title) {
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Missing required fields: api_key, wp_post_id, and post_title are required'
      }, { status: 400 });
    }

    // Validate API key format
    if (!validateZWPApiKey(requestData.api_key)) {
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Invalid ZWP API key format'
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

    // Find or create author user if provided
    let authorUserId = null;
    if (requestData.post_author) {
      const { data: existingUser } = await supabase
        .from('ywp_users')
        .select('id')
        .eq('site_id', site.id)
        .eq('wp_user_id', requestData.post_author)
        .single();

      if (existingUser) {
        authorUserId = existingUser.id;
      }
    }

    // Check if post already exists
    const { data: existingPost, error: checkError } = await supabase
      .from('ywp_posts')
      .select('id')
      .eq('site_id', site.id)
      .eq('wp_post_id', requestData.wp_post_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing post:', checkError);
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Database error while checking post'
      }, { status: 500 });
    }

    if (existingPost) {
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Post already exists. Use update endpoint instead.'
      }, { status: 409 });
    }

    // Prepare post data
    const postData = {
      site_id: site.id,
      wp_post_id: requestData.wp_post_id,
      post_author: authorUserId,
      post_date: requestData.post_date,
      post_date_gmt: requestData.post_date_gmt,
      post_content: requestData.post_content,
      post_title: requestData.post_title,
      post_excerpt: requestData.post_excerpt,
      post_status: requestData.post_status || 'draft',
      comment_status: requestData.comment_status || 'closed',
      ping_status: requestData.ping_status || 'closed',
      post_password: requestData.post_password,
      post_name: requestData.post_name,
      post_modified: requestData.post_modified,
      post_modified_gmt: requestData.post_modified_gmt,
      post_content_filtered: requestData.post_content_filtered,
      post_parent: requestData.post_parent || 0,
      guid: requestData.guid,
      menu_order: requestData.menu_order || 0,
      post_type: requestData.post_type || 'post',
      post_mime_type: requestData.post_mime_type,
      comment_count: requestData.comment_count || 0,
      featured_image_url: requestData.featured_image_url,
      seo_title: requestData.seo_title,
      seo_description: requestData.seo_description
    };

    // Insert post
    const { data: newPost, error: insertError } = await supabase
      .from('ywp_posts')
      .insert(postData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting post:', insertError);
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Failed to create post'
      }, { status: 500 });
    }

    console.log('✅ Post created successfully:', newPost.id);

    // Insert post meta if provided
    if (requestData.post_meta && requestData.post_meta.length > 0) {
      const metaData = requestData.post_meta.map(meta => ({
        post_id: newPost.id,
        site_id: site.id,
        meta_key: meta.meta_key,
        meta_value: meta.meta_value
      }));

      const { error: metaError } = await supabase
        .from('ywp_post_meta')
        .insert(metaData);

      if (metaError) {
        console.warn('⚠️ Failed to insert post meta:', metaError);
      } else {
        console.log('✅ Post meta inserted successfully');
      }
    }

    // Handle taxonomies if provided
    if (requestData.taxonomies && requestData.taxonomies.length > 0) {
      for (const tax of requestData.taxonomies) {
        // Create or find taxonomy term
        const { data: existingTerm } = await supabase
          .from('ywp_taxonomies')
          .select('id')
          .eq('site_id', site.id)
          .eq('wp_term_id', tax.term_id)
          .eq('taxonomy', tax.taxonomy)
          .single();

        let taxonomyId = existingTerm?.id;

        if (!existingTerm) {
          // Create new taxonomy term
          const { data: newTerm, error: termError } = await supabase
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

          if (termError) {
            console.warn('⚠️ Failed to create taxonomy term:', termError);
            continue;
          }

          taxonomyId = newTerm.id;
        }

        // Link post to taxonomy
        if (taxonomyId) {
          const { error: linkError } = await supabase
            .from('ywp_post_taxonomies')
            .insert({
              post_id: newPost.id,
              taxonomy_id: taxonomyId,
              site_id: site.id
            });

          if (linkError) {
            console.warn('⚠️ Failed to link post to taxonomy:', linkError);
          }
        }
      }
    }

    // Log creation in sync log
    const { error: logError } = await supabase
      .from('ywp_sync_log')
      .insert({
        site_id: site.id,
        sync_type: 'post',
        operation: 'create',
        wp_object_id: requestData.wp_post_id,
        object_type: requestData.post_type || 'post',
        status: 'success',
        records_processed: 1,
        records_total: 1,
        sync_data: {
          post_title: requestData.post_title,
          post_type: requestData.post_type,
          meta_count: requestData.post_meta?.length || 0,
          taxonomy_count: requestData.taxonomies?.length || 0
        }
      });

    if (logError) {
      console.warn('⚠️ Failed to log creation:', logError);
    }

    // Update site last sync time
    await supabase
      .from('ywp_sites')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', site.id);

    return NextResponse.json<ZWPApiResponse<any>>({
      success: true,
      data: {
        post_id: newPost.id,
        wp_post_id: newPost.wp_post_id,
        post_title: newPost.post_title,
        post_type: newPost.post_type,
        status: 'created'
      },
      zwp_sync_id: newPost.id
    });

  } catch (error) {
    console.error('❌ ZWP post creation error:', error);
    return NextResponse.json<ZWPApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 