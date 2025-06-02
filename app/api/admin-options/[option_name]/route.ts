import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ option_name: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { option_name } = await context.params;

    // Fetch the admin option by name
    const { data: adminOption, error } = await supabase
      .from('admin_options')
      .select('*')
      .eq('option_name', option_name)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch admin option' },
        { status: 500 }
      );
    }

    if (!adminOption) {
      return NextResponse.json(
        { success: false, message: 'Admin option not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: adminOption
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 