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

    // DEBUG: Check total count before filtering
    const { count: totalResultsCount, error: countError } = await supabase
      .from('zhe_serp_results')
      .select('*', { count: 'exact', head: true })
      .eq('rel_fetch_id', fetchId);
    
    console.log(`F420: DEBUG - Total results in DB for fetch ${fetchId}: ${totalResultsCount}`);

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Get ALL domains from zhe_serp_results (not just EMD)
    // ═══════════════════════════════════════════════════════════
    const matchColumn = emd_stamp_method === 'method-1' ? 'is_match_emd_stamp' : 'is_match_emd_stamp';

    // Note: rank_in_group is stored as TEXT, so we need to filter/sort in JavaScript
    const { data: allDomainsRaw, error: domainsError } = await supabase
      .from('zhe_serp_results')
      .select('result_id, domain, rank_in_group, url, is_match_emd_stamp')
      .eq('rel_fetch_id', fetchId)
      .not('rank_in_group', 'is', null);
    
    // Filter by rank <= 100 and SORT in JavaScript (TEXT field can't be sorted correctly in DB)
    const allDomains = (allDomainsRaw || [])
      .filter(d => {
        const rank = parseInt(d.rank_in_group || '0');
        return rank > 0 && rank <= 100;
      })
      .sort((a, b) => parseInt(a.rank_in_group || '0') - parseInt(b.rank_in_group || '0'));
    
    console.log(`F420: Retrieved ${allDomains.length} domains (filtered rank 1-100, sorted numerically)`);
    if (allDomains.length > 0) {
      const firstRank = parseInt(allDomains[0].rank_in_group || '0');
      const lastRank = parseInt(allDomains[allDomains.length - 1].rank_in_group || '0');
      console.log(`F420: Rank range (rank_in_group): ${firstRank} to ${lastRank}`);
    }

    if (domainsError) {
      console.error('F420: Error fetching domains:', domainsError);
      return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
    }

    if (!allDomains || allDomains.length === 0) {
      console.log('F420: No SERP results found for this fetch');
      return NextResponse.json({ 
        message: 'No SERP results found. Please run F400 first.',
        total_emd_count: 0,
        zones_cached: 0,
        relations_created: 0
      });
    }

    // Separate EMD matches for relations table
    const emdMatches = allDomains.filter(d => d[matchColumn] === true);
    
    console.log(`F420: Found ${allDomains.length} total domains, ${emdMatches.length} EMD matches`);

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Mark old cache as historical and clear old relations
    // ═══════════════════════════════════════════════════════════
    console.log(`F420: Marking old cache as historical for method ${emd_stamp_method}...`);
    
    // Set existing cache entries to is_current = FALSE (preserve history)
    await supabase
      .from('keywordshub_serp_zone_cache')
      .update({ is_current: false })
      .eq('keyword_id', keyword_id)
      .eq('emd_stamp_method', emd_stamp_method)
      .eq('is_current', true);

    // Delete old relations (no need to keep historical relations, just cache)
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
    // STEP 5: Aggregate ALL domains by zone for cache
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

    // Create Set of EMD result_ids for fast lookup
    const emdResultIds = new Set(emdMatches.map(m => m.result_id));

    // Group ALL domains by zone with is_emd_m1 flag (already sorted numerically by rank_in_group)
    for (const domain of allDomains) {
      const rankNum = parseInt(domain.rank_in_group || '0');
      const zone = getZoneIdFromRank(rankNum);
      if (zone && zoneAggregates[zone.zone_key]) {
        zoneAggregates[zone.zone_key].push({
          domain: domain.domain,
          rank: rankNum,  // Store as number for proper sorting in UI
          url: domain.url,
          is_emd_m1: emdResultIds.has(domain.result_id)
        });
      }
    }

    // LOG zone aggregates for debugging
    console.log('F420: ==================== Zone Aggregates Summary ====================');
    console.log(`  Zone 1: ${zoneAggregates['1'].length} domains`, zoneAggregates['1'].map(d => `#${d.rank} ${d.domain} (EMD:${d.is_emd_m1})`));
    console.log(`  Zone 2: ${zoneAggregates['2'].length} domains`, zoneAggregates['2'].map(d => `#${d.rank} ${d.domain} (EMD:${d.is_emd_m1})`));
    console.log(`  Zone 3: ${zoneAggregates['3'].length} domains`, zoneAggregates['3'].map(d => `#${d.rank} ${d.domain} (EMD:${d.is_emd_m1})`));
    console.log(`  Zone 4-10: ${zoneAggregates['4_10'].length} domains`, zoneAggregates['4_10'].slice(0, 3).map(d => `#${d.rank} ${d.domain}`));
    console.log(`  Zone 11-25: ${zoneAggregates['11_25'].length} domains`, zoneAggregates['11_25'].slice(0, 3).map(d => `#${d.rank} ${d.domain}`));
    console.log(`  Zone 26-50: ${zoneAggregates['26_50'].length} domains`, zoneAggregates['26_50'].slice(0, 3).map(d => `#${d.rank} ${d.domain}`));
    console.log(`  Zone 51-100: ${zoneAggregates['51_100'].length} domains`, zoneAggregates['51_100'].slice(0, 3).map(d => `#${d.rank} ${d.domain}`));
    console.log('F420: ================================================================');

    // Build cache object with new structure
    const cacheData = {
      keyword_id,
      emd_stamp_method,
      latest_fetch_id: fetchId,
      source_fetch_id: fetchId,
      is_current: true,
      cache_version: 1,  // Add cache_version column
      
      // Count columns (renamed)
      total_emd_count: emdMatches.length,
      zone_1_emd_count: zoneAggregates['1'].filter(d => d.is_emd_m1).length,
      zone_2_emd_count: zoneAggregates['2'].filter(d => d.is_emd_m1).length,
      zone_3_emd_count: zoneAggregates['3'].filter(d => d.is_emd_m1).length,
      zone_4_10_emd_count: zoneAggregates['4_10'].filter(d => d.is_emd_m1).length,
      zone_11_25_emd_count: zoneAggregates['11_25'].filter(d => d.is_emd_m1).length,
      zone_26_50_emd_count: zoneAggregates['26_50'].filter(d => d.is_emd_m1).length,
      zone_51_100_emd_count: zoneAggregates['51_100'].filter(d => d.is_emd_m1).length,
      
      // Domain columns (new JSONB structure with all domains)
      zone_1_domains: { domains: zoneAggregates['1'] },
      zone_2_domains: { domains: zoneAggregates['2'] },
      zone_3_domains: { domains: zoneAggregates['3'] },
      zone_4_10_domains: { domains: zoneAggregates['4_10'] },
      zone_11_25_domains: { domains: zoneAggregates['11_25'] },
      zone_26_50_domains: { domains: zoneAggregates['26_50'] },
      zone_51_100_domains: { domains: zoneAggregates['51_100'] }
    };

    // ═══════════════════════════════════════════════════════════
    // STEP 6: UPSERT cache entry (update if exists, insert if not)
    // ═══════════════════════════════════════════════════════════
    // DEBUG: Log what we're about to store
    console.log('F420: About to UPSERT cache data:');
    console.log('  - zone_1_domains:', JSON.stringify(cacheData.zone_1_domains));
    console.log('  - zone_2_domains:', JSON.stringify(cacheData.zone_2_domains));
    console.log('  - zone_3_domains:', JSON.stringify(cacheData.zone_3_domains));
    console.log('  - zone_1_emd_count:', cacheData.zone_1_emd_count);
    console.log('  - zone_2_emd_count:', cacheData.zone_2_emd_count);
    console.log('  - zone_3_emd_count:', cacheData.zone_3_emd_count);
    
    // Use upsert to handle both new and existing cache entries
    // The unique constraint is on (keyword_id, emd_stamp_method, source_fetch_id)
    const { error: cacheError } = await supabase
      .from('keywordshub_serp_zone_cache')
      .upsert(cacheData, {
        onConflict: 'keyword_id,emd_stamp_method,source_fetch_id',
        ignoreDuplicates: false
      });

    if (cacheError) {
      console.error('F420: Error upserting cache:', cacheError);
      console.error('F420: Cache data that failed:', JSON.stringify(cacheData, null, 2));
      return NextResponse.json({ 
        error: 'Failed to update cache',
        details: cacheError.message,
        code: cacheError.code,
        hint: cacheError.hint
      }, { status: 500 });
    }

    console.log(`F420: ✅ Universal SERP Zone Cache updated successfully`);
    console.log(`F420: Total domains: ${allDomains.length}, EMD matches: ${emdMatches.length}`);
    console.log(`F420: Zone EMD distribution:`, {
      zone_1: cacheData.zone_1_emd_count,
      zone_2: cacheData.zone_2_emd_count,
      zone_3: cacheData.zone_3_emd_count,
      zone_4_10: cacheData.zone_4_10_emd_count,
      zone_11_25: cacheData.zone_11_25_emd_count,
      zone_26_50: cacheData.zone_26_50_emd_count,
      zone_51_100: cacheData.zone_51_100_emd_count
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 7: Return success
    // ═══════════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      keyword_id,
      emd_stamp_method,
      latest_fetch_id: fetchId,
      total_domains: allDomains.length,
      total_emd_count: cacheData.total_emd_count,
      zones_cached: 7,
      relations_created: relationsToInsert.length,
      zone_breakdown: {
        zone_1: { emd: cacheData.zone_1_emd_count, total: zoneAggregates['1'].length },
        zone_2: { emd: cacheData.zone_2_emd_count, total: zoneAggregates['2'].length },
        zone_3: { emd: cacheData.zone_3_emd_count, total: zoneAggregates['3'].length },
        zone_4_10: { emd: cacheData.zone_4_10_emd_count, total: zoneAggregates['4_10'].length },
        zone_11_25: { emd: cacheData.zone_11_25_emd_count, total: zoneAggregates['11_25'].length },
        zone_26_50: { emd: cacheData.zone_26_50_emd_count, total: zoneAggregates['26_50'].length },
        zone_51_100: { emd: cacheData.zone_51_100_emd_count, total: zoneAggregates['51_100'].length }
      }
    });

  } catch (error) {
    console.error('F420 function error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

