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

    // Get the host account with company information
    const { data: hostAccount, error: hostError } = await supabase
      .from('host_account')
      .select(`
        *,
        host_company:fk_host_company_id (
          id,
          name,
          portal_url1
        )
      `)
      .eq('id', host_account_id)
      .single();

    if (hostError || !hostAccount) {
      console.error('Error fetching host account:', hostError);
      return NextResponse.json(
        { success: false, error: 'Host account not found' },
        { status: 404 }
      );
    }

    const companyName = hostAccount.host_company?.name?.toLowerCase() || '';
    console.log('Determining registrar from company name:', companyName);

    // Determine which registrar API to use based on company name
    let registrarEndpoint = '';
    
    if (companyName.includes('dynadot')) {
      registrarEndpoint = '/api/fetch-domains/dynadot';
    } else if (companyName.includes('porkbun')) {
      registrarEndpoint = '/api/fetch-domains/porkbun';
    } else if (companyName.includes('godaddy')) {
      // TODO: Implement GoDaddy API
      return NextResponse.json(
        { success: false, error: 'GoDaddy API not yet implemented' },
        { status: 501 }
      );
    } else if (companyName.includes('namecheap')) {
      // TODO: Implement Namecheap API
      return NextResponse.json(
        { success: false, error: 'Namecheap API not yet implemented' },
        { status: 501 }
      );
    } else if (companyName.includes('namesilo')) {
      // TODO: Implement NameSilo API
      return NextResponse.json(
        { success: false, error: 'NameSilo API not yet implemented' },
        { status: 501 }
      );
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: `Unknown registrar: ${companyName}. Supported registrars: dynadot, porkbun` 
        },
        { status: 400 }
      );
    }

    // Call the appropriate registrar-specific endpoint
    const baseUrl = request.nextUrl.origin;
    const registrarResponse = await fetch(`${baseUrl}${registrarEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ host_account_id })
    });

    const registrarData = await registrarResponse.json();
    
    if (!registrarData.success) {
      return NextResponse.json(registrarData, { status: registrarResponse.status });
    }

    return NextResponse.json({
      success: true,
      registrar: companyName,
      ...registrarData
    });

  } catch (error) {
    console.error('Domain fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}