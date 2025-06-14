import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user_internal_id from query params
    const { searchParams } = new URL(request.url);
    const userInternalId = searchParams.get('user_internal_id');

    if (!userInternalId) {
      return NextResponse.json(
        { success: false, error: 'User internal ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching host account with company join for user ID (V2):', userInternalId);

    // Fetch all host account records with joined host_company data
    const { data: hostAccounts, error } = await supabase
      .from('host_account')
      .select(`
        *,
        host_company:fk_host_company_id (
          id,
          name,
          portal_url1,
          fk_user_id,
          notes1,
          notes2,
          notes3
        )
      `)
      .eq('fk_user_id', userInternalId);

    if (error) {
      console.error('Error fetching host account with join (V2):', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch host account data' },
        { status: 500 }
      );
    }

    console.log(`Found ${hostAccounts?.length || 0} host account records with company data for user (V2)`);

    return NextResponse.json({
      success: true,
      data: hostAccounts || []
    });

  } catch (error) {
    console.error('get_hostaccount_data_v2 API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}