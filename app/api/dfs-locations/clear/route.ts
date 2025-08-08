import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log('🗑️ Clearing dfs_locations table...');

    // Check current count
    const { count: beforeCount } = await supabase
      .from('dfs_locations')
      .select('*', { count: 'exact', head: true });

    if (!beforeCount || beforeCount === 0) {
      return NextResponse.json({
        message: 'No locations to clear - table is already empty',
        count: 0
      });
    }

    console.log(`Found ${beforeCount} locations to delete`);

    // Clear all locations
    const { error } = await supabase
      .from('dfs_locations')
      .delete()
      .neq('location_id', 0); // This will match all rows

    if (error) {
      throw error;
    }

    // Verify deletion
    const { count: afterCount } = await supabase
      .from('dfs_locations')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Cleared ${beforeCount} locations, ${afterCount || 0} remaining`);

    return NextResponse.json({
      success: true,
      message: 'Locations cleared successfully',
      deleted_count: beforeCount,
      remaining_count: afterCount || 0
    });

  } catch (error) {
    console.error('❌ Clear failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear locations', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}