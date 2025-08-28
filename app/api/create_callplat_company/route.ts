import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_internal_id, cplatcompany_name, portal_url1, note1, note2, note3 } = body;

    if (!user_internal_id || !cplatcompany_name) {
      return NextResponse.json(
        { success: false, error: 'User internal ID and company name are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Creating new call platform company:', { user_internal_id, cplatcompany_name });

    // Insert new call platform company
    const { data: newCompany, error } = await supabase
      .from('callplat_companies')
      .insert([
        {
          cplatcompany_name: cplatcompany_name.trim(),
          portal_url1: portal_url1?.trim() || '',
          user_id: user_internal_id,
          note1: note1?.trim() || '',
          note2: note2?.trim() || '',
          note3: note3?.trim() || ''
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating call platform company:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create call platform company' },
        { status: 500 }
      );
    }

    console.log('Call platform company created successfully:', newCompany);

    return NextResponse.json({
      success: true,
      data: newCompany
    });

  } catch (error) {
    console.error('Create call platform company error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}