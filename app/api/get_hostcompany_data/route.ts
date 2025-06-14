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

    console.log('Fetching host company for user ID:', userInternalId);

    // Fetch all host company records for this user
    const { data: hostCompanies, error } = await supabase
      .from('host_company')
      .select('*')
      .eq('fk_user_id', userInternalId);

    if (error) {
      console.error('Error fetching host company:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch host company' },
        { status: 500 }
      );
    }

    console.log(`Found ${hostCompanies?.length || 0} host company records for user`);

    return NextResponse.json({
      success: true,
      data: hostCompanies || []
    });

  } catch (error) {
    console.error('get_hostcompany_data API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}