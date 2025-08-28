import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_internal_id = searchParams.get('user_internal_id');

    if (!user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'User internal ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Fetching call platform data for user_internal_id:', user_internal_id);

    // Fetch call platform companies and their associated accounts
    const { data: callplatData, error } = await supabase
      .from('callplat_companies')
      .select(`
        cplatcompany_id,
        cplatcompany_name,
        portal_url1,
        user_id,
        note1,
        note2,
        note3,
        created_at,
        updated_at,
        callplat_accounts!fk_callplat_company_id (
          cplatacct_id,
          cplatacct_username,
          cplatacct_api_key,
          cplatacct_api_secret,
          api_management_url,
          phone_numbers_glacier,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user_internal_id)
      .order('cplatcompany_name');

    if (error) {
      console.error('Error fetching call platform data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch call platform data' },
        { status: 500 }
      );
    }

    console.log('Call platform data fetched successfully:', callplatData?.length || 0, 'companies found');

    return NextResponse.json({
      success: true,
      data: callplatData || []
    });

  } catch (error) {
    console.error('Call platform data fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}