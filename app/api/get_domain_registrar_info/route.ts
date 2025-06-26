import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userInternalId = searchParams.get('user_internal_id');
    const fkDomregHostaccount = searchParams.get('fk_domreg_hostaccount');

    if (!userInternalId) {
      return NextResponse.json(
        { success: false, error: 'User internal ID is required' },
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

    let domainRegistrarInfo = null;

    // If we have a specific fk_domreg_hostaccount, fetch that specific record
    if (fkDomregHostaccount && fkDomregHostaccount !== 'null') {
      const { data: hostAccountData, error: hostAccountError } = await supabase
        .from('host_account')
        .select(`
          id,
          username,
          host_company:fk_host_company_id (
            id,
            name,
            portal_url1
          )
        `)
        .eq('id', fkDomregHostaccount)
        .eq('fk_user_id', userInternalId)
        .single();

      if (!hostAccountError && hostAccountData && hostAccountData.host_company) {
        const company = Array.isArray(hostAccountData.host_company) 
          ? hostAccountData.host_company[0] 
          : hostAccountData.host_company;
        
        domainRegistrarInfo = {
          host_account_id: hostAccountData.id,
          username: hostAccountData.username,
          company_name: company?.name || null,
          portal_url: company?.portal_url1 || null,
          company_id: company?.id || null
        };
      }
    }

    // Get all host accounts for the user (for the dropdown menu)
    const { data: allHostAccounts, error: allHostAccountsError } = await supabase
      .from('host_account')
      .select(`
        id,
        username,
        host_company:fk_host_company_id (
          id,
          name,
          portal_url1
        )
      `)
      .eq('fk_user_id', userInternalId)
      .order('username');

    if (allHostAccountsError) {
      console.error('Error fetching all host accounts:', allHostAccountsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch host accounts' },
        { status: 500 }
      );
    }

    const formattedHostAccounts = (allHostAccounts || []).map(account => {
      const company = Array.isArray(account.host_company) 
        ? account.host_company[0] 
        : account.host_company;
      
      return {
        host_account_id: account.id,
        username: account.username,
        company_name: company?.name || 'Unknown Company',
        portal_url: company?.portal_url1 || null,
        company_id: company?.id || null
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        current_registrar_info: domainRegistrarInfo,
        all_host_accounts: formattedHostAccounts
      }
    });

  } catch (error) {
    console.error('Error in get_domain_registrar_info:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}