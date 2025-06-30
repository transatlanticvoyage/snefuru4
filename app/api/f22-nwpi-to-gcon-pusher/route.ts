import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Field mapping configuration
const NWPI_TO_GCON_MAPPING = {
  // Direct field mappings
  direct: {
    'fk_sitespren_base': 'asn_sitespren_base',
    'post_name': 'pageslug', // Legacy field - keep for compatibility
    'post_id': 'g_post_id',
    'post_status': 'g_post_status',
    'post_type': 'g_post_type',
  },

  // Additional direct mappings for new fields
  additional_direct: {
    'post_name': 'post_name', // New field - stores actual WordPress slug
  },
  
  // Transform mappings with functions
  transform: {
    'post_title': (data: any) => ({
      'meta_title': data.post_title,
      'h1title': data.post_title,
      'pgb_h1title': data.post_title,
      'aval_title': data.post_title,
      'mud_title': data.post_title // Add mud_title
    }),
    'post_content': (data: any) => {
      console.log(`🔍 DEBUG - post_content transform input: "${data.post_content?.substring(0, 100)}..."`);
      const bozoResult = bozoHTMLNormalizationProcess1(data.post_content || '');
      const tontoResult = tontoNormalizationProcess1(data.post_content || '');
      console.log(`🔍 DEBUG - TontoNormalizationProcess1 result: mudContent length=${tontoResult.mudContent?.length || 0}, deplines=${tontoResult.mudDeplines?.length || 0}`);
      const result = {
        'corpus1': data.post_content || '',
        'aval_content': bozoResult.normalizedContent,
        '_dorli_blocks': bozoResult.dorliBlocks, // Store for later processing
        'mud_content': tontoResult.mudContent, // Add mud_content
        '_mud_deplines': tontoResult.mudDeplines // Store for later processing
      };
      console.log(`🔍 DEBUG - post_content transform result keys:`, Object.keys(result));
      return result;
    },
    'post_excerpt': (data: any) => ({
      'corpus2': data.post_excerpt || ''
    }),
    'a_elementor_substance': (data: any) => ({
      'pelementor_cached': data.a_elementor_substance
    }),
  },
  
  // Computed fields
  computed: {
    'asn_nwpi_posts_id': (data: any) => `${data.fk_sitespren_base}->postid${data.post_id}`,
    'pageurl': (data: any) => data.post_name ? `https://${data.fk_sitespren_base}/${data.post_name}` : null,
    'date_time_pub_carry': (data: any) => data.post_date || new Date().toISOString(),
  }
};

// Interface for extracted dorli blocks
interface DorliBlock {
  tag: string;
  placeholder: string;
  raw: string;
  line_count: number;
}

