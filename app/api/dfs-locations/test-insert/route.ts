import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log('🧪 Testing single location insert...');

    // Test with a simple record
    const testRecord = {
      location_code: 99999,
      location_name: 'Test Location',
      location_code_parent: null,
      country_iso_code: 'US',
      location_type: 'Test',
      available_sources: 'google_ads',
      is_available_google_ads: true,
      is_available_bing_ads: false,
      is_available_google_trends: false,
      is_available_google_search: false
    };

    console.log('Attempting to insert:', testRecord);

    const { data, error, count } = await supabase
      .from('dfs_locations')
      .insert([testRecord])
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        test_record: testRecord
      }, { status: 500 });
    }

    console.log('✅ Test insert successful:', data);

    return NextResponse.json({
      success: true,
      message: 'Test insert successful',
      inserted_data: data,
      test_record: testRecord
    });

  } catch (error) {
    console.error('❌ Test insert failed:', error);
    return NextResponse.json({
      error: 'Test insert failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}