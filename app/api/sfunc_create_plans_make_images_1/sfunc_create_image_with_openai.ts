import OpenAI from 'openai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function sfunc_create_image_with_openai({ prompt, userId }: { prompt: string, userId: string }) {
  const supabase = createRouteHandlerClient({ cookies });
  // Get API key from tapikeys2 table for this specific user
  const { data: apiKeyData, error: apiKeyError } = await supabase
    .from('tapikeys2')
    .select('key_value')
    .eq('fk_users_id', userId)
    .eq('key_type', 'openai')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (apiKeyError) {
    return { success: false, error: 'Database error: ' + apiKeyError.message };
  }
  if (!apiKeyData || apiKeyData.length === 0) {
    return { success: false, error: 'No active OpenAI API key found in tapikeys2 table' };
  }
  const apiKey = apiKeyData[0].key_value;
  if (!apiKey) {
    return { success: false, error: 'OpenAI API key is empty in tapikeys2 table' };
  }

  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey });
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
    });
    if (!response.data || response.data.length === 0) {
      return { success: false, error: 'No image generated' };
    }
    return { success: true, url: response.data[0].url };
  } catch (error: any) {
    return { success: false, error: error?.message || 'OpenAI error' };
  }
} 