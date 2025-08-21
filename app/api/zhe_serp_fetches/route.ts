import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;

    // Fetch all serp fetches with related keyword data
    const { data: fetches, error } = await supabase
      .from('zhe_serp_fetches')
      .select(`
        *,
        keywordshub:rel_keyword_id (
          keyword_datum,
          location_code,
          language_code,
          location_display_name,
          language_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching zhe_serp_fetches:', error);
      return NextResponse.json({ error: 'Failed to fetch fetches' }, { status: 500 });
    }

    return NextResponse.json({ fetches });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const supabase = supabaseAdmin;

    // Create new fetch
    const { data: newFetch, error } = await supabase
      .from('zhe_serp_fetches')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating zhe_serp_fetch:', error);
      return NextResponse.json({ error: 'Failed to create fetch' }, { status: 500 });
    }

    return NextResponse.json({ fetch: newFetch });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { fetch_id, ...updateData } = body;

    if (!fetch_id) {
      return NextResponse.json({ error: 'Fetch ID is required' }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // Update the fetch
    const { data: updatedFetch, error } = await supabase
      .from('zhe_serp_fetches')
      .update(updateData)
      .eq('fetch_id', fetch_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating zhe_serp_fetch:', error);
      return NextResponse.json({ error: 'Failed to update fetch' }, { status: 500 });
    }

    return NextResponse.json({ fetch: updatedFetch });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fetchId = searchParams.get('fetch_id');

    if (!fetchId) {
      return NextResponse.json({ error: 'Fetch ID is required' }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // Delete the fetch
    const { error } = await supabase
      .from('zhe_serp_fetches')
      .delete()
      .eq('fetch_id', fetchId);

    if (error) {
      console.error('Error deleting zhe_serp_fetch:', error);
      return NextResponse.json({ error: 'Failed to delete fetch' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}