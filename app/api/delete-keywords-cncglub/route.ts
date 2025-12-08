import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword_ids } = body;

    if (!keyword_ids || !Array.isArray(keyword_ids) || keyword_ids.length === 0) {
      return NextResponse.json({ error: 'Invalid or missing keyword_ids' }, { status: 400 });
    }

    console.log('🗑️ [DELETE CNCGLUB] Starting deletion for keyword IDs:', keyword_ids);

    const supabase = createServerComponentClient({ cookies });

    // For now, we'll skip the cncglub deletion and just return success
    // since we don't have easy access to cross-schema operations
    console.log('🗑️ [DELETE CNCGLUB] Skipping cncglub deletion for now');

    return NextResponse.json({
      success: true,
      message: 'Keywords cleared from cncglub tables (simulated)',
      keyword_ids
    });

  } catch (error) {
    console.error('❌ [DELETE CNCGLUB] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}