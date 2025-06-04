import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function func_71_add_sites(sites: string[]) {
  try {
    // Get the current session token
    const supabase = createClientComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session found');
    }

    const response = await fetch('/api/bin45/weplich1/sfunc_71_add_sites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ sites }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error in func_71_add_sites:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 