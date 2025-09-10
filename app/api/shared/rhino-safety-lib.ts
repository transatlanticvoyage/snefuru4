/**
 * Rhino Replace Safety Library
 * Shared validation and safety functions for both Cliff and Mason
 */

export interface ImageUploadResult {
  nupload_id: number;
  nupload_status1: string;
  img_url_returned: string;
  wp_img_id_returned: number | null;
}

export interface ReplacementMap {
  [oldUrl: string]: ImageUploadResult;
}

export interface ValidationResult {
  success: boolean;
  error?: string;
  backup_id?: string;
}

export interface UpdateResult {
  success: boolean;
  replacements_made: number;
  backup_id?: string;
  error?: string;
  rollback_performed?: boolean;
}

/**
 * PHASE 1: PRE-UPDATE VALIDATION & BACKUP
 */

// Validate that all new image URLs are accessible
export async function validateImageUrls(uploadedImages: ImageUploadResult[]): Promise<boolean> {
  console.log(`🔍 Validating ${uploadedImages.length} image URLs...`);
  
  for (const image of uploadedImages) {
    if (!image.img_url_returned) {
      console.error(`❌ Missing URL for image ${image.nupload_id}`);
      return false;
    }
    
    try {
      const response = await fetch(image.img_url_returned, { method: 'HEAD', timeout: 5000 });
      if (!response.ok) {
        console.error(`❌ Invalid image URL (${response.status}): ${image.img_url_returned}`);
        return false;
      }
      console.log(`✅ Valid image: ${image.img_url_returned}`);
    } catch (error) {
      console.error(`❌ Failed to validate image URL: ${image.img_url_returned} - ${error}`);
      return false;
    }
  }
  
  console.log(`✅ All ${uploadedImages.length} image URLs validated successfully`);
  return true;
}

