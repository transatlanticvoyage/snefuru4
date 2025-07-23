import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Bozo HTML Normalization Process 1
function bozoHTMLNormalizationProcess1(htmlContent: string) {
  if (!htmlContent) return { normalizedContent: '', dorliBlocks: [] };
  
  // Simple HTML cleanup - remove script tags, normalize whitespace
  let normalized = htmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  // Extract dorli blocks (placeholder logic)
  const dorliBlocks: string[] = [];
  
  return {
    normalizedContent: normalized,
    dorliBlocks
  };
}

// Tonto Normalization Process 1
function tontoNormalizationProcess1(htmlContent: string) {
  if (!htmlContent) return { mudContent: '', mudDeplines: [] };
  
  // Advanced HTML processing for mud content
  let mudContent = htmlContent
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/\s+/g, ' ')
    .trim();
    
  // Extract deplines (placeholder logic)
  const mudDeplines: string[] = [];
  
  return {
    mudContent,
    mudDeplines
  };
}

export async function POST(request: NextRequest) {
  try {
    const { gcon_piece_id } = await request.json();
    
    if (!gcon_piece_id) {
      return NextResponse.json({ error: 'gcon_piece_id is required' }, { status: 400 });
    }

    console.log(`🚀 F22 Processing started for gcon_piece: ${gcon_piece_id}`);

    const supabase = createRouteHandlerClient({ cookies });
    
    // 1. Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log(`✅ User authenticated: ${user.id}`);

    // 2. Get user record from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      console.error('❌ User record not found:', userError);
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    console.log(`✅ User record found: ${userData.id}`);

    // 3. Verify user owns this gcon_piece and get current data
    const { data: gconPiece, error: ownershipError } = await supabase
      .from('gcon_pieces')
      .select('*')
      .eq('id', gcon_piece_id)
      .eq('fk_users_id', userData.id)
      .single();
      
    if (ownershipError || !gconPiece) {
      console.error('❌ gcon_piece not found or access denied:', ownershipError);
      return NextResponse.json({ error: 'gcon_piece not found or access denied' }, { status: 404 });
    }

    console.log(`✅ gcon_piece verified: ${gconPiece.id}`);

    // 4. Get nwpi_content records for this specific gcon_piece
    const { data: nwpiRecords, error: queryError } = await supabase
      .from('nwpi_content')
      .select('*')
      .eq('fk_gcon_piece_id', gcon_piece_id)
      .eq('fk_users_id', userData.id);

    if (queryError) {
      console.error('❌ Database query failed:', queryError);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    console.log(`✅ Found ${nwpiRecords?.length || 0} nwpi_content records to process`);

    if (!nwpiRecords || nwpiRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No nwpi_content records found for gcon_piece ${gcon_piece_id}. F22 processing completed.`,
        processedCount: 0
      });
    }

    // 5. Process each nwpi_content record
    let processedCount = 0;
    const results: string[] = [];
    let updatedData: any = {};
    
    for (const record of nwpiRecords) {
      try {
        console.log(`🔄 Processing nwpi_content record: ${record.id}`);
        
        // Apply Bozo HTML Normalization Process 1
        const bozoResult = bozoHTMLNormalizationProcess1(record.post_content || '');
        
        // Apply Tonto Normalization Process 1  
        const tontoResult = tontoNormalizationProcess1(record.post_content || '');
        
        // Accumulate processed data for gcon_pieces update
        updatedData = {
          ...updatedData,
          // Core content fields
          mud_title: record.post_title || gconPiece.mud_title,
          mud_content: tontoResult.mudContent || gconPiece.mud_content,
          aval_content: bozoResult.normalizedContent || gconPiece.aval_content,
          corpus1: record.post_content || gconPiece.corpus1,
          corpus2: record.post_excerpt || gconPiece.corpus2,
          
          // Elementor processing
          pelementor_cached: record.a_elementor_substance || gconPiece.pelementor_cached,
          
          // WordPress metadata
          g_post_id: record.post_id || gconPiece.g_post_id,
          g_post_status: record.post_status || gconPiece.g_post_status,
          g_post_type: record.post_type || gconPiece.g_post_type,
          post_name: record.post_name || gconPiece.post_name,
          pageslug: record.post_name || gconPiece.pageslug,
          
          // Site reference
          asn_sitespren_base: record.fk_sitespren_base || gconPiece.asn_sitespren_base,
          
          // Update timestamp
          updated_at: new Date().toISOString()
        };
        
        processedCount++;
        results.push(`✅ Processed nwpi_content record ${record.id} (${record.post_title || 'Untitled'})`);
        
      } catch (error: any) {
        console.error(`❌ Error processing record ${record.id}:`, error);
        results.push(`❌ Error processing record ${record.id}: ${error.message}`);
      }
    }

    // 6. Update the gcon_pieces record with processed data
    if (processedCount > 0) {
      console.log(`🔄 Updating gcon_piece ${gcon_piece_id} with processed data`);
      
      const { error: updateError } = await supabase
        .from('gcon_pieces')
        .update(updatedData)
        .eq('id', gcon_piece_id)
        .eq('fk_users_id', userData.id);
        
      if (updateError) {
        console.error('❌ Failed to update gcon_piece:', updateError);
        return NextResponse.json({ error: 'Failed to update gcon_piece' }, { status: 500 });
      }
      
      console.log(`✅ Successfully updated gcon_piece ${gcon_piece_id}`);
      results.push(`✅ Updated gcon_piece ${gcon_piece_id} with processed data`);
    }

    const successMessage = `F22 processing completed successfully for gcon_piece ${gcon_piece_id}.\n\nProcessed ${processedCount} nwpi_content records.\n\nUpdated fields: mud_title, mud_content, aval_content, pelementor_cached, and metadata.\n\nResults:\n${results.join('\n')}`;

    console.log(`🎉 F22 processing completed for ${gcon_piece_id}`);

    return NextResponse.json({
      success: true,
      message: successMessage,
      processedCount,
      gconPieceId: gcon_piece_id,
      details: results
    });

  } catch (error: any) {
    console.error('💥 F22 gcon_piece processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during F22 processing',
      details: error.message 
    }, { status: 500 });
  }
}