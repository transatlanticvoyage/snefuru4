import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      site_url,
      post_title,
      post_name,
      post_status = 'publish',
      post_type = 'page',
      elementor_data,
      gcon_piece_id,
      meta_input
    } = body;

    // Validate required fields
    if (!site_url || !post_title || !elementor_data) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: site_url, post_title, or elementor_data' 
        },
        { status: 400 }
      );
    }

    // Prepare the payload to send to the WordPress plugin
    const pluginPayload = {
      action: 'dublish_create_elementor_page',
      post_data: {
        post_title,
        post_name: post_name || sanitizeSlug(post_title),
        post_status,
        post_type,
        post_content: '', // Elementor uses meta, not content
        meta_input: {
          '_elementor_edit_mode': 'builder',
          '_elementor_template_type': 'wp-page',
          '_elementor_version': '3.17.0',
          '_elementor_pro_version': '3.17.0',
          '_elementor_data': elementor_data,
          '_elementor_page_settings': JSON.stringify({
            "custom_css": "",
            "page_title": "hide",
            "page_description": "hide"
          }),
          '_wp_page_template': 'elementor_header_footer',
          ...meta_input
        }
      },
      gcon_piece_id,
      source: 'snefuru_dublish_system'
    };

    // Make request to WordPress site's plugin endpoint
    const wpApiUrl = `https://${site_url}/wp-json/snefuru/v1/dublish-create-page`;
    
    const response = await fetch(wpApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Snefuru-Dublish-System/1.0'
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
            site_url
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
      message: `Successfully created Elementor page "${post_title}"`,
      postId: result.post_id,
      postUrl: result.post_url,
      editUrl: result.edit_url,
      data: result
    });

  } catch (error) {
    console.error('Dublish Create Page Error:', error);
    
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

// Helper function to sanitize slug
function sanitizeSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}