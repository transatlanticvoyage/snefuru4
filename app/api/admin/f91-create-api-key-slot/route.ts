import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Not logged in' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('auth_id', session.user.id)
      .single();
    
    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.slot_name) {
      return NextResponse.json(
        { error: 'Slot name is required' },
        { status: 400 }
      );
    }
    
    // Prepare data for insertion
    const insertData = {
      slot_name: body.slot_name,
      m1name: body.m1name || null,
      m1inuse: body.m1inuse || false,
      m2name: body.m2name || null,
      m2inuse: body.m2inuse || false,
      m3name: body.m3name || null,
      m3inuse: body.m3inuse || false,
      fk_iservices_provider_id: body.fk_iservices_provider_id || null,
      slot_publicly_shown: body.slot_publicly_shown || false,
      fk_ai_model_id: body.fk_ai_model_id || null,
      is_ai_model: body.is_ai_model || false
    };
    
    // Insert new API key slot
    const { data, error } = await supabase
      .from('api_key_slots')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating API key slot:', error);
      return NextResponse.json(
        { error: 'Failed to create API key slot', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: data,
      message: 'API key slot created successfully'
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}