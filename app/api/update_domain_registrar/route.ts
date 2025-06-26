import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sitespren_id, fk_domreg_hostaccount, user_internal_id } = body;

    if (!sitespren_id || !user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'Site ID and user internal ID are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the site belongs to the user
    const { data: siteData, error: siteError } = await supabase
      .from('sitespren')
      .select('id, fk_users_id')
      .eq('id', sitespren_id)
      .eq('fk_users_id', user_internal_id)
      .single();

    if (siteError || !siteData) {
      return NextResponse.json(
        { success: false, error: 'Site not found or access denied' },
        { status: 404 }
      );
    }

    // If fk_domreg_hostaccount is provided, verify it belongs to the user
    if (fk_domreg_hostaccount) {
      const { data: hostAccountData, error: hostAccountError } = await supabase
        .from('host_account')
        .select('id')
        .eq('id', fk_domreg_hostaccount)
        .eq('fk_user_id', user_internal_id)
        .single();

      if (hostAccountError || !hostAccountData) {
        return NextResponse.json(
          { success: false, error: 'Host account not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Update the sitespren record
    const { data: updateData, error: updateError } = await supabase
      .from('sitespren')
      .update({ 
        fk_domreg_hostaccount: fk_domreg_hostaccount || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', sitespren_id)
      .eq('fk_users_id', user_internal_id)
      .select();

    if (updateError) {
      console.error('Error updating domain registrar:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update domain registrar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Domain registrar updated successfully',
      data: updateData
    });

  } catch (error) {
    console.error('Error in update_domain_registrar:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}