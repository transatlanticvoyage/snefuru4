import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get auth_id from query params
    const { searchParams } = new URL(request.url);
    const authId = searchParams.get('auth_id');

    if (!authId) {
      return NextResponse.json(
        { success: false, error: 'Auth ID is required' },
        { status: 400 }
      );
    }

    // Get the internal user ID
    const { data: userData, error } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (error || !userData) {
      console.error('Error finding user:', error);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        internal_id: userData.id
      }
    });

  } catch (error) {
    console.error('get_user_internal_id API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}