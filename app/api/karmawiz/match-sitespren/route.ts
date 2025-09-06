import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface SitesprenMatch {
  id: string;
  sitespren_base: string;
  driggs_brand_name?: string;
  driggs_city?: string;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's internal ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { domainBase } = await request.json();

    if (!domainBase || typeof domainBase !== 'string') {
      return NextResponse.json({ error: 'Domain base is required' }, { status: 400 });
    }

    // Search for matching sitespren records
    const { data: sitesprenMatches, error: sitesprenError } = await supabase
      .from('sitespren')
      .select('id, sitespren_base, driggs_brand_name, driggs_city, created_at')
      .eq('fk_users_id', userData.id)
      .eq('sitespren_base', domainBase);

    if (sitesprenError) {
      console.error('Error searching sitespren:', sitesprenError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      matches: sitesprenMatches || [],
      totalMatches: (sitesprenMatches || []).length
    });

  } catch (error) {
    console.error('Error in sitespren matching:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}