import { ImageRecord } from '../panjar2/types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface FetchImageResponse {
  success: boolean;
  error?: string;
  image?: ImageRecord;
}

export async function func_fetch_image_2(prompt: string): Promise<FetchImageResponse> {
  try {
    // 1. Prompt validation
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: 'Prompt cannot be empty'
      };
    }

    // 2. Check authentication
    const supabase = createClientComponentClient();
    console.log('Checking authentication...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session check result:', { session: !!session, error: sessionError });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return {
        success: false,
        error: `Authentication error: ${sessionError.message}`
      };
    }

    if (!session) {
      console.log('No session found');
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    console.log('User authenticated:', session.user.id);

    // 3. Call our server-side API endpoint
    const response = await fetch('/fbin2/api/sfunc_fetch_image_2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    console.log('Server response:', data);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to generate image'
      };
    }

    return data;

  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
} 