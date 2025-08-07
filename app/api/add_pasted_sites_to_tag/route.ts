import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pasted_sites, tag_id, user_internal_id } = body;

    if (!pasted_sites || !Array.isArray(pasted_sites) || pasted_sites.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pasted sites array is required' },
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

    // Find matching sites in user's account by sitespren_base
    // Clean the pasted sites first (remove protocol, trailing slashes, etc.)
    const cleanedSites = pasted_sites.map(site => {
      let cleaned = site.trim();
      // Remove protocol
      cleaned = cleaned.replace(/^https?:\/\//, '');
      // Remove www.
      cleaned = cleaned.replace(/^www\./, '');
      // Remove trailing slash
      cleaned = cleaned.replace(/\/$/, '');
      return cleaned;
    });

    const { data: matchingSites, error: sitesError } = await supabase
      .from('sitespren')
      .select('id, sitespren_base')
      .eq('fk_users_id', user_internal_id)
      .or(cleanedSites.map(site => `sitespren_base.eq.${site}`).join(','));

    if (sitesError) {
      console.error('Error finding matching sites:', sitesError);
      return NextResponse.json(
        { success: false, error: 'Error searching for sites in account' },
        { status: 500 }
      );
    }

    // Create lookup map for found sites
    const foundSitesMap = new Map();
    if (matchingSites) {
      matchingSites.forEach(site => {
        foundSitesMap.set(site.sitespren_base, site.id);
      });
    }

    // Categorize results
    const foundSiteIds: string[] = [];
    const notFoundSites: string[] = [];
    const details: string[] = [];

    cleanedSites.forEach(cleanedSite => {
      if (foundSitesMap.has(cleanedSite)) {
        foundSiteIds.push(foundSitesMap.get(cleanedSite));
        details.push(`Found: ${cleanedSite}`);
      } else {
        notFoundSites.push(cleanedSite);
        details.push(`Not in account: ${cleanedSite}`);
      }
    });

    // Check which found sites already have the tag
    let existingSiteIds: Set<string> = new Set();
    if (foundSiteIds.length > 0) {
      const { data: existingRelations, error: existingError } = await supabase
        .from('sitespren_tags_relations')
        .select('fk_sitespren_id')
        .eq('fk_tag_id', tag_id)
        .in('fk_sitespren_id', foundSiteIds);

      if (existingError) {
        console.error('Error checking existing relations:', existingError);
        return NextResponse.json(
          { success: false, error: 'Error checking existing tag relations' },
          { status: 500 }
        );
      }

      existingSiteIds = new Set(existingRelations?.map(r => r.fk_sitespren_id) || []);
    }

    // Filter out sites that already have this tag
    const newSiteIds = foundSiteIds.filter(siteId => !existingSiteIds.has(siteId));

    // Update details for existing tagged sites
    foundSiteIds.forEach(siteId => {
      if (existingSiteIds.has(siteId)) {
        const matchingSite = matchingSites?.find(site => site.id === siteId);
        if (matchingSite) {
          const existingIndex = details.findIndex(d => d.includes(matchingSite.sitespren_base));
          if (existingIndex !== -1) {
            details[existingIndex] = `Already tagged: ${matchingSite.sitespren_base}`;
          }
        }
      }
    });

    // Create new tag relations for sites that don't already have the tag
    if (newSiteIds.length > 0) {
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
    }

    return NextResponse.json({
      success: true,
      message: `Processing complete: ${newSiteIds.length} sites added to tag`,
      totalSubmitted: pasted_sites.length,
      successfullyAdded: newSiteIds.length,
      alreadyExisted: existingSiteIds.size,
      notInAccount: notFoundSites.length,
      details
    });

  } catch (error) {
    console.error('Error in add_pasted_sites_to_tag:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}