import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Interface for mud_deplines
interface MudDepline {
  depline_id?: string;
  fk_gcon_piece_id: string;
  depline_jnumber: number;
  depline_knumber: number | null;
  content_raw: string;
  html_tags_detected: string;
  created_at?: string;
}

// TontoNormalizationProcess1 - Text-based line processing for mud system
function tontoNormalizationProcess1(content: string): { mudContent: string; mudDeplines: MudDepline[] } {
  console.log(`🌊 Joni TontoNormalizationProcess1 ENTRY: content length=${content?.length || 0}`);
  
  if (!content || content.trim() === '') {
    console.log(`🌊 Joni TontoNormalizationProcess1 EMPTY INPUT: returning empty result`);
    return { mudContent: '', mudDeplines: [] };
  }

  try {
    // Split content by actual text linebreaks (\n or \r\n)
    const lines = content.split(/\r?\n/);
    const mudDeplines: MudDepline[] = [];
    
    console.log(`🌊 Joni TontoNormalizationProcess1 PROCESSING: split into ${lines.length} lines`);
    
    // Regular expression to find opening HTML tags
    const htmlTagRegex = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    
    // Process each line
    lines.forEach((line, index) => {
      // Extract all opening HTML tags from this line
      const tagsFound = new Set<string>();
      let match;
      
      while ((match = htmlTagRegex.exec(line)) !== null) {
        tagsFound.add(match[1].toLowerCase());
      }
      
      // Convert Set to comma-separated string (no duplicates)
      const htmlTagsDetected = Array.from(tagsFound).join(',');
      
      // Keep the line as-is, preserving all HTML tags
      const rawLine = line.trim();
      
      // Create mud_depline entry
      mudDeplines.push({
        fk_gcon_piece_id: '', // Will be set when calling this function
        depline_jnumber: index + 1, // Line numbering starts at 1
        depline_knumber: null,
        content_raw: rawLine,
        html_tags_detected: htmlTagsDetected
      });
    });
    
    // Reconstruct mud_content by joining lines with \n
    const mudContent = lines.join('\n');
    
    console.log(`🌊 Joni TontoNormalizationProcess1 RESULT:`);
    console.log(`  - Input lines: ${lines.length}`);
    console.log(`  - Output mudDeplines: ${mudDeplines.length}`);
    console.log(`  - mudContent length: ${mudContent?.length || 0}`);
    console.log(`  - mudContent preview: "${mudContent.substring(0, 100)}..."`);
    
    return { mudContent, mudDeplines };
    
  } catch (error) {
    console.error('❌ Joni TontoNormalizationProcess1 error:', error);
    // Fallback: return original content with no deplines
    return { 
      mudContent: content,
      mudDeplines: []
    };
  }
}

// Process mud_deplines by inserting them into mud_deplines table
async function processJoniMudDeplines(mudDeplines: MudDepline[], gconPieceId: string, supabase: any) {
  if (!mudDeplines || mudDeplines.length === 0) {
    console.log(`🌊 Joni: No mudDeplines to process for gcon_piece: ${gconPieceId}`);
    return;
  }

  console.log(`🌊 Joni: Processing ${mudDeplines.length} mud_deplines for gcon_piece: ${gconPieceId}`);

  // Delete all existing mud_deplines for this gcon_piece
  const { error: deleteError } = await supabase
    .from('mud_deplines')
    .delete()
    .eq('fk_gcon_piece_id', gconPieceId);

  if (deleteError) {
    console.error('❌ Joni: Error clearing existing mud_deplines:', deleteError);
    throw new Error(`Failed to clear existing mud_deplines: ${deleteError.message}`);
  }

  // Insert new mud_deplines with generated UUIDs
  const mudInserts = mudDeplines.map(depline => ({
    depline_id: crypto.randomUUID(), // Generate UUID for each depline
    fk_gcon_piece_id: gconPieceId,
    depline_jnumber: depline.depline_jnumber,
    depline_knumber: depline.depline_knumber,
    content_raw: depline.content_raw,
    html_tags_detected: depline.html_tags_detected,
    created_at: new Date().toISOString()
  }));

  const { error: insertError } = await supabase
    .from('mud_deplines')
    .insert(mudInserts);

  if (insertError) {
    console.error('❌ Joni: Error inserting mud_deplines:', insertError);
    throw new Error(`Failed to insert mud_deplines: ${insertError.message}`);
  }

  console.log(`✅ Joni: Successfully inserted ${mudDeplines.length} mud_deplines`);
}

