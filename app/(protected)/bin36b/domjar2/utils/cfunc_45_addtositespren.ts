import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

export async function func_45_addtositespren(prenbaseLines: string[]) {
  const supabase = createClientComponentClient();
  const { user } = useAuth();

  if (!user?.id) {
    return { success: false, message: 'User not authenticated' };
  }

  try {
    const response = await fetch('/api/bin36b/domjar2/sfunc_45_addtositespren', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prenbaseLines }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error in func_45_addtositespren:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
} 