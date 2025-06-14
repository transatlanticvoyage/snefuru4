import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the request body
    const { site_ids, user_internal_id } = await request.json();

    if (!site_ids || !Array.isArray(site_ids) || site_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Site IDs array is required' },
        { status: 400 }
      );
    }

    if (!user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'User internal ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting sites:', { site_ids, user_internal_id });

    // First verify that all sites belong to this user
    const { data: existingRecords, error: verifyError } = await supabase
      .from('sitespren')
      .select('id, fk_users_id')
      .in('id', site_ids);

    if (verifyError) {
      console.error('Error verifying site ownership:', verifyError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify site ownership' },
        { status: 500 }
      );
    }

    if (!existingRecords || existingRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No sites found with the provided IDs' },
        { status: 404 }
      );
    }

    // Check if all sites belong to the user
    const unauthorizedSites = existingRecords.filter(
      record => record.fk_users_id !== user_internal_id
    );

    if (unauthorizedSites.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access denied - you can only delete your own sites',
          unauthorized_count: unauthorizedSites.length
        },
        { status: 403 }
      );
    }

    // Delete the records
    const { data: deletedRecords, error: deleteError } = await supabase
      .from('sitespren')
      .delete()
      .in('id', site_ids)
      .eq('fk_users_id', user_internal_id) // Double security check
      .select('id');

    if (deleteError) {
      console.error('Error deleting sitespren records:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete site records' },
        { status: 500 }
      );
    }

    const deletedCount = deletedRecords ? deletedRecords.length : 0;
    console.log(`Successfully deleted ${deletedCount} sitespren records`);

    return NextResponse.json({
      success: true,
      data: {
        deletedCount,
        deletedIds: deletedRecords?.map(record => record.id) || []
      },
      message: `Successfully deleted ${deletedCount} site(s)`
    });

  } catch (error) {
    console.error('f18_deletesites API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}