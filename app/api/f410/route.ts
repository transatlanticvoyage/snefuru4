import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword_id } = body;

    if (!keyword_id) {
      return NextResponse.json({ error: 'keyword_id is required' }, { status: 400 });
    }

    console.log(`F410: Starting EMD Stamp Match for keyword_id: ${keyword_id}`);

    // Step 1: Get keyword data with emd_stamp_slug and cached_city_name
    const { data: keywordData, error: keywordError } = await supabase
      .from('keywordshub')
      .select(`
        keyword_id,
        keyword_datum,
        rel_industry_id,
        cached_city_name,
        industries (
          industry_id,
          emd_stamp_slug
        )
      `)
      .eq('keyword_id', keyword_id)
      .single();

    if (keywordError || !keywordData) {
      console.error('Error fetching keyword data:', keywordError);
      return NextResponse.json({ error: 'Failed to fetch keyword data' }, { status: 500 });
    }

    const emd_stamp_slug = keywordData.industries?.emd_stamp_slug;
    const cached_city_name = keywordData.cached_city_name;

    console.log(`F410: emd_stamp_slug = "${emd_stamp_slug}"`);
    console.log(`F410: cached_city_name = "${cached_city_name}"`);

    if (!emd_stamp_slug) {
      return NextResponse.json({ 
        error: 'No emd_stamp_slug found. Please ensure the keyword has an industry assigned with an emd_stamp_slug.' 
      }, { status: 400 });
    }

    if (!cached_city_name) {
      return NextResponse.json({ 
        error: 'No cached_city_name found. Please ensure the keyword has a cached_city_name.' 
      }, { status: 400 });
    }

    // Step 2: Get LATEST fetch_id ONLY for this keyword
    const { data: latestFetch, error: fetchError } = await supabase
      .from('zhe_serp_fetches')
      .select('fetch_id')
      .eq('rel_keyword_id', keyword_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !latestFetch) {
      console.error('Error fetching latest fetch record:', fetchError);
      return NextResponse.json({ 
        error: 'No SERP fetches found for this keyword. Please run F400 first.',
        matches_found: 0,
        total_checked: 0
      }, { status: 400 });
    }

    const latestFetchId = latestFetch.fetch_id;
    console.log(`F410: Using LATEST fetch_id: ${latestFetchId}`);

    // DEBUG: Check how many results exist for this fetch_id
    const { count: totalCount, error: countError } = await supabase
      .from('zhe_serp_results')
      .select('*', { count: 'exact', head: true })
      .eq('rel_fetch_id', latestFetchId);
    
    console.log(`F410: DEBUG - Total results in DB for fetch ${latestFetchId}: ${totalCount}`);

    // Step 3: Get SERP results ONLY from the latest fetch (top 100)
    // Note: rank_in_group is stored as TEXT, so we can't sort/filter in DB - do it in JS
    const { data: serpResults, error: serpError } = await supabase
      .from('zhe_serp_results')
      .select('result_id, domain, rel_fetch_id, rank_in_group')
      .eq('rel_fetch_id', latestFetchId)
      .not('rank_in_group', 'is', null);
    
    // Filter and sort in JavaScript (TEXT field can't be filtered/sorted correctly in DB)
    const filteredResults = (serpResults || [])
      .filter(r => {
        const rank = parseInt(r.rank_in_group || '0');
        return rank > 0 && rank <= 100;
      })
      .sort((a, b) => parseInt(a.rank_in_group || '0') - parseInt(b.rank_in_group || '0'));

    if (serpError) {
      console.error('Error fetching SERP results:', serpError);
      return NextResponse.json({ error: 'Failed to fetch SERP results' }, { status: 500 });
    }

    console.log(`F410: Found ${filteredResults.length} SERP results to process (after filtering rank <= 100)`);
    console.log(`F410: Rank range: ${filteredResults[0]?.rank_in_group} to ${filteredResults[filteredResults.length - 1]?.rank_in_group}`);

    if (!filteredResults || filteredResults.length === 0) {
      return NextResponse.json({ 
        message: 'No SERP results found for this keyword',
        matches_found: 0,
        total_checked: 0
      });
    }

    // Step 4: Process each result and check for matches
    let matchesFound = 0;
    const matchedResultIds: number[] = [];
    
    // Prepare city name variations
    const cityNameLower = cached_city_name.toLowerCase();
    const cityNameNoSpaces = cityNameLower.replace(/\s+/g, '');
    const cityNameParts = cityNameLower.split(/\s+/).filter(part => part.length > 0);
    const emdStampSlugLower = emd_stamp_slug.toLowerCase();

    for (const result of filteredResults) {
      if (!result.domain) continue;

      const domainLower = result.domain.toLowerCase();
      
      // Check if domain contains emd_stamp_slug
      const hasEmdStamp = domainLower.includes(emdStampSlugLower);
      
      // Check if domain contains city name (with flexible matching)
      let hasCityName = false;
      
      // Method 1: Check for city name without spaces (e.g., "corpuschristi")
      if (domainLower.includes(cityNameNoSpaces)) {
        hasCityName = true;
      }
      
      // Method 2: Check if domain contains all parts of the city name
      // (e.g., "corpus" and "christi" appear somewhere in the domain)
      if (!hasCityName && cityNameParts.length > 1) {
        const allPartsPresent = cityNameParts.every(part => domainLower.includes(part));
        if (allPartsPresent) {
          hasCityName = true;
        }
      }
      
      // Method 3: Check for single-word city names
      if (!hasCityName && cityNameParts.length === 1) {
        if (domainLower.includes(cityNameParts[0])) {
          hasCityName = true;
        }
      }

      // If both conditions are met, mark as match
      if (hasEmdStamp && hasCityName) {
        matchesFound++;
        matchedResultIds.push(result.result_id);
        
        console.log(`F410: MATCH found - result_id: ${result.result_id}, domain: ${result.domain}`);
        
        // Update the is_match_emd_stamp field to TRUE
        const { error: updateError } = await supabase
          .from('zhe_serp_results')
          .update({ is_match_emd_stamp: true })
          .eq('result_id', result.result_id);

        if (updateError) {
          console.error(`F410: Error updating result_id ${result.result_id}:`, updateError);
        }
      } else {
        // Update to FALSE if it doesn't match (to clear any previous matches)
        const { error: updateError } = await supabase
          .from('zhe_serp_results')
          .update({ is_match_emd_stamp: false })
          .eq('result_id', result.result_id);

        if (updateError) {
          console.error(`F410: Error updating result_id ${result.result_id}:`, updateError);
        }
      }
    }

    console.log(`F410: Complete - Found ${matchesFound} matches out of ${filteredResults.length} results`);

    return NextResponse.json({
      success: true,
      message: `F410 EMD Stamp Match completed`,
      matches_found: matchesFound,
      total_checked: filteredResults.length,
      matched_result_ids: matchedResultIds,
      emd_stamp_slug: emd_stamp_slug,
      cached_city_name: cached_city_name,
      keyword_datum: keywordData.keyword_datum
    });

  } catch (error) {
    console.error('F410 function error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

