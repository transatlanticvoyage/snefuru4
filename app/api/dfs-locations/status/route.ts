import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log('📊 Checking dfs_locations table status...');

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('dfs_locations')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    // Get sample records
    const { data: sampleData, error: sampleError } = await supabase
      .from('dfs_locations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (sampleError) {
      throw sampleError;
    }

    // Get breakdown by location type
    const { data: typeBreakdown, error: typeError } = await supabase
      .from('dfs_locations')
      .select('location_type')
      .not('location_type', 'is', null);

    const typeCounts: Record<string, number> = {};
    if (!typeError && typeBreakdown) {
      typeBreakdown.forEach(item => {
        if (item.location_type) {
          typeCounts[item.location_type] = (typeCounts[item.location_type] || 0) + 1;
        }
      });
    }

    // Get breakdown by country
    const { data: countryBreakdown, error: countryError } = await supabase
      .from('dfs_locations')
      .select('country_iso_code')
      .not('country_iso_code', 'is', null)
      .limit(1000); // Limit to avoid huge response

    const countryCounts: Record<string, number> = {};
    if (!countryError && countryBreakdown) {
      countryBreakdown.forEach(item => {
        if (item.country_iso_code) {
          countryCounts[item.country_iso_code] = (countryCounts[item.country_iso_code] || 0) + 1;
        }
      });
    }

    // Sort countries by count
    const topCountries = Object.entries(countryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    // Get availability stats
    const { data: availabilityStats, error: availError } = await supabase
      .from('dfs_locations')
      .select('is_available_google_ads, is_available_bing_ads, is_available_google_trends, is_available_google_search');

    const availStats = {
      google_ads: 0,
      bing_ads: 0,
      google_trends: 0,
      google_search: 0
    };

    if (!availError && availabilityStats) {
      availabilityStats.forEach(item => {
        if (item.is_available_google_ads) availStats.google_ads++;
        if (item.is_available_bing_ads) availStats.bing_ads++;
        if (item.is_available_google_trends) availStats.google_trends++;
        if (item.is_available_google_search) availStats.google_search++;
      });
    }

    console.log(`✅ Status check completed: ${totalCount} total locations`);

    return NextResponse.json({
      success: true,
      status: {
        total_locations: totalCount || 0,
        has_data: (totalCount || 0) > 0,
        last_updated: sampleData?.[0]?.updated_at || null,
        sample_locations: sampleData?.map(loc => ({
          location_code: loc.location_code,
          location_name: loc.location_name,
          location_type: loc.location_type,
          country_iso_code: loc.country_iso_code
        })) || []
      },
      breakdown: {
        by_type: typeCounts,
        by_country: Object.fromEntries(topCountries),
        availability: availStats
      }
    });

  } catch (error) {
    console.error('❌ Status check failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check status', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}