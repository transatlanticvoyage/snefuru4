import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_NAME = 'bucket-images-b1';

export async function DELETE(req: NextRequest) {
  try {
    // Get authenticated user
    const supabaseAuth = createServerComponentClient({ cookies });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current avatar info
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('avatar_url, avatar_filename')
      .eq('auth_id', user.id)
      .single();

    if (userFetchError) {
      return NextResponse.json({ 
        error: 'Failed to fetch user data' 
      }, { status: 500 });
    }

    // Check if user has an avatar to delete
    if (!userData.avatar_filename || !userData.avatar_url) {
      return NextResponse.json({ 
        error: 'No avatar found to delete' 
      }, { status: 404 });
    }

    // Get first 4 characters of user's auth ID for folder structure
    const userFolderPrefix = user.id.substring(0, 4);
    const folderPath = `UserProfilePics/${userFolderPrefix}`;
    const fullPath = `${folderPath}/${userData.avatar_filename}`;

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fullPath]);

    if (deleteError) {
      console.error('Storage delete error:', deleteError);
      // Don't fail completely if storage delete fails - still update the database
    }

    // Update user record to remove avatar info
    const { error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: null,
        avatar_filename: null,
        avatar_uploaded_at: null,
        avatar_file_size: null,
        avatar_mime_type: null
      })
      .eq('auth_id', user.id);

    if (updateError) {
      return NextResponse.json({ 
        error: `Failed to update user record: ${updateError.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully'
    });

  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}