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
      'aval_title': data.post_title
    }),
    'post_content': (data: any) => ({
      'corpus1': data.post_content || '',
      'aval_content': bozoHTMLNormalizationProcess1(data.post_content || '')
    }),
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

// BozoHTMLNormalizationProcess1
function bozoHTMLNormalizationProcess1(html: string): string {
  if (!html || html.trim() === '') {
    return '';
  }

  try {
    // Create a temporary DOM element to parse HTML
    let cleanHtml = html;
    
    // Remove script and style elements completely
    cleanHtml = cleanHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Convert block-level elements to text + newline
    // Handle headings (h1-h6)
    cleanHtml = cleanHtml.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '$1\n');
    
    // Handle paragraphs
    cleanHtml = cleanHtml.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n');
    
    // Handle divs
    cleanHtml = cleanHtml.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n');
    
    // Handle list items
    cleanHtml = cleanHtml.replace(/<li[^>]*>(.*?)<\/li>/gi, '$1\n');
    
    // Handle other block elements
    cleanHtml = cleanHtml.replace(/<(blockquote|article|section|header|footer|main|aside)[^>]*>(.*?)<\/\1>/gi, '$2\n');
    
    // Handle line breaks and horizontal rules
    cleanHtml = cleanHtml.replace(/<br[^>]*>/gi, '\n');
    cleanHtml = cleanHtml.replace(/<hr[^>]*>/gi, '\n');
    
    // Remove remaining HTML tags (keeping inline content)
    cleanHtml = cleanHtml.replace(/<[^>]+>/g, '');
    
    // Decode HTML entities
    cleanHtml = cleanHtml
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    
    // Clean up whitespace and normalize line breaks
    const lines = cleanHtml.split(/\r?\n/);
    const normalizedLines = lines
      .map(line => line.trim()) // Trim whitespace from each line
      .filter(line => line.length > 0); // Remove empty lines
    
    // Join with single newlines
    const result = normalizedLines.join('\n');
    
    console.log(`🔄 BozoHTMLNormalizationProcess1: Converted ${html.length} chars HTML to ${result.length} chars plaintext with ${normalizedLines.length} lines`);
    
    return result;
    
  } catch (error) {
    console.error('❌ BozoHTMLNormalizationProcess1 error:', error);
    // Fallback: return the original content with basic cleanup
    return html.replace(/<[^>]+>/g, '').trim();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordIds = [], pushAll = false } = body;

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
          
          const { error: updateError } = await supabase
            .from('gcon_pieces')
            .update(gconData)
            .eq('id', existingRecord.id);

          if (updateError) {
            console.error(`❌ Failed to update record ${nwpiRecord.internal_post_id}:`, updateError);
            results.failed++;
            results.errors.push(`Failed to update "${nwpiRecord.post_title}": ${updateError.message}`);
          } else {
            console.log(`✅ Successfully updated: ${nwpiRecord.post_title}`);
            results.succeeded++;
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('gcon_pieces')
            .insert([gconData]);

          if (insertError) {
            console.error(`❌ Failed to insert record ${nwpiRecord.internal_post_id}:`, insertError);
            results.failed++;
            results.errors.push(`Failed to insert "${nwpiRecord.post_title}": ${insertError.message}`);
          } else {
            console.log(`✅ Successfully inserted: ${nwpiRecord.post_title}`);
            results.succeeded++;
          }
        }

      } catch (recordError) {
        console.error(`💥 Error processing record ${nwpiRecord.internal_post_id}:`, recordError);
        results.failed++;
        results.errors.push(`Error processing "${nwpiRecord.post_title}": ${recordError instanceof Error ? recordError.message : 'Unknown error'}`);
      }
    }

    console.log(`📈 f22_nwpi_to_gcon_pusher completed: ${results.succeeded}/${results.processed} successful`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} records: ${results.succeeded} succeeded, ${results.failed} failed`,
      results: results
    });

  } catch (error) {
    console.error('f22_nwpi_to_gcon_pusher API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
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
      const transformed = transformFn(nwpiRecord);
      Object.assign(gconData, transformed);
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