import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tag_id');
    const userInternalId = searchParams.get('user_internal_id');

    if (!tagId || !userInternalId) {
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
      .select('tag_id, tag_name')
      .eq('tag_id', tagId)
      .eq('user_id', userInternalId)
      .single();

    if (tagError || !tagData) {
      return NextResponse.json(
        { success: false, error: 'Tag not found or access denied' },
        { status: 404 }
      );
    }

    // Get URLs associated with this tag
    const { data: urlRelations, error: relationsError } = await supabase
      .from('redditurlsvat_tags_relations')
      .select(`
        tag_position,
        redditurlsvat:fk_url_id (
          url_id,
          url_datum,
          subreddit_name,
          post_title,
          keyword,
          current_position,
          search_volume,
          cpc,
          is_starred,
          created_at
        )
      `)
      .eq('fk_tag_id', tagId)
      .eq('user_id', userInternalId)
      .order('tag_position', { ascending: true });

    if (relationsError) {
      console.error('Error fetching URLs by tag:', relationsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch URLs for tag' },
        { status: 500 }
      );
    }

    // Format the response
    const urls = urlRelations?.map(relation => ({
      ...relation.redditurlsvat,
      tag_position: relation.tag_position
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        tag: tagData,
        urls: urls,
        total_urls: urls.length
      }
    });

  } catch (error) {
    console.error('Error in get_urls_by_tag:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}