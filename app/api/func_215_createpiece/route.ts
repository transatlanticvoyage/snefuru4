import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientComponentClient();
    
    // Get the request body
    const { auth_user_id } = await request.json();
    
    if (!auth_user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First, get the internal user ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', auth_user_id)
      .single();

    if (userError || !userData) {
      console.error('Error finding user:', userError);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Create new gcon_pieces record
    const { data: newPiece, error: createError } = await supabase
      .from('gcon_pieces')
      .insert({
        fk_users_id: userData.id,
        meta_title: null,
        h1title: null,
        pgb_h1title: null,
        corpus1: null,
        corpus2: null,
        asn_sitespren_base: null,
        asn_nwpi_posts_id: null,
        image_pack1: null
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating gcon_piece:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create content piece' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newPiece.id,
        message: 'Content piece created successfully'
      }
    });

  } catch (error) {
    console.error('func_215_createpiece API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}