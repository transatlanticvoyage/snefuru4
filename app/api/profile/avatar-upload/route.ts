import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_NAME = 'bucket-images-b1';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const supabaseAuth = createServerComponentClient({ cookies });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB' 
      }, { status: 400 });
    }

    // Get first 4 characters of user's auth ID for folder structure
    const userFolderPrefix = user.id.substring(0, 4);
    const folderPath = `UserProfilePics/${userFolderPrefix}`;

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `avatar-${timestamp}.${fileExtension}`;
    const fullPath = `${folderPath}/${filename}`;

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();

    // Get user's current avatar to delete old one later
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

    // Upload new file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fullPath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json({ 
        error: `Upload failed: ${uploadError.message}` 
      }, { status: 500 });
    }

    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fullPath);

    // Update user record with new avatar info
    const { error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: publicUrlData.publicUrl,
        avatar_filename: filename,
        avatar_uploaded_at: new Date().toISOString(),
        avatar_file_size: file.size,
        avatar_mime_type: file.type
      })
      .eq('auth_id', user.id);

    if (updateError) {
      // If user update fails, try to clean up uploaded file
      await supabase.storage.from(BUCKET_NAME).remove([fullPath]);
      return NextResponse.json({ 
        error: `Failed to update user record: ${updateError.message}` 
      }, { status: 500 });
    }

    // Delete old avatar if it exists
    if (userData.avatar_filename && userData.avatar_url) {
      const oldPath = `${folderPath}/${userData.avatar_filename}`;
      await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
    }

    return NextResponse.json({
      success: true,
      avatar_url: publicUrlData.publicUrl,
      message: 'Avatar uploaded successfully'
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}