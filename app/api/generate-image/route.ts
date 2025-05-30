import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getUserApiKey } from '@/lib/api-keys';
import OpenAI from 'openai';
import fetch from 'node-fetch';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { prompt, imageId: id } = await request.json();
    console.log('Received request with imageId:', id);

    // Get the image record to find the user
    const { data: imageData, error: imageError } = await supabase
      .from('images')
      .select('rel_users_id')
      .eq('id', id)
      .single();

    if (imageError) {
      throw new Error(`Failed to fetch image data: ${imageError.message}`);
    }

    if (!imageData?.rel_users_id) {
      throw new Error('Image record is missing user ID');
    }

    // Get the user's OpenAI API key
    const apiKey = await getUserApiKey(imageData.rel_users_id, 'openai');
    if (!apiKey) {
      throw new Error('Please add your OpenAI API key in the API Keys page before generating images.');
    }

    // Initialize OpenAI with user's API key
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Generate image using OpenAI
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    if (!response.data?.[0]?.url) {
      throw new Error('No image URL in response');
    }

    const imageUrl = response.data[0].url;

    // Download the image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    // Upload to Supabase Storage
    const fileName = `${id}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bucket-images-b1')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload image to storage: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('bucket-images-b1')
      .getPublicUrl(fileName);

    // Update the database record
    const { error: updateError } = await supabase
      .from('images')
      .update({
        img_file_url1: publicUrl,
        status: 'completed'
      })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Failed to update image record: ${updateError.message}`);
    }

    return NextResponse.json({ success: true, imageUrl: publicUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
} 