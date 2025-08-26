import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url_ids, tag_id, user_internal_id } = body;

    if (!url_ids || !Array.isArray(url_ids) || url_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'URL IDs array is required' },
        { status: 400 }
      );
    }

    if (!tag_id || !user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'Tag ID and user internal ID are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the tag belongs to the user
    const { data: tagData, error: tagError } = await supabase
      .from('redditurlsvat_tags')
      .select('tag_id')
      .eq('tag_id', tag_id)
      .eq('user_id', user_internal_id)
      .single();

    if (tagError || !tagData) {
      return NextResponse.json(
        { success: false, error: 'Tag not found or access denied' },
        { status: 404 }
      );
    }

    // Verify all URLs exist (Note: redditurlsvat doesn't have user-specific ownership like sitespren)
    // We'll just verify the URLs exist in the system
    const { data: urlsData, error: urlsError } = await supabase
      .from('redditurlsvat')
      .select('url_id')
      .in('url_id', url_ids);

    if (urlsError) {
      return NextResponse.json(
        { success: false, error: 'Error verifying URL existence' },
        { status: 500 }
      );
    }

    if (!urlsData || urlsData.length !== url_ids.length) {
      return NextResponse.json(
        { success: false, error: 'Some URLs not found' },
        { status: 404 }
      );
    }

    // Get existing relations to avoid duplicates
    const { data: existingRelations, error: existingError } = await supabase
      .from('redditurlsvat_tags_relations')
      .select('fk_url_id')
      .eq('fk_tag_id', tag_id)
      .in('fk_url_id', url_ids);

    if (existingError) {
      console.error('Error checking existing relations:', existingError);
      return NextResponse.json(
        { success: false, error: 'Error checking existing relations' },
        { status: 500 }
      );
    }

    // Filter out URLs that already have this tag
    const existingUrlIds = new Set(existingRelations?.map(r => r.fk_url_id) || []);
    const newUrlIds = url_ids.filter(urlId => !existingUrlIds.has(urlId));

    if (newUrlIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All selected URLs are already tagged with this tag',
        data: {
          total_urls: url_ids.length,
          new_relations: 0,
          existing_relations: url_ids.length
        }
      });
    }

    // Create new relations
    const relationsToInsert = newUrlIds.map((urlId, index) => ({
      fk_url_id: urlId,
      fk_tag_id: tag_id,
      user_id: user_internal_id,
      tag_position: index
    }));

    const { error: insertError } = await supabase
      .from('redditurlsvat_tags_relations')
      .insert(relationsToInsert);

    if (insertError) {
      console.error('Error inserting tag relations:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to add URLs to tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${newUrlIds.length} URL(s) to tag`,
      data: {
        total_urls: url_ids.length,
        new_relations: newUrlIds.length,
        existing_relations: existingUrlIds.size
      }
    });

  } catch (error) {
    console.error('Error in redditurlsvat_tags_relations POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { url_ids, tag_id, user_internal_id } = body;

    if (!user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'User internal ID is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    let query = supabase
      .from('redditurlsvat_tags_relations')
      .delete()
      .eq('user_id', user_internal_id);

    // If specific tag_id provided, filter by it
    if (tag_id) {
      query = query.eq('fk_tag_id', tag_id);
    }

    // If specific url_ids provided, filter by them
    if (url_ids && Array.isArray(url_ids) && url_ids.length > 0) {
      query = query.in('fk_url_id', url_ids);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting tag relations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to remove URLs from tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully removed URLs from tag'
    });

  } catch (error) {
    console.error('Error in redditurlsvat_tags_relations DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}