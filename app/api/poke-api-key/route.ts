import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { slot_id } = await request.json();

    if (!slot_id) {
      return NextResponse.json(
        { success: false, error: 'slot_id is required' },
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

    console.log(`🔍 Poke API: Starting poke for slot ${slot_id}, user ${userData.id}`);

    // Get slot information
    const { data: slotData, error: slotError } = await supabase
      .from('api_key_slots')
      .select('slot_name, test_endpoint_url, test_method, m1platcodehandle, m2platcodehandle, m3platcodehandle')
      .eq('slot_id', slot_id)
      .single();

    if (slotError || !slotData) {
      return NextResponse.json(
        { success: false, error: 'Slot not found' },
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

    console.log(`🔑 Found API key for ${slotData.slot_name}, testing endpoint: ${slotData.test_endpoint_url}`);

    // Update poke attempt timestamp
    const attemptTime = new Date().toISOString();
    await supabase
      .from('api_keys_t3')
      .update({ 
        poke_last_attempted: attemptTime,
        updated_at: attemptTime
      })
      .eq('fk_user_id', userData.id)
      .eq('fk_slot_id', slot_id);

    // Prepare request based on provider
    let testResponse;
    try {
      testResponse = await makeProviderRequest(slotData.slot_name, slotData.test_endpoint_url, slotData.test_method, apiKey);
    } catch (error) {
      console.error(`❌ API test failed for ${slotData.slot_name}:`, error);
      
      const failureResponse = {
        success: false,
        provider: slotData.slot_name,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        endpoint_tested: slotData.test_endpoint_url
      };

      // Update failure count and store response
      await supabase
        .from('api_keys_t3')
        .update({
          poke_response1: JSON.stringify(failureResponse),
          updated_at: new Date().toISOString()
        })
        .eq('fk_user_id', userData.id)
        .eq('fk_slot_id', slot_id);

      // Increment failure count separately
      await supabase.rpc('increment_failure_count', { 
        target_slot_id: slot_id,
        target_user_id: userData.id
      });

      return NextResponse.json({
        success: false,
        response: failureResponse
      });
    }

    // Success - store response and update counters
    const successResponse = {
      success: true,
      provider: slotData.slot_name,
      timestamp: new Date().toISOString(),
      endpoint_tested: slotData.test_endpoint_url,
      response_data: testResponse
    };

    const successTime = new Date().toISOString();
    await supabase
      .from('api_keys_t3')
      .update({
        poke_response1: JSON.stringify(successResponse),
        poke_last_success: successTime,
        updated_at: successTime
      })
      .eq('fk_user_id', userData.id)
      .eq('fk_slot_id', slot_id);

    // Increment success count separately
    await supabase.rpc('increment_success_count', { 
      target_slot_id: slot_id,
      target_user_id: userData.id
    });

    console.log(`✅ API test successful for ${slotData.slot_name}`);

    return NextResponse.json({
      success: true,
      response: successResponse
    });

  } catch (error) {
    console.error('Poke API route error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

async function makeProviderRequest(slotName: string, endpointUrl: string | null, method: string | null, apiKey: string) {
  if (!endpointUrl || !method) {
    throw new Error('No test endpoint configured for this provider');
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
  } else if (lowerSlotName.includes('claude') || lowerSlotName.includes('anthropic')) {
    headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    };
    if (method.toUpperCase() === 'POST') {
      body = JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      });
    }
  } else if (lowerSlotName.includes('gemini') || lowerSlotName.includes('google')) {
    // Google uses query parameter for API key
    url = `${endpointUrl}?key=${apiKey}`;
    headers = {
      'Content-Type': 'application/json'
    };
  } else if (lowerSlotName.includes('perplexity')) {
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    if (method.toUpperCase() === 'POST') {
      body = JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1
      });
    }
  } else if (lowerSlotName.includes('grok')) {
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  } else if (lowerSlotName.includes('cohere')) {
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  } else if (lowerSlotName.includes('stability')) {
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  } else if (lowerSlotName.includes('replicate')) {
    headers = {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json'
    };
  } else if (lowerSlotName.includes('hugging')) {
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  } else if (lowerSlotName.includes('mistral')) {
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  } else if (lowerSlotName.includes('together')) {
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  } else {
    // Default to Bearer token
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  console.log(`🌐 Making ${method} request to ${url} for ${slotName}`);

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, {
      method: method.toUpperCase(),
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
    return responseData;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout after 10 seconds');
    }
    throw error;
  }
}