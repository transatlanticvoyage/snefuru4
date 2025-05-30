import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: Request) {
  let imageId: number | undefined;
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.');
    }

    const { prompt, imageId: id } = await request.json();
    imageId = id;

    if (!prompt || !imageId) {
      return NextResponse.json(
        { error: 'Prompt and imageId are required' },
        { status: 400 }
      );
    }

    console.log('Generating image for prompt:', prompt);

    // Generate image using DALL-E
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    console.log('OpenAI response:', response);

    if (!response.data?.[0]?.url) {
      throw new Error('No image URL returned from OpenAI');
    }

    const imageUrl = response.data[0].url;
    console.log('Generated image URL:', imageUrl);

    // Update the image record in the database
    const { error: updateError } = await supabase
      .from('images')
      .update({
        image_url: imageUrl,
        status: 'completed'
      })
      .eq('id', imageId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update image record: ${updateError.message}`);
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    
    // Update the image record to mark it as failed
    if (error instanceof Error && imageId) {
      try {
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
      } catch (updateError) {
        console.error('Error updating failed status:', updateError);
      }
    }

    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred while generating the image';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 