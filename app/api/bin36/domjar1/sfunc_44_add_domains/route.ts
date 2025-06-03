import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const { domains } = await req.json();
    
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid domains data provided' },
        { status: 400 }
      );
    }

    // Get user's DB id from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();
      
    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User record not found' },
        { status: 404 }
      );
    }

    // Validate domains (basic validation)
    const validDomains = domains.filter(domain => {
      const trimmed = domain.trim();
      return trimmed.length > 0 && trimmed.length <= 255; // Basic length check
    });

    if (validDomains.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid domains found' },
        { status: 400 }
      );
    }

    // Prepare domain records for insertion
    const domainRecords = validDomains.map(domain => ({
      domain_base: domain.trim(),
      fk_user_id: userData.id,
      note1: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insert domains into the database
    const { data, error: insertError } = await supabase
      .from('domains1')
      .insert(domainRecords)
      .select();
      
    if (insertError) {
      console.error('Database insertion error:', insertError);
      return NextResponse.json(
        { success: false, message: `Database error: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${validDomains.length} domains`,
      count: validDomains.length,
      data: data
    });

  } catch (error) {
    console.error('Error in sfunc_44_add_domains:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 