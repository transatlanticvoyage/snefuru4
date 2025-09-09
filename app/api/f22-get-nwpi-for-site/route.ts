import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sitespren_base } = body;

    if (!sitespren_base) {
      return NextResponse.json(
        { success: false, message: 'sitespren_base is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 f22-get-nwpi-for-site: Fetching NWPI content for site: ${sitespren_base}`);

    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User record not found' },
        { status: 404 }
      );
    }

    console.log(`🔄 Querying nwpi_content for user ${userData.id} and site ${sitespren_base}`);

    // Query nwpi_content for this user and site
    const { data: nwpiRecords, error: fetchError } = await supabase
      .from('nwpi_content')
      .select('internal_post_id, post_title, post_id, fk_sitespren_base')
      .eq('fk_users_id', userData.id)
      .eq('fk_sitespren_base', sitespren_base)
      .order('i_created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching nwpi_content records:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Error fetching NWPI records' },
        { status: 500 }
      );
    }

    const recordIds = nwpiRecords?.map(record => record.internal_post_id) || [];
    
    console.log(`📊 Found ${nwpiRecords?.length || 0} NWPI records for site ${sitespren_base}:`);
    nwpiRecords?.forEach(record => {
      console.log(`  - ${record.post_title} (ID: ${record.internal_post_id}, WP ID: ${record.post_id})`);
    });

    return NextResponse.json({
      success: true,
      message: `Found ${recordIds.length} NWPI records for site ${sitespren_base}`,
      record_ids: recordIds,
      records: nwpiRecords
    });

  } catch (error) {
    console.error('f22-get-nwpi-for-site API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}