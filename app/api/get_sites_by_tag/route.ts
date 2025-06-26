import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userInternalId = searchParams.get('user_internal_id');
    const tagId = searchParams.get('tag_id');

    if (!userInternalId) {
      return NextResponse.json(
        { success: false, error: 'User internal ID is required' },
        { status: 400 }
      );
    }

    if (!tagId) {
      return NextResponse.json(
        { success: false, error: 'Tag ID is required' },
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
      .from('sitespren_tags')
      .select('tag_id')
      .eq('tag_id', tagId)
      .eq('fk_user_id', userInternalId)
      .single();

    if (tagError || !tagData) {
      return NextResponse.json(
        { success: false, error: 'Tag not found or access denied' },
        { status: 404 }
      );
    }

    // Get site IDs that have this tag
    const { data: tagRelations, error: relationsError } = await supabase
      .from('sitespren_tags_relations')
      .select('fk_sitespren_id')
      .eq('fk_tag_id', tagId)
      .eq('fk_user_id', userInternalId);

    if (relationsError) {
      console.error('Error fetching tag relations:', relationsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tag relations' },
        { status: 500 }
      );
    }

    const siteIds = tagRelations?.map(rel => rel.fk_sitespren_id) || [];

    return NextResponse.json({
      success: true,
      data: {
        tag_id: tagId,
        site_ids: siteIds
      }
    });

  } catch (error) {
    console.error('Error in get_sites_by_tag:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}