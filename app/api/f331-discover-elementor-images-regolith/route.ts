import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Interface for actual image data found in Elementor content
interface DiscoveredImage {
  id: string;
  url: string;
  alt_text?: string;
  title?: string;
  description?: string;
  source_type: 'url' | 'attachment_id' | 'media_object';
  element_context: {
    element_type: string;
    widget_type?: string;
    settings_path: string;
    element_id?: string;
  };
  image_metadata?: {
    size?: string;
    width?: number;
    height?: number;
    attachment_id?: number;
  };
}

// Function to extract actual images from Elementor data
function discoverActualImages(data: any, path: string = '', level: number = 0): DiscoveredImage[] {
  const images: DiscoveredImage[] = [];
  
  if (!data || typeof data !== 'object') {
    return images;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      images.push(...discoverActualImages(item, `${path}[${index}]`, level));
    });
    return images;
  }

  // Function to process image value and extract URL/metadata
  const processImageValue = (value: any, field: string, elementData: any): DiscoveredImage | null => {
    let imageUrl = '';
    let sourceType: 'url' | 'attachment_id' | 'media_object' = 'url';
    let metadata: any = {};

    if (typeof value === 'string' && value.trim()) {
      // Direct URL string
      if (value.startsWith('http') || value.startsWith('//') || value.startsWith('/')) {
        imageUrl = value;
        sourceType = 'url';
      } else if (/^\d+$/.test(value)) {
        // Attachment ID as string
        sourceType = 'attachment_id';
        metadata.attachment_id = parseInt(value);
      }
    } else if (typeof value === 'number' && value > 0) {
      // Attachment ID as number
      sourceType = 'attachment_id';
      metadata.attachment_id = value;
    } else if (typeof value === 'object' && value !== null) {
      // Media object with URL and metadata
      if (value.url) {
        imageUrl = value.url;
        sourceType = 'media_object';
        metadata = {
          attachment_id: value.id,
          width: value.width,
          height: value.height,
          size: value.size
        };
      }
    }

    if (!imageUrl && sourceType !== 'attachment_id') {
      return null;
    }

    const imageId = `img_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: imageId,
      url: imageUrl || `[attachment_id:${metadata.attachment_id}]`,
      alt_text: value.alt || undefined,
      title: value.title || undefined,
      description: value.description || undefined,
      source_type: sourceType,
      element_context: {
        element_type: elementData.elType || 'unknown',
        widget_type: elementData.widgetType || undefined,
        settings_path: `${path}.${field}`,
        element_id: elementData.id
      },
      image_metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  };

  // Look for actual images in common image fields
  const imageFields = [
    'image', 'background_image', 'bg_image', 'icon_image', 'logo',
    'gallery', 'slider_images', 'carousel_images', 'carousel', 'hero_image',
    'featured_image', 'thumbnail', 'banner_image', 'media'
  ];

  // Check direct fields
  for (const field of imageFields) {
    if (data[field] !== undefined) {
      if ((field === 'gallery' || field === 'carousel') && Array.isArray(data[field])) {
        // Handle gallery and carousel arrays
        data[field].forEach((galleryItem: any, index: number) => {
          const image = processImageValue(galleryItem, `${field}[${index}]`, data);
          if (image) images.push(image);
        });
      } else {
        const image = processImageValue(data[field], field, data);
        if (image) images.push(image);
      }
    }
  }

  // Check settings object
  if (data.settings && typeof data.settings === 'object') {
    for (const field of imageFields) {
      if (data.settings[field] !== undefined) {
        if ((field === 'gallery' || field === 'carousel') && Array.isArray(data.settings[field])) {
          // Handle gallery and carousel arrays in settings
          data.settings[field].forEach((galleryItem: any, index: number) => {
            const image = processImageValue(galleryItem, `settings.${field}[${index}]`, data);
            if (image) images.push(image);
          });
        } else {
          const image = processImageValue(data.settings[field], `settings.${field}`, data);
          if (image) images.push(image);
        }
      }
    }
  }

  // Recursively search in nested structures
  const nestedFields = ['elements', 'columns', 'widgets', 'children', 'content'];
  for (const field of nestedFields) {
    if (data[field] && Array.isArray(data[field])) {
      data[field].forEach((item: any, index: number) => {
        images.push(...discoverActualImages(item, `${path}.${field}[${index}]`, level + 1));
      });
    }
  }

  // Search in any other object properties (but avoid infinite recursion)
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'settings' && !nestedFields.includes(key) && !imageFields.includes(key)) {
      if (typeof value === 'object' && value !== null && level < 10) {
        images.push(...discoverActualImages(value, `${path}.${key}`, level + 1));
      }
    }
  }

  return images;
}

// Parse Elementor data from various formats
function parseElementorData(elementorData: any): any {
  // If it's already an object/array, return as-is
  if (typeof elementorData === 'object' && elementorData !== null) {
    return elementorData;
  }

  // If it's a string, try to parse as JSON
  if (typeof elementorData === 'string') {
    try {
      return JSON.parse(elementorData);
    } catch {
      console.log('🔍 Attempting to parse serialized PHP data');
      return null;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gconPieceId } = body;

    if (!gconPieceId) {
      return NextResponse.json(
        { success: false, message: 'gconPieceId is required' },
        { status: 400 }
      );
    }

    console.log(`🖼️ f331_discover_elementor_images_regolith: Starting discovery for gcon_piece: ${gconPieceId}`);

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User record not found' },
        { status: 404 }
      );
    }

    // Fetch the gcon_piece record with pelementor_cached data
    const { data: gconPiece, error: gconError } = await supabase
      .from('gcon_pieces')
      .select('id, pelementor_cached, meta_title, asn_sitespren_base, post_name')
      .eq('id', gconPieceId)
      .eq('fk_users_id', userData.id)
      .single();

    if (gconError || !gconPiece) {
      return NextResponse.json(
        { success: false, message: 'Gcon piece not found or not accessible' },
        { status: 404 }
      );
    }

    console.log(`📄 Processing: ${gconPiece.meta_title} (${gconPiece.asn_sitespren_base}/${gconPiece.post_name})`);

    // Check if pelementor_cached has data
    if (!gconPiece.pelementor_cached) {
      return NextResponse.json({
        success: false,
        message: 'No Elementor data found in pelementor_cached field',
        details: 'This gcon_piece does not have Elementor data to analyze'
      });
    }

    // Parse the Elementor data
    const elementorData = parseElementorData(gconPiece.pelementor_cached);
    
    if (!elementorData) {
      return NextResponse.json({
        success: false,
        message: 'Unable to parse Elementor data',
        details: 'The pelementor_cached data format is not supported'
      });
    }

    console.log(`🔍 Parsed Elementor data successfully, starting actual images discovery...`);

    // Find all actual images in the Elementor data
    const actualImages = discoverActualImages(elementorData);

    console.log(`🖼️ Found ${actualImages.length} actual images`);

    // Prepare the discovery result
    const regolithResult = {
      gcon_piece_id: gconPieceId,
      discovery_timestamp: new Date().toISOString(),
      elementor_data_size: JSON.stringify(elementorData).length,
      total_images_found: actualImages.length,
      images_by_source_type: actualImages.reduce((acc: {[key: string]: number}, img) => {
        acc[img.source_type] = (acc[img.source_type] || 0) + 1;
        return acc;
      }, {}),
      images_by_element_type: actualImages.reduce((acc: {[key: string]: number}, img) => {
        const key = img.element_context.widget_type || img.element_context.element_type;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
      discovered_images: actualImages,
      processing_metadata: {
        processed_at: new Date().toISOString(),
        processor_version: '1.0.0',
        source_data_type: typeof gconPiece.pelementor_cached,
        discovery_method: 'regolith_analysis'
      }
    };

    // Save the discovery result to the database
    const { error: updateError } = await supabase
      .from('gcon_pieces')
      .update({ 
        discovered_images_regolith: regolithResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', gconPieceId);

    if (updateError) {
      console.error('❌ Error saving regolith discovery results:', updateError);
      return NextResponse.json(
        { success: false, message: 'Error saving regolith discovery results', error: updateError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Regolith discovery completed and saved successfully`);

    return NextResponse.json({
      success: true,
      message: `Successfully discovered ${actualImages.length} actual images`,
      data: {
        discovered_images_regolith: regolithResult
      },
      results: {
        gcon_piece: {
          id: gconPiece.id,
          title: gconPiece.meta_title,
          site: gconPiece.asn_sitespren_base,
          slug: gconPiece.post_name
        },
        discovery: {
          total_images: actualImages.length,
          images_by_source_type: regolithResult.images_by_source_type,
          images_by_element_type: regolithResult.images_by_element_type,
          elementor_data_size: regolithResult.elementor_data_size
        }
      }
    });

  } catch (error) {
    console.error('🚨 f331_discover_elementor_images_regolith API CRITICAL ERROR:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    );
  }
}