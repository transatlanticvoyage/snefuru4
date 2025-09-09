import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { batch_id } = await request.json();
    
    if (!batch_id) {
      return NextResponse.json(
        { error: 'batch_id is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get user with snef2@kozomail.com
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log(`🔍 Test Debug: User: ${user.email}`);

    // Get the batch info
    const { data: batchData, error: batchError } = await supabase
      .from('images_plans_batches')
      .select('id, batch_name, asn_gcon_piece_id')
      .eq('id', batch_id)
      .single();

    if (batchError || !batchData) {
      return NextResponse.json({
        error: 'Batch not found',
        batch_id
      });
    }

    console.log(`🔍 Test Debug: Batch: ${batchData.batch_name}, gcon_piece: ${batchData.asn_gcon_piece_id}`);

    // Get the gcon piece info
    const { data: gconPiece, error: gconError } = await supabase
      .from('gcon_pieces')
      .select('id, meta_title, discovered_images_regolith, pelementor_cached, asn_sitespren_base, g_post_id')
      .eq('id', batchData.asn_gcon_piece_id)
      .single();

    if (gconError || !gconPiece) {
      return NextResponse.json({
        error: 'Gcon piece not found',
        gcon_piece_id: batchData.asn_gcon_piece_id
      });
    }

    // Parse regolith data
    let regolithData = null;
    let regolithImages = [];
    if (gconPiece.discovered_images_regolith) {
      try {
        regolithData = typeof gconPiece.discovered_images_regolith === 'string' 
          ? JSON.parse(gconPiece.discovered_images_regolith)
          : gconPiece.discovered_images_regolith;
        regolithImages = regolithData.discovered_images || [];
      } catch (e) {
        console.error('Failed to parse regolith:', e);
      }
    }

    // Parse elementor data and extract current URLs
    let elementorData = null;
    let currentUrls = [];
    if (gconPiece.pelementor_cached) {
      try {
        elementorData = typeof gconPiece.pelementor_cached === 'string'
          ? JSON.parse(gconPiece.pelementor_cached)
          : gconPiece.pelementor_cached;
        
        const dataString = JSON.stringify(elementorData);
        const urlMatches = dataString.match(/https?:\/\/[^\s"',}]+\.(jpg|jpeg|png|gif|webp)/gi);
        currentUrls = [...new Set(urlMatches || [])];
      } catch (e) {
        console.error('Failed to parse elementor:', e);
      }
    }

    return NextResponse.json({
      success: true,
      debug_info: {
        user_email: user.email,
        batch: {
          id: batchData.id,
          name: batchData.batch_name,
          gcon_piece_id: batchData.asn_gcon_piece_id
        },
        gcon_piece: {
          id: gconPiece.id,
          title: gconPiece.meta_title,
          site: gconPiece.asn_sitespren_base,
          post_id: gconPiece.g_post_id
        },
        regolith: {
          has_data: !!gconPiece.discovered_images_regolith,
          images_count: regolithImages.length,
          urls: regolithImages.map((img: any) => img.url).slice(0, 5) // First 5 URLs
        },
        current_elementor: {
          has_data: !!gconPiece.pelementor_cached,
          urls_found: currentUrls.length,
          sample_urls: currentUrls.slice(0, 5) // First 5 URLs
        },
        url_matches: {
          regolith_urls: regolithImages.map((img: any) => img.url),
          current_urls: currentUrls.slice(0, 10),
          matches: regolithImages.filter((img: any) => 
            currentUrls.some(url => url.includes(img.url) || img.url.includes(url))
          ).length
        }
      }
    });

  } catch (error) {
    console.error('Test debug error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}