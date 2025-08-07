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

    // Fetch sitespren data from the base table to ensure we get is_external/is_internal columns
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
    
    // Debug: Check if is_external and is_internal columns are present
    if (sitespren && sitespren.length > 0) {
      const firstRecord = sitespren[0];
      const hasExternal = 'is_external' in firstRecord;
      const hasInternal = 'is_internal' in firstRecord;
      console.log('First record keys:', Object.keys(firstRecord));
      console.log('Has is_external column:', hasExternal);
      console.log('Has is_internal column:', hasInternal);
      if (hasExternal) {
        console.log('Sample is_external values:', sitespren.slice(0, 3).map(r => ({ id: r.id, is_external: r.is_external })));
      }
    }

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