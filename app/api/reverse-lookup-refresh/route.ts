import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting reverse lookup refresh process...');
    const startTime = Date.now();
    
    const { keyword_ids } = await request.json();
    
    if (!keyword_ids || !Array.isArray(keyword_ids) || keyword_ids.length === 0) {
      return NextResponse.json(
        { error: 'keyword_ids array is required' },
        { status: 400 }
      );
    }

    console.log(`📋 Processing reverse lookup for ${keyword_ids.length} keywords...`);

    // Get the reverse lookup data from cncglub
    // This query finds all cncglub records where kwslot1 matches any of our keyword_ids
    const { data: reverseLookupData, error: lookupError } = await supabase
      .from('cncglub')
      .select('cncg_id, kwslot1')
      .in('kwslot1', keyword_ids)
      .not('kwslot1', 'is', null);

    if (lookupError) {
      console.error('❌ Error fetching reverse lookup data:', lookupError);
      throw lookupError;
    }

    console.log(`🔍 Found ${reverseLookupData?.length || 0} reverse lookup matches`);

    // Group the cncg_ids by kwslot1 (keyword_id)
    const lookupMap: Record<number, number[]> = {};
    
    if (reverseLookupData) {
      reverseLookupData.forEach(item => {
        const keywordId = item.kwslot1;
        const cncgId = item.cncg_id;
        
        if (!lookupMap[keywordId]) {
          lookupMap[keywordId] = [];
        }
        lookupMap[keywordId].push(cncgId);
      });
    }

    console.log(`📊 Lookup map created for ${Object.keys(lookupMap).length} keywords`);

    // Update the cached_cncglub_ids field for each keyword
    let updateCount = 0;
    const batchSize = 50;
    
    for (let i = 0; i < keyword_ids.length; i += batchSize) {
      const batch = keyword_ids.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(keyword_ids.length/batchSize)}: ${batch.length} keywords`);
      
      // Prepare batch updates
      const updates = batch.map(keywordId => {
        const cncgIds = lookupMap[keywordId] || [];
        const cachedValue = cncgIds.length > 0 ? cncgIds.join(',') : null;
        
        return {
          keyword_id: keywordId,
          cached_cncglub_ids: cachedValue
        };
      });

      // Perform batch update
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('keywordshub')
          .update({ cached_cncglub_ids: update.cached_cncglub_ids })
          .eq('keyword_id', update.keyword_id);

        if (updateError) {
          console.error(`❌ Failed to update keyword ${update.keyword_id}:`, updateError);
        } else {
          updateCount++;
        }
      }
    }

    const totalTime = Date.now() - startTime;
    
    console.log(`✅ Reverse lookup refresh completed:`);
    console.log(`   - Keywords processed: ${keyword_ids.length}`);
    console.log(`   - Cache entries updated: ${updateCount}`);
    console.log(`   - Reverse lookup matches found: ${reverseLookupData?.length || 0}`);
    console.log(`   - Processing time: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);

    return NextResponse.json({
      success: true,
      message: 'Reverse lookup refresh completed',
      processed: keyword_ids.length,
      updated: updateCount,
      matches_found: reverseLookupData?.length || 0,
      processing_time_ms: totalTime
    });

  } catch (error) {
    console.error('💥 Reverse lookup refresh failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refresh reverse lookup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}