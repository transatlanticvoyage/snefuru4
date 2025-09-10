import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { restoreFromBackup } from '../shared/rhino-safety-lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backup_id, site_url, post_id, api_key } = body;

    if (!backup_id || !site_url || !post_id || !api_key) {
      return NextResponse.json(
        { error: 'Missing required fields: backup_id, site_url, post_id, api_key' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log(`🚨 Emergency restore: Backup ${backup_id} for ${site_url} post ${post_id}`);

    const restored = await restoreFromBackup(
      supabase,
      backup_id,
      site_url,
      post_id,
      api_key
    );

    if (restored) {
      return NextResponse.json({
        success: true,
        message: 'Emergency restore completed successfully',
        backup_id,
        post_id
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Restore operation failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('🚨 Emergency restore CRITICAL ERROR:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Emergency restore failed'
    }, { status: 500 });
  }
}