// Generate mud_document from mud_deplines
async function generateJoniMudDocument(gconPieceId: string, supabase: any): Promise<string> {
  // Fetch all mud_deplines for this gcon_piece, ordered by depline_jnumber
  const { data: deplines, error: fetchError } = await supabase
    .from('mud_deplines')
    .select('content_raw')
    .eq('fk_gcon_piece_id', gconPieceId)
    .order('depline_jnumber', { ascending: true });

  if (fetchError) {
    console.error('❌ Joni: Error fetching mud_deplines for document generation:', fetchError);
    throw new Error(`Failed to fetch mud_deplines: ${fetchError.message}`);
  }

  if (!deplines || deplines.length === 0) {
    console.log(`🌊 Joni: No mud_deplines found for document generation`);
    return '';
  }

  // Join all content_raw values with newlines
  const mudDocument = deplines.map((depline: any) => depline.content_raw).join('\n');
  
  console.log(`🌊 Joni: Generated mud_document with ${mudDocument.length} characters from ${deplines.length} deplines`);
  
  return mudDocument;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log(`🌊 Joni: mud-depline-population-process starting`);
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Joni: Failed to parse request body:', parseError);
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { gcon_piece_id } = body;
    
    if (!gcon_piece_id) {
      return NextResponse.json(
        { success: false, message: 'gcon_piece_id is required' },
        { status: 400 }
      );
    }
    
    console.log(`🌊 Joni: Processing request for gcon_piece_id: ${gcon_piece_id}`);

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
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
        { success: false, message: 'User record not found' },
        { status: 404 }
      );
    }

    // Fetch the gcon_piece record
    const { data: gconPiece, error: gconError } = await supabase
      .from('gcon_pieces')
      .select('id, mud_content, mud_title')
      .eq('id', gcon_piece_id)
      .eq('fk_users_id', userData.id)
      .single();

    if (gconError || !gconPiece) {
      console.error('❌ Joni: Error fetching gcon_piece:', gconError);
      return NextResponse.json(
        { success: false, message: 'Content piece not found or access denied' },
        { status: 404 }
      );
    }

    // Check if mud_content exists
    if (!gconPiece.mud_content || gconPiece.mud_content.trim() === '') {
      console.log(`🌊 Joni: Empty mud_content for piece: ${gcon_piece_id}`);
      return NextResponse.json(
        { success: false, message: 'No mud_content available for processing' },
        { status: 400 }
      );
    }

    console.log(`🌊 Joni: Processing mud_content with ${gconPiece.mud_content.length} characters`);

    // Run TontoNormalizationProcess1 on the mud_content
    const { mudContent, mudDeplines } = tontoNormalizationProcess1(gconPiece.mud_content);

    // Set the gcon_piece_id for all mudDeplines
    mudDeplines.forEach(depline => {
      depline.fk_gcon_piece_id = gcon_piece_id;
    });

    // Process the mud_deplines (delete existing, insert new)
    await processJoniMudDeplines(mudDeplines, gcon_piece_id, supabase);

    // Generate and update mud_document
    const mudDocument = await generateJoniMudDocument(gcon_piece_id, supabase);
    
    const { error: updateError } = await supabase
      .from('gcon_pieces')
      .update({ 
        mud_document: mudDocument,
        updated_at: new Date().toISOString()
      })
      .eq('id', gcon_piece_id);

    if (updateError) {
      console.error('❌ Joni: Error updating mud_document:', updateError);
      throw new Error(`Failed to update mud_document: ${updateError.message}`);
    }

    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Joni: Successfully completed processing for ${gcon_piece_id}`);
    console.log(`🌊 Joni: Created ${mudDeplines.length} deplines in ${processingTime}ms`);

    const response = {
      success: true,
      message: `Joni successfully populated ${mudDeplines.length} mud_deplines`,
      data: {
        gcon_piece_id: gcon_piece_id,
        joni_deplines_created: mudDeplines.length,
        joni_mud_document_updated: true,
        joni_processing_time_ms: processingTime,
        mud_content_length: gconPiece.mud_content.length,
        mud_document_length: mudDocument.length
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Joni: Critical error in mud-depline-population-process:', error);
    
    const errorResponse = {
      success: false,
      message: `Joni process failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: {
        joni_processing_time_ms: processingTime,
        error_type: error instanceof Error ? error.name : 'UnknownError',
        error_details: error instanceof Error ? error.message : String(error)
      }
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}