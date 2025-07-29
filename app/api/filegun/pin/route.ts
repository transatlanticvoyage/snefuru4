import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { path, isPinned } = await request.json();
    console.log('PIN API - Received request:', { path, isPinned });

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Path is required' },
        { status: 400 }
      );
    }

    // First, try to update existing folder
    console.log('PIN API - Attempting to update existing folder:', path);
    const { data: updateData, error: updateError } = await supabase
      .from('filegun_folders')
      .update({ is_pinned: isPinned })
      .eq('folder_path', path)
      .select();
    
    console.log('PIN API - Update result:', { updateData, updateError });

    // If no rows were updated, the folder doesn't exist in DB yet, so insert it
    if (updateData && updateData.length === 0) {
      console.log('PIN API - Folder not found, creating new entry');
      
      // Extract folder name from path
      const folderName = path.split('/').pop() || path;
      const folderParentPath = path === '/' ? null : path.substring(0, path.lastIndexOf('/')) || '/';
      const depth = path.split('/').length - 1;
      
      const insertPayload = {
        folder_path: path,
        folder_name: folderName,
        folder_parent_path: folderParentPath,
        depth: depth,
        file_system_created: new Date().toISOString(),
        file_system_modified: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        is_protected: false, // Assume not protected for manually pinned folders
        permissions: null,
        checksum: `manual-${Date.now()}`, // Simple checksum for manually created entries
        is_pinned: isPinned,
        sync_status: 'synced', // Use valid sync status
        last_sync_at: new Date().toISOString()
      };
      
      console.log('PIN API - Insert payload:', insertPayload);
      
      const { data: insertData, error: insertError } = await supabase
        .from('filegun_folders')
        .insert(insertPayload)
        .select();

      console.log('PIN API - Insert result:', { insertData, insertError });

      if (insertError) {
        console.error('PIN API - Database insert error details:', {
          error: insertError,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        return NextResponse.json(
          { success: false, error: `Failed to create and pin folder: ${insertError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: insertData[0],
        message: `Folder ${isPinned ? 'pinned' : 'unpinned'} successfully`
      });
    }

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update pin status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updateData[0],
      message: `Folder ${isPinned ? 'pinned' : 'unpinned'} successfully`
    });

  } catch (error) {
    console.error('Pin toggle error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all pinned folders
    const { data, error } = await supabase
      .from('filegun_folders')
      .select('folder_path, folder_name, is_pinned')
      .eq('is_pinned', true)
      .eq('sync_status', 'synced')
      .order('folder_name');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pinned folders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Get pinned folders error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}