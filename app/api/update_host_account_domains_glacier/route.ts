import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { host_account_id, domains_glacier, user_internal_id } = await request.json();

    if (!host_account_id || !user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify the user owns this host account (through user_id relationship)
    const { data: hostAccount, error: fetchError } = await supabase
      .from('host_account')
      .select('id, fk_user_id')
      .eq('id', host_account_id)
      .eq('fk_user_id', user_internal_id)
      .single();

    if (fetchError || !hostAccount) {
      return NextResponse.json(
        { success: false, error: 'Host account not found or access denied' },
        { status: 404 }
      );
    }

    // Update the domains_glacier field
    const { error: updateError } = await supabase
      .from('host_account')
      .update({ domains_glacier })
      .eq('id', host_account_id)
      .eq('fk_user_id', user_internal_id);

    if (updateError) {
      console.error('Error updating host account domains_glacier:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update domains_glacier' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Domains glacier updated successfully'
    });

  } catch (error) {
    console.error('Server error in update_host_account_domains_glacier:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}