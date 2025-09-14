/**
 * SabertoothScreenshotImages - Advanced Image Screenshot and Replacement System
 * 
 * This function takes a screenshot of an originally captured image, replaces the original
 * with the screenshot version, and updates all associated database records.
 * 
 * Key functionality:
 * 1. Downloads the original image from Supabase
 * 2. Takes a screenshot of the image in its original size using puppeteer/playwright
 * 3. Uploads the screenshot to Supabase (replacing the original)
 * 4. Deletes the original image from Supabase storage
 * 5. Updates the database row in 'images' table with new URL and metadata
 */

import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import sharp from 'sharp';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Parse percentage range string and return random value within the range
 * @param rangeStr - String like "1-5%" or "3%" 
 * @returns Random percentage as decimal (e.g., 0.03 for 3%)
 */
function parseRandomPercentage(rangeStr: string): number {
  // Remove % symbol and trim whitespace
  const cleanStr = rangeStr.replace('%', '').trim();
  
  // Check if it's a range (contains dash)
  if (cleanStr.includes('-')) {
    const [minStr, maxStr] = cleanStr.split('-').map(s => s.trim());
    const min = parseFloat(minStr);
    const max = parseFloat(maxStr);
    
    if (isNaN(min) || isNaN(max)) {
      console.warn(`Invalid range format: ${rangeStr}, defaulting to 3%`);
      return 0.03;
    }
    
    // Generate random percentage between min and max
    const randomValue = min + Math.random() * (max - min);
    return randomValue / 100; // Convert to decimal
  } else {
    // Single value
    const value = parseFloat(cleanStr);
    if (isNaN(value)) {
      console.warn(`Invalid percentage format: ${rangeStr}, defaulting to 3%`);
      return 0.03;
    }
    return value / 100; // Convert to decimal
  }
}

interface SabertoothScreenshotResult {
  success: boolean;
  message: string;
  originalUrl?: string;
  screenshotUrl?: string;
  error?: string;
}

interface ImageRecord {
  id: string;
  img_file_url1: string;
  img_file_extension: string;
  img_file_size?: number;
  width?: number;
  height?: number;
  rel_users_id: string;
  rel_images_plans_id?: string;
  prompt1?: string;
  status?: string;
  function_used_to_fetch_the_image?: string;
}

/**
 * Main SabertoothScreenshotImages function
 * @param imageId - The ID of the image record in the database
 * @param userId - The user ID for authorization
 * @param alterpro - Optional alterpro settings for edge cropping
 * @returns Promise<SabertoothScreenshotResult>
 */