// BozoHTMLNormalizationProcess1 - Line-by-line processing with dorli block detection
function bozoHTMLNormalizationProcess1(html: string, gconPieceId?: string): { normalizedContent: string; dorliBlocks: DorliBlock[] } {
  if (!html || html.trim() === '') {
    return { normalizedContent: '', dorliBlocks: [] };
  }

  try {
    // Remove script and style elements completely before line processing
    let cleanHtml = html;
    cleanHtml = cleanHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    const dorliBlocks: DorliBlock[] = [];
    const normalizedLines: string[] = [];
    
    // Dorli tags that should be extracted as blocks
    const dorliTags = ['table', 'div', 'form', 'label', 'section', 'article', 'aside', 'main', 'header', 'footer', 'nav'];
    
    // Counter for each tag type to generate unique placeholders
    const tagCounters: { [key: string]: number } = {};
    dorliTags.forEach(tag => {
      tagCounters[tag.toUpperCase()] = 0;
    });
    
    // Split content into lines for processing
    const lines = cleanHtml.split(/\r?\n/);
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Check if this line starts a dorli block
      let dorliTagFound: string | null = null;
      let openingTag: string = '';
      
      for (const tag of dorliTags) {
        const openingPattern = new RegExp(`^\\s*<${tag}(\\s[^>]*)?>`);
        const match = line.match(openingPattern);
        if (match) {
          dorliTagFound = tag;
          openingTag = match[0];
          break;
        }
      }
      
      if (dorliTagFound) {
        // Enter dorli capture mode
        console.log(`🔄 Detected dorli block start: ${dorliTagFound} on line ${i + 1}`);
        
        const capturedLines: string[] = [];
        const closingTag = `</${dorliTagFound}>`;
        let blockComplete = false;
        let currentLine = i;
        
        // Check if opening and closing tags are on the same line
        if (line.includes(closingTag)) {
          // Single-line dorli block
          capturedLines.push(lines[currentLine]);
          blockComplete = true;
        } else {
          // Multi-line dorli block - capture until closing tag
          while (currentLine < lines.length && !blockComplete) {
            capturedLines.push(lines[currentLine]);
            
            if (lines[currentLine].includes(closingTag)) {
              blockComplete = true;
            }
            currentLine++;
          }
        }
        
        if (blockComplete) {
          // Generate unique placeholder
          const placeholder = `{{DORLI:${dorliTagFound.toUpperCase()}:${tagCounters[dorliTagFound.toUpperCase()]}}}`;
          tagCounters[dorliTagFound.toUpperCase()]++;
          
          // Store the dorli block
          const rawContent = capturedLines.join('\n');
          dorliBlocks.push({
            tag: dorliTagFound,
            placeholder: placeholder,
            raw: rawContent,
            line_count: capturedLines.length
          });
          
          console.log(`✅ Captured dorli block: ${placeholder} (${capturedLines.length} lines, ${rawContent.length} chars)`);
          
          // Add placeholder to normalized content
          normalizedLines.push(placeholder);
          
          // Skip to after the captured block
          i = currentLine;
        } else {
          // Incomplete block - treat as regular content
          console.warn(`⚠️ Incomplete dorli block detected for ${dorliTagFound}, treating as regular content`);
          normalizedLines.push(processRegularLine(line));
          i++;
        }
      } else {
        // Regular line - process normally
        const processedLine = processRegularLine(line);
        if (processedLine) {
          normalizedLines.push(processedLine);
        }
        i++;
      }
    }
    
    // Join with single newlines and remove any empty lines
    const normalizedContent = normalizedLines
      .filter(line => line.trim().length > 0)
      .join('\n');
    
    console.log(`🔄 BozoHTMLNormalizationProcess1: Converted ${html.length} chars HTML to ${normalizedContent.length} chars plaintext with ${normalizedLines.length} lines, extracted ${dorliBlocks.length} dorli blocks`);
    
    return { normalizedContent, dorliBlocks };
    
  } catch (error) {
    console.error('❌ BozoHTMLNormalizationProcess1 error:', error);
    // Fallback: return the original content with basic cleanup
    return { 
      normalizedContent: html.replace(/<[^>]+>/g, '').trim(),
      dorliBlocks: []
    };
  }
}

