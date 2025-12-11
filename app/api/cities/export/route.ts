import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all cities data sorted by population (largest to smallest)
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .order('city_population', { ascending: false });

    if (error) {
      console.error('Error fetching cities:', error);
      return NextResponse.json({ error: 'Failed to fetch cities data' }, { status: 500 });
    }

    return NextResponse.json({ cities });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}