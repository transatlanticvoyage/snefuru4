import OpenAI from 'openai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function sfunc_create_image_with_openai({ prompt, userId, batchFolder, fileName }: { prompt: string, userId: string, batchFolder: string, fileName?: string }) {
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
    const imageUrl = response.data[0].url;
    if (!imageUrl || typeof imageUrl !== 'string') {
      return { success: false, error: 'OpenAI did not return a valid image URL' };
    }
    // Download the image as a buffer
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return { success: false, error: 'Failed to download image from OpenAI' };
    }
    const imageBuffer = await imageRes.arrayBuffer();
    // Use provided fileName or fallback to timestamp
    let safeFileName = fileName && typeof fileName === 'string' && fileName.trim() ? fileName.trim() : `image_${Date.now()}.png`;
    // Ensure the filename is safe (no path traversal)
    safeFileName = safeFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `barge1/${batchFolder}/${safeFileName}`;
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bucket-images-b1')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });
    if (uploadError) {
      return { success: false, error: 'Supabase Storage upload error: ' + uploadError.message };
    }
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('bucket-images-b1')
      .getPublicUrl(storagePath);
    return { success: true, url: publicUrlData.publicUrl };
  } catch (error: any) {
    return { success: false, error: error?.message || 'OpenAI error' };
  }
} 