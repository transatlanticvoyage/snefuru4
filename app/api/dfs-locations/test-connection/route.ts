import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing DataForSEO connection...');

    // Get DataForSEO credentials
    const username = process.env.DFS_USERNAME;
    const password = process.env.DFS_PASSWORD;

    if (!username || !password) {
      return NextResponse.json(
        { 
          error: 'DataForSEO credentials not found', 
          message: 'Please set DFS_USERNAME and DFS_PASSWORD in your environment variables'
        },
        { status: 400 }
      );
    }

    console.log('📡 Making test request to DataForSEO API...');

    // Test with a simple API call - get just a few locations
    const response = await fetch('https://api.dataforseo.com/v3/serp/google/locations?limit=5', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('DataForSEO API Error:', responseText);
      return NextResponse.json(
        { 
          error: `API connection failed: ${response.status} ${response.statusText}`,
          details: responseText,
          username_length: username.length,
          password_length: password.length
        },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      return NextResponse.json(
        { 
          error: 'Failed to parse API response',
          details: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
        },
        { status: 500 }
      );
    }

    console.log('✅ DataForSEO connection successful');

    // Extract useful info from the response
    const locationCount = data.tasks?.[0]?.result?.length || 0;
    const sampleLocations = data.tasks?.[0]?.result?.slice(0, 3) || [];

    return NextResponse.json({
      success: true,
      message: 'DataForSEO connection successful',
      api_info: {
        status: response.status,
        response_time: new Date().toISOString(),
        sample_location_count: locationCount,
        sample_locations: sampleLocations.map((loc: any) => ({
          location_code: loc.location_code,
          location_name: loc.location_name,
          location_type: loc.location_type,
          country_iso_code: loc.country_iso_code
        })),
        credentials_status: {
          username_configured: !!username,
          password_configured: !!password,
          username_length: username.length,
          password_length: password.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return NextResponse.json(
      { 
        error: 'Connection test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}