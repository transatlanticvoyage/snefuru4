import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Interface for image cradle locations in Elementor data
interface ImageCradle {
  id: string;
  element_type: string;
  widget_type?: string;
  settings_path: string;
  current_value?: string;
  description: string;
  position_info: {
    section_id?: string;
    column_id?: string;
    widget_id?: string;
    nested_level: number;
  };
}

// Function to recursively search for image locations in Elementor data
function findImageCradles(data: any, path: string = '', level: number = 0): ImageCradle[] {
  const cradles: ImageCradle[] = [];
  
  if (!data || typeof data !== 'object') {
    return cradles;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      cradles.push(...findImageCradles(item, `${path}[${index}]`, level));
    });
    return cradles;
  }

  // Check for image-related fields in current object
  const imageFields = [
    'image', 'background_image', 'bg_image', 'icon_image', 'logo',
    'gallery', 'slider_images', 'carousel_images', 'hero_image',
    'featured_image', 'thumbnail', 'banner_image', 'media'
  ];

  for (const field of imageFields) {
    if (data[field] !== undefined) {
      const cradleId = data.id || `generated_${Math.random().toString(36).substr(2, 9)}`;
      
      cradles.push({
        id: cradleId,
        element_type: data.elType || 'unknown',
        widget_type: data.widgetType || undefined,
        settings_path: `${path}.${field}`,
        current_value: typeof data[field] === 'object' ? JSON.stringify(data[field]) : data[field],
        description: `${field} in ${data.elType || 'element'} ${data.widgetType ? `(${data.widgetType})` : ''}`,
        position_info: {
          section_id: level === 0 ? cradleId : undefined,
          column_id: level === 1 ? cradleId : undefined,
          widget_id: level === 2 ? cradleId : undefined,
          nested_level: level
        }
      });
    }
  }

  // Check settings object specifically
  if (data.settings && typeof data.settings === 'object') {
    for (const field of imageFields) {
      if (data.settings[field] !== undefined) {
        const cradleId = data.id || `generated_${Math.random().toString(36).substr(2, 9)}`;
        
        cradles.push({
          id: cradleId,
          element_type: data.elType || 'unknown',
          widget_type: data.widgetType || undefined,
          settings_path: `${path}.settings.${field}`,
          current_value: typeof data.settings[field] === 'object' ? JSON.stringify(data.settings[field]) : data.settings[field],
          description: `${field} in settings of ${data.elType || 'element'} ${data.widgetType ? `(${data.widgetType})` : ''}`,
          position_info: {
            section_id: level === 0 ? cradleId : undefined,
            column_id: level === 1 ? cradleId : undefined,
            widget_id: level === 2 ? cradleId : undefined,
            nested_level: level
          }
        });
      }
    }
  }

  // Recursively search in nested structures
  const nestedFields = ['elements', 'columns', 'widgets', 'children', 'content'];
  for (const field of nestedFields) {
    if (data[field] && Array.isArray(data[field])) {
      data[field].forEach((item: any, index: number) => {
        cradles.push(...findImageCradles(item, `${path}.${field}[${index}]`, level + 1));
      });
    }
  }

  // Search in any other object properties
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'settings' && !nestedFields.includes(key) && !imageFields.includes(key)) {
      if (typeof value === 'object' && value !== null) {
        cradles.push(...findImageCradles(value, `${path}.${key}`, level));
      }
    }
  }

  return cradles;
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
      // If JSON parse fails, might be serialized PHP data
      console.log('🔍 Attempting to parse serialized PHP data');
      // For now, return null - in the future, we could add PHP unserialize functionality
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

    console.log(`🔍 f327_elementor_image_discovery: Starting discovery for gcon_piece: ${gconPieceId}`);

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

    console.log(`🔍 Parsed Elementor data successfully, starting image cradle discovery...`);

    // Find all image cradles in the Elementor data
    const imageCradles = findImageCradles(elementorData);

    console.log(`🎯 Found ${imageCradles.length} potential image cradles`);

    // Prepare the discovery result
    const discoveryResult = {
      gcon_piece_id: gconPieceId,
      discovery_timestamp: new Date().toISOString(),
      elementor_data_size: JSON.stringify(elementorData).length,
      total_cradles_found: imageCradles.length,
      cradles_by_type: imageCradles.reduce((acc: {[key: string]: number}, cradle) => {
        const key = cradle.widget_type || cradle.element_type;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
      image_cradles: imageCradles,
      processing_metadata: {
        processed_at: new Date().toISOString(),
        processor_version: '1.0.0',
        source_data_type: typeof gconPiece.pelementor_cached
      }
    };

    // Save the discovery result to the database
    const { error: updateError } = await supabase
      .from('gcon_pieces')
      .update({ 
        discovered_img_cradles_json: discoveryResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', gconPieceId);

    if (updateError) {
      console.error('❌ Error saving discovery results:', updateError);
      return NextResponse.json(
        { success: false, message: 'Error saving discovery results', error: updateError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Discovery completed and saved successfully`);

    return NextResponse.json({
      success: true,
      message: `Successfully discovered ${imageCradles.length} image cradles`,
      results: {
        gcon_piece: {
          id: gconPiece.id,
          title: gconPiece.meta_title,
          site: gconPiece.asn_sitespren_base,
          slug: gconPiece.post_name
        },
        discovery: {
          total_cradles: imageCradles.length,
          cradles_by_type: discoveryResult.cradles_by_type,
          elementor_data_size: discoveryResult.elementor_data_size
        }
      }
    });

  } catch (error) {
    console.error('🚨 f327_elementor_image_discovery API CRITICAL ERROR:', error);
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