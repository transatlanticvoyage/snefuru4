import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { host_company_id, user_id } = await request.json();

    if (!host_company_id) {
      return NextResponse.json(
        { success: false, error: 'Host company ID is required' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify that the host company exists and belongs to the user
    const { data: hostCompany, error: hostCompanyError } = await supabase
      .from('host_company')
      .select('id, name, fk_user_id')
      .eq('id', host_company_id)
      .eq('fk_user_id', user_id)
      .single();

    if (hostCompanyError || !hostCompany) {
      console.error('Error fetching host company:', hostCompanyError);
      return NextResponse.json(
        { success: false, error: 'Host company not found or access denied' },
        { status: 404 }
      );
    }

    console.log('Creating host account for company:', hostCompany.name, 'ID:', host_company_id);

    // Create a new host account with minimal required fields
    const { data: newHostAccount, error: createError } = await supabase
      .from('host_account')
      .insert([
        {
          fk_host_company_id: host_company_id,
          fk_user_id: user_id,
          username: null,
          pass: null,
          hostacct_apikey1: null,
          hostacct_api_secret: null,
          api_management_url: null,
          domains_glacier: null
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating host account:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create host account' },
        { status: 500 }
      );
    }

    console.log('Successfully created host account with ID:', newHostAccount.id);

    return NextResponse.json({
      success: true,
      host_account: newHostAccount,
      message: `Successfully created new host account for ${hostCompany.name}`
    });

  } catch (error) {
    console.error('Create host account API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}