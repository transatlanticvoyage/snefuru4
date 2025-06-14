import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the request body
    const { user_internal_id } = await request.json();

    if (!user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'User internal ID is required' },
        { status: 400 }
      );
    }

    console.log('Creating new host company for user ID:', user_internal_id);

    // Create a new host company record with minimal data
    const newHostCompany = {
      fk_user_id: user_internal_id,
      name: null,
      portal_url1: null,
      notes1: null,
      notes2: null,
      notes3: null
    };

    const { data: createdRecord, error: createError } = await supabase
      .from('host_company')
      .insert(newHostCompany)
      .select()
      .single();

    if (createError) {
      console.error('Error creating host company:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create host company record' },
        { status: 500 }
      );
    }

    console.log('Successfully created host company:', createdRecord.id);

    return NextResponse.json({
      success: true,
      data: createdRecord,
      message: 'Host company created successfully'
    });

  } catch (error) {
    console.error('f18_createhostcompany API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}