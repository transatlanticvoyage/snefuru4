import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/error-logger';

export async function POST(request: Request) {
  try {
    const { imageId, newFilename } = await request.json();
    
    if (!imageId || !newFilename) {
      return NextResponse.json({ 
        success: false, 
        message: 'Image ID and new filename are required' 
      }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not authenticated' 
      }, { status: 401 });
    }

    // Get user's DB id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();
      
    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Could not find user record' 
      }, { status: 400 });
    }

    // Get the image record from database to verify ownership and get current filename
    const { data: imageRecord, error: imageError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('rel_users_id', userData.id)
      .single();
      
    if (imageError || !imageRecord) {
      return NextResponse.json({ 
        success: false, 
        message: 'Image not found or access denied' 
      }, { status: 404 });
    }

    if (!imageRecord.img_file_url1) {
      return NextResponse.json({ 
        success: false, 
        message: 'No image URL found in database record' 
      }, { status: 400 });
    }

    const currentUrl = imageRecord.img_file_url1;
    
    await logger.info({
      category: 'tbn2_file_rename',
      message: `Tebnar2: Starting file rename for image ${imageId}`,
      details: {
        imageId: imageId,
        currentUrl: currentUrl,
        newFilename: newFilename,
        userId: userData.id,
        sourceSystem: 'tebnar2'
      }
    });

    // Extract storage path from URL
    const urlParts = currentUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'bucket-images-b1');
    if (bucketIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid Supabase storage URL format' 
      }, { status: 400 });
    }
    
    const currentStoragePath = urlParts.slice(bucketIndex + 1).join('/');
    const currentFilename = currentStoragePath.split('/').pop() || '';
    const currentExtension = currentFilename.includes('.') ? 
      currentFilename.substring(currentFilename.lastIndexOf('.')) : '.png';
    
    // Clean the new filename
    const cleanedFilename = newFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const newFullFilename = `${cleanedFilename}${currentExtension}`;
    
    // Create new storage path with the new filename
    const pathParts = currentStoragePath.split('/');
    pathParts[pathParts.length - 1] = newFullFilename;
    const newStoragePath = pathParts.join('/');

    console.log(`🔄 Renaming file: ${currentStoragePath} → ${newStoragePath}`);

    // Create a Supabase client with service role for storage operations
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if file exists at current path
    const { data: existingFile, error: existingFileError } = await supabaseAdmin.storage
      .from('bucket-images-b1')
      .download(currentStoragePath);

    if (existingFileError || !existingFile) {
      return NextResponse.json({ 
        success: false, 
        message: `Original file not found in storage: ${existingFileError?.message || 'File does not exist'}` 
      }, { status: 404 });
    }

    // Upload file with new name
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('bucket-images-b1')
      .upload(newStoragePath, existingFile, {
        contentType: 'image/png', // Assume PNG for now
        upsert: false // Don't overwrite if exists
      });

    if (uploadError) {
      if (uploadError.message.includes('already exists')) {
        return NextResponse.json({ 
          success: false, 
          message: `A file with the name "${newFullFilename}" already exists. Please choose a different name.` 
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        success: false, 
        message: `Failed to upload renamed file: ${uploadError.message}` 
      }, { status: 500 });
    }

    // Get public URL for the new file
    const { data: newUrlData } = supabaseAdmin.storage
      .from('bucket-images-b1')
      .getPublicUrl(newStoragePath);

    const newPublicUrl = newUrlData.publicUrl;

    // Update database record with new URL
    const { error: updateError } = await supabase
      .from('images')
      .update({
        img_file_url1: newPublicUrl
      })
      .eq('id', imageId);

    if (updateError) {
      // If database update fails, try to clean up the new file
      await supabaseAdmin.storage
        .from('bucket-images-b1')
        .remove([newStoragePath]);
        
      return NextResponse.json({ 
        success: false, 
        message: `Failed to update database: ${updateError.message}` 
      }, { status: 500 });
    }

    // Delete old file from storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from('bucket-images-b1')
      .remove([currentStoragePath]);

    if (deleteError) {
      console.warn(`⚠️ Warning: Could not delete old file ${currentStoragePath}: ${deleteError.message}`);
      // Don't fail the operation if we can't delete the old file
    }

    await logger.info({
      category: 'tbn2_file_rename',
      message: `Tebnar2: Successfully renamed file for image ${imageId}`,
      details: {
        imageId: imageId,
        oldUrl: currentUrl,
        newUrl: newPublicUrl,
        oldFilename: currentFilename,
        newFilename: newFullFilename,
        userId: userData.id,
        sourceSystem: 'tebnar2'
      }
    });

    return NextResponse.json({
      success: true,
      message: `File successfully renamed from "${currentFilename}" to "${newFullFilename}"`,
      oldUrl: currentUrl,
      newUrl: newPublicUrl,
      oldFilename: currentFilename,
      newFilename: newFullFilename,
      source_system: 'tebnar2'
    });

  } catch (error) {
    console.error('🚨 File rename error:', error);
    
    await logger.error({
      category: 'tbn2_file_rename',
      message: 'Tebnar2: File rename operation failed',
      details: {
        error: error instanceof Error ? error.message : String(error),
        sourceSystem: 'tebnar2'
      },
      stack_trace: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({ 
      success: false, 
      message: `File rename failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source_system: 'tebnar2'
    }, { status: 500 });
  }
}