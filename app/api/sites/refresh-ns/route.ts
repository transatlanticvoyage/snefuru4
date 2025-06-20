import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { promisify } from 'util';
import { resolve } from 'dns';

const resolveTxt = promisify(resolve);

export async function POST(request: NextRequest) {
  try {
    const { siteId, domain } = await request.json();

    if (!siteId || !domain) {
      return NextResponse.json({ 
        success: false, 
        error: 'Site ID and domain are required' 
      }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get internal user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Verify user owns this site
    const { data: siteData, error: siteError } = await supabase
      .from('sitespren')
      .select('id, sitespren_base')
      .eq('id', siteId)
      .eq('fk_users_id', userData.id)
      .single();

    if (siteError || !siteData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Site not found or access denied' 
      }, { status: 404 });
    }

    let nsResult = null;

    try {
      // Perform DNS NS lookup
      const nsRecords = await resolveTxt(domain, 'NS');
      nsResult = nsRecords.join(', ');
    } catch (dnsError) {
      console.error('DNS lookup error:', dnsError);
      nsResult = 'DNS lookup failed';
    }

    // Update the database with new NS information
    const { error: updateError } = await supabase
      .from('sitespren')
      .update({ 
        ns_full: nsResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', siteId)
      .eq('fk_users_id', userData.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update database' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ns_full: nsResult
      }
    });

  } catch (error) {
    console.error('Error in refresh-ns API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}