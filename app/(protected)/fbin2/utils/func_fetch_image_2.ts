import { ImageRecord } from '../panjar2/types';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 2. Get API key from tapikeys2 table
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('tapikeys2')
      .select('api_key')
      .order('created_at', { ascending: false })
      .limit(1);

    if (apiKeyError) {
      console.error('Supabase error:', apiKeyError);
      return {
        success: false,
        error: `Database error: ${apiKeyError.message}`
      };
    }

    if (!apiKeyData || apiKeyData.length === 0) {
      return {
        success: false,
        error: 'No API key found in tapikeys2 table'
      };
    }

    const apiKey = apiKeyData[0].api_key;
    if (!apiKey) {
      return {
        success: false,
        error: 'API key is empty in tapikeys2 table'
      };
    }

    // 3. Generate image with DALL-E
    const openai = new OpenAI({
      apiKey: apiKey
    });

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });

    if (!response.data?.[0]?.url) {
      return {
        success: false,
        error: 'Failed to generate image with DALL-E'
      };
    }

    const imageUrl = response.data[0].url;

    // 4. Download and upload to Supabase storage
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    
    const timestamp = new Date().getTime();
    const fileName = `image_${timestamp}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('images')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return {
        success: false,
        error: `Storage error: ${uploadError.message}`
      };
    }

    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabase
      .storage
      .from('images')
      .getPublicUrl(fileName);

    // 5. Create record in images table
    const { data: newImage, error: dbError } = await supabase
      .from('images')
      .insert({
        prompt1: prompt,
        function_used_to_fetch_the_image: 'func_fetch_image_2',
        img_file_url1: publicUrl,
        img_file_extension: 'png',
        img_file_size: imageBlob.size,
        width: 1024,
        height: 1024,
        status: 'completed'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return {
        success: false,
        error: `Database error: ${dbError.message}`
      };
    }

    return {
      success: true,
      image: newImage
    };

  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
} 