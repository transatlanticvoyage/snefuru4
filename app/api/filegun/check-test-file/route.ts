import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look for our test file
    const { data: testFile, error } = await supabase
      .from('filegun_files')
      .select('*')
      .eq('file_name', 'test-sentinel-sync.txt')
      .single();

    return NextResponse.json({
      success: true,
      data: {
        fileFound: !!testFile,
        fileData: testFile,
        error: error
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}