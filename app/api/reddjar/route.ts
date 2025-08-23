import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from('redditurlsvat')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reddit urls:', error);
      return NextResponse.json({ error: 'Failed to fetch reddit urls' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    const { data, error } = await supabase
      .from('redditurlsvat')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating reddit url:', error);
      return NextResponse.json({ error: 'Failed to create reddit url' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { url_id, ...updateData } = body;

    const { data, error } = await supabase
      .from('redditurlsvat')
      .update(updateData)
      .eq('url_id', url_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reddit url:', error);
      return NextResponse.json({ error: 'Failed to update reddit url' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}