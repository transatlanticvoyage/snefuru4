import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';
import fetch from 'node-fetch';

export async function POST(request: Request) {
  try {
    const { prompt, imageId: id } = await request.json();
    console.log('Received request with imageId:', id);

    // Get the user's API key
    const { data: imageData, error: imageError } = await supabaseAdmin
      .from('images')
      .select('rel_users_id')
      .eq('id', id)
      .single();

    console.log('Image data:', imageData);
    console.log('Image error:', imageError);

    if (imageError) {
      console.error('Image fetch error details:', {
        code: imageError.code,
        message: imageError.message,
        details: imageError.details
      });
      throw new Error(`Failed to fetch image data: ${imageError.message}`);
    }

    if (!imageData?.rel_users_id) {
      console.error('No rel_users_id found in image data:', imageData);
      throw new Error('Image record is missing user ID');
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('openai_api_key')
      .eq('id', imageData.rel_users_id)
      .single();

    console.log('User data:', userData);
    console.log('User error:', userError);

    if (userError) {
      console.error('User fetch error details:', {
        code: userError.code,
        message: userError.message,
        details: userError.details
      });
      throw new Error(`Failed to fetch user data: ${userError.message}`);
    }

    if (!userData?.openai_api_key) {
      throw new Error('OpenAI API key not configured. Please add your API key in the API Keys page.');
    }

    // Initialize OpenAI with user's API key
    const openai = new OpenAI({
      apiKey: userData.openai_api_key,
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
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('bucket-images-b1')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload image to storage: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('bucket-images-b1')
      .getPublicUrl(fileName);

    // Update the database record
    const { error: updateError } = await supabaseAdmin
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