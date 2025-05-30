import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  let imageId: number | undefined;
  
  try {
    const { prompt, imageId: id } = await request.json();
    imageId = id;

    if (!prompt || !imageId) {
      return NextResponse.json(
        { error: 'Prompt and imageId are required' },
        { status: 400 }
      );
    }

    // Generate image using DALL-E
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    if (!response.data?.[0]?.url) {
      throw new Error('No image URL returned from OpenAI');
    }

    const imageUrl = response.data[0].url;

    // Update the image record in the database
    const { error: updateError } = await supabase
      .from('images')
      .update({
        image_url: imageUrl,
        status: 'completed'
      })
      .eq('id', imageId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    
    // Update the image record to mark it as failed
    if (error instanceof Error && imageId) {
      const { error: updateError } = await supabase
        .from('images')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', imageId);

      if (updateError) {
        console.error('Error updating failed status:', updateError);
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 