import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Prompt cannot be empty' },
        { status: 400 }
      );
    }

    // Initialize Supabase with auth context
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // First, get the user's ID from the users table
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (userError) {
      console.error('User lookup error:', userError);
      return NextResponse.json(
        { success: false, error: 'Failed to find user record' },
        { status: 500 }
      );
    }

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User record not found' },
        { status: 404 }
      );
    }

    // Get API key from api_keys_t1 table for this specific user
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys_t1')
      .select('key_value')
      .eq('fk_users_id', existingUser.id)
      .eq('key_type', 'openai')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (apiKeyError) {
      console.error('Supabase error:', apiKeyError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Database error: ${apiKeyError.message}`,
          debug: {
            error: apiKeyError,
            query: {
              table: 'api_keys_t1',
              filters: {
                fk_users_id: existingUser.id,
                key_type: 'openai',
                is_active: true
              }
            }
          }
        },
        { status: 500 }
      );
    }

    if (!apiKeyData || apiKeyData.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No active OpenAI API key found in api_keys_t1 table',
          debug: {
            query: {
              table: 'api_keys_t1',
              filters: {
                fk_users_id: existingUser.id,
                key_type: 'openai',
                is_active: true
              }
            },
            result: apiKeyData
          }
        },
        { status: 404 }
      );
    }

    const apiKey = apiKeyData[0].key_value;
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API key is empty in api_keys_t1 table',
          debug: {
            query: {
              table: 'api_keys_t1',
              filters: {
                fk_users_id: existingUser.id,
                key_type: 'openai',
                is_active: true
              }
            },
            result: apiKeyData
          }
        },
        { status: 400 }
      );
    }

    // Generate image with DALL-E
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
      return NextResponse.json(
        { success: false, error: 'Failed to generate image with DALL-E' },
        { status: 500 }
      );
    }

    const imageUrl = response.data[0].url;

    // Download and upload to Supabase storage
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
      return NextResponse.json(
        { success: false, error: `Storage error: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabase
      .storage
      .from('images')
      .getPublicUrl(fileName);

    // Create record in images table
    const { data: newImage, error: dbError } = await supabase
      .from('images')
      .insert({
        prompt1: prompt,
        function_used_to_fetch_the_image: 'sfunc_fetch_image_2',
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
      return NextResponse.json(
        { success: false, error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: newImage
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 