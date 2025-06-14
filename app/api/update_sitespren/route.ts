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
    const { site_id, user_internal_id, updates } = await request.json();

    if (!site_id) {
      return NextResponse.json(
        { success: false, error: 'Site ID is required' },
        { status: 400 }
      );
    }

    if (!user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'User internal ID is required' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Updates object is required' },
        { status: 400 }
      );
    }

    console.log('Updating sitespren record:', { site_id, user_internal_id, updates });

    // First verify that the user owns this record
    const { data: existingRecord, error: verifyError } = await supabase
      .from('sitespren')
      .select('fk_users_id')
      .eq('id', site_id)
      .single();

    if (verifyError || !existingRecord) {
      return NextResponse.json(
        { success: false, error: 'Site record not found' },
        { status: 404 }
      );
    }

    if (existingRecord.fk_users_id !== user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'Access denied - you can only edit your own sites' },
        { status: 403 }
      );
    }

    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Update the record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('sitespren')
      .update(updateData)
      .eq('id', site_id)
      .eq('fk_users_id', user_internal_id) // Double security check
      .select()
      .single();

    if (updateError) {
      console.error('Error updating sitespren record:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update site record' },
        { status: 500 }
      );
    }

    console.log('Successfully updated sitespren record:', updatedRecord.id);

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: 'Site record updated successfully'
    });

  } catch (error) {
    console.error('update_sitespren API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}