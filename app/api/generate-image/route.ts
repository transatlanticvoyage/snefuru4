import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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

    if (imageError || !imageData) {
      console.error('Error fetching image record:', imageError);
      return NextResponse.json(
        { error: 'Failed to fetch image record' },
        { status: 500 }
      );
    }

    const userId = imageData.rel_users_id;
    if (!userId) {
      return NextResponse.json(
        { error: 'No user ID associated with this image' },
        { status: 400 }
      );
    }

    // Get the user's API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('user_id', userId)
      .eq('key_type', 'openai')
      .eq('is_active', true)
      .single();

    if (apiKeyError || !apiKeyData) {
      console.error('Error fetching API key:', apiKeyError);
      return NextResponse.json(
        { error: 'Please add your OpenAI API key in the API Keys page before generating images.' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKeyData.key_value,
    });

    // Generate the image
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    if (!response?.data?.[0]?.url) {
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
      console.error('Error uploading to storage:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image to storage' },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('bucket-images-b1')
      .getPublicUrl(fileName);

    // Update the database record
    const { error: updateError } = await supabase
      .from('images')
      .update({
        image_url: publicUrl,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating image record:', updateError);
      return NextResponse.json(
        { error: 'Failed to update image record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, imageUrl: publicUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while generating the image' },
      { status: 500 }
    );
  }
} 