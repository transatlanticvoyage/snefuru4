import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test Supabase connection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Supabase client created');

    // Test if tables exist by trying to count records
    const { count: filesCount, error: filesError } = await supabase
      .from('filegun_files')
      .select('*', { count: 'exact', head: true });

    const { count: foldersCount, error: foldersError } = await supabase
      .from('filegun_folders')
      .select('*', { count: 'exact', head: true });

    console.log('Files table count:', filesCount, 'Error:', filesError);
    console.log('Folders table count:', foldersCount, 'Error:', foldersError);

    if (filesError || foldersError) {
      return NextResponse.json({
        success: false,
        error: 'Tables not found or accessible',
        details: { filesError, foldersError }
      });
    }

    // Test inserting a simple record
    const testFile = {
      file_path: '/test/sample.txt',
      file_name: 'sample.txt',  
      file_parent_path: '/test',
      file_size: 100,
      file_system_created: new Date().toISOString(),
      file_system_modified: new Date().toISOString(),
      sync_status: 'synced'
    };

    console.log('Attempting to insert test record:', testFile);

    const { data: insertData, error: insertError } = await supabase
      .from('filegun_files')
      .insert(testFile)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to insert test record',
        details: insertError,
        counts: { filesCount, foldersCount }
      });
    }

    console.log('Insert successful:', insertData);

    // Clean up test record
    await supabase
      .from('filegun_files')
      .delete()
      .eq('file_path', '/test/sample.txt');

    return NextResponse.json({
      success: true,
      message: 'Database connection and operations working!',
      data: {
        filesCount,
        foldersCount,
        testInsert: insertData
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}