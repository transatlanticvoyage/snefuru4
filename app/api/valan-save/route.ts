import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      aval_title, 
      aval_content, 
      aval_fk_featured_image_plan_id, 
      aval_metadata_mode 
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

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

    console.log(`🔄 valan-save: Saving aval fields for record ${id} by user ${userData.id}`);

    // Verify user owns the record
    const { data: existingRecord, error: checkError } = await supabase
      .from('gcon_pieces')
      .select('id, fk_users_id')
      .eq('id', id)
      .eq('fk_users_id', userData.id)
      .single();

    if (checkError || !existingRecord) {
      return NextResponse.json(
        { success: false, message: 'Record not found or access denied' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Add fields if provided
    if (aval_title !== undefined) updateData.aval_title = aval_title;
    if (aval_content !== undefined) updateData.aval_content = aval_content;
    if (aval_fk_featured_image_plan_id !== undefined) updateData.aval_fk_featured_image_plan_id = aval_fk_featured_image_plan_id;
    if (aval_metadata_mode !== undefined) updateData.aval_metadata_mode = aval_metadata_mode;

    console.log(`📊 Updating fields:`, Object.keys(updateData));

    // Update the record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('gcon_pieces')
      .update(updateData)
      .eq('id', id)
      .eq('fk_users_id', userData.id)
      .select()
      .single();

    if (updateError) {
      console.error(`❌ Failed to update record ${id}:`, updateError);
      return NextResponse.json(
        { success: false, message: `Failed to save: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully updated record ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Avalanche content saved successfully',
      data: updatedRecord
    });

  } catch (error) {
    console.error('valan-save API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}