import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client with service role key
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

    console.log('Fetching all host companies with optional host accounts for user ID (V2):', userInternalId);

    // Fetch all host companies owned by the user with LEFT JOIN to host accounts
    // This shows ALL host companies, whether they have associated accounts or not
    const { data: hostCompanies, error } = await supabase
      .from('host_company')
      .select(`
        id,
        name,
        portal_url1,
        fk_user_id,
        notes1,
        notes2,
        notes3,
        host_accounts:host_account!fk_host_company_id (
          id,
          username,
          pass,
          hostacct_apikey1,
          fk_user_id,
          fk_host_company_id,
          domains_glacier
        )
      `)
      .eq('fk_user_id', userInternalId);

    if (error) {
      console.error('Error fetching host companies with accounts (V2):', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch host company data' },
        { status: 500 }
      );
    }

    console.log(`Found ${hostCompanies?.length || 0} host company records for user (V2)`);
    
    // Transform the data to match the expected format for the UI
    // We'll flatten it so each host_account becomes a row, with host_company as nested data
    const transformedData: any[] = [];
    
    hostCompanies?.forEach(company => {
      if (company.host_accounts && company.host_accounts.length > 0) {
        // Company has accounts - create rows for each account
        company.host_accounts.forEach(account => {
          transformedData.push({
            // Host account fields
            id: account.id,
            username: account.username,
            pass: account.pass,
            hostacct_apikey1: account.hostacct_apikey1,
            fk_user_id: account.fk_user_id,
            fk_host_company_id: account.fk_host_company_id,
            domains_glacier: account.domains_glacier,
            // Host company nested object
            host_company: {
              id: company.id,
              name: company.name,
              portal_url1: company.portal_url1,
              fk_user_id: company.fk_user_id,
              notes1: company.notes1,
              notes2: company.notes2,
              notes3: company.notes3
            }
          });
        });
      } else {
        // Company has no accounts - create a row with null account data
        transformedData.push({
          // Null host account fields (company without account)
          id: null,
          username: null,
          pass: null,
          hostacct_apikey1: null,
          fk_user_id: null,
          fk_host_company_id: null,
          domains_glacier: null,
          // Host company data
          host_company: {
            id: company.id,
            name: company.name,
            portal_url1: company.portal_url1,
            fk_user_id: company.fk_user_id,
            notes1: company.notes1,
            notes2: company.notes2,
            notes3: company.notes3
          },
          // Flag to indicate this is a company without account
          _is_company_only: true
        });
      }
    });

    console.log(`Transformed to ${transformedData.length} display records (V2)`);

    return NextResponse.json({
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error('get_hostaccount_data_v2 API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}