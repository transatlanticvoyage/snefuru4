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
  unit_label: string | null;
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

    function extractFullText(settings?: Record<string, any>): string | null {
      if (!settings) return null;
      
      // Collect all text content from various fields
      const textFields = ['title', 'title_text', 'text', 'content', 'heading_text', 'description', 'caption', 'link_text', 'button_text', 'placeholder', 'html', 'shortcode'];
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

    function processElement(
      element: ElementorElement,
      parentId: string | null = null,
      depthLevel: number = 0,
      positionOrder: number = 0
    ): void {
      const fullTextContent = extractFullText(element.settings);
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