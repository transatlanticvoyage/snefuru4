// Tebnar2 Constants - Cloned from tebnar1 with TBN2_ prefixes

import { Tebnar2ColumnSettings, Tebnar2HeaderCellSettings, Tebnar2RowSettings, Tebnar2MainElementStyling, Tebnar2TableStyling } from '../types/tebnar2-types';

// Table columns based on schema
export const TBN2_COLUMNS = [
  'int1',
  'fk_image1_id',
  'int2',
  'fk_image2_id',
  'int3',
  'fk_image3_id',
  'int4',
  'fk_image4_id',
  'id',
  'rel_users_id',
  'rel_images_plans_batches_id',
  'created_at',
  'e_zpf_img_code',
  'e_width',
  'e_height',
  'e_associated_content1',
  'e_file_name1',
  'e_more_instructions1',
  'e_prompt1',
  'e_ai_tool1',
];

// Column width and styling settings
export const TBN2_COLUMN_SETTINGS: Record<string, Tebnar2ColumnSettings> = {
  // Intent columns (new) - positioned before fk_ columns
  int1: { width: '60px', minWidth: '60px', maxWidth: '60px', textAlign: 'center' },
  int2: { width: '60px', minWidth: '60px', maxWidth: '60px', textAlign: 'center' },
  int3: { width: '60px', minWidth: '60px', maxWidth: '60px', textAlign: 'center' },
  int4: { width: '60px', minWidth: '60px', maxWidth: '60px', textAlign: 'center' },
  
  // Image ID columns (compact) - Updated to 45px fixed width
  fk_image1_id: { width: '45px', minWidth: '45px', maxWidth: '45px', textAlign: 'center' },
  fk_image2_id: { width: '45px', minWidth: '45px', maxWidth: '45px', textAlign: 'center' },
  fk_image3_id: { width: '45px', minWidth: '45px', maxWidth: '45px', textAlign: 'center' },
  fk_image4_id: { width: '45px', minWidth: '45px', maxWidth: '45px', textAlign: 'center' },
  
  // Preview columns (fixed size for images)
  'image1-preview': { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  'image2-preview': { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  'image3-preview': { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  'image4-preview': { width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' },
  
  // ID and relationship columns
  id: { width: '200px', minWidth: '150px', maxWidth: '250px', textAlign: 'left' },
  rel_users_id: { width: '150px', minWidth: '120px', maxWidth: '200px', textAlign: 'center' },
  rel_images_plans_batches_id: { width: '150px', minWidth: '120px', maxWidth: '200px', textAlign: 'center' },
  
  // Date column
  created_at: { width: '160px', minWidth: '140px', maxWidth: '200px', textAlign: 'center' },
  
  // Content columns (wider for text)
  e_zpf_img_code: { width: '120px', minWidth: '100px', maxWidth: '150px', textAlign: 'left' },
  e_width: { width: '80px', minWidth: '60px', maxWidth: '100px', textAlign: 'center' },
  e_height: { width: '80px', minWidth: '60px', maxWidth: '100px', textAlign: 'center' },
  e_associated_content1: { width: '200px', minWidth: '150px', maxWidth: '300px', textAlign: 'left' },
  e_file_name1: { width: '200px', minWidth: '150px', maxWidth: '300px', textAlign: 'left' },
  e_more_instructions1: { width: '250px', minWidth: '200px', maxWidth: '400px', textAlign: 'left' },
  e_prompt1: { width: '300px', minWidth: '200px', maxWidth: '500px', textAlign: 'left' },
  e_ai_tool1: { width: '120px', minWidth: '100px', maxWidth: '150px', textAlign: 'center' },
};

// Row settings
export const TBN2_ROW_SETTINGS: Tebnar2RowSettings = {
  height: '40px',
  minHeight: '80px',
  maxHeight: '80px',
};

// Grid settings
export const TBN2_GRID_ROWS = 20;
export const TBN2_GRID_COLS = 10;

// Pagination options
export const TBN2_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
export const TBN2_DEFAULT_PAGE_SIZE = 10;

// Throttle defaults
export const TBN2_DEFAULT_THROTTLE = {
  enabled: false,
  delayBetweenImages: 3000, // milliseconds, default 3 seconds
  delayBetweenPlans: 1000,  // milliseconds, default 1 second
};

// Debounce constants
export const TBN2_DEBOUNCE_MS = 2000; // 2 seconds between clicks

// AI Models
export const TBN2_AI_MODELS = ['openai', 'anthropic', 'other'];
export const TBN2_DEFAULT_AI_MODEL = 'openai';

// Main Element Styling Controls
export const TBN2_MAIN_ELEMENT_STYLING: Tebnar2MainElementStyling = {
  // Main element dimensions and spacing
  layout: {
    width: '100%',                    // Main element width
    maxWidth: 'none',                 // Maximum width constraint
    minWidth: '0px',                  // Minimum width
    height: 'auto',                   // Main element height
    minHeight: '100vh',               // Minimum height (full viewport)
    maxHeight: 'none',                // Maximum height constraint
  },
  
  // Margin overrides (high specificity to override existing styles)
  margins: {
    margin: '0',                      // All margins
    marginTop: '0',                   // Top margin override
    marginRight: '0',                 // Right margin override  
    marginBottom: '0',                // Bottom margin override
    marginLeft: '0',                  // Left margin override
    marginBlock: '0',                 // Block margins (top/bottom)
    marginInline: '0',                // Inline margins (left/right)
  },
  
  // Padding controls
  padding: {
    padding: '0',                     // All padding
    paddingTop: '0',                  // Top padding
    paddingRight: '0',                // Right padding
    paddingBottom: '0',               // Bottom padding
    paddingLeft: '0',                 // Left padding
    paddingBlock: '0',                // Block padding (top/bottom)
    paddingInline: '0',               // Inline padding (left/right)
  },
};

// Table styling configuration
export const TBN2_TABLE_STYLING: Tebnar2TableStyling = {
  // Container that holds the table
  container: {
    width: '100%',                    // Container width
    height: 'auto',                   // Container height (auto-adjusts)
    overflow: 'auto',                 // Scrolling behavior
    border: '1px solid #e5e7eb',      // Container border
    borderRadius: '8px',              // Container border radius
    backgroundColor: '#ffffff',       // Container background
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', // Container shadow
    margin: '0',                      // Container margin
    padding: '0',                     // Container padding
  },
  
  // Table element itself
  table: {
    width: '100%',                    // Table width
    tableLayout: 'auto',              // Table layout algorithm
    borderCollapse: 'separate',       // Border collapse mode
    borderSpacing: '0',               // Space between borders
    fontSize: '12px',                 // Base font size
    fontFamily: 'inherit',            // Font family
    backgroundColor: '#ffffff',       // Table background
    border: 'none',                   // Table border
  },
};

// Header cell width overrides
export const TBN2_HEADER_CELL_WIDTHS: Record<string, Tebnar2HeaderCellSettings> = {
  // Intent columns (new) - positioned before fk_ columns
  'int1': { width: '60px', minWidth: '60px', maxWidth: '60px' },
  'int2': { width: '60px', minWidth: '60px', maxWidth: '60px' },
  'int3': { width: '60px', minWidth: '60px', maxWidth: '60px' },
  'int4': { width: '60px', minWidth: '60px', maxWidth: '60px' },
  
  // Image preview columns
  'image1-preview': { width: '120px', minWidth: '100px', maxWidth: '150px' },
  'image2-preview': { width: '120px', minWidth: '100px', maxWidth: '150px' },
  'image3-preview': { width: '120px', minWidth: '100px', maxWidth: '150px' },
  'image4-preview': { width: '120px', minWidth: '100px', maxWidth: '150px' },
  
  // Image ID columns - Updated to 45px fixed width
  'fk_image1_id': { width: '45px', minWidth: '45px', maxWidth: '45px' },
  'fk_image2_id': { width: '45px', minWidth: '45px', maxWidth: '45px' },
  'fk_image3_id': { width: '45px', minWidth: '45px', maxWidth: '45px' },
  'fk_image4_id': { width: '45px', minWidth: '45px', maxWidth: '45px' },
  
  // Data columns
  'id': { width: '200px', minWidth: '150px', maxWidth: '300px' },
  'rel_users_id': { width: '120px', minWidth: '100px', maxWidth: '150px' },
  'rel_images_plans_batches_id': { width: '180px', minWidth: '150px', maxWidth: '220px' },
  'created_at': { width: '160px', minWidth: '140px', maxWidth: '200px' },
  'e_zpf_img_code': { width: '120px', minWidth: '100px', maxWidth: '150px' },
  'e_width': { width: '80px', minWidth: '60px', maxWidth: '100px' },
  'e_height': { width: '80px', minWidth: '60px', maxWidth: '100px' },
  'e_associated_content1': { width: '200px', minWidth: '150px', maxWidth: '350px' },
  'e_file_name1': { width: '200px', minWidth: '150px', maxWidth: '350px' },
  'e_more_instructions1': { width: '250px', minWidth: '200px', maxWidth: '400px' },
  'e_prompt1': { width: '300px', minWidth: '200px', maxWidth: '500px' },
  'e_ai_tool1': { width: '120px', minWidth: '100px', maxWidth: '150px' },
};