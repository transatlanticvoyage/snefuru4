import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Field mapping configuration
const NWPI_TO_GCON_MAPPING = {
  // Direct field mappings
  direct: {
    'fk_sitespren_base': 'asn_sitespren_base',
    'post_name': 'pageslug',
    'post_id': 'g_post_id',
    'post_status': 'g_post_status',
    'post_type': 'g_post_type',
  },
  
  // Transform mappings with functions
  transform: {
    'post_title': (data: any) => ({
      'meta_title': data.post_title,
      'h1title': data.post_title,
      'pgb_h1title': data.post_title
    }),
    'post_content': (data: any) => ({
      'corpus1': data.post_content || ''
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
        
        // Transform the record using the mapping configuration
        const gconData = transformNwpiToGcon(nwpiRecord, userData.id);
        
        console.log(`🔄 Processing: ${nwpiRecord.post_title} (ID: ${nwpiRecord.internal_post_id})`);

        // Check if record already exists based on g_post_id, sitespren_base, and user
        const { data: existingRecord } = await supabase
          .from('gcon_pieces')
          .select('id')
          .eq('fk_users_id', userData.id)
          .eq('g_post_id', nwpiRecord.post_id)
          .eq('asn_sitespren_base', nwpiRecord.fk_sitespren_base)
          .single();

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