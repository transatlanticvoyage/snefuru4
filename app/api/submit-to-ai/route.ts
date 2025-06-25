import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { slot_id, prompt, gcon_piece_id } = await request.json();

    if (!slot_id || !prompt || !gcon_piece_id) {
      return NextResponse.json(
        { success: false, error: 'slot_id, prompt, and gcon_piece_id are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User record not found' },
        { status: 404 }
      );
    }

    console.log(`🤖 AI Submission: Starting for slot ${slot_id}, user ${userData.id}, piece ${gcon_piece_id}`);

    // Verify user owns the gcon_piece
    const { data: pieceData, error: pieceError } = await supabase
      .from('gcon_pieces')
      .select('id')
      .eq('id', gcon_piece_id)
      .eq('fk_users_id', userData.id)
      .single();

    if (pieceError || !pieceData) {
      return NextResponse.json(
        { success: false, error: 'Content piece not found or access denied' },
        { status: 404 }
      );
    }

    // Get slot information
    const { data: slotData, error: slotError } = await supabase
      .from('api_key_slots')
      .select('slot_name, test_endpoint_url, test_method')
      .eq('slot_id', slot_id)
      .single();

    if (slotError || !slotData) {
      return NextResponse.json(
        { success: false, error: 'API key slot not found' },
        { status: 404 }
      );
    }

    // Get user's API key for this slot
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys_t3')
      .select('m1datum, m2datum, m3datum')
      .eq('fk_user_id', userData.id)
      .eq('fk_slot_id', slot_id)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json(
        { success: false, error: 'No API key found for this slot' },
        { status: 404 }
      );
    }

    // Find the first available API key
    let apiKey = '';
    if (keyData.m1datum) apiKey = keyData.m1datum;
    else if (keyData.m2datum) apiKey = keyData.m2datum;
    else if (keyData.m3datum) apiKey = keyData.m3datum;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'No API key value found' },
        { status: 400 }
      );
    }

    console.log(`🔑 Found API key for ${slotData.slot_name}, making AI request`);

    // Make AI request based on provider
    let aiResponse;
    try {
      aiResponse = await makeAIRequest(slotData.slot_name, slotData.test_endpoint_url, apiKey, prompt);
    } catch (error) {
      console.error(`❌ AI request failed for ${slotData.slot_name}:`, error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'AI request failed'
      }, { status: 500 });
    }

    console.log(`✅ AI request successful for ${slotData.slot_name}`);

    return NextResponse.json({
      success: true,
      ai_response: aiResponse,
      model_used: slotData.slot_name
    });

  } catch (error) {
    console.error('Submit to AI route error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

async function makeAIRequest(slotName: string, endpointUrl: string | null, apiKey: string, prompt: string) {
  if (!endpointUrl) {
    throw new Error('No API endpoint configured for this provider');
  }

  const lowerSlotName = slotName.toLowerCase();
  let url = endpointUrl;
  let headers: Record<string, string> = {};
  let body: any = null;

  // Configure request based on provider
  if (lowerSlotName.includes('openai')) {
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    body = JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    });
  } else if (lowerSlotName.includes('claude') || lowerSlotName.includes('anthropic')) {
    headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    };
    body = JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });
  } else if (lowerSlotName.includes('gemini') || lowerSlotName.includes('google')) {
    // Google uses query parameter for API key
    url = `${endpointUrl}?key=${apiKey}`;
    headers = {
      'Content-Type': 'application/json'
    };
    body = JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    });
  } else if (lowerSlotName.includes('perplexity')) {
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    body = JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    });
  } else {
    // Default to OpenAI-compatible format
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    body = JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    });
  }

  console.log(`🌐 Making AI request to ${url} for ${slotName}`);

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for AI requests

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    
    // Extract response text based on provider
    if (lowerSlotName.includes('openai')) {
      return responseData.choices?.[0]?.message?.content || 'No response content';
    } else if (lowerSlotName.includes('claude') || lowerSlotName.includes('anthropic')) {
      return responseData.content?.[0]?.text || 'No response content';
    } else if (lowerSlotName.includes('gemini') || lowerSlotName.includes('google')) {
      return responseData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response content';
    } else if (lowerSlotName.includes('perplexity')) {
      return responseData.choices?.[0]?.message?.content || 'No response content';
    } else {
      // Default to OpenAI format
      return responseData.choices?.[0]?.message?.content || 'No response content';
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI request timeout after 30 seconds');
    }
    throw error;
  }
}