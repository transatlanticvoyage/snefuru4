import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zone determination logic
function getZoneIdFromRank(rank: number): { zone_id: number; zone_key: string } | null {
  if (rank === 1) return { zone_id: 1, zone_key: '1' };
  if (rank === 2) return { zone_id: 2, zone_key: '2' };
  if (rank === 3) return { zone_id: 3, zone_key: '3' };
  if (rank >= 4 && rank <= 10) return { zone_id: 4, zone_key: '4_10' };
  if (rank >= 11 && rank <= 25) return { zone_id: 5, zone_key: '11_25' };
  if (rank >= 26 && rank <= 50) return { zone_id: 6, zone_key: '26_50' };
  if (rank >= 51 && rank <= 100) return { zone_id: 7, zone_key: '51_100' };
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword_id, emd_stamp_method = 'method-1' } = body;

    if (!keyword_id) {
      return NextResponse.json({ error: 'keyword_id is required' }, { status: 400 });
    }

    console.log(`🚀 F420: Starting zone cache for keyword_id ${keyword_id}, method: ${emd_stamp_method}`);

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Get latest fetch_id for this keyword
    // ═══════════════════════════════════════════════════════════
    const { data: latestFetch, error: fetchError } = await supabase
      .from('zhe_serp_fetches')
      .select('fetch_id')
      .eq('rel_keyword_id', keyword_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !latestFetch) {
      console.error('F420: No fetch found for keyword:', fetchError);
      return NextResponse.json({ 
        error: 'No SERP fetch found for this keyword. Please run F400 first.' 
      }, { status: 400 });
    }

    const fetchId = latestFetch.fetch_id;
    console.log(`F420: Using fetch_id ${fetchId}`);

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Get all EMD matches from zhe_serp_results
    // ═══════════════════════════════════════════════════════════
    // For method-1, use is_match_emd_stamp column
    // For future methods, use is_match_emd_stamp_2, is_match_emd_stamp_3, etc.
    const matchColumn = emd_stamp_method === 'method-1' ? 'is_match_emd_stamp' : 'is_match_emd_stamp';

    const { data: emdMatches, error: matchError } = await supabase
      .from('zhe_serp_results')
      .select('result_id, domain, rank_absolute, url')
      .eq('rel_fetch_id', fetchId)
      .eq(matchColumn, true)
      .order('rank_absolute');

    if (matchError) {
      console.error('F420: Error fetching EMD matches:', matchError);
      return NextResponse.json({ error: 'Failed to fetch EMD matches' }, { status: 500 });
    }

    console.log(`F420: Found ${emdMatches?.length || 0} EMD matches`);

    if (!emdMatches || emdMatches.length === 0) {
      return NextResponse.json({ 
        message: 'No EMD matches found. Please run F410 first to mark EMD matches.',
        total_emd_sites: 0,
        zones_cached: 0,
        relations_created: 0
      });
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Clear existing cache and relations for this keyword+method
    // ═══════════════════════════════════════════════════════════
    console.log(`F420: Clearing old cache and relations for method ${emd_stamp_method}...`);
    
    await supabase
      .from('keywordshub_emd_zone_cache')
      .delete()
      .eq('keyword_id', keyword_id)
      .eq('emd_stamp_method', emd_stamp_method);

    await supabase
      .from('relations_keywordshub_results_zones')
      .delete()
      .eq('keyword_id', keyword_id)
      .eq('emd_stamp_method', emd_stamp_method);

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Populate relations_keywordshub_results_zones
    // ═══════════════════════════════════════════════════════════
    const relationsToInsert: any[] = [];

    for (const match of emdMatches) {
      const zone = getZoneIdFromRank(match.rank_absolute);
      
      if (!zone) {
        console.warn(`F420: No zone found for rank ${match.rank_absolute}, skipping`);
        continue;
      }

      relationsToInsert.push({
        keyword_id,
        result_id: match.result_id,
        zone_id: zone.zone_id,
        emd_stamp_method
      });
    }

    if (relationsToInsert.length > 0) {
      const { error: relationsError } = await supabase
        .from('relations_keywordshub_results_zones')
        .insert(relationsToInsert);

      if (relationsError) {
        console.error('F420: Error inserting relations:', relationsError);
        return NextResponse.json({ error: 'Failed to create relations' }, { status: 500 });
      }
      
      console.log(`F420: Created ${relationsToInsert.length} relation records`);
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 5: Aggregate data by zone for cache
    // ═══════════════════════════════════════════════════════════
    const zoneAggregates: { [key: string]: any[] } = {
      '1': [],
      '2': [],
      '3': [],
      '4_10': [],
      '11_25': [],
      '26_50': [],
      '51_100': []
    };

    // Group matches by zone
    for (const match of emdMatches) {
      const zone = getZoneIdFromRank(match.rank_absolute);
      if (zone && zoneAggregates[zone.zone_key]) {
        zoneAggregates[zone.zone_key].push({
          domain: match.domain,
          rank: match.rank_absolute,
          result_id: match.result_id,
          url: match.url
        });
      }
    }

    // Build cache object
    const cacheData = {
      keyword_id,
      emd_stamp_method,
      latest_fetch_id: fetchId,
      
      // Count columns
      total_emd_sites: emdMatches.length,
      zone_1_count: zoneAggregates['1'].length,
      zone_2_count: zoneAggregates['2'].length,
      zone_3_count: zoneAggregates['3'].length,
      zone_4_10_count: zoneAggregates['4_10'].length,
      zone_11_25_count: zoneAggregates['11_25'].length,
      zone_26_50_count: zoneAggregates['26_50'].length,
      zone_51_100_count: zoneAggregates['51_100'].length,
      
      // Domain columns (top 5 per zone)
      zone_1_domains: zoneAggregates['1'].slice(0, 5),
      zone_2_domains: zoneAggregates['2'].slice(0, 5),
      zone_3_domains: zoneAggregates['3'].slice(0, 5),
      zone_4_10_domains: zoneAggregates['4_10'].slice(0, 5),
      zone_11_25_domains: zoneAggregates['11_25'].slice(0, 5),
      zone_26_50_domains: zoneAggregates['26_50'].slice(0, 5),
      zone_51_100_domains: zoneAggregates['51_100'].slice(0, 5)
    };

    // ═══════════════════════════════════════════════════════════
    // STEP 6: UPSERT into cache table
    // ═══════════════════════════════════════════════════════════
    const { error: cacheError } = await supabase
      .from('keywordshub_emd_zone_cache')
      .upsert(cacheData, {
        onConflict: 'keyword_id,emd_stamp_method'
      });

    if (cacheError) {
      console.error('F420: Error upserting cache:', cacheError);
      return NextResponse.json({ error: 'Failed to update cache' }, { status: 500 });
    }

    console.log(`F420: Cache updated successfully`);
    console.log(`F420: Zone distribution:`, {
      zone_1: cacheData.zone_1_count,
      zone_2: cacheData.zone_2_count,
      zone_3: cacheData.zone_3_count,
      zone_4_10: cacheData.zone_4_10_count,
      zone_11_25: cacheData.zone_11_25_count,
      zone_26_50: cacheData.zone_26_50_count,
      zone_51_100: cacheData.zone_51_100_count
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 7: Return success
    // ═══════════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      keyword_id,
      emd_stamp_method,
      latest_fetch_id: fetchId,
      total_emd_sites: cacheData.total_emd_sites,
      zones_cached: 7,
      relations_created: relationsToInsert.length,
      zone_breakdown: {
        zone_1: cacheData.zone_1_count,
        zone_2: cacheData.zone_2_count,
        zone_3: cacheData.zone_3_count,
        zone_4_10: cacheData.zone_4_10_count,
        zone_11_25: cacheData.zone_11_25_count,
        zone_26_50: cacheData.zone_26_50_count,
        zone_51_100: cacheData.zone_51_100_count
      }
    });

  } catch (error) {
    console.error('F420 function error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

