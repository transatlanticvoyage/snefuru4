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

    console.log('Fetching domains from Porkbun for account:', host_account_id);

    // For Porkbun, the API key might contain both API key and secret key
    // Format: "apikey:secretkey" or just "apikey" (we'll handle both)
    let porkbunApiKey = apiKey;
    let porkbunSecretKey = '';
    
    if (apiKey.includes(':')) {
      const [key, secret] = apiKey.split(':');
      porkbunApiKey = key;
      porkbunSecretKey = secret;
    }

    // Porkbun API call to list domains
    const porkbunUrl = 'https://porkbun.com/api/json/v3/domain/listAll';
    
    const requestBody = {
      apikey: porkbunApiKey,
      secretapikey: porkbunSecretKey
    };

    const response = await fetch(porkbunUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('Porkbun API error:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, error: `Porkbun API error: ${response.status}` },
        { status: response.status }
      );
    }

    const porkbunData = await response.json();
    
    if (porkbunData.status !== 'SUCCESS') {
      console.error('Porkbun API returned error:', porkbunData);
      return NextResponse.json(
        { success: false, error: porkbunData.message || 'Porkbun API error' },
        { status: 400 }
      );
    }

    // Extract domains from response
    const domains = porkbunData.domains || [];
    const domainsText = domains.map((domain: any) => {
      return `${domain.domain} | Expires: ${domain.expireDate} | Status: ${domain.status} | Auto-renew: ${domain.autoRenew ? 'Yes' : 'No'}`;
    }).join('\n');

    // Update the domains_glacier field in the host_account
    const { error: updateError } = await supabase
      .from('host_account')
      .update({ 
        domains_glacier: domainsText
      })
      .eq('id', host_account_id);

    if (updateError) {
      console.error('Error updating domains_glacier:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to save domains data' },
        { status: 500 }
      );
    }

    console.log(`Successfully fetched and saved ${domains.length} domains from Porkbun`);

    return NextResponse.json({
      success: true,
      domains: domains,
      domains_text: domainsText,
      count: domains.length
    });

  } catch (error) {
    console.error('Porkbun domain fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}