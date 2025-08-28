import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { host_account_id } = await request.json();

    if (!host_account_id) {
      return NextResponse.json(
        { success: false, error: 'Host account ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the host account with API key
    const { data: hostAccount, error: hostError } = await supabase
      .from('host_account')
      .select('*')
      .eq('id', host_account_id)
      .single();

    if (hostError || !hostAccount) {
      console.error('Error fetching host account:', hostError);
      return NextResponse.json(
        { success: false, error: 'Host account not found' },
        { status: 404 }
      );
    }

    const apiKey = hostAccount.hostacct_apikey1;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not found for this host account' },
        { status: 400 }
      );
    }

    console.log('Fetching domains from Dynadot for account:', host_account_id);

    // Dynadot API call to list domains
    const dynadotUrl = `https://api.dynadot.com/api3.json?key=${apiKey}&command=list_domain`;
    
    const response = await fetch(dynadotUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Dynadot API error:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, error: `Dynadot API error: ${response.status}` },
        { status: response.status }
      );
    }

    const dynadotData = await response.json();
    
    if (dynadotData.status !== 'success') {
      console.error('Dynadot API returned error:', dynadotData);
      return NextResponse.json(
        { success: false, error: dynadotData.error || 'Dynadot API error' },
        { status: 400 }
      );
    }

    // Extract domains from response
    const domains = dynadotData.domain_list || [];
    const domainsText = domains.map((domain: any) => {
      return `${domain.name} | Expires: ${domain.expiration} | Status: ${domain.status}`;
    }).join('\n');

    // Update the domains_glacier field in the host_account
    const { error: updateError } = await supabase
      .from('host_account')
      .update({ 
        domains_glacier: domainsText,
        updated_at: new Date().toISOString()
      })
      .eq('id', host_account_id);

    if (updateError) {
      console.error('Error updating domains_glacier:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to save domains data' },
        { status: 500 }
      );
    }

    console.log(`Successfully fetched and saved ${domains.length} domains from Dynadot`);

    return NextResponse.json({
      success: true,
      domains: domains,
      domains_text: domainsText,
      count: domains.length
    });

  } catch (error) {
    console.error('Dynadot domain fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}