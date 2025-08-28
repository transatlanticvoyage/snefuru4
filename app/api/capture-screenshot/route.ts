import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { chromium } from 'playwright';
import path from 'path';

interface ScreenshotRequest {
  sitespren_id: string;
  sitespren_base: string;
  force_refresh?: boolean;
}

interface ScreenshotResult {
  success: boolean;
  image_url?: string;
  error?: string;
  version_number?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ScreenshotRequest;
    const { sitespren_id, sitespren_base, force_refresh = false } = body;

    if (!sitespren_id || !sitespren_base) {
      return NextResponse.json(
        { error: 'Missing required fields: sitespren_id, sitespren_base' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get the database user ID
    const { data: dbUser, error: dbUserError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (dbUserError || !dbUser) {
      return NextResponse.json(
        { error: 'Database user record not found' },
        { status: 404 }
      );
    }

    console.log('🔍 Screenshot capture request:', { sitespren_id, sitespren_base, user_id: dbUser.id });

    // Validate sitespren ownership
    const { data: sitesprenData, error: sitesprenError } = await supabase
      .from('sitespren')
      .select('id, sitespren_base, screenshot_url, screenshot_taken_at, screenshot_status')
      .eq('id', sitespren_id)
      .eq('fk_users_id', dbUser.id)
      .single();

    console.log('🔍 Database query result:', { sitesprenData, sitesprenError, query: { id: sitespren_id, fk_users_id: dbUser.id } });

    if (sitesprenError || !sitesprenData) {
      console.error('❌ Sitespren lookup failed:', { error: sitesprenError, sitesprenData, sitespren_id, user_id: dbUser.id });
      return NextResponse.json(
        { error: 'Sitespren site not found or access denied' },
        { status: 404 }
      );
    }

    // Check if we need to capture a new screenshot
    if (!force_refresh && sitesprenData.screenshot_url) {
      const lastUpdate = sitesprenData.screenshot_taken_at ? new Date(sitesprenData.screenshot_taken_at) : null;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastUpdate && lastUpdate > oneHourAgo) {
        console.log('⏰ Using cached screenshot (less than 1 hour old)');
        return NextResponse.json({
          success: true,
          image_url: sitesprenData.screenshot_url,
          cached: true
        });
      }
    }

    // Since there's no version column in the schema, we'll use a timestamp-based approach
    const nextVersion = Date.now();

    // Use the actual sitespren_base including periods for folder naming
    // Create folder structure: SitesprenSnailScreenshots/{user_id}/{sitespren_base}/
    const folderPath = `SitesprenSnailScreenshots/${dbUser.id}/${sitespren_base}`;
    const fileName = `${sitespren_base}_screenshot_${nextVersion}.jpg`;
    const fullPath = `${folderPath}/${fileName}`;

    console.log('📁 Screenshot storage path:', { folderPath, fileName, fullPath });

    // Capture screenshot using Playwright
    const screenshotBuffer = await captureWebsiteScreenshot(sitespren_base);
    
    if (!screenshotBuffer) {
      return NextResponse.json(
        { error: 'Failed to capture screenshot' },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bucket-images-b1')
      .upload(fullPath, screenshotBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload screenshot: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from('bucket-images-b1')
      .getPublicUrl(fullPath);

    const publicUrl = urlData.publicUrl;

    // Update sitespren record with new screenshot info
    const { error: updateError } = await supabase
      .from('sitespren')
      .update({
        screenshot_url: publicUrl,
        screenshot_taken_at: new Date().toISOString(),
        screenshot_status: 'completed'
      })
      .eq('id', sitespren_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      // Don't fail the request - screenshot was captured successfully
    }

    // Clean up old versions (keep max 5) - commented out for now since we're using timestamp-based naming
    // await cleanupOldVersions(supabase, folderPath, sanitizedSitesprenBase, nextVersion);

    console.log('✅ Screenshot captured successfully:', { url: publicUrl });

    return NextResponse.json({
      success: true,
      image_url: publicUrl
    });

  } catch (error) {
    console.error('Screenshot capture error:', error);
    return NextResponse.json(
      { error: 'Internal server error during screenshot capture' },
      { status: 500 }
    );
  }
}

// Capture website screenshot using Playwright
async function captureWebsiteScreenshot(sitesprenBase: string): Promise<Buffer | null> {
  let browser = null;
  
  try {
    console.log('🎭 Launching Playwright browser for:', sitesprenBase);
    
    // Ensure URL has protocol
    const url = sitesprenBase.startsWith('http') 
      ? sitesprenBase 
      : `https://${sitesprenBase}`;

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--ignore-certificate-errors'
      ]
    });

    const page = await browser.newPage();

    // Set viewport for 16:9 ratio (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Set user agent to avoid bot detection
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // Navigate with timeout and wait for network idle
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait a bit more for dynamic content
    await page.waitForTimeout(2000);

    // Take screenshot in JPEG format for optimal compression
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      fullPage: false // Viewport only for consistent 16:9 ratio
    });

    console.log('📸 Screenshot captured successfully, size:', screenshot.length, 'bytes');

    return Buffer.from(screenshot);

  } catch (error) {
    console.error('Playwright screenshot error:', error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Clean up old screenshot versions (keep max 5)
async function cleanupOldVersions(
  supabase: any, 
  folderPath: string, 
  sanitizedSitesprenBase: string, 
  currentVersion: number
) {
  try {
    if (currentVersion <= 5) return; // Don't cleanup until we have more than 5 versions

    const versionsToDelete = [];
    const keepVersions = 5;
    const oldestVersionToKeep = currentVersion - keepVersions + 1;

    // Generate list of old versions to delete
    for (let version = 1; version < oldestVersionToKeep; version++) {
      const oldFileName = `${sanitizedSitesprenBase}_snail_image_${version}.webp`;
      const oldFilePath = `${folderPath}/${oldFileName}`;
      versionsToDelete.push(oldFilePath);
    }

    if (versionsToDelete.length > 0) {
      console.log('🗑️ Cleaning up old screenshot versions:', versionsToDelete);
      
      const { error: deleteError } = await supabase.storage
        .from('sitespren-images')
        .remove(versionsToDelete);

      if (deleteError) {
        console.error('Cleanup error (non-critical):', deleteError);
      }
    }

  } catch (error) {
    console.error('Cleanup error (non-critical):', error);
  }
}