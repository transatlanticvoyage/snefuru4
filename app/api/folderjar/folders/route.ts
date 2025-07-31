import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data, error } = await supabase
      .from('filegun_folders')
      .select('*')
      .order('file_system_created', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch folders', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['folder_path', 'folder_name'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Prepare the data for insertion
    const insertData = {
      folder_path: body.folder_path,
      folder_name: body.folder_name,
      folder_parent_path: body.folder_parent_path || null,
      depth: body.depth || null,
      file_system_created: body.file_system_created || new Date().toISOString(),
      file_system_modified: body.file_system_modified || new Date().toISOString(),
      last_accessed_at: body.last_accessed_at || new Date().toISOString(),
      last_sync_at: body.last_sync_at || new Date().toISOString(),
      is_protected: body.is_protected || false,
      permissions: body.permissions || null,
      checksum: body.checksum || null,
      sync_status: body.sync_status || 'synced',
      is_pinned: body.is_pinned || false
    };
    
    const { data, error } = await supabase
      .from('filegun_folders')
      .insert([insertData])
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create folder', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    if (!body.folder_id) {
      return NextResponse.json(
        { error: 'folder_id is required for updates' },
        { status: 400 }
      );
    }
    
    // Remove folder_id from update data
    const { folder_id, ...updateData } = body;
    
    const { data, error } = await supabase
      .from('filegun_folders')
      .update(updateData)
      .eq('folder_id', folder_id)
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update folder', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folder_id');
    
    if (!folderId) {
      return NextResponse.json(
        { error: 'folder_id is required for deletion' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('filegun_folders')
      .delete()
      .eq('folder_id', folderId)
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete folder', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}