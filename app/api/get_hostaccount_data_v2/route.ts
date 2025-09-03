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

    // Simplified approach - just fetch host companies first
    const { data: hostCompanies, error } = await supabase
      .from('host_company')
      .select('*')
      .eq('fk_user_id', userInternalId);

    if (error) {
      console.error('Error fetching host companies with accounts (V2):', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch host company data' },
        { status: 500 }
      );
    }

    console.log(`Found ${hostCompanies?.length || 0} host company records for user (V2)`);
    
    // Manually fetch related data for each company
    const transformedData: any[] = [];
    
    for (const company of hostCompanies || []) {
      // Fetch host accounts for this company
      const { data: hostAccounts } = await supabase
        .from('host_account')
        .select('*')
        .eq('fk_host_company_id', company.id);
      
      if (hostAccounts && hostAccounts.length > 0) {
        for (const account of hostAccounts) {
          // Fetch host plans for this account
          const { data: hostPlans } = await supabase
            .from('host_plan')
            .select('*')
            .eq('fk_host_account_id', account.id);
          
          if (hostPlans && hostPlans.length > 0) {
            for (const plan of hostPlans) {
              // Fetch host panels for this plan
              const { data: hostPanels } = await supabase
                .from('host_panel')
                .select('*')
                .eq('fk_host_plan_id', plan.id);
              
              if (hostPanels && hostPanels.length > 0) {
                // Plan has panels - create rows for each panel
                for (const panel of hostPanels) {
                  transformedData.push({
                    // Host account fields
                    id: account.id,
                    username: account.username,
                    pass: account.pass,
                    hostacct_apikey1: account.hostacct_apikey1,
                    hostacct_api_secret: account.hostacct_api_secret,
                    api_management_url: account.api_management_url,
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
                    },
                    // Host plan nested object
                    host_plan: {
                      id: plan.id,
                      paymentdate_first: plan.paymentdate_first,
                      payment_method: plan.payment_method,
                      price: plan.price,
                      currency: plan.currency,
                      price_term: plan.price_term,
                      subscribed: plan.subscribed,
                      cc_added: plan.cc_added,
                      paymentdate_next: plan.paymentdate_next,
                      fk_user_id: plan.fk_user_id,
                      ue_identifier_1: plan.ue_identifier_1,
                      fk_host_account_id: plan.fk_host_account_id
                    },
                    // Host panel nested object
                    host_panel: {
                      id: panel.id,
                      panel_url1: panel.panel_url1,
                      panel_user: panel.panel_user,
                      panel_pass: panel.panel_pass,
                      panel_type: panel.panel_type,
                      panel_ns: panel.panel_ns,
                      fk_user_id: panel.fk_user_id,
                      panel_note1: panel.panel_note1,
                      flag_nsduplicate: panel.flag_nsduplicate,
                      fk_host_plan_id: panel.fk_host_plan_id
                    }
                  });
                }
              } else {
                // Plan has no panels - create row with null panel data
                transformedData.push({
                  id: account.id,
                  username: account.username,
                  pass: account.pass,
                  hostacct_apikey1: account.hostacct_apikey1,
                  hostacct_api_secret: account.hostacct_api_secret,
                  api_management_url: account.api_management_url,
                  fk_user_id: account.fk_user_id,
                  fk_host_company_id: account.fk_host_company_id,
                  domains_glacier: account.domains_glacier,
                  host_company: {
                    id: company.id,
                    name: company.name,
                    portal_url1: company.portal_url1,
                    fk_user_id: company.fk_user_id,
                    notes1: company.notes1,
                    notes2: company.notes2,
                    notes3: company.notes3
                  },
                  host_plan: {
                    id: plan.id,
                    paymentdate_first: plan.paymentdate_first,
                    payment_method: plan.payment_method,
                    price: plan.price,
                    currency: plan.currency,
                    price_term: plan.price_term,
                    subscribed: plan.subscribed,
                    cc_added: plan.cc_added,
                    paymentdate_next: plan.paymentdate_next,
                    fk_user_id: plan.fk_user_id,
                    ue_identifier_1: plan.ue_identifier_1,
                    fk_host_account_id: plan.fk_host_account_id
                  },
                  host_panel: null,
                  _is_plan_only: true
                });
              }
            }
          } else {
            // Account has no plans - create row with null plan and panel data
            transformedData.push({
              id: account.id,
              username: account.username,
              pass: account.pass,
              hostacct_apikey1: account.hostacct_apikey1,
              hostacct_api_secret: account.hostacct_api_secret,
              api_management_url: account.api_management_url,
              fk_user_id: account.fk_user_id,
              fk_host_company_id: account.fk_host_company_id,
              domains_glacier: account.domains_glacier,
              host_company: {
                id: company.id,
                name: company.name,
                portal_url1: company.portal_url1,
                fk_user_id: company.fk_user_id,
                notes1: company.notes1,
                notes2: company.notes2,
                notes3: company.notes3
              },
              host_plan: null,
              host_panel: null,
              _is_account_only: true
            });
          }
        }
      } else {
        // Company has no accounts - create a row with null account, plan, and panel data
        transformedData.push({
          id: null,
          username: null,
          pass: null,
          hostacct_apikey1: null,
          hostacct_api_secret: null,
          api_management_url: null,
          fk_user_id: null,
          fk_host_company_id: null,
          domains_glacier: null,
          host_company: {
            id: company.id,
            name: company.name,
            portal_url1: company.portal_url1,
            fk_user_id: company.fk_user_id,
            notes1: company.notes1,
            notes2: company.notes2,
            notes3: company.notes3
          },
          host_plan: null,
          host_panel: null,
          _is_company_only: true
        });
      }
    }

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