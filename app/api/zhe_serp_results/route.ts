import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;

    // Fetch all serp results
    const { data: results, error } = await supabase
      .from('zhe_serp_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching zhe_serp_results:', error);
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }

    return NextResponse.json({ results });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const supabase = supabaseAdmin;

    // Create new result
    const { data: newResult, error } = await supabase
      .from('zhe_serp_results')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating zhe_serp_result:', error);
      return NextResponse.json({ error: 'Failed to create result' }, { status: 500 });
    }

    return NextResponse.json({ result: newResult });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { result_id, ...updateData } = body;

    if (!result_id) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // Update the result
    const { data: updatedResult, error } = await supabase
      .from('zhe_serp_results')
      .update(updateData)
      .eq('result_id', result_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating zhe_serp_result:', error);
      return NextResponse.json({ error: 'Failed to update result' }, { status: 500 });
    }

    return NextResponse.json({ result: updatedResult });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get('result_id');

    if (!resultId) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // Delete the result
    const { error } = await supabase
      .from('zhe_serp_results')
      .delete()
      .eq('result_id', resultId);

    if (error) {
      console.error('Error deleting zhe_serp_result:', error);
      return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}