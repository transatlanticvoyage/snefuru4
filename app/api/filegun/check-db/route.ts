import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check actual table contents
    const { data: files, error: filesError } = await supabase
      .from('filegun_files')
      .select('file_id, file_path, file_name, sync_status')
      .limit(10);

    const { data: folders, error: foldersError } = await supabase
      .from('filegun_folders')
      .select('folder_id, folder_path, folder_name, sync_status')
      .limit(10);

    // Get counts
    const { count: fileCount } = await supabase
      .from('filegun_files')
      .select('*', { count: 'exact', head: true });

    const { count: folderCount } = await supabase
      .from('filegun_folders')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: {
        counts: { fileCount, folderCount },
        sampleFiles: files || [],
        sampleFolders: folders || [],
        errors: { filesError, foldersError }
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}