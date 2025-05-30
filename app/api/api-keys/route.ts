import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Fetch user's API keys
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST: Add or update an API key
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyType, keyValue } = await request.json();

    // First, deactivate any existing keys of the same type
    const { error: deactivateError } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('user_id', session.user.id)
      .eq('key_type', keyType);

    if (deactivateError) {
      throw deactivateError;
    }

    // Then create the new key
    const { error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id: session.user.id,
        key_type: keyType,
        key_value: keyValue,
        is_active: true
      });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving API key:', error);
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    );
  }
}

// DELETE: Deactivate an API key
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyType } = await request.json();

    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('user_id', session.user.id)
      .eq('key_type', keyType);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
} 