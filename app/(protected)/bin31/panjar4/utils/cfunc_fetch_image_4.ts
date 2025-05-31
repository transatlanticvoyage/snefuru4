import { ImageRecord } from '../types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface FetchImageResponse {
  success: boolean;
  error?: string;
  image?: ImageRecord;
  debug?: any;
}

export async function func_fetch_image_4(prompt: string): Promise<FetchImageResponse> {
  try {
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: 'Prompt cannot be empty'
      };
    }

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

    const response = await fetch('/bin31/panjar4/api/sfunc_fetch_image_4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error('Server error:', errorData);
      return {
        success: false,
        error: errorData.error || `Server error: ${response.status}`,
        debug: errorData.debug
      };
    }

    const data = await response.json();
    console.log('Server response:', data);

    return data;

  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
} 