// Helper function to process regular (non-dorli) lines
function processRegularLine(line: string): string {
  if (!line || line.trim() === '') {
    return '';
  }
  
  let processedLine = line;
  
  // Handle headings (h1-h6)
  processedLine = processedLine.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '$1');
  
  // Handle paragraphs
  processedLine = processedLine.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1');
  
  // Handle list items
  processedLine = processedLine.replace(/<li[^>]*>(.*?)<\/li>/gi, '$1');
  
  // Handle other block elements
  processedLine = processedLine.replace(/<(blockquote|ul|ol)[^>]*>(.*?)<\/\1>/gi, '$2');
  
  // Handle line breaks and horizontal rules
  processedLine = processedLine.replace(/<br[^>]*>/gi, '');
  processedLine = processedLine.replace(/<hr[^>]*>/gi, '');
  
  // Remove remaining HTML tags (keeping inline content)
  processedLine = processedLine.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  processedLine = processedLine
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  return processedLine.trim();
}

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
  if (!content || content.trim() === '') {
    return { mudContent: '', mudDeplines: [] };
  }

  try {
    // Split content by actual text linebreaks (\n or \r\n)
    const lines = content.split(/\r?\n/);
    const mudDeplines: MudDepline[] = [];
    
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
      
      // Create mud_depline entry
      mudDeplines.push({
        fk_gcon_piece_id: '', // Will be set when calling this function
        depline_jnumber: index + 1, // Line numbering starts at 1
        depline_knumber: null,
        content_raw: line,
        html_tags_detected: htmlTagsDetected
      });
    });
    
    // Reconstruct mud_content by joining lines with \n
    const mudContent = lines.join('\n');
    
    console.log(`🌊 TontoNormalizationProcess1: Processed ${lines.length} lines, found ${mudDeplines.length} deplines`);
    console.log(`🔍 DEBUG - mudContent length: ${mudContent?.length || 0}, deplines: ${mudDeplines?.length || 0}`);
    
    return { mudContent, mudDeplines };
    
  } catch (error) {
    console.error('❌ TontoNormalizationProcess1 error:', error);
    // Fallback: return original content with no deplines
    return { 
      mudContent: content,
      mudDeplines: []
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Add error handling for request body parsing
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { recordIds = [], pushAll = false } = body;
    console.log(`🔄 f22_nwpi_to_gcon_pusher: Request received with recordIds.length=${recordIds.length}, pushAll=${pushAll}`);

    // Initialize Supabase client with service role to bypass RLS
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

    console.log(`🔄 f22_nwpi_to_gcon_pusher: Starting push for user ${userData.id}`);

    // Build query for nwpi_content records
    let query = supabase
      .from('nwpi_content')
      .select('*')
      .eq('fk_users_id', userData.id);

    if (!pushAll && recordIds.length > 0) {
      query = query.in('internal_post_id', recordIds);
    }

    const { data: nwpiRecords, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching nwpi_content records:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Error fetching records' },
        { status: 500 }
      );
    }

    if (!nwpiRecords || nwpiRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No records found to push',
        results: { processed: 0, succeeded: 0, failed: 0, errors: [] }
      });
    }

    console.log(`📊 Found ${nwpiRecords.length} nwpi_content records to process`);

    // Debug: Check for duplicate post_ids in source data
    const postIdCounts = new Map<string, number>();
    nwpiRecords.forEach(record => {
      const key = `${record.post_id}_${record.fk_sitespren_base}`;
      postIdCounts.set(key, (postIdCounts.get(key) || 0) + 1);
    });
    
    const duplicates = Array.from(postIdCounts.entries()).filter(([key, count]) => count > 1);
    if (duplicates.length > 0) {
      console.warn(`⚠️ WARNING: Found duplicate post_id/sitespren combinations in source nwpi_content data:`);
      duplicates.forEach(([key, count]) => {
        console.log(`  ${key}: ${count} occurrences`);
      });
    }

    // Process records in batches
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const nwpiRecord of nwpiRecords) {
      try {
        results.processed++;
        
        // Skip records with null/empty post_id as they cannot be properly deduplicated
        if (!nwpiRecord.post_id || nwpiRecord.post_id === null || nwpiRecord.post_id === undefined) {
          console.log(`⏭️ Skipping record with null/empty post_id: ${nwpiRecord.post_title} (ID: ${nwpiRecord.internal_post_id})`);
          results.failed++;
          results.errors.push(`Skipped "${nwpiRecord.post_title}": No valid post_id for deduplication`);
          continue;
        }
        
        // Transform the record using the mapping configuration
        const gconData = transformNwpiToGcon(nwpiRecord, userData.id);
        
        // DEBUG: Check key fields
        console.log(`🔍 DEBUG - mud_title: ${gconData.mud_title}, mud_content length: ${gconData.mud_content?.length || 0}`);
        
        // Extract dorli blocks from the transformed data
        const dorliBlocks = gconData._dorli_blocks || [];
        delete gconData._dorli_blocks; // Remove from data to be inserted
        
        // Extract mud_deplines from the transformed data
        const mudDeplines = gconData._mud_deplines || [];
        delete gconData._mud_deplines; // Remove from data to be inserted
        
        console.log(`🔄 Processing: ${nwpiRecord.post_title} (ID: ${nwpiRecord.internal_post_id})`);
        console.log(`📊 Debug - post_id: ${nwpiRecord.post_id}, sitespren: ${nwpiRecord.fk_sitespren_base}, user: ${userData.id}`);

        // Check if record already exists based on g_post_id, sitespren_base, and user
        const { data: existingRecords, error: checkError } = await supabase
          .from('gcon_pieces')
          .select('id, g_post_id, asn_sitespren_base')
          .eq('fk_users_id', userData.id)
          .eq('g_post_id', nwpiRecord.post_id)
          .eq('asn_sitespren_base', nwpiRecord.fk_sitespren_base);

        if (checkError) {
          console.error(`❌ Error checking for existing record:`, checkError);
          results.failed++;
          results.errors.push(`Failed to check existing record for "${nwpiRecord.post_title}": ${checkError.message}`);
          continue;
        }

        console.log(`🔍 Found ${existingRecords?.length || 0} existing records with same post_id/sitespren combination`);
        if (existingRecords && existingRecords.length > 1) {
          console.warn(`⚠️ WARNING: Multiple existing records found for post_id=${nwpiRecord.post_id}, sitespren=${nwpiRecord.fk_sitespren_base}`);
          existingRecords.forEach((rec, i) => {
            console.log(`  Record ${i + 1}: id=${rec.id}, g_post_id=${rec.g_post_id}, sitespren=${rec.asn_sitespren_base}`);
          });
        }

        const existingRecord = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

        if (existingRecord) {
          // UPDATE existing record instead of skipping
          console.log(`🔄 Updating existing record: post_id=${nwpiRecord.post_id}, sitespren=${nwpiRecord.fk_sitespren_base}`);
          console.log(`🔍 DEBUG - About to update gconData with keys:`, Object.keys(gconData));
          console.log(`🔍 DEBUG - mud_title in gconData:`, gconData.mud_title);
          console.log(`🔍 DEBUG - mud_content in gconData:`, gconData.mud_content ? `${gconData.mud_content.substring(0, 100)}...` : 'MISSING');
          // Removed complex JSON.stringify to avoid errors
          
          const { error: updateError } = await supabase
            .from('gcon_pieces')
            .update(gconData)
            .eq('id', existingRecord.id);

          if (updateError) {
            console.error(`❌ Failed to update record ${nwpiRecord.internal_post_id}:`, updateError);
            results.failed++;
            results.errors.push(`Failed to update "${nwpiRecord.post_title}": ${updateError.message}`);
          } else {
            // Verify what was actually saved by reading it back
            const { data: verifyData } = await supabase
              .from('gcon_pieces')
              .select('id, mud_title, mud_content, aval_title, aval_content')
              .eq('id', existingRecord.id)
              .single();
            
            console.log(`🔍 DEBUG - VERIFICATION after UPDATE - mud_title: ${verifyData?.mud_title}, mud_content length: ${verifyData?.mud_content?.length || 0}`);
            
            // Process dorli blocks and mud_deplines for updated record
            try {
              await processDorliBlocks(dorliBlocks, existingRecord.id, supabase);
              await processMudDeplines(mudDeplines, existingRecord.id, supabase);
              console.log(`✅ Successfully updated: ${nwpiRecord.post_title}`);
              results.succeeded++;
            } catch (error) {
              console.error(`❌ Failed to process blocks for updated record:`, error);
              results.failed++;
              results.errors.push(`Failed to process blocks for "${nwpiRecord.post_title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        } else {
          // Insert new record
          console.log(`🔍 DEBUG - About to insert gconData with keys:`, Object.keys(gconData));
          console.log(`🔍 DEBUG - mud_title in gconData:`, gconData.mud_title);
          console.log(`🔍 DEBUG - mud_content in gconData:`, gconData.mud_content ? `${gconData.mud_content.substring(0, 100)}...` : 'MISSING');
          // Removed complex JSON.stringify to avoid errors
          
          const { data: insertedData, error: insertError } = await supabase
            .from('gcon_pieces')
            .insert([gconData])
            .select('id')
            .single();

          if (insertError) {
            console.error(`❌ Failed to insert record ${nwpiRecord.internal_post_id}:`, insertError);
            results.failed++;
            results.errors.push(`Failed to insert "${nwpiRecord.post_title}": ${insertError.message}`);
          } else {
            // Verify what was actually saved by reading it back
            const { data: verifyData } = await supabase
              .from('gcon_pieces')
              .select('id, mud_title, mud_content, aval_title, aval_content')
              .eq('id', insertedData.id)
              .single();
            
            console.log(`🔍 DEBUG - VERIFICATION after INSERT - mud_title: ${verifyData?.mud_title}, mud_content length: ${verifyData?.mud_content?.length || 0}`);
            
            // Process dorli blocks and mud_deplines for new record
            try {
              await processDorliBlocks(dorliBlocks, insertedData.id, supabase);
              await processMudDeplines(mudDeplines, insertedData.id, supabase);
              console.log(`✅ Successfully inserted: ${nwpiRecord.post_title}`);
              results.succeeded++;
            } catch (error) {
              console.error(`❌ Failed to process blocks for new record:`, error);
              results.failed++;
              results.errors.push(`Failed to process blocks for "${nwpiRecord.post_title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }

      } catch (recordError) {
        console.error(`💥 Error processing record ${nwpiRecord.internal_post_id}:`, recordError);
        results.failed++;
        results.errors.push(`Error processing "${nwpiRecord.post_title}": ${recordError instanceof Error ? recordError.message : 'Unknown error'}`);
      }
    }

    console.log(`📈 f22_nwpi_to_gcon_pusher completed: ${results.succeeded}/${results.processed} successful`);

    const response = {
      success: true,
      message: `Processed ${results.processed} records: ${results.succeeded} succeeded, ${results.failed} failed`,
      results: results
    };
    
    console.log(`🔄 f22_nwpi_to_gcon_pusher: Sending response:`, response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('f22_nwpi_to_gcon_pusher API error:', error);
    const errorResponse = { 
      success: false, 
      message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      results: { processed: 0, succeeded: 0, failed: 0, errors: [] }
    };
    console.log(`🔄 f22_nwpi_to_gcon_pusher: Sending error response:`, errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Transform nwpi_content record to gcon_pieces format
function transformNwpiToGcon(nwpiRecord: any, userId: string) {
  const gconData: any = {
    fk_users_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Apply direct mappings
  for (const [nwpiField, gconField] of Object.entries(NWPI_TO_GCON_MAPPING.direct)) {
    if (nwpiRecord[nwpiField] !== null && nwpiRecord[nwpiField] !== undefined) {
      gconData[gconField] = nwpiRecord[nwpiField];
    }
  }

  // Apply additional direct mappings
  for (const [nwpiField, gconField] of Object.entries(NWPI_TO_GCON_MAPPING.additional_direct)) {
    if (nwpiRecord[nwpiField] !== null && nwpiRecord[nwpiField] !== undefined) {
      gconData[gconField] = nwpiRecord[nwpiField];
    }
  }

  // Apply transform mappings
  for (const [nwpiField, transformFn] of Object.entries(NWPI_TO_GCON_MAPPING.transform)) {
    if (nwpiRecord[nwpiField] !== null && nwpiRecord[nwpiField] !== undefined) {
      console.log(`🔍 DEBUG - Processing transform field: ${nwpiField} = "${nwpiRecord[nwpiField]?.substring(0, 50)}..."`);
      const transformed = transformFn(nwpiRecord);
      console.log(`🔍 DEBUG - Transform result for ${nwpiField}:`, Object.keys(transformed));
      Object.assign(gconData, transformed);
    } else {
      console.log(`🔍 DEBUG - Skipping transform field ${nwpiField}: value is null/undefined`);
    }
  }

  // Apply computed fields
  for (const [gconField, computeFn] of Object.entries(NWPI_TO_GCON_MAPPING.computed)) {
    const computed = computeFn(nwpiRecord);
    if (computed !== null && computed !== undefined) {
      gconData[gconField] = computed;
    }
  }

  return gconData;
}

// Process dorli blocks by inserting them into aval_dorlis table
async function processDorliBlocks(dorliBlocks: DorliBlock[], gconPieceId: string, supabase: any) {
  if (!dorliBlocks || dorliBlocks.length === 0) {
    return;
  }

  console.log(`🔄 Processing ${dorliBlocks.length} dorli blocks for gcon_piece: ${gconPieceId}`);

  // Clear existing dorli blocks for this gcon_piece (in case of updates)
  const { error: deleteError } = await supabase
    .from('aval_dorlis')
    .delete()
    .eq('fk_gcon_piece_id', gconPieceId);

  if (deleteError) {
    console.error('❌ Error clearing existing dorli blocks:', deleteError);
    throw new Error(`Failed to clear existing dorli blocks: ${deleteError.message}`);
  }

  // Insert new dorli blocks
  const dorliInserts = dorliBlocks.map(block => ({
    fk_gcon_piece_id: gconPieceId,
    tag: block.tag,
    placeholder: block.placeholder,
    raw: block.raw,
    line_count: block.line_count
  }));

  const { error: insertError } = await supabase
    .from('aval_dorlis')
    .insert(dorliInserts);

  if (insertError) {
    console.error('❌ Error inserting dorli blocks:', insertError);
    throw new Error(`Failed to insert dorli blocks: ${insertError.message}`);
  }

  console.log(`✅ Successfully inserted ${dorliBlocks.length} dorli blocks`);
}

// Process mud_deplines by inserting them into mud_deplines table
async function processMudDeplines(mudDeplines: MudDepline[], gconPieceId: string, supabase: any) {
  if (!mudDeplines || mudDeplines.length === 0) {
    return;
  }

  console.log(`🌊 Processing ${mudDeplines.length} mud_deplines for gcon_piece: ${gconPieceId}`);

  // Delete all existing mud_deplines for this gcon_piece
  const { error: deleteError } = await supabase
    .from('mud_deplines')
    .delete()
    .eq('fk_gcon_piece_id', gconPieceId);

  if (deleteError) {
    console.error('❌ Error clearing existing mud_deplines:', deleteError);
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
    console.error('❌ Error inserting mud_deplines:', insertError);
    throw new Error(`Failed to insert mud_deplines: ${insertError.message}`);
  }

  console.log(`✅ Successfully inserted ${mudDeplines.length} mud_deplines`);
}

// Generate slug from title if needed
function generateSlug(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}