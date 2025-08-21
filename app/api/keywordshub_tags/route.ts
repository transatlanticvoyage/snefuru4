import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userInternalId = searchParams.get('user_internal_id');

    if (!userInternalId) {
      return NextResponse.json({ error: 'User internal ID is required' }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // Fetch keywordshub_tags for the user
    const { data: tags, error } = await supabase
      .from('keywordshub_tags')
      .select('*')
      .eq('user_id', userInternalId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching keywordshub_tags:', error);
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }

    return NextResponse.json({ tags });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_internal_id, ...tagData } = body;

    if (!user_internal_id) {
      return NextResponse.json({ error: 'User internal ID is required' }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // Create new tag
    const { data: newTag, error } = await supabase
      .from('keywordshub_tags')
      .insert([{
        ...tagData,
        user_id: user_internal_id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating keywordshub_tag:', error);
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
    }

    return NextResponse.json({ tag: newTag });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tag_id, user_internal_id, ...updateData } = body;

    if (!tag_id || !user_internal_id) {
      return NextResponse.json({ error: 'Tag ID and User internal ID are required' }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // Update the tag (ensure it belongs to the user)
    const { data: updatedTag, error } = await supabase
      .from('keywordshub_tags')
      .update(updateData)
      .eq('tag_id', tag_id)
      .eq('user_id', user_internal_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating keywordshub_tag:', error);
      return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
    }

    return NextResponse.json({ tag: updatedTag });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tag_id');
    const userInternalId = searchParams.get('user_internal_id');

    if (!tagId || !userInternalId) {
      return NextResponse.json({ error: 'Tag ID and User internal ID are required' }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // Delete the tag (ensure it belongs to the user)
    const { error } = await supabase
      .from('keywordshub_tags')
      .delete()
      .eq('tag_id', tagId)
      .eq('user_id', userInternalId);

    if (error) {
      console.error('Error deleting keywordshub_tag:', error);
      return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}