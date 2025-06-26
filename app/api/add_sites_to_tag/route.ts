import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { site_ids, tag_id, user_internal_id } = body;

    if (!site_ids || !Array.isArray(site_ids) || site_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Site IDs array is required' },
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
      .from('sitespren_tags')
      .select('tag_id')
      .eq('tag_id', tag_id)
      .eq('fk_user_id', user_internal_id)
      .single();

    if (tagError || !tagData) {
      return NextResponse.json(
        { success: false, error: 'Tag not found or access denied' },
        { status: 404 }
      );
    }

    // Verify all sites belong to the user
    const { data: sitesData, error: sitesError } = await supabase
      .from('sitespren')
      .select('id')
      .in('id', site_ids)
      .eq('fk_users_id', user_internal_id);

    if (sitesError) {
      return NextResponse.json(
        { success: false, error: 'Error verifying site ownership' },
        { status: 500 }
      );
    }

    if (!sitesData || sitesData.length !== site_ids.length) {
      return NextResponse.json(
        { success: false, error: 'Some sites not found or access denied' },
        { status: 404 }
      );
    }

    // Get existing relations to avoid duplicates
    const { data: existingRelations, error: existingError } = await supabase
      .from('sitespren_tags_relations')
      .select('fk_sitespren_id')
      .eq('fk_tag_id', tag_id)
      .in('fk_sitespren_id', site_ids);

    if (existingError) {
      console.error('Error checking existing relations:', existingError);
      return NextResponse.json(
        { success: false, error: 'Error checking existing relations' },
        { status: 500 }
      );
    }

    // Filter out sites that already have this tag
    const existingSiteIds = new Set(existingRelations?.map(r => r.fk_sitespren_id) || []);
    const newSiteIds = site_ids.filter(siteId => !existingSiteIds.has(siteId));

    if (newSiteIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All selected sites are already tagged with this tag',
        data: {
          total_sites: site_ids.length,
          new_relations: 0,
          existing_relations: site_ids.length
        }
      });
    }

    // Create new relations
    const relationsToInsert = newSiteIds.map((siteId, index) => ({
      fk_sitespren_id: siteId,
      fk_tag_id: tag_id,
      fk_user_id: user_internal_id,
      tag_position: index
    }));

    const { error: insertError } = await supabase
      .from('sitespren_tags_relations')
      .insert(relationsToInsert);

    if (insertError) {
      console.error('Error inserting tag relations:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to add sites to tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${newSiteIds.length} site(s) to tag`,
      data: {
        total_sites: site_ids.length,
        new_relations: newSiteIds.length,
        existing_relations: existingSiteIds.size
      }
    });

  } catch (error) {
    console.error('Error in add_sites_to_tag:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}