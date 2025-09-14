import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SabertoothScreenshotImages, SabertoothBatchScreenshotImages } from '@/app/(protected)/bin34/tebnar2/utils/SabertoothScreenshotImages';
import { logger } from '@/lib/error-logger';

export async function POST(request: Request) {
  try {
    const { imageId, imageIds, batchId } = await request.json();
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
    }

    // Get user's DB id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();
    if (userError || !userData) {
      return NextResponse.json({ success: false, message: 'Could not find user record' }, { status: 400 });
    }

    await logger.info({
      category: 'tbn2_sabertooth_screenshot',
      message: `Tebnar2: Starting SabertoothScreenshotImages process`,
      details: {
        userId: userData.id,
        singleImageId: imageId || null,
        batchImageIds: imageIds || null,
        batchId: batchId || null,
        requestType: imageId ? 'single' : 'batch',
        sourceSystem: 'tebnar2'
      },
      batch_id: batchId || undefined
    });

    let results;
    
    if (imageId) {
      // Process single image
      console.log(`🦷 API: Processing single image: ${imageId}`);
      results = [await SabertoothScreenshotImages(imageId, session.user.id)];
    } else if (imageIds && Array.isArray(imageIds)) {
      // Process multiple images
      console.log(`🦷 API: Processing batch of ${imageIds.length} images`);
      results = await SabertoothBatchScreenshotImages(imageIds, session.user.id);
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Either imageId or imageIds array must be provided' 
      }, { status: 400 });
    }

    // Count successes and failures
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    const overallSuccess = successCount > 0;
    const message = results.length === 1 
      ? results[0].message
      : `Processed ${results.length} images: ${successCount} successful, ${failureCount} failed`;

    await logger.info({
      category: 'tbn2_sabertooth_screenshot',
      message: `Tebnar2: SabertoothScreenshotImages process completed`,
      details: {
        totalImages: results.length,
        successfulScreenshots: successCount,
        failedScreenshots: failureCount,
        overallSuccess: overallSuccess,
        sourceSystem: 'tebnar2',
        results: results.map(r => ({
          success: r.success,
          message: r.message,
          originalUrl: r.originalUrl,
          screenshotUrl: r.screenshotUrl
        }))
      },
      batch_id: batchId || undefined
    });

    return NextResponse.json({
      success: overallSuccess,
      message: `🦷 Sabertooth: ${message}`,
      results: results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      },
      source_system: 'tebnar2'
    });

  } catch (error) {
    console.error('🦷 SabertoothScreenshotImages API Error:', error);
    
    await logger.error({
      category: 'tbn2_sabertooth_screenshot',
      message: `Tebnar2: SabertoothScreenshotImages API error`,
      details: {
        error: error instanceof Error ? error.message : String(error),
        sourceSystem: 'tebnar2'
      },
      stack_trace: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({ 
      success: false, 
      message: `🦷 Sabertooth Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source_system: 'tebnar2'
    }, { status: 500 });
  }
}