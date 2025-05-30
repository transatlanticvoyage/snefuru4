import { supabaseAdmin } from './supabase-admin';

export async function getUserApiKey(userId: string, keyType: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('key_value')
      .eq('user_id', userId)
      .eq('key_type', keyType)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching API key:', error);
      return null;
    }

    return data?.key_value || null;
  } catch (error) {
    console.error('Error in getUserApiKey:', error);
    return null;
  }
} 