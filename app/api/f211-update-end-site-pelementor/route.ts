import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { gcon_piece_id, pelementor_data } = await request.json();

    if (!gcon_piece_id || !pelementor_data) {
      return NextResponse.json(
        { success: false, error: 'gcon_piece_id and pelementor_data are required' },
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

    // Get user record with ruplin API key
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, ruplin_api_key_1')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User record not found' },
        { status: 404 }
      );
    }

    if (!userData.ruplin_api_key_1) {
      return NextResponse.json(
        { success: false, error: 'No ruplin API key found for user' },
        { status: 400 }
      );
    }

    console.log(`🚀 F211: Starting pelementor update for piece ${gcon_piece_id}, user ${userData.id}`);

    // Get gcon_piece with site information
    const { data: pieceData, error: pieceError } = await supabase
      .from('gcon_pieces')
      .select('id, asn_sitespren_base, asn_nwpi_posts_id, meta_title')
      .eq('id', gcon_piece_id)
      .eq('fk_users_id', userData.id)
      .single();

    if (pieceError || !pieceData) {
      return NextResponse.json(
        { success: false, error: 'Content piece not found or access denied' },
        { status: 404 }
      );
    }

    if (!pieceData.asn_sitespren_base) {
      return NextResponse.json(
        { success: false, error: 'No site assignment found for this content piece' },
        { status: 400 }
      );
    }

    if (!pieceData.asn_nwpi_posts_id) {
      return NextResponse.json(
        { success: false, error: 'No WordPress post ID found for this content piece' },
        { status: 400 }
      );
    }

    console.log(`📍 Found piece: ${pieceData.meta_title}, Site: ${pieceData.asn_sitespren_base}, Post ID: ${pieceData.asn_nwpi_posts_id}`);

    // Get site configuration from sitespren table
    const { data: siteData, error: siteError } = await supabase
      .from('sitespren')
      .select('*')
      .eq('sitespren_base', pieceData.asn_sitespren_base)
      .single();

    if (siteError || !siteData) {
      return NextResponse.json(
        { success: false, error: 'Site configuration not found' },
        { status: 404 }
      );
    }

    console.log(`🌐 Found site config for: ${siteData.sitespren_base}`);

    // Update WordPress site with pelementor data
    const wpUpdateResult = await updateWordPressPelementor(
      siteData,
      pieceData.asn_nwpi_posts_id,
      pelementor_data,
      userData.ruplin_api_key_1
    );

    if (!wpUpdateResult.success) {
      throw new Error(wpUpdateResult.error);
    }

    console.log(`✅ Successfully updated WordPress site with pelementor data`);

    return NextResponse.json({
      success: true,
      message: 'Successfully updated live site with pelementor data',
      site: pieceData.asn_sitespren_base,
      post_id: pieceData.asn_nwpi_posts_id,
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('F211 route error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

async function updateWordPressPelementor(siteData: any, postId: string, pelementorData: any, ruplinApiKey: string) {
  try {
    // Construct WordPress site URL
    const siteUrl = `https://${siteData.sitespren_base}`;
    
    // Prepare the elementor data as JSON string (WordPress stores it as serialized/JSON)
    const elementorDataString = JSON.stringify(pelementorData);
    
    console.log(`🔧 Updating WordPress post ${postId} on ${siteUrl} using ruplin API key`);

    // Call WordPress API through snefuruplin plugin using the correct endpoint and authentication
    const wpResponse = await fetch(`${siteUrl}/wp-json/snefuru/v1/posts/${postId}/elementor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ruplinApiKey}`, // Use ruplin_api_key_1 from users table
      },
      body: JSON.stringify({
        elementor_data: elementorDataString
      }),
    });

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      throw new Error(`WordPress API error: ${wpResponse.status} - ${errorText}`);
    }

    const wpResult = await wpResponse.json();
    
    if (!wpResult.success) {
      throw new Error(wpResult.message || 'WordPress update failed');
    }

    console.log(`✅ WordPress elementor data updated successfully`);
    
    return {
      success: true,
      message: 'Elementor data updated in WordPress',
      wp_response: wpResult
    };

  } catch (error) {
    console.error('❌ WordPress update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown WordPress update error'
    };
  }
}