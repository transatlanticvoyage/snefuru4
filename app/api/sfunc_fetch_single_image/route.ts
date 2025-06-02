import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required' 
      }, { status: 401 });
    }

    // Get request data
    const { plan_id, image_slot, prompt, aiModel } = await request.json();
    
    if (!plan_id || !image_slot || !prompt) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: plan_id, image_slot, prompt' 
      }, { status: 400 });
    }

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found in database' 
      }, { status: 404 });
    }

    // Verify the plan belongs to this user
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('id, fk_image1_id, fk_image2_id, fk_image3_id, fk_image4_id')
      .eq('id', plan_id)
      .eq('rel_users_id', userData.id)
      .single();

    if (planError || !planData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Plan not found or access denied' 
      }, { status: 404 });
    }

    // Check if image already exists for this slot (with proper typing)
    const imageField = image_slot === 1 ? planData.fk_image1_id :
                      image_slot === 2 ? planData.fk_image2_id :
                      image_slot === 3 ? planData.fk_image3_id :
                      image_slot === 4 ? planData.fk_image4_id : null;
                      
    if (imageField) {
      return NextResponse.json({ 
        success: false, 
        message: `Image already exists for slot ${image_slot}` 
      }, { status: 400 });
    }

    // Generate a single image using OpenAI
    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'OpenAI API key not configured' 
      }, { status: 500 });
    }

    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiModel || 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url'
      }),
    });

    if (!imageResponse.ok) {
      const error = await imageResponse.text();
      return NextResponse.json({ 
        success: false, 
        message: `OpenAI API error: ${error}` 
      }, { status: 500 });
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.data[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ 
        success: false, 
        message: 'No image URL returned from OpenAI' 
      }, { status: 500 });
    }

    // Create image record in database
    const { data: newImage, error: imageError } = await supabase
      .from('images')
      .insert({
        rel_users_id: userData.id,
        img_file_url1: imageUrl,
        e_prompt1: prompt,
        e_image_generator1: aiModel || 'dall-e-3'
      })
      .select()
      .single();

    if (imageError || !newImage) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to save image to database' 
      }, { status: 500 });
    }

    // Update the plan with the new image
    const updateField = image_slot === 1 ? 'fk_image1_id' :
                       image_slot === 2 ? 'fk_image2_id' :
                       image_slot === 3 ? 'fk_image3_id' :
                       'fk_image4_id';

    const { error: updateError } = await supabase
      .from('plans')
      .update({ [updateField]: newImage.id })
      .eq('id', plan_id);

    if (updateError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update plan with new image' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Image ${image_slot} generated successfully`,
      image_id: newImage.id,
      image_url: imageUrl
    });

  } catch (error) {
    console.error('Error in sfunc_fetch_single_image:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 