export async function SabertoothScreenshotImages(
  imageId: string, 
  userId: string,
  alterpro?: { enabled: boolean; edgePercentages: { top: string; bottom: string; left: string; right: string; } }
): Promise<SabertoothScreenshotResult> {
  
  let browser: any = null;
  
  try {
    console.log(`🦷 SabertoothScreenshotImages: Starting screenshot process for image ${imageId}`);
    
    // 1. Validate user access and get internal user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userId)
      .single();
      
    if (userError || !userData) {
      return {
        success: false,
        message: 'User not found or unauthorized',
        error: userError?.message || 'User validation failed'
      };
    }

    // 2. Get the image record from database
    const { data: imageRecord, error: imageError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('rel_users_id', userData.id)
      .single() as { data: ImageRecord | null, error: any };
      
    if (imageError || !imageRecord) {
      return {
        success: false,
        message: 'Image not found or access denied',
        error: imageError?.message || 'Image lookup failed'
      };
    }

    if (!imageRecord.img_file_url1) {
      return {
        success: false,
        message: 'No image URL found in database record',
        error: 'Missing img_file_url1 field'
      };
    }

    const originalUrl = imageRecord.img_file_url1;
    console.log(`🦷 SabertoothScreenshotImages: Found original image URL: ${originalUrl}`);

    // 3. Extract storage path from URL for later deletion
    const urlParts = originalUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'bucket-images-b1');
    if (bucketIndex === -1) {
      return {
        success: false,
        message: 'Invalid Supabase storage URL format',
        error: 'Could not parse bucket path from URL'
      };
    }
    const storagePath = decodeURIComponent(urlParts.slice(bucketIndex + 1).join('/'));
    
    // 4. Launch puppeteer browser
    console.log(`🦷 SabertoothScreenshotImages: Launching browser...`);
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // 5. Get original image dimensions
    let originalWidth = imageRecord.width || 1024;
    let originalHeight = imageRecord.height || 1024;
    
    // Try to get actual dimensions by downloading the image
    try {
      const imageResponse = await fetch(originalUrl);
      if (imageResponse.ok) {
        const imageBuffer = await imageResponse.arrayBuffer();
        const metadata = await sharp(Buffer.from(imageBuffer)).metadata();
        originalWidth = metadata.width || originalWidth;
        originalHeight = metadata.height || originalHeight;
        console.log(`🦷 SabertoothScreenshotImages: Detected original dimensions: ${originalWidth}x${originalHeight}`);
      }
    } catch (dimError) {
      console.warn(`🦷 SabertoothScreenshotImages: Could not detect dimensions, using defaults: ${originalWidth}x${originalHeight}`);
    }

    // 6. Set viewport to match original image size
    await page.setViewport({
      width: originalWidth,
      height: originalHeight,
      deviceScaleFactor: 1
    });

    // 7. Create HTML page with the image
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              overflow: hidden;
            }
            img { 
              max-width: 100%;
              max-height: 100vh;
              width: auto;
              height: auto;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${originalUrl}" alt="Original Image" onload="console.log('Image loaded')" onerror="console.error('Image failed to load')" />
        </body>
      </html>
    `;

    await page.setContent(htmlContent);
    
    // 8. Wait for image to load
    await page.waitForSelector('img');
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const img = document.querySelector('img') as HTMLImageElement;
        if (img.complete) {
          resolve(true);
        } else {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(true);
          setTimeout(() => resolve(true), 5000); // Timeout after 5 seconds
        }
      });
    });

    console.log(`🦷 SabertoothScreenshotImages: Taking screenshot...`);

    // 9. Calculate crop dimensions if alterpro is enabled
    let clipX = 0;
    let clipY = 0;
    let clipWidth = originalWidth;
    let clipHeight = originalHeight;
    
    if (alterpro?.enabled && alterpro.edgePercentages) {
      console.log(`🦷 SabertoothScreenshotImages: Alterpro enabled, calculating crop dimensions...`);
      
      // Parse random percentages for each edge
      const topPercent = parseRandomPercentage(alterpro.edgePercentages.top);
      const bottomPercent = parseRandomPercentage(alterpro.edgePercentages.bottom);
      const leftPercent = parseRandomPercentage(alterpro.edgePercentages.left);
      const rightPercent = parseRandomPercentage(alterpro.edgePercentages.right);
      
      console.log(`🦷 SabertoothScreenshotImages: Random edge percentages - Top: ${(topPercent * 100).toFixed(2)}%, Bottom: ${(bottomPercent * 100).toFixed(2)}%, Left: ${(leftPercent * 100).toFixed(2)}%, Right: ${(rightPercent * 100).toFixed(2)}%`);
      
      // Calculate crop offsets
      const topOffset = Math.floor(originalHeight * topPercent);
      const bottomOffset = Math.floor(originalHeight * bottomPercent);
      const leftOffset = Math.floor(originalWidth * leftPercent);
      const rightOffset = Math.floor(originalWidth * rightPercent);
      
      // Calculate final crop dimensions
      clipX = leftOffset;
      clipY = topOffset;
      clipWidth = originalWidth - leftOffset - rightOffset;
      clipHeight = originalHeight - topOffset - bottomOffset;
      
      // Ensure minimum dimensions
      clipWidth = Math.max(clipWidth, 50); // Minimum 50px width
      clipHeight = Math.max(clipHeight, 50); // Minimum 50px height
      
      console.log(`🦷 SabertoothScreenshotImages: Original: ${originalWidth}x${originalHeight}, Cropped: ${clipWidth}x${clipHeight} (offset: ${clipX},${clipY})`);
    }

    // 9. Take screenshot
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: {
        x: clipX,
        y: clipY,
        width: clipWidth,
        height: clipHeight
      }
    });

    // 10. Generate new filename for screenshot
    const originalFilename = storagePath.split('/').pop() || 'screenshot.png';
    const fileExtension = originalFilename.split('.').pop() || 'png';
    const baseFilename = originalFilename.replace(/\.[^/.]+$/, '');
    const screenshotFilename = `${baseFilename}_screenshot.${fileExtension}`;
    const screenshotStoragePath = storagePath.replace(originalFilename, screenshotFilename);

    console.log(`🦷 SabertoothScreenshotImages: Uploading screenshot to: ${screenshotStoragePath}`);

    // 11. Upload screenshot to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bucket-images-b1')
      .upload(screenshotStoragePath, screenshotBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Screenshot upload failed: ${uploadError.message}`);
    }

    // 12. Get public URL for the screenshot
    const { data: urlData } = supabase.storage
      .from('bucket-images-b1')
      .getPublicUrl(screenshotStoragePath);

    const screenshotUrl = urlData.publicUrl;
    console.log(`🦷 SabertoothScreenshotImages: Screenshot uploaded to: ${screenshotUrl}`);

    // 13. Update database record with new screenshot URL and metadata
    const { error: updateError } = await supabase
      .from('images')
      .update({
        img_file_url1: screenshotUrl,
        img_file_extension: 'png',
        img_file_size: screenshotBuffer.length,
        width: clipWidth,
        height: clipHeight,
        function_used_to_fetch_the_image: `${imageRecord.function_used_to_fetch_the_image || 'unknown'}_sabertooth_screenshot${alterpro?.enabled ? '_alterpro' : ''}`,
        status: 'screenshot_processed'
      })
      .eq('id', imageId);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    // 14. Delete original image from Supabase storage
    console.log(`🦷 SabertoothScreenshotImages: Deleting original image: ${storagePath}`);
    const { error: deleteError } = await supabase.storage
      .from('bucket-images-b1')
      .remove([storagePath]);

    if (deleteError) {
      console.warn(`🦷 SabertoothScreenshotImages: Warning - Could not delete original image: ${deleteError.message}`);
      // Don't fail the entire process if deletion fails
    }

    console.log(`🦷 SabertoothScreenshotImages: Process completed successfully!`);

    return {
      success: true,
      message: `Successfully created screenshot and updated database for image ${imageId}`,
      originalUrl: originalUrl,
      screenshotUrl: screenshotUrl
    };

  } catch (error) {
    console.error(`🦷 SabertoothScreenshotImages: Error processing image ${imageId}:`, error);
    
    return {
      success: false,
      message: `Screenshot processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
  } finally {
    // 15. Always clean up browser
    if (browser) {
      try {
        await browser.close();
        console.log(`🦷 SabertoothScreenshotImages: Browser closed`);
      } catch (closeError) {
        console.warn(`🦷 SabertoothScreenshotImages: Warning - Could not close browser:`, closeError);
      }
    }
  }
}

/**
 * Batch processing function to handle multiple images
 * @param imageIds - Array of image IDs to process
 * @param userId - The user ID for authorization
 * @param alterpro - Optional alterpro settings for edge cropping
 * @returns Promise<SabertoothScreenshotResult[]>
 */
export async function SabertoothBatchScreenshotImages(
  imageIds: string[],
  userId: string,
  alterpro?: { enabled: boolean; edgePercentages: { top: string; bottom: string; left: string; right: string; } }
): Promise<SabertoothScreenshotResult[]> {
  
  console.log(`🦷 SabertoothBatchScreenshotImages: Processing ${imageIds.length} images`);
  
  const results: SabertoothScreenshotResult[] = [];
  
  // Process images sequentially to avoid overwhelming the system
  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    console.log(`🦷 SabertoothBatchScreenshotImages: Processing ${i + 1}/${imageIds.length}: ${imageId}`);
    
    const result = await SabertoothScreenshotImages(imageId, userId, alterpro);
    results.push(result);
    
    // Add small delay between screenshots to be gentle on resources
    if (i < imageIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`🦷 SabertoothBatchScreenshotImages: Completed ${successCount}/${imageIds.length} screenshots successfully`);
  
  return results;
}