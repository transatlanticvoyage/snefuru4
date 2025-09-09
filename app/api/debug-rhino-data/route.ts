import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gcon_piece_id } = body;

    if (!gcon_piece_id) {
      return NextResponse.json({ error: 'gcon_piece_id is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get user internal ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get gcon piece with both regolith and pelementor data
    const { data: gconPiece, error: gconError } = await supabase
      .from('gcon_pieces')
      .select(`
        id, 
        discovered_images_regolith, 
        pelementor_cached,
        meta_title
      `)
      .eq('id', gcon_piece_id)
      .eq('fk_users_id', userData.id)
      .single();

    if (gconError || !gconPiece) {
      return NextResponse.json({ error: 'Gcon piece not found' }, { status: 404 });
    }

    // Parse regolith data
    let regolithData;
    try {
      regolithData = typeof gconPiece.discovered_images_regolith === 'string' 
        ? JSON.parse(gconPiece.discovered_images_regolith)
        : gconPiece.discovered_images_regolith;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid regolith data format' }, { status: 400 });
    }

    // Parse pelementor data
    let pelementorData;
    try {
      pelementorData = typeof gconPiece.pelementor_cached === 'string' 
        ? JSON.parse(gconPiece.pelementor_cached)
        : gconPiece.pelementor_cached;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid pelementor data format' }, { status: 400 });
    }

    const regolithImages = regolithData?.discovered_images || [];
    const pelementorString = JSON.stringify(pelementorData);

    // Check if each regolith URL exists in the pelementor data
    const urlAnalysis = regolithImages.map((regolithImage: any) => {
      const urlMatches = (pelementorString.match(new RegExp(escapeRegExp(regolithImage.url), 'g')) || []).length;
      
      // Also check for variations (http vs https, different domains)
      const variations = [
        regolithImage.url.replace('http://', 'https://'),
        regolithImage.url.replace('https://', 'http://'),
        regolithImage.url.replace(/^https?:\/\/[^\/]+/, ''), // Just the path
      ];
      
      const variationMatches = variations.map(variation => ({
        variation,
        matches: (pelementorString.match(new RegExp(escapeRegExp(variation), 'g')) || []).length
      }));

      return {
        regolith_url: regolithImage.url,
        attachment_id: regolithImage.image_metadata?.attachment_id,
        element_context: regolithImage.element_context,
        direct_matches: urlMatches,
        variation_matches: variationMatches,
        found_in_pelementor: urlMatches > 0
      };
    });

    return NextResponse.json({
      success: true,
      gcon_piece: {
        id: gconPiece.id,
        title: gconPiece.meta_title
      },
      regolith_images_count: regolithImages.length,
      pelementor_data_size: pelementorString.length,
      url_analysis: urlAnalysis,
      debug_data: {
        // First 1000 chars of pelementor data for inspection
        pelementor_preview: pelementorString.substring(0, 1000),
        regolith_urls: regolithImages.map((img: any) => img.url)
      }
    });

  } catch (error) {
    console.error('Debug rhino data error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}