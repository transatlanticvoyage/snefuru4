import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { siteId, fieldKey, checked } = await request.json();

    if (!siteId || !fieldKey || checked === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // First, check if record exists
    const { data: existingData, error: checkError } = await supabase
      .from('sitespren_exclude_from_wp')
      .select('id')
      .eq('id', siteId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing record:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!existingData) {
      // Create record if it doesn't exist
      const { error: insertError } = await supabase
        .from('sitespren_exclude_from_wp')
        .insert({ id: siteId, [fieldKey]: checked });

      if (insertError) {
        console.error('Error creating record:', insertError);
        return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
      }
    } else {
      // Update existing record
      const { error: updateError } = await supabase
        .from('sitespren_exclude_from_wp')
        .update({ [fieldKey]: checked })
        .eq('id', siteId);

      if (updateError) {
        console.error('Error updating record:', updateError);
        return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Missing siteId parameter' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from('sitespren_exclude_from_wp')
      .select('*')
      .eq('id', siteId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching data:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ data: data || {} });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}