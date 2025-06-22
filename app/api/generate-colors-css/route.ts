import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Fetch all colors from database
    const { data: colors, error } = await supabase
      .from('custom_colors')
      .select('color_ref_code, hex_value')
      .order('color_ref_code');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch colors' }, { status: 500 });
    }

    // Generate CSS content
    const cssContent = generateCSSContent(colors || []);

    // Write CSS file to public directory
    const publicPath = join(process.cwd(), 'public', 'bapri-custom-color-code-system-1.css');
    await writeFile(publicPath, cssContent, 'utf8');

    return NextResponse.json({ 
      success: true, 
      colorsCount: colors?.length || 0,
      message: 'CSS file generated successfully'
    });

  } catch (error) {
    console.error('CSS generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate CSS file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateCSSContent(colors: Array<{ color_ref_code: string; hex_value: string }>) {
  const timestamp = new Date().toISOString();
  
  let css = `/*
 * Bapri Custom Color Code System 1
 * Auto-generated from database colors
 * Generated: ${timestamp}
 * Total colors: ${colors.length}
 */

`;

  // ===== CSS VARIABLES =====
  css += `/* ===== CSS VARIABLES (CUSTOM PROPERTIES) ===== */
:root {
`;

  colors.forEach(color => {
    const varName = convertToValidCSSVar(color.color_ref_code);
    css += `  --color-${varName}: ${color.hex_value};\n`;
  });

  css += `}

`;

  // ===== BACKGROUND CLASSES =====
  css += `/* ===== BACKGROUND COLOR CLASSES ===== */
`;

  colors.forEach(color => {
    const className = convertToValidCSSClass(color.color_ref_code);
    const varName = convertToValidCSSVar(color.color_ref_code);
    css += `.bg-${className} { 
  background-color: var(--color-${varName}) !important; 
}
`;
  });

  css += `
`;

  // ===== TEXT CLASSES =====
  css += `/* ===== TEXT COLOR CLASSES ===== */
`;

  colors.forEach(color => {
    const className = convertToValidCSSClass(color.color_ref_code);
    const varName = convertToValidCSSVar(color.color_ref_code);
    css += `.text-${className} { 
  color: var(--color-${varName}) !important; 
}
`;
  });

  css += `
`;

  // ===== BORDER CLASSES =====
  css += `/* ===== BORDER COLOR CLASSES ===== */
`;

  colors.forEach(color => {
    const className = convertToValidCSSClass(color.color_ref_code);
    const varName = convertToValidCSSVar(color.color_ref_code);
    css += `.border-${className} { 
  border-color: var(--color-${varName}) !important; 
}
`;
  });

  css += `
`;

  // ===== HOVER VARIANTS =====
  css += `/* ===== HOVER VARIANTS ===== */
`;

  colors.forEach(color => {
    const className = convertToValidCSSClass(color.color_ref_code);
    const varName = convertToValidCSSVar(color.color_ref_code);
    css += `.hover\\:bg-${className}:hover { 
  background-color: var(--color-${varName}) !important; 
}
`;
  });

  css += `
`;

  // ===== SEMANTIC IDs (Optional) =====
  css += `/* ===== SEMANTIC IDs FOR UNIQUE ELEMENTS ===== */
`;

  // Generate some common semantic IDs based on color reference codes
  colors.forEach(color => {
    if (color.color_ref_code.includes('header')) {
      const idName = convertToValidCSSClass(color.color_ref_code);
      const varName = convertToValidCSSVar(color.color_ref_code);
      css += `#${idName} { 
  background-color: var(--color-${varName}) !important; 
}
`;
    }
  });

  css += `
`;

  // ===== UTILITY MIXINS =====
  css += `/* ===== UTILITY CLASSES ===== */
/* Force important on all custom color classes */
[class*="bg-"]:not([class*="bg-gray"]):not([class*="bg-blue"]):not([class*="bg-red"]):not([class*="bg-green"]):not([class*="bg-yellow"]):not([class*="bg-purple"]):not([class*="bg-pink"]):not([class*="bg-indigo"]) {
  /* Custom color classes take precedence */
}

/* End of auto-generated CSS */
`;

  return css;
}

function convertToValidCSSVar(refCode: string): string {
  // Convert reference code to valid CSS variable name
  return refCode
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function convertToValidCSSClass(refCode: string): string {
  // Convert reference code to valid CSS class name
  return refCode
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}