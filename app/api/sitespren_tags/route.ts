import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userInternalId = searchParams.get('user_internal_id');

    if (!userInternalId) {
      return NextResponse.json(
        { success: false, error: 'User internal ID is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user's tags
    const { data: tags, error } = await supabase
      .from('sitespren_tags')
      .select('*')
      .eq('fk_user_id', userInternalId)
      .order('tag_order', { ascending: true });

    if (error) {
      console.error('Error fetching tags:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tags' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tags || []
    });

  } catch (error) {
    console.error('Error in sitespren_tags GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tag_name, tag_order, user_internal_id } = body;

    if (!tag_name || !user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'Tag name and user internal ID are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create new tag
    const { data: newTag, error } = await supabase
      .from('sitespren_tags')
      .insert({
        tag_name,
        tag_order: tag_order || 0,
        fk_user_id: user_internal_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newTag,
      message: 'Tag created successfully'
    });

  } catch (error) {
    console.error('Error in sitespren_tags POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tag_id, tag_name, tag_order, user_internal_id } = body;

    if (!tag_id || !user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'Tag ID and user internal ID are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Update tag
    const updateData: any = {};
    if (tag_name !== undefined) updateData.tag_name = tag_name;
    if (tag_order !== undefined) updateData.tag_order = tag_order;

    const { data: updatedTag, error } = await supabase
      .from('sitespren_tags')
      .update(updateData)
      .eq('tag_id', tag_id)
      .eq('fk_user_id', user_internal_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tag:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTag,
      message: 'Tag updated successfully'
    });

  } catch (error) {
    console.error('Error in sitespren_tags PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { tag_id, user_internal_id } = body;

    if (!tag_id || !user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'Tag ID and user internal ID are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Delete tag (relations will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('sitespren_tags')
      .delete()
      .eq('tag_id', tag_id)
      .eq('fk_user_id', user_internal_id);

    if (error) {
      console.error('Error deleting tag:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully'
    });

  } catch (error) {
    console.error('Error in sitespren_tags DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}