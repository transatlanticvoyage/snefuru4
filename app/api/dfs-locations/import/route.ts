import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log('🌍 Starting DataForSEO locations import...');

    // Check if we already have locations
    const { count: existingCount } = await supabase
      .from('dfs_locations')
      .select('*', { count: 'exact', head: true });

    if (existingCount && existingCount > 0) {
      return NextResponse.json({ 
        message: `Already have ${existingCount} locations in database. Use force=true to reimport.`,
        existing_count: existingCount 
      });
    }

    // Check for force parameter
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (!force && existingCount && existingCount > 0) {
      return NextResponse.json({
        message: 'Locations already exist. Add ?force=true to overwrite.',
        existing_count: existingCount
      });
    }

    // Get DataForSEO credentials
    const username = process.env.DFS_USERNAME;
    const password = process.env.DFS_PASSWORD;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'DataForSEO credentials not found in environment variables' },
        { status: 400 }
      );
    }

    console.log('📡 Fetching locations from DataForSEO API...');

    // Fetch from DataForSEO
    const response = await fetch('https://api.dataforseo.com/v3/serp/google/locations', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DataForSEO API Error:', errorText);
      return NextResponse.json(
        { error: `DataForSEO API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.tasks || !data.tasks[0] || !data.tasks[0].result) {
      console.error('Invalid DataForSEO response structure:', data);
      return NextResponse.json(
        { error: 'Invalid response structure from DataForSEO' },
        { status: 500 }
      );
    }

    const locations = data.tasks[0].result;
    console.log(`📊 Retrieved ${locations.length} locations from DataForSEO`);

    // Clear existing data if force import
    if (force && existingCount && existingCount > 0) {
      console.log('🗑️ Clearing existing locations...');
      await supabase.from('dfs_locations').delete().neq('location_id', 0);
    }

    console.log('💾 Starting batch insert to database...');

    // Batch insert (chunks of 1000 to avoid timeout)
    const chunkSize = 1000;
    let totalInserted = 0;
    let errors = 0;

    for (let i = 0; i < locations.length; i += chunkSize) {
      const chunk = locations.slice(i, i + chunkSize);
      
      console.log(`Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(locations.length / chunkSize)} (${chunk.length} records)`);
      
      try {
        const transformedChunk = chunk.map((loc: any) => ({
          location_code: loc.location_code,
          location_name: loc.location_name,
          location_code_parent: loc.location_code_parent,
          country_iso_code: loc.country_iso_code,
          location_type: loc.location_type,
          available_sources: Array.isArray(loc.available_sources) ? loc.available_sources.join(',') : loc.available_sources,
          is_available_google_ads: Array.isArray(loc.available_sources) ? loc.available_sources.includes('google_ads') : false,
          is_available_bing_ads: Array.isArray(loc.available_sources) ? loc.available_sources.includes('bing_ads') : false,
          is_available_google_trends: Array.isArray(loc.available_sources) ? loc.available_sources.includes('google_trends') : false,
          is_available_google_search: Array.isArray(loc.available_sources) ? loc.available_sources.includes('google') : false
        }));

        const { error, count } = await supabase
          .from('dfs_locations')
          .upsert(transformedChunk, { 
            onConflict: 'location_code',
            count: 'exact'
          });

        if (error) {
          console.error(`Chunk ${Math.floor(i / chunkSize) + 1} error:`, error);
          console.error('Sample record that failed:', transformedChunk[0]);
          errors++;
        } else {
          totalInserted += count || chunk.length;
          console.log(`✅ Chunk ${Math.floor(i / chunkSize) + 1} completed: ${count || chunk.length} records`);
        }
      } catch (chunkError) {
        console.error(`Chunk ${Math.floor(i / chunkSize) + 1} exception:`, chunkError);
        errors++;
      }
    }

    // Final count check
    const { count: finalCount } = await supabase
      .from('dfs_locations')
      .select('*', { count: 'exact', head: true });

    console.log(`🎉 Import completed! Total locations in database: ${finalCount}`);

    return NextResponse.json({
      success: true,
      message: 'DataForSEO locations imported successfully',
      stats: {
        total_from_api: locations.length,
        total_inserted: totalInserted,
        final_count: finalCount,
        errors: errors,
        chunks_processed: Math.ceil(locations.length / chunkSize)
      }
    });

  } catch (error) {
    console.error('❌ Import failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import locations', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}