// Create backup of current Elementor data
export async function createElementorBackup(
  supabase: any,
  gcon_piece_id: string,
  current_data: any,
  reason: string = 'pre_rhino_replace'
): Promise<string> {
  console.log(`💾 Creating Elementor backup for gcon_piece: ${gcon_piece_id}`);
  
  const backup = {
    gcon_piece_id,
    backup_data: current_data,
    backup_timestamp: new Date().toISOString(),
    backup_reason: reason,
    backup_status: 'active'
  };
  
  const { data, error } = await supabase
    .from('elementor_backups')
    .insert(backup)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create backup: ${error.message}`);
  }
  
  console.log(`✅ Backup created with ID: ${data.id}`);
  return data.id;
}

// Validate Elementor data structure
export function validateElementorDataStructure(elementorData: any): boolean {
  console.log(`🔍 Validating Elementor data structure...`);
  
  try {
    // Parse if string
    let parsed = elementorData;
    if (typeof elementorData === 'string') {
      parsed = JSON.parse(elementorData);
    }
    
    // Must be array
    if (!Array.isArray(parsed)) {
      console.error(`❌ Elementor data must be an array, got: ${typeof parsed}`);
      return false;
    }
    
    // Check for required structure
    for (const element of parsed) {
      if (!element.id || !element.elType) {
        console.error(`❌ Invalid element structure - missing id or elType`);
        return false;
      }
    }
    
    console.log(`✅ Elementor data structure is valid`);
    return true;
    
  } catch (error) {
    console.error(`❌ Invalid Elementor data: ${error}`);
    return false;
  }
}

/**
 * PHASE 2: ENHANCED WIDGET DETECTION (Core Fixes)
 */

// Replace images with complete property preservation
export function replaceWithPropertyPreservation(
  imageObject: any, 
  oldUrl: string,
  newImage: ImageUploadResult
): boolean {
  if (!imageObject?.url || imageObject.url !== oldUrl) {
    return false;
  }
  
  console.log(`🔄 Replacing image object completely: ${oldUrl}`);
  
  // CRITICAL: Remove ALL old properties that might reference old image
  const keysToDelete = ['sizes', 'width', 'height', 'thumbnail', 'medium', 'large'];
  keysToDelete.forEach(key => {
    if (key in imageObject) {
      delete imageObject[key];
    }
  });
  
  // Set new image data with minimal required properties
  imageObject.url = newImage.img_url_returned;
  imageObject.id = newImage.wp_img_id_returned || '';
  
  // Reset to minimal valid state - Elementor will rebuild the rest
  imageObject.size = 'full';
  imageObject.source = 'library';
  imageObject.alt = '';
  
  console.log(`✅ Replaced image object with minimal valid structure for: ${newImage.img_url_returned}`);
  return true;
}

// Fixed carousel image replacement
export function replaceCarouselImages(carousel: any[], replacementMap: ReplacementMap): number {
  let count = 0;
  
  if (!Array.isArray(carousel)) return count;
  
  carousel.forEach((carouselItem, index) => {
    if (carouselItem?.url) {
      Object.keys(replacementMap).forEach(oldUrl => {
        if (replaceWithPropertyPreservation(carouselItem, oldUrl, replacementMap[oldUrl])) {
          console.log(`🖼️ FIXED: Updated carousel image [${index}]: ${oldUrl}`);
          count++;
        }
      });
    }
  });
  
  return count;
}

// Fixed gallery image replacement  
export function replaceGalleryImages(gallery: any[], replacementMap: ReplacementMap): number {
  let count = 0;
  
  if (!Array.isArray(gallery)) return count;
  
  gallery.forEach((galleryItem, index) => {
    if (galleryItem?.url) {
      Object.keys(replacementMap).forEach(oldUrl => {
        if (replaceWithPropertyPreservation(galleryItem, oldUrl, replacementMap[oldUrl])) {
          console.log(`🖼️ FIXED: Updated gallery image [${index}]: ${oldUrl}`);
          count++;
        }
      });
    }
  });
  
  return count;
}

// Fixed single image replacement
export function replaceSingleImage(imageSettings: any, replacementMap: ReplacementMap): number {
  let count = 0;
  
  if (imageSettings?.url) {
    Object.keys(replacementMap).forEach(oldUrl => {
      if (replaceWithPropertyPreservation(imageSettings, oldUrl, replacementMap[oldUrl])) {
        console.log(`🖼️ FIXED: Updated single image widget: ${oldUrl}`);
        count++;
      }
    });
  }
  
  return count;
}

// Fixed background image replacement with complete property preservation
export function replaceBackgroundImagesComplete(settings: any, replacementMap: ReplacementMap): number {
  let count = 0;
  
  // Standard background image
  if (settings.background_image?.url) {
    Object.keys(replacementMap).forEach(oldUrl => {
      if (replaceWithPropertyPreservation(settings.background_image, oldUrl, replacementMap[oldUrl])) {
        console.log(`🎨 FIXED: Updated background image with full property preservation: ${oldUrl}`);
        count++;
      }
    });
  }
  
  // Background overlay image
  if (settings.background_overlay_image?.url) {
    Object.keys(replacementMap).forEach(oldUrl => {
      if (replaceWithPropertyPreservation(settings.background_overlay_image, oldUrl, replacementMap[oldUrl])) {
        console.log(`🎨 FIXED: Updated background overlay image: ${oldUrl}`);
        count++;
      }
    });
  }
  
  // Check all other settings for image objects
  Object.keys(settings).forEach(key => {
    if (typeof settings[key] === 'object' && settings[key]?.url) {
      Object.keys(replacementMap).forEach(oldUrl => {
        if (replaceWithPropertyPreservation(settings[key], oldUrl, replacementMap[oldUrl])) {
          console.log(`🔧 FIXED: Updated setting ${key} with property preservation: ${oldUrl}`);
          count++;
        }
      });
    }
  });
  
  return count;
}

// Main enhanced widget detection function
export function replaceImagesInElementsFixed(
  elements: any, 
  replacementMap: ReplacementMap
): number {
  let count = 0;
  
  if (Array.isArray(elements)) {
    elements.forEach(element => {
      count += replaceImagesInElementsFixed(element, replacementMap);
    });
  } else if (typeof elements === 'object' && elements !== null) {
    
    // ✅ FIX 1: Correct image carousel detection
    if (elements.widgetType === 'image-carousel' && elements.settings?.carousel) {
      count += replaceCarouselImages(elements.settings.carousel, replacementMap);
    }
    
    // ✅ FIX 2: Image gallery widget
    if (elements.widgetType === 'image-gallery' && elements.settings?.gallery) {
      count += replaceGalleryImages(elements.settings.gallery, replacementMap);
    }
    
    // ✅ FIX 3: Single image widget
    if (elements.widgetType === 'image' && elements.settings?.image) {
      count += replaceSingleImage(elements.settings.image, replacementMap);
    }
    
    // ✅ FIX 4: All background image types with property preservation
    if (elements.settings) {
      count += replaceBackgroundImagesComplete(elements.settings, replacementMap);
    }
    
    // Check for other slide-based widgets (non-carousel)
    if (elements.settings?.slides && Array.isArray(elements.settings.slides)) {
      elements.settings.slides.forEach((slide: any) => {
        count += replaceImagesInElementsFixed(slide, replacementMap);
      });
    }
    
    // Recursive processing
    if (elements.elements && Array.isArray(elements.elements)) {
      count += replaceImagesInElementsFixed(elements.elements, replacementMap);
    }
    
    // Process other nested structures
    Object.keys(elements).forEach(key => {
      if (key !== 'elements' && key !== 'settings' && key !== 'widgetType') {
        if (typeof elements[key] === 'object') {
          count += replaceImagesInElementsFixed(elements[key], replacementMap);
        }
      }
    });
  }
  
  return count;
}

/**
 * PHASE 3: SAFE ROLLBACK MECHANISM
 */

// Restore from backup
export async function restoreFromBackup(
  supabase: any,
  backup_id: string,
  siteUrl: string,
  postId: number,
  apiKey: string
): Promise<boolean> {
  console.log(`🔄 Restoring from backup ID: ${backup_id}`);
  
  try {
    // Get backup data
    const { data: backup, error } = await supabase
      .from('elementor_backups')
      .select('*')
      .eq('id', backup_id)
      .single();
    
    if (error || !backup) {
      throw new Error(`Backup not found: ${backup_id}`);
    }
    
    // Restore to WordPress
    const restoreSuccess = await updateWordPressSafe(
      siteUrl, postId, backup.backup_data, apiKey
    );
    
    if (restoreSuccess) {
      // Mark backup as used
      await supabase
        .from('elementor_backups')
        .update({ backup_status: 'restored', restored_at: new Date().toISOString() })
        .eq('id', backup_id);
      
      console.log(`✅ Successfully restored from backup ${backup_id}`);
      return true;
    } else {
      throw new Error('WordPress restore failed');
    }
    
  } catch (error) {
    console.error(`❌ Restore failed: ${error}`);
    return false;
  }
}

// Safe WordPress update with validation
export async function updateWordPressSafe(
  siteUrl: string,
  postId: number,
  elementorData: any,
  apiKey: string
): Promise<boolean> {
  console.log(`🛡️ Performing safe WordPress update for post ${postId}`);
  
  // Validate data structure before sending
  if (!validateElementorDataStructure(elementorData)) {
    console.error(`❌ Invalid Elementor data structure - aborting update`);
    return false;
  }
  
  const endpoints = [
    { name: 'enhanced', url: `https://${siteUrl}/wp-json/snefuru/v1/posts/${postId}/elementor` },
    { name: 'native', url: `https://${siteUrl}/wp-json/snefuru/v1/posts/${postId}/elementor-native` },
    { name: 'legacy', url: `https://${siteUrl}/wp-json/snefuru/v1/posts/${postId}/elementor-legacy` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 Attempting safe update via ${endpoint.name}: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'RhinoReplace-Safe/2.0'
        },
        body: JSON.stringify({
          elementor_data: JSON.stringify(elementorData)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Safe WordPress update successful via ${endpoint.name}:`, result);
        return true;
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ ${endpoint.name} method failed: ${response.status} - ${errorText.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.warn(`⚠️ ${endpoint.name} method exception:`, error);
    }
  }
  
  console.error(`❌ All WordPress update methods failed`);
  return false;
}