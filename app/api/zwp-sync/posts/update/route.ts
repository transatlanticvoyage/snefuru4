import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ZWP Post Update Interface (similar to create but for updates)
interface ZWPPostUpdateRequest {
  api_key: string;
  wp_post_id: number;
  post_author?: number;
  post_date?: string;
  post_date_gmt?: string;
  post_content?: string;
  post_title?: string;
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
    console.log('🚀 Starting ZWP post update');
    
    // Get request data
    const requestData: ZWPPostUpdateRequest = await request.json();
    console.log('📥 Post update request:', {
      api_key: requestData.api_key ? 'provided' : 'missing',
      wp_post_id: requestData.wp_post_id,
      post_title: requestData.post_title,
      post_type: requestData.post_type,
      post_status: requestData.post_status
    });

    // Validate required fields
    if (!requestData.api_key || !requestData.wp_post_id) {
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Missing required fields: api_key and wp_post_id are required'
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

    // Find existing post
    const { data: existingPost, error: findError } = await supabase
      .from('ywp_posts')
      .select('*')
      .eq('site_id', site.id)
      .eq('wp_post_id', requestData.wp_post_id)
      .single();

    if (findError || !existingPost) {
      console.error('❌ Post not found:', findError);
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Post not found. Use create endpoint instead.'
      }, { status: 404 });
    }

    console.log('✅ Post found for update:', existingPost.id);

    // Find author user if provided
    let authorUserId = existingPost.post_author; // Keep existing author by default
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

    // Prepare update data (only include fields that are provided)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (requestData.post_author !== undefined) updateData.post_author = authorUserId;
    if (requestData.post_date !== undefined) updateData.post_date = requestData.post_date;
    if (requestData.post_date_gmt !== undefined) updateData.post_date_gmt = requestData.post_date_gmt;
    if (requestData.post_content !== undefined) updateData.post_content = requestData.post_content;
    if (requestData.post_title !== undefined) updateData.post_title = requestData.post_title;
    if (requestData.post_excerpt !== undefined) updateData.post_excerpt = requestData.post_excerpt;
    if (requestData.post_status !== undefined) updateData.post_status = requestData.post_status;
    if (requestData.comment_status !== undefined) updateData.comment_status = requestData.comment_status;
    if (requestData.ping_status !== undefined) updateData.ping_status = requestData.ping_status;
    if (requestData.post_password !== undefined) updateData.post_password = requestData.post_password;
    if (requestData.post_name !== undefined) updateData.post_name = requestData.post_name;
    if (requestData.post_modified !== undefined) updateData.post_modified = requestData.post_modified;
    if (requestData.post_modified_gmt !== undefined) updateData.post_modified_gmt = requestData.post_modified_gmt;
    if (requestData.post_content_filtered !== undefined) updateData.post_content_filtered = requestData.post_content_filtered;
    if (requestData.post_parent !== undefined) updateData.post_parent = requestData.post_parent;
    if (requestData.guid !== undefined) updateData.guid = requestData.guid;
    if (requestData.menu_order !== undefined) updateData.menu_order = requestData.menu_order;
    if (requestData.post_type !== undefined) updateData.post_type = requestData.post_type;
    if (requestData.post_mime_type !== undefined) updateData.post_mime_type = requestData.post_mime_type;
    if (requestData.comment_count !== undefined) updateData.comment_count = requestData.comment_count;
    if (requestData.featured_image_url !== undefined) updateData.featured_image_url = requestData.featured_image_url;
    if (requestData.seo_title !== undefined) updateData.seo_title = requestData.seo_title;
    if (requestData.seo_description !== undefined) updateData.seo_description = requestData.seo_description;

    // Update post
    const { data: updatedPost, error: updateError } = await supabase
      .from('ywp_posts')
      .update(updateData)
      .eq('id', existingPost.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating post:', updateError);
      return NextResponse.json<ZWPApiResponse<null>>({
        success: false,
        error: 'Failed to update post'
      }, { status: 500 });
    }

    console.log('✅ Post updated successfully:', updatedPost.id);

    // Update post meta if provided
    if (requestData.post_meta && requestData.post_meta.length > 0) {
      // Delete existing meta for this post
      await supabase
        .from('ywp_post_meta')
        .delete()
        .eq('post_id', existingPost.id);

      // Insert new meta data
      const metaData = requestData.post_meta.map(meta => ({
        post_id: existingPost.id,
        site_id: site.id,
        meta_key: meta.meta_key,
        meta_value: meta.meta_value
      }));

      const { error: metaError } = await supabase
        .from('ywp_post_meta')
        .insert(metaData);

      if (metaError) {
        console.warn('⚠️ Failed to update post meta:', metaError);
      } else {
        console.log('✅ Post meta updated successfully');
      }
    }

    // Update taxonomies if provided
    if (requestData.taxonomies && requestData.taxonomies.length > 0) {
      // Delete existing taxonomy relationships
      await supabase
        .from('ywp_post_taxonomies')
        .delete()
        .eq('post_id', existingPost.id);

      // Create new taxonomy relationships
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
              post_id: existingPost.id,
              taxonomy_id: taxonomyId,
              site_id: site.id
            });

          if (linkError) {
            console.warn('⚠️ Failed to link post to taxonomy:', linkError);
          }
        }
      }
    }

    // Log update in sync log
    const { error: logError } = await supabase
      .from('ywp_sync_log')
      .insert({
        site_id: site.id,
        sync_type: 'post',
        operation: 'update',
        wp_object_id: requestData.wp_post_id,
        object_type: updatedPost.post_type,
        status: 'success',
        records_processed: 1,
        records_total: 1,
        sync_data: {
          post_title: updatedPost.post_title,
          post_type: updatedPost.post_type,
          fields_updated: Object.keys(updateData).length,
          meta_count: requestData.post_meta?.length || 0,
          taxonomy_count: requestData.taxonomies?.length || 0
        }
      });

    if (logError) {
      console.warn('⚠️ Failed to log update:', logError);
    }

    // Update site last sync time
    await supabase
      .from('ywp_sites')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', site.id);

    return NextResponse.json<ZWPApiResponse<any>>({
      success: true,
      data: {
        post_id: updatedPost.id,
        wp_post_id: updatedPost.wp_post_id,
        post_title: updatedPost.post_title,
        post_type: updatedPost.post_type,
        status: 'updated'
      },
      zwp_sync_id: updatedPost.id
    });

  } catch (error) {
    console.error('❌ ZWP post update error:', error);
    return NextResponse.json<ZWPApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 