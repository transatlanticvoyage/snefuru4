import { NextRequest, NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ElementorElement {
  id: string;
  elType: string;
  widgetType?: string;
  settings?: Record<string, any>;
  elements?: ElementorElement[];
  [key: string]: any;
}

interface NemtorUnit {
  fk_gcon_piece_id: string;
  unit_marker: string;
  el_id: string;
  el_type: string;
  widget_type: string | null;
  parent_el_id: string | null;
  position_order: number;
  depth_level: number;
  sort_index: number;
  summary_text: string | null;
  full_text_cached: string | null;
  full_text_edits: string | null;
  tar_description_text: string | null;
  unit_label: string | null;
  has_img_slot: boolean | null;
  img_slot_qty: number | null;
  image_type: string | null;
  image_id: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_size: string | null;
  image_source: string | null;
  carousel_position: number | null;
  image_context: string | null;
  settings_json: Record<string, any>;
  style_json: Record<string, any>;
  globals_json: Record<string, any>;
  raw_json: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const { gcon_piece_id } = await request.json();

    if (!gcon_piece_id) {
      return NextResponse.json({ error: 'gcon_piece_id is required' }, { status: 400 });
    }

    const supabase = createClientComponentClient();

    // 1. Fetch the Elementor JSON from gcon_pieces.pelementor_cached
    const { data: gconPiece, error: fetchError } = await supabase
      .from('gcon_pieces')
      .select('pelementor_cached')
      .eq('id', gcon_piece_id)
      .single();

    if (fetchError || !gconPiece) {
      return NextResponse.json({ error: 'Failed to fetch gcon_piece or piece not found' }, { status: 404 });
    }

    if (!gconPiece.pelementor_cached) {
      return NextResponse.json({ error: 'No pelementor_cached data found' }, { status: 400 });
    }

    // 2. Delete existing nemtor_units for this gcon_piece_id
    const { error: deleteError } = await supabase
      .from('nemtor_units')
      .delete()
      .eq('fk_gcon_piece_id', gcon_piece_id);

    if (deleteError) {
      console.error('Error deleting existing nemtor_units:', deleteError);
      return NextResponse.json({ error: 'Failed to clear existing nemtor_units' }, { status: 500 });
    }

    // 3. Parse the Elementor JSON
    let elementorData: ElementorElement[];
    try {
      if (typeof gconPiece.pelementor_cached === 'string') {
        elementorData = JSON.parse(gconPiece.pelementor_cached);
      } else {
        elementorData = gconPiece.pelementor_cached;
      }
    } catch (parseError) {
      console.error('Error parsing Elementor JSON:', parseError);
      return NextResponse.json({ error: 'Invalid Elementor JSON format' }, { status: 400 });
    }

    // 4. Convert Elementor JSON to nemtor_units
    const nemtorUnits: NemtorUnit[] = [];
    let sortIndex = 0;

    function extractSummaryText(settings?: Record<string, any>): string | null {
      if (!settings) return null;
      
      // Common Elementor text fields
      const textFields = ['title', 'title_text', 'text', 'content', 'heading_text', 'description'];
      
      for (const field of textFields) {
        if (settings[field] && typeof settings[field] === 'string') {
          return settings[field].substring(0, 200); // Limit length
        }
      }
      
      return null;
    }

    function extractFullText(settings?: Record<string, any>, widgetType?: string): string | null {
      if (!settings) return null;
      
      // Special handling for text-editor widget type - prioritize "editor" field
      if (widgetType === 'text-editor' && settings.editor && typeof settings.editor === 'string') {
        const editorContent = settings.editor.trim();
        if (editorContent.length > 0) {
          return editorContent;
        }
      }
      
      // Collect all text content from various fields
      const textFields = ['title', 'title_text', 'text', 'content', 'heading_text', 'description', 'caption', 'link_text', 'button_text', 'placeholder', 'html', 'shortcode', 'editor'];
      const textParts: string[] = [];
      
      for (const field of textFields) {
        if (settings[field] && typeof settings[field] === 'string') {
          const cleanText = settings[field].trim();
          if (cleanText.length > 0) {
            textParts.push(cleanText);
          }
        }
      }
      
      // Also check for nested objects that might contain text
      const nestedFields = ['typography', 'text_color', 'background', 'border'];
      for (const field of nestedFields) {
        if (settings[field] && typeof settings[field] === 'object') {
          const nestedText = extractTextFromObject(settings[field]);
          if (nestedText) {
            textParts.push(nestedText);
          }
        }
      }
      
      return textParts.length > 0 ? textParts.join(' | ') : null;
    }

    function extractTextFromObject(obj: any): string | null {
      if (!obj || typeof obj !== 'object') return null;
      
      const textValues: string[] = [];
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.trim().length > 0) {
          // Skip technical values like colors, sizes, etc.
          if (!key.includes('color') && !key.includes('size') && !key.includes('weight') && value.length > 2) {
            textValues.push(value.trim());
          }
        } else if (typeof value === 'object' && value !== null) {
          const nestedText = extractTextFromObject(value);
          if (nestedText) {
            textValues.push(nestedText);
          }
        }
      }
      
      return textValues.length > 0 ? textValues.join(' ') : null;
    }

    function extractDescriptionText(settings?: Record<string, any>): string | null {
      if (!settings) return null;
      
      // Extract description_text field specifically
      if (settings.description_text && typeof settings.description_text === 'string') {
        return settings.description_text.trim();
      }
      
      return null;
    }

    function detectImageSlots(element: ElementorElement): {
      has_img_slot: boolean | null;
      img_slot_qty: number | null;
    } {
      const settings = element.settings || {};
      
      // Check for image slots in various widget types
      if (element.elType === 'widget') {
        switch (element.widgetType) {
          case 'image':
          case 'image-box':
            return { has_img_slot: true, img_slot_qty: 1 };
          
          case 'image-carousel':
            // Check if carousel has predefined slots or can accept multiple images
            if (settings.carousel && Array.isArray(settings.carousel)) {
              return { has_img_slot: true, img_slot_qty: settings.carousel.length || 1 };
            }
            return { has_img_slot: true, img_slot_qty: 1 };
          
          case 'image-gallery':
            // Gallery widgets can have multiple image slots
            if (settings.gallery && Array.isArray(settings.gallery)) {
              return { has_img_slot: true, img_slot_qty: settings.gallery.length || 1 };
            }
            return { has_img_slot: true, img_slot_qty: 1 };
          
          default:
            // Check if any widget has image-related settings
            if (settings.image || settings.background_image) {
              return { has_img_slot: true, img_slot_qty: 1 };
            }
            break;
        }
      }
      
      // Check for background image slots in containers/sections
      if (element.elType === 'container' || element.elType === 'section') {
        if (settings.background_image || settings.background_image_url) {
          return { has_img_slot: true, img_slot_qty: 1 };
        }
      }
      
      // No image slots detected
      return { has_img_slot: false, img_slot_qty: 0 };
    }

    function extractImageData(element: ElementorElement): {
      image_type: string | null;
      image_id: string | null;
      image_url: string | null;
      image_alt: string | null;
      image_size: string | null;
      image_source: string | null;
      carousel_position: number | null;
      image_context: string | null;
    } {
      const settings = element.settings || {};
      
      // Check for background image in containers/sections
      if (settings.background_image && (element.elType === 'container' || element.elType === 'section')) {
        const bgImage = settings.background_image;
        return {
          image_type: 'background',
          image_id: bgImage.id || null,
          image_url: bgImage.url || null,
          image_alt: bgImage.alt || null,
          image_size: bgImage.size || null,
          image_source: bgImage.source || null,
          carousel_position: null,
          image_context: JSON.stringify({
            background_size: settings.background_size,
            background_position: settings.background_position,
            background_repeat: settings.background_repeat
          })
        };
      }
      
      // Check for widget images (image-box, image widgets)
      if (settings.image && element.elType === 'widget') {
        const widgetImage = settings.image;
        return {
          image_type: 'widget',
          image_id: widgetImage.id || null,
          image_url: widgetImage.url || null,
          image_alt: widgetImage.alt || null,
          image_size: widgetImage.size || settings.image_size?.size?.toString() || null,
          image_source: null,
          carousel_position: null,
          image_context: JSON.stringify({
            widget_type: element.widgetType,
            image_size: settings.image_size,
            hover_animation: settings.hover_animation
          })
        };
      }
      
      // Check for carousel images
      if (settings.carousel && Array.isArray(settings.carousel) && element.widgetType === 'image-carousel') {
        // For carousel, we'll handle the first image here and create additional records separately
        const firstImage = settings.carousel[0];
        if (firstImage) {
          return {
            image_type: 'carousel',
            image_id: firstImage.id?.toString() || null,
            image_url: firstImage.url || null,
            image_alt: firstImage.alt || null,
            image_size: settings.thumbnail_size || null,
            image_source: null,
            carousel_position: 1,
            image_context: JSON.stringify({
              carousel_name: settings.carousel_name,
              slides_to_show: settings.slides_to_show,
              navigation: settings.navigation,
              total_slides: settings.carousel.length
            })
          };
        }
      }
      
      // No image found
      return {
        image_type: null,
        image_id: null,
        image_url: null,
        image_alt: null,
        image_size: null,
        image_source: null,
        carousel_position: null,
        image_context: null
      };
    }

    function processElement(
      element: ElementorElement,
      parentId: string | null = null,
      depthLevel: number = 0,
      positionOrder: number = 0
    ): void {
      const fullTextContent = extractFullText(element.settings, element.widgetType);
      const imageData = extractImageData(element);
      const imageSlotData = detectImageSlots(element);
      const baseUnit: Partial<NemtorUnit> = {
        fk_gcon_piece_id: gcon_piece_id,
        el_id: element.id,
        el_type: element.elType,
        widget_type: element.widgetType ?? null,
        parent_el_id: parentId,
        position_order: positionOrder,
        depth_level: depthLevel,
        summary_text: extractSummaryText(element.settings),
        full_text_cached: fullTextContent,
        full_text_edits: fullTextContent,
        tar_description_text: extractDescriptionText(element.settings),
        has_img_slot: imageSlotData.has_img_slot,
        img_slot_qty: imageSlotData.img_slot_qty,
        image_type: imageData.image_type,
        image_id: imageData.image_id,
        image_url: imageData.image_url,
        image_alt: imageData.image_alt,
        image_size: imageData.image_size,
        image_source: imageData.image_source,
        carousel_position: imageData.carousel_position,
        image_context: imageData.image_context,
        settings_json: element.settings || {},
        style_json: element.style || {},
        globals_json: element.__globals__ || {},
        raw_json: element
      };

      // Generate unit markers based on element type
      if (element.elType === 'section') {
        // Section begin
        nemtorUnits.push({
          ...baseUnit,
          unit_marker: 'section_begin',
          sort_index: sortIndex++,
          unit_label: `Section Start: ${element.id}`
        } as NemtorUnit);

        // Section core
        nemtorUnits.push({
          ...baseUnit,
          unit_marker: 'section_core',
          sort_index: sortIndex++,
          unit_label: `Section Core: ${element.id}`
        } as NemtorUnit);

        // Process children
        if (element.elements && element.elements.length > 0) {
          element.elements.forEach((child, index) => {
            processElement(child, element.id, depthLevel + 1, index);
          });
        }

        // Section end
        nemtorUnits.push({
          ...baseUnit,
          unit_marker: 'section_end',
          sort_index: sortIndex++,
          unit_label: `Section End: ${element.id}`
        } as NemtorUnit);

      } else if (element.elType === 'column') {
        // Column begin
        nemtorUnits.push({
          ...baseUnit,
          unit_marker: 'column_begin',
          sort_index: sortIndex++,
          unit_label: `Column Start: ${element.id}`
        } as NemtorUnit);

        // Column core
        nemtorUnits.push({
          ...baseUnit,
          unit_marker: 'column_core',
          sort_index: sortIndex++,
          unit_label: `Column Core: ${element.id}`
        } as NemtorUnit);

        // Process children
        if (element.elements && element.elements.length > 0) {
          element.elements.forEach((child, index) => {
            processElement(child, element.id, depthLevel + 1, index);
          });
        }

        // Column end
        nemtorUnits.push({
          ...baseUnit,
          unit_marker: 'column_end',
          sort_index: sortIndex++,
          unit_label: `Column End: ${element.id}`
        } as NemtorUnit);

      } else if (element.elType === 'container') {
        // Container begin
        nemtorUnits.push({
          ...baseUnit,
          unit_marker: 'container_begin',
          sort_index: sortIndex++,
          unit_label: `Container Start: ${element.id}`
        } as NemtorUnit);

        // Container core
        nemtorUnits.push({
          ...baseUnit,
          unit_marker: 'container_core',
          sort_index: sortIndex++,
          unit_label: `Container Core: ${element.id}`
        } as NemtorUnit);

        // Process children
        if (element.elements && element.elements.length > 0) {
          element.elements.forEach((child, index) => {
            processElement(child, element.id, depthLevel + 1, index);
          });
        }

        // Container end
        nemtorUnits.push({
          ...baseUnit,
          unit_marker: 'container_end',
          sort_index: sortIndex++,
          unit_label: `Container End: ${element.id}`
        } as NemtorUnit);

      } else if (element.elType === 'widget') {
        // Widget core (single unit for widgets)
        nemtorUnits.push({
          ...baseUnit,
          unit_marker: 'widget_core',
          sort_index: sortIndex++,
          unit_label: `Widget: ${element.widgetType || 'unknown'} (${element.id})`
        } as NemtorUnit);

        // Widgets typically don't have children, but if they do, process them
        if (element.elements && element.elements.length > 0) {
          element.elements.forEach((child, index) => {
            processElement(child, element.id, depthLevel + 1, index);
          });
        }

      } else {
        // Generic element core
        nemtorUnits.push({
          ...baseUnit,
          unit_marker: 'element_core',
          sort_index: sortIndex++,
          unit_label: `Element: ${element.elType} (${element.id})`
        } as NemtorUnit);

        // Process children if any
        if (element.elements && element.elements.length > 0) {
          element.elements.forEach((child, index) => {
            processElement(child, element.id, depthLevel + 1, index);
          });
        }
      }
    }

    // Process all root elements
    elementorData.forEach((element, index) => {
      processElement(element, null, 0, index);
    });

    // 5. Insert all nemtor_units into the database
    if (nemtorUnits.length > 0) {
      const { error: insertError } = await supabase
        .from('nemtor_units')
        .insert(nemtorUnits);

      if (insertError) {
        console.error('Error inserting nemtor_units:', insertError);
        return NextResponse.json({ error: 'Failed to insert nemtor_units' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully populated ${nemtorUnits.length} nemtor_units`,
      unitsCreated: nemtorUnits.length
    });

  } catch (error) {
    console.error('Error in populate-nemtor-units:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}