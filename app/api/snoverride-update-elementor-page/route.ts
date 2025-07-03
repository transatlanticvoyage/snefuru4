import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      site_url,
      post_id,
      post_title,
      elementor_data,
      gcon_piece_id,
      update_fields
    } = body;

    // Validate required fields
    if (!site_url || !post_id || !elementor_data) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: site_url, post_id, or elementor_data' 
        },
        { status: 400 }
      );
    }

    // Prepare the payload to send to the WordPress plugin
    const pluginPayload = {
      action: 'snoverride_update_elementor_page',
      post_id: parseInt(post_id),
      update_data: {
        post_title: post_title || '',
        meta_input: {
          '_elementor_data': elementor_data,
          '_elementor_edit_mode': 'builder',
          '_elementor_version': '3.17.0',
          '_snefuru_last_update': new Date().toISOString(),
          '_snefuru_update_via': 'snoverride_system',
          ...update_fields?.meta_input
        }
      },
      gcon_piece_id,
      source: 'snefuru_snoverride_system'
    };

    // Make request to WordPress site's plugin endpoint
    const wpApiUrl = `https://${site_url}/wp-json/snefuru/v1/snoverride-update-page`;
    
    const response = await fetch(wpApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Snefuru-Snoverride-System/1.0'
      },
      body: JSON.stringify(pluginPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress API Error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `WordPress API Error (${response.status}): ${errorText}`,
          details: {
            status: response.status,
            url: wpApiUrl,
            site_url,
            post_id
          }
        },
        { status: 502 }
      );
    }

    const result = await response.json();

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: result.message || 'WordPress plugin returned error',
          details: result
        },
        { status: 400 }
      );
    }

    // Return success response with WordPress post data
    return NextResponse.json({
      success: true,
      message: `Successfully updated Elementor page "${post_title}"`,
      postId: result.post_id,
      postUrl: result.post_url,
      editUrl: result.edit_url,
      data: result
    });

  } catch (error) {
    console.error('Snoverride Update Page Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}