import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('filegun_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching filegun_files:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Remove file_id if it's null or undefined (let database auto-generate)
    if (!body.file_id) {
      delete body.file_id;
    }

    const { data, error } = await supabase
      .from('filegun_files')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating filegun_file:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { file_id, ...updateData } = body;

    if (!file_id) {
      return NextResponse.json({ error: 'file_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('filegun_files')
      .update(updateData)
      .eq('file_id', file_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating filegun_file:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const file_id = searchParams.get('file_id');

    if (!file_id) {
      return NextResponse.json({ error: 'file_id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('filegun_files')
      .delete()
      .eq('file_id', file_id);

    if (error) {
      console.error('Error deleting filegun_file:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}