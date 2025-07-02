import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bakli_id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const resolvedParams = await params;
    const bakliId = resolvedParams.bakli_id;

    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user's internal ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (!userData) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Fetch the bakli_mockup CSS content
    const { data: mockup, error } = await supabase
      .from('bakli_mockups')
      .select('bakli_css')
      .eq('bakli_id', bakliId)
      .eq('fk_user_id', userData.id)
      .single();

    if (error || !mockup) {
      return new NextResponse('Mockup not found', { status: 404 });
    }

    // Return the CSS content with proper content-type header
    return new NextResponse(mockup.bakli_css || '/* No CSS content */', {
      status: 200,
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error serving bakli CSS:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}