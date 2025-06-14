import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client with service role key to bypass RLS
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

    console.log('Fetching sitespren data for user:', userInternalId);

    // Fetch sitespren data
    const { data: sitespren, error } = await supabase
      .from('sitespren')
      .select('*')
      .eq('fk_users_id', userInternalId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sitespren:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sites data' },
        { status: 500 }
      );
    }

    console.log('Found sitespren records:', sitespren?.length || 0);

    return NextResponse.json({
      success: true,
      data: sitespren || []
    });

  } catch (error) {
    console.error('get_sitespren_data API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}