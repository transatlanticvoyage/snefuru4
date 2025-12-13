import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const body = await request.json();
    
    const {
      page = 1,
      pageSize = 100,
      selectedTagId,
      searchTerm = '',
      keywordDatumSearch = '',
      sortField = 'search_volume',
      sortOrder = 'desc',
      dfsFetchStatusFilter,
      searchVolumeFilter,
      cpcFilter,
      competitionFilter,
      competitionIndexFilter,
      exactCityPopulationFilter,
      largestCityPopulationFilter,
      cityClassificationFilter
    } = body;

    console.log('🏷️ [PAGINATED API] Request:', { page, pageSize, selectedTagId, searchTerm, sortField, sortOrder });

    // Build the base query
    let query = supabase
      .from('keywordshub')
      .select(`
        keyword_id,
        keyword_datum,
        is_starred,
        is_chosen,
        search_volume,
        cpc,
        semrush_volume,
        rel_dfs_location_code,
        country_code_internal,
        location_display_name,
        location_coordinate,
        language_code,
        language_name,
        competition,
        competition_index,
        low_top_of_page_bid,
        high_top_of_page_bid,
        api_fetched_at,
        created_at,
        updated_at,
        created_by,
        last_updated_by,
        cached_cncglub_ids,
        rel_industry_id,
        cached_city_name,
        rel_largest_city_id,
        rel_exact_city_id,
        dfs_fetch_status,
        serp_results_count,
        serp_last_fetched_at,
        serp_fetch_status,
        industries (
          industry_name
        ),
        exact_city:cities!rel_exact_city_id (
          classification,
          city_name,
          state_code,
          state_full,
          associated_principal_city,
          city_population
        ),
        largest_city:cities!rel_largest_city_id (
          city_population
        )
      `, { count: 'exact' });

    // Apply tag filter if selected
    if (selectedTagId) {
      const { data: taggedKeywordIds, error: tagError } = await supabase
        .from('keywordshub_tag_relations')
        .select('fk_keyword_id')
        .eq('fk_tag_id', selectedTagId);

      if (tagError) throw tagError;

      const keywordIds = taggedKeywordIds.map(rel => rel.fk_keyword_id);
      
      if (keywordIds.length > 0) {
        query = query.in('keyword_id', keywordIds);
      } else {
        // No keywords have this tag, return empty result
        return NextResponse.json({
          data: [],
          totalCount: 0,
          page,
          pageSize,
          totalPages: 0
        });
      }
    }

    // Apply search filters
    if (searchTerm.trim()) {
      query = query.or(`keyword_datum.ilike.%${searchTerm}%,location_display_name.ilike.%${searchTerm}%,language_name.ilike.%${searchTerm}%,competition.ilike.%${searchTerm}%,cached_city_name.ilike.%${searchTerm}%`);
    }

    if (keywordDatumSearch.trim()) {
      query = query.ilike('keyword_datum', `%${keywordDatumSearch}%`);
    }

    // Apply other filters
    if (dfsFetchStatusFilter && dfsFetchStatusFilter !== 'all') {
      query = query.eq('dfs_fetch_status', dfsFetchStatusFilter);
    }

    if (searchVolumeFilter && searchVolumeFilter !== 'all') {
      const [min, max] = searchVolumeFilter.split('-').map(Number);
      if (max) {
        query = query.gte('search_volume', min).lte('search_volume', max);
      } else {
        query = query.gte('search_volume', min);
      }
    }

    if (cpcFilter && cpcFilter !== 'all') {
      const [min, max] = cpcFilter.split('-').map(Number);
      if (max) {
        query = query.gte('cpc', min).lte('cpc', max);
      } else {
        query = query.gte('cpc', min);
      }
    }

    if (competitionFilter && competitionFilter !== 'all') {
      query = query.eq('competition', competitionFilter);
    }

    if (competitionIndexFilter && competitionIndexFilter !== 'all') {
      const [min, max] = competitionIndexFilter.split('-').map(Number);
      if (max !== undefined) {
        query = query.gte('competition_index', min).lte('competition_index', max);
      } else {
        query = query.gte('competition_index', min);
      }
    }

    // Apply city population filters
    if (exactCityPopulationFilter && exactCityPopulationFilter !== 'all') {
      // Need to join and filter on city population
      // This is complex, we'll handle it after basic implementation
    }

    if (largestCityPopulationFilter && largestCityPopulationFilter !== 'all') {
      // Same as above
    }

    if (cityClassificationFilter && cityClassificationFilter !== 'all') {
      // Filter on exact_city.classification
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortField, { ascending });

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    query = query.range(startIndex, startIndex + pageSize - 1);

    // Execute query
    const { data: keywords, error, count } = await query;

    if (error) {
      console.error('🏷️ [PAGINATED API] Database error:', error);
      throw error;
    }

    // Fetch tags for the current page of keywords
    if (keywords && keywords.length > 0) {
      const keywordIds = keywords.map(k => k.keyword_id);
      
      const { data: tagRelations, error: tagError } = await supabase
        .from('keywordshub_tag_relations')
        .select(`
          fk_keyword_id,
          keywordshub_tags (
            tag_id,
            tag_name
          )
        `)
        .in('fk_keyword_id', keywordIds);

      if (!tagError && tagRelations) {
        // Group tags by keyword_id
        const tagsByKeyword: Record<number, Array<{ tag_id: number; tag_name: string }>> = {};
        tagRelations.forEach(rel => {
          if (!tagsByKeyword[rel.fk_keyword_id]) {
            tagsByKeyword[rel.fk_keyword_id] = [];
          }
          if (rel.keywordshub_tags) {
            tagsByKeyword[rel.fk_keyword_id].push(rel.keywordshub_tags);
          }
        });

        // Add tags to keywords
        keywords.forEach(keyword => {
          keyword.tags = tagsByKeyword[keyword.keyword_id] || [];
        });
      }

      // Fetch cache status for keywords
      const { data: cacheData, error: cacheError } = await supabase
        .from('keywordshub_serp_cache_m1')
        .select('fk_keyword_id, total_emd_count, zone_1_emd_count, zone_2_emd_count, zone_3_emd_count, zone_4_10_emd_count, zone_11_25_emd_count, zone_26_50_emd_count, zone_51_100_emd_count, zone_1_domains, zone_2_domains, zone_3_domains, zone_4_10_domains, zone_11_25_domains, zone_26_50_domains, zone_51_100_domains')
        .in('fk_keyword_id', keywordIds);

      if (!cacheError && cacheData) {
        const cacheByKeyword: Record<number, any> = {};
        cacheData.forEach(cache => {
          cacheByKeyword[cache.fk_keyword_id] = cache;
        });

        keywords.forEach(keyword => {
          keyword.serp_cache_m1 = cacheByKeyword[keyword.keyword_id] || null;
          keyword.cache_status = keyword.serp_cache_m1 ? 'CURRENT' : 'NO_CACHE';
        });
      }
    }

    const totalPages = Math.ceil((count || 0) / pageSize);

    return NextResponse.json({
      data: keywords || [],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages
    });

  } catch (error) {
    console.error('🏷️ [PAGINATED API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paginated data' },
      { status: 500 }
    );
  }
}