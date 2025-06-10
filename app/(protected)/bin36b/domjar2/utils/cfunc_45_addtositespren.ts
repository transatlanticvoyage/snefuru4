import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

export async function func_45_addtositespren(prenbaseLines: string[]) {
  const supabase = createClientComponentClient();
  const { user } = useAuth();

  console.log('Starting func_45_addtositespren with prenbaseLines:', prenbaseLines);

  if (!user?.id) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }

  try {
    // Get user's DB id from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return { success: false, message: 'Could not find user record.' };
    }

    console.log('User data retrieved:', userData);

    // Insert prenbase entries into sitespren table
    const { data, error } = await supabase
      .from('sitespren')
      .insert(
        prenbaseLines.map(prenbase => ({
          prenbase1: prenbase,
          fk_users_id: userData.id
        }))
      );

    if (error) {
      console.error('Error inserting data into sitespren:', error);
      return { success: false, message: error.message };
    }

    console.log('Data inserted successfully:', data);
    return { success: true, count: data ? (data as any[]).length : 0 };
  } catch (err) {
    console.error('Error in func_45_addtositespren:', err);
    return { success: false, message: err instanceof Error ? err.message : 'Unknown error' };
  }
} 