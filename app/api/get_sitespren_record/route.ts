import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get parameters from query
    const { searchParams } = new URL(request.url);
    const site = searchParams.get('site');
    const userInternalId = searchParams.get('user_internal_id');

    if (!site) {
      return NextResponse.json(
        { success: false, error: 'Site parameter is required' },
        { status: 400 }
      );
    }

    if (!userInternalId) {
      return NextResponse.json(
        { success: false, error: 'User internal ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching sitespren record for:', { site, userInternalId });

    // Fetch the specific sitespren record for this user and site
    const { data: sitesprenRecord, error } = await supabase
      .from('sitespren')
      .select('*')
      .eq('sitespren_base', site)
      .eq('fk_users_id', userInternalId)
      .single();

    if (error) {
      console.error('Error fetching sitespren record:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Site record not found or access denied' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Failed to fetch site record' },
        { status: 500 }
      );
    }

    console.log('Found sitespren record:', sitesprenRecord.id);

    return NextResponse.json({
      success: true,
      data: sitesprenRecord
    });

  } catch (error) {
    console.error('get_sitespren_record API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}