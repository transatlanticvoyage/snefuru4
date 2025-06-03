"use client";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Table columns based on schema in setup-database/route.ts
const columns = [
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
const columnSettings: Record<string, { width: string; minWidth: string; maxWidth: string; textAlign?: 'left' | 'center' | 'right' }> = {
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
const rowSettings = {
  height: '40px',
  minHeight: '80px',
  maxHeight: '80px',
};

// Main Element Styling Controls (targets the first <main> element on the page)
const mainElementStyling = {
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
  
  // Background and appearance
  appearance: {
    backgroundColor: '#ffffff',       // Main background color
    backgroundImage: 'none',          // Background image
    backgroundSize: 'cover',          // Background size
    backgroundPosition: 'center',     // Background position
    backgroundRepeat: 'no-repeat',    // Background repeat
    backgroundAttachment: 'scroll',   // Background attachment
  },
  
  // Overflow controls
  overflow: {
    overflow: 'visible',              // Overall overflow behavior
    overflowX: 'visible',             // Horizontal overflow
    overflowY: 'visible',             // Vertical overflow
    overflowWrap: 'normal',           // Text overflow wrapping
    wordWrap: 'normal',               // Word wrapping
  },
  
  // Display and positioning
  display: {
    display: 'block',                 // Display type
    position: 'relative',             // Position type
    top: 'auto',                      // Top position
    right: 'auto',                    // Right position
    bottom: 'auto',                   // Bottom position
    left: 'auto',                     // Left position
    zIndex: 'auto',                   // Z-index layering
  },
  
  // Flexbox controls (if display is flex)
  flexbox: {
    flexDirection: 'column',          // Flex direction
    flexWrap: 'nowrap',               // Flex wrap
    justifyContent: 'flex-start',     // Main axis alignment
    alignItems: 'stretch',            // Cross axis alignment
    alignContent: 'stretch',          // Multi-line alignment
    gap: '0px',                       // Gap between flex items
  },
  
  // Border controls
  borders: {
    border: 'none',                   // All borders
    borderTop: 'none',                // Top border
    borderRight: 'none',              // Right border
    borderBottom: 'none',             // Bottom border
    borderLeft: 'none',               // Left border
    borderRadius: '0px',              // Border radius
    outline: 'none',                  // Outline
  },
  
  // Box model controls
  boxModel: {
    boxSizing: 'border-box',          // Box sizing model
    float: 'none',                    // Float behavior
    clear: 'none',                    // Clear behavior
    resize: 'none',                   // Resize behavior
  },
  
  // Typography inheritance controls
  typography: {
    fontFamily: 'inherit',            // Font family
    fontSize: 'inherit',              // Font size
    fontWeight: 'inherit',            // Font weight
    lineHeight: 'inherit',            // Line height
    color: 'inherit',                 // Text color
    textAlign: 'inherit',             // Text alignment
  },
  
  // CSS injection settings
  injection: {
    enabled: true,                    // Enable CSS injection
    important: true,                  // Use !important declarations
    selector: 'main:first-of-type',   // CSS selector to target
    additionalSelectors: [            // Additional selectors for higher specificity
      'body main:first-of-type',
      'div main:first-of-type',
      '#__next main:first-of-type',
      '.app main:first-of-type',
    ],
  }
};

// Comprehensive Header Customization Controls
const headerCustomizationSettings = {
  // Header row overall settings
  headerRow: {
    height: '60px',                    // Overall header row height
    minHeight: '40px',                 // Minimum header row height
    maxHeight: '100px',                // Maximum header row height
    backgroundColor: '#f7ead4',        // Header row background color - updated to new color
    borderBottom: '2px solid #e5e7eb', // Header row bottom border
    position: 'sticky' as 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky', // For sticky headers
    top: '0px',                        // Top position if sticky
    zIndex: 10,                        // Z-index for layering
  },
  
  // Individual header cell width overrides (takes precedence over columnSettings)
  headerCellWidths: {
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
  } as Record<string, { width: string; minWidth: string; maxWidth: string }>,
  
  // Header cell styling
  headerCell: {
    padding: '4px 4px',             // Header cell padding - ensure 4px for all headers
    verticalAlign: 'middle' as 'top' | 'middle' | 'bottom' | 'baseline', // Vertical alignment
    textAlign: 'center' as 'left' | 'center' | 'right', // Default text alignment
    borderRight: '1px solid #e5e7eb', // Right border between headers
    borderLeft: '0px solid transparent', // Left border
    backgroundColor: '#f7ead4',       // Individual cell background - updated to new color
    overflow: 'hidden' as 'visible' | 'hidden' | 'scroll' | 'auto', // Overflow behavior
    textOverflow: 'ellipsis' as 'clip' | 'ellipsis', // Text overflow behavior
    whiteSpace: 'nowrap' as 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line', // White space handling
    wordBreak: 'normal' as 'normal' | 'break-all' | 'keep-all' | 'break-word', // Word breaking
    boxSizing: 'border-box' as 'content-box' | 'border-box', // Box sizing model
  },
  
  // Header text typography
  headerText: {
    fontSize: '12px',                 // Header text size
    fontWeight: '600' as 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900', // Font weight
    color: '#0e0e0e',                 // Text color - changed to requested color
    textTransform: 'lowercase' as 'none' | 'capitalize' | 'uppercase' | 'lowercase', // Text transformation - changed to lowercase
    letterSpacing: '0.05em',          // Letter spacing
    lineHeight: '1.4',                // Line height
    fontFamily: 'inherit',            // Font family
  },
  
  // Header hover effects
  headerHover: {
    enabled: true,                    // Enable hover effects
    backgroundColor: '#f3f4f6',      // Hover background color
    textColor: '#1f2937',            // Hover text color
    borderColor: '#d1d5db',          // Hover border color
    transition: 'all 0.2s ease-in-out', // Hover transition
    cursor: 'pointer' as 'default' | 'pointer' | 'text' | 'help', // Hover cursor
  },
  
  // Header borders and spacing
  headerBorders: {
    topBorder: '0px solid transparent',    // Top border of header row
    bottomBorder: '2px solid #e5e7eb',     // Bottom border of header row
    leftBorder: '0px solid transparent',   // Left border of first header
    rightBorder: '0px solid transparent',  // Right border of last header
    cellBorderRight: '1px solid #e5e7eb', // Border between header cells
    cellBorderLeft: '0px solid transparent', // Left border of each cell
    borderRadius: '0px',                   // Border radius for corners
  },
  
  // Header column-specific text alignment overrides
  headerTextAlign: {
    // Intent columns - center aligned
    'int1': 'center' as 'left' | 'center' | 'right',
    'int2': 'center' as 'left' | 'center' | 'right',
    'int3': 'center' as 'left' | 'center' | 'right',
    'int4': 'center' as 'left' | 'center' | 'right',
    
    // Preview columns - center aligned
    'image1-preview': 'center' as 'left' | 'center' | 'right',
    'image2-preview': 'center' as 'left' | 'center' | 'right',
    'image3-preview': 'center' as 'left' | 'center' | 'right',
    'image4-preview': 'center' as 'left' | 'center' | 'right',
    
    // Image ID columns - center aligned
    'fk_image1_id': 'center' as 'left' | 'center' | 'right',
    'fk_image2_id': 'center' as 'left' | 'center' | 'right',
    'fk_image3_id': 'center' as 'left' | 'center' | 'right',
    'fk_image4_id': 'center' as 'left' | 'center' | 'right',
    
    // Data columns - left aligned for text, center for numbers/dates
    'id': 'left' as 'left' | 'center' | 'right',
    'rel_users_id': 'center' as 'left' | 'center' | 'right',
    'rel_images_plans_batches_id': 'center' as 'left' | 'center' | 'right',
    'created_at': 'center' as 'left' | 'center' | 'right',
    'e_zpf_img_code': 'left' as 'left' | 'center' | 'right',
    'e_width': 'center' as 'left' | 'center' | 'right',
    'e_height': 'center' as 'left' | 'center' | 'right',
    'e_associated_content1': 'left' as 'left' | 'center' | 'right',
    'e_file_name1': 'left' as 'left' | 'center' | 'right',
    'e_more_instructions1': 'left' as 'left' | 'center' | 'right',
    'e_prompt1': 'left' as 'left' | 'center' | 'right',
    'e_ai_tool1': 'center' as 'left' | 'center' | 'right',
  } as Record<string, 'left' | 'center' | 'right'>,
  
  // Header sorting/interaction settings
  headerInteraction: {
    enableSorting: false,             // Enable column sorting
    sortIndicatorColor: '#6b7280',    // Color for sort indicators
    sortIndicatorSize: '12px',        // Size of sort indicators
    enableResizing: false,            // Enable column resizing
    resizeHandleColor: '#d1d5db',     // Color of resize handles
    resizeHandleWidth: '2px',         // Width of resize handles
  },
  
  // Header responsive settings
  headerResponsive: {
    enableResponsive: true,           // Enable responsive behavior
    mobileHeaderHeight: '50px',       // Header height on mobile
    mobileHeaderFontSize: '11px',     // Header font size on mobile
    mobileHeaderPadding: '8px 12px',  // Header padding on mobile
    tabletBreakpoint: '768px',        // Tablet breakpoint
    mobileBreakpoint: '640px',        // Mobile breakpoint
  }
};

// Enhanced row and table styling settings
const tableStyleSettings = {
  // Table-level settings for strict layout control
  table: {
    tableLayout: 'fixed' as 'auto' | 'fixed', // Forces columns to respect width settings
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden' as 'visible' | 'hidden' | 'scroll' | 'auto',
  },
  
  // Row styling
  row: {
    height: '80px',
    minHeight: '80px',
    maxHeight: '80px',
    verticalAlign: 'middle' as 'top' | 'middle' | 'bottom',
    backgroundColor: '#ffffff',
    hoverBackgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    overflow: 'hidden' as 'visible' | 'hidden' | 'scroll' | 'auto', // Prevent row overflow
  },
  
  // Cell styling - Enhanced for strict overflow control
  cell: {
    overflow: 'hidden' as 'visible' | 'hidden' | 'scroll' | 'auto',
    textOverflow: 'ellipsis' as 'clip' | 'ellipsis',
    whiteSpace: 'nowrap' as 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line',
    wordBreak: 'break-word' as 'normal' | 'break-all' | 'keep-all' | 'break-word', // Better handling of long words
    wordWrap: 'break-word' as 'normal' | 'break-word' | 'anywhere', // Additional word breaking
    verticalAlign: 'top' as 'top' | 'middle' | 'bottom' | 'baseline', // Changed from 'middle' to 'top' for upper left justification
    padding: '8px 16px',
    maxWidth: '100%', // Ensure cells don't exceed their allocated width
    minWidth: '0', // Allow cells to shrink if needed
    boxSizing: 'border-box' as 'content-box' | 'border-box', // Include padding in width calculations
  },
  
  // Text cell specific styling (for data columns) - Enhanced overflow control
  textCell: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#374151',
    fontWeight: 'normal' as 'normal' | 'bold' | 'lighter' | 'bolder',
    overflow: 'hidden', // Explicit overflow hidden for text cells
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    wordBreak: 'break-word',
  },
  
  // Preview cell specific styling (for image columns) - Enhanced overflow control
  previewCell: {
    padding: '8px',
    textAlign: 'center' as 'left' | 'center' | 'right',
    backgroundColor: '#fafafa',
    overflow: 'hidden' as 'visible' | 'hidden' | 'scroll' | 'auto', // Prevent image overflow
    display: 'flex' as 'block' | 'flex' | 'inline-block',
    alignItems: 'center' as 'flex-start' | 'center' | 'flex-end',
    justifyContent: 'center' as 'flex-start' | 'center' | 'flex-end',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  
  // Image styling within preview cells - Strict size control
  previewImage: {
    width: '64px',
    height: '64px',
    maxWidth: '64px', // Explicit max-width
    maxHeight: '64px', // Explicit max-height
    objectFit: 'cover' as 'fill' | 'contain' | 'cover' | 'none' | 'scale-down',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
    flexShrink: 0, // Prevent image from shrinking
  },
  
  // Fetch button styling - Strict size control
  fetchButton: {
    width: '64px',
    height: '64px',
    maxWidth: '64px', // Explicit max-width
    maxHeight: '64px', // Explicit max-height
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s ease-in-out',
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
    hoverBackgroundColor: '#bfdbfe',
    textColor: '#1d4ed8',
    overflow: 'hidden', // Prevent button content overflow
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 0, // Prevent button from shrinking
  },
  
  // Loading spinner styling - Strict size control
  loadingSpinner: {
    width: '64px',
    height: '64px',
    maxWidth: '64px', // Explicit max-width
    maxHeight: '64px', // Explicit max-height
    backgroundColor: '#f3f4f6',
    spinnerSize: '32px',
    spinnerColor: '#2563eb',
    overflow: 'hidden', // Prevent spinner overflow
    flexShrink: 0, // Prevent spinner from shrinking
  },
  
  // Table header styling
  header: {
    backgroundColor: '#f9fafb',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase' as 'none' | 'capitalize' | 'uppercase' | 'lowercase',
    letterSpacing: '0.05em',
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    overflow: 'hidden', // Prevent header text overflow
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  
  // Pagination styling
  pagination: {
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    padding: '12px 24px',
    fontSize: '14px',
    color: '#374151',
    overflow: 'hidden', // Prevent pagination overflow
  }
};

// TABLE CELL PADDING
const tableCellPaddingSettings = {
  // Global default padding (applies to all cells unless overridden)
  globalDefault: {
    padding: '4px 4px',             // Default padding for all cells
    paddingTop: '4px',               // Default top padding
    paddingRight: '4px',            // Default right padding
    paddingBottom: '4px',            // Default bottom padding
    paddingLeft: '4px',             // Default left padding
  },
  
  // Column-specific padding overrides - ALL SET TO 4px 4px
  columnPadding: {
    // Intent columns - 4px padding
    'int1': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'int2': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'int3': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'int4': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    
    // Image preview columns - 4px padding (ensuring these are set correctly)
    'image1-preview': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'image2-preview': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'image3-preview': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'image4-preview': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    
    // Image ID columns - 4px padding
    'fk_image1_id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'fk_image2_id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'fk_image3_id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'fk_image4_id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    
    // Data columns - 4px padding
    'id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'rel_users_id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'rel_images_plans_batches_id': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'created_at': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    
    // Content columns - 4px padding
    'e_zpf_img_code': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_width': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_height': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_associated_content1': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_file_name1': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_more_instructions1': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_prompt1': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
    'e_ai_tool1': { padding: '4px 4px', paddingTop: '4px', paddingRight: '4px', paddingBottom: '4px', paddingLeft: '4px' },
  } as Record<string, { padding: string; paddingTop: string; paddingRight: string; paddingBottom: string; paddingLeft: string }>,
  
  // Row type specific padding - ALL SET TO 4px 4px
  rowTypePadding: {
    headerRow: {
      padding: '4px 4px',          // Header row cell padding
      paddingTop: '4px',
      paddingRight: '4px',
      paddingBottom: '4px',
      paddingLeft: '4px',
    },
    dataRow: {
      padding: '4px 4px',           // Data row cell padding
      paddingTop: '4px',
      paddingRight: '4px',
      paddingBottom: '4px',
      paddingLeft: '4px',
    },
    firstRow: {
      paddingTop: '4px',            // Consistent padding for first data row
    },
    lastRow: {
      paddingBottom: '4px',         // Consistent padding for last data row
    },
  },
  
  // Responsive padding adjustments
  responsivePadding: {
    mobile: {
      globalPadding: '6px 8px',      // Smaller padding on mobile
      previewPadding: '2px',         // Minimal padding for previews on mobile
    },
    tablet: {
      globalPadding: '8px 12px',     // Medium padding on tablet
      previewPadding: '3px',         // Small padding for previews on tablet
    },
    desktop: {
      globalPadding: '8px 16px',     // Full padding on desktop
      previewPadding: '4px',         // Standard padding for previews on desktop
    },
  }
};

// TABLE BORDERS
const tableBorderSettings = {
  // Global border settings
  global: {
    borderCollapse: 'collapse' as 'separate' | 'collapse', // Border collapse model
    borderSpacing: '0px',            // Border spacing when separate
    borderStyle: 'solid',            // Global border style
    borderColor: '#c7cbd3',          // Global border color - updated to requested color
    borderWidth: '1px',              // Global border width
  },
  
  // Table outer borders
  tableBorders: {
    enabled: true,                   // Enable table outer borders
    top: '1px solid #c7cbd3',        // Top border of entire table
    right: '1px solid #c7cbd3',      // Right border of entire table
    bottom: '1px solid #c7cbd3',     // Bottom border of entire table
    left: '1px solid #c7cbd3',       // Left border of entire table
    borderRadius: '0px',             // Border radius for table corners
  },
  
  // Row borders (horizontal lines)
  rowBorders: {
    enabled: true,                   // Enable row borders
    headerBottom: '1px solid #c7cbd3', // Border below header row
    dataRowBottom: '1px solid #c7cbd3', // Border below each data row
    lastRowBottom: '1px solid #c7cbd3', // Border below last row
    alternatingRows: {
      enabled: false,                // Enable alternating row border styles
      evenRowBorder: '1px solid #c7cbd3', // Even row border
      oddRowBorder: '1px solid #c7cbd3',  // Odd row border
    },
    hoverBorder: '1px solid #c7cbd3', // Border color on row hover
  },
  
  // Column borders (vertical lines)
  columnBorders: {
    enabled: true,                   // Enable column borders
    defaultRight: '1px solid #c7cbd3', // Default right border for columns
    defaultLeft: '1px solid #c7cbd3', // Default left border for columns
    firstColumnLeft: '1px solid #c7cbd3', // Left border of first column
    lastColumnRight: '1px solid #c7cbd3', // Right border of last column
    
    // Column-specific border overrides - all consistent now
    columnSpecific: {
      // Intent columns
      'int1': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'int2': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'int3': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'int4': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      
      // Image preview columns
      'image1-preview': { right: '1px solid #c7cbd3', left: '1px solidrgb(57, 72, 102)' },
      'image2-preview': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'image3-preview': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'image4-preview': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      
      // Image ID columns
      'fk_image1_id': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'fk_image2_id': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'fk_image3_id': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'fk_image4_id': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      
      // Data columns
      'id': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'rel_users_id': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'rel_images_plans_batches_id': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'created_at': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      
      // Content columns
      'e_zpf_img_code': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'e_width': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'e_height': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'e_associated_content1': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'e_file_name1': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'e_more_instructions1': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'e_prompt1': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' },
      'e_ai_tool1': { right: '1px solid #c7cbd3', left: '1px solid #c7cbd3' }, // Last column now has right border too
    } as Record<string, { right: string; left: string }>,
  },
  
  // Header-specific borders
  headerBorders: {
    enabled: true,                   // Enable header-specific borders
    cellBorderRight: '1px solid #c7cbd3', // Right border for header cells
    cellBorderLeft: '1px solid #c7cbd3', // Left border for header cells
    cellBorderTop: '1px solid #c7cbd3', // Top border for header cells
    cellBorderBottom: '1px solid #c7cbd3', // Bottom border for header cells
    lastHeaderCellRight: '1px solid #c7cbd3', // Right border of last header cell
  },
  
  // Cell border styles
  cellBorders: {
    defaultStyle: 'solid',           // Default border style for cells
    defaultColor: '#c7cbd3',         // Default border color for cells - updated
    defaultWidth: '1px',             // Default border width for cells
    
    // Special cell border styles
    previewCells: {
      style: 'solid',
      color: '#c7cbd3',              // Updated to consistent color
      width: '1px',
    },
    dataCells: {
      style: 'solid',
      color: '#c7cbd3',              // Updated to consistent color
      width: '1px',
    },
    headerCells: {
      style: 'solid',
      color: '#c7cbd3',              // Updated to consistent color
      width: '1px',
    },
  },
  
  // Border effects and animations
  borderEffects: {
    hoverEnabled: true,              // Enable border changes on hover
    hoverColor: '#cbd5e1',           // Border color on hover
    hoverWidth: '1px',               // Border width on hover
    hoverStyle: 'solid',             // Border style on hover
    transition: 'border-color 0.15s ease-in-out', // Border transition animation
    
    focusEnabled: true,              // Enable border changes on focus
    focusColor: '#3b82f6',           // Border color on focus
    focusWidth: '2px',               // Border width on focus
    focusStyle: 'solid',             // Border style on focus
  },
  
  // Responsive border adjustments
  responsiveBorders: {
    mobile: {
      tableBorder: '1px solid #e5e7eb', // Thinner table border on mobile
      rowBorder: '1px solid #f3f4f6',   // Lighter row borders on mobile
      columnBorder: '0px',              // No column borders on mobile
    },
    tablet: {
      tableBorder: '1px solid #d1d5db', // Medium table border on tablet
      rowBorder: '1px solid #e5e7eb',   // Standard row borders on tablet
      columnBorder: '1px solid #f3f4f6', // Light column borders on tablet
    },
    desktop: {
      tableBorder: '2px solid #d1d5db', // Full table border on desktop
      rowBorder: '1px solid #e5e7eb',   // Standard row borders on desktop
      columnBorder: '1px solid #e5e7eb', // Full column borders on desktop
    },
  }
};

const gridCols = 9; // A-I
const gridRows = 11;
const colHeaders = Array.from({ length: gridCols }, (_, i) => String.fromCharCode(65 + i)); // ['A',...,'I']

function ExcelPasteGrid({ onGridDataChange, presetData }: { onGridDataChange?: (grid: string[][]) => void; presetData?: string[][] | null }) {
  const [grid, setGrid] = useState<string[][]>(Array.from({ length: gridRows }, () => Array(gridCols).fill('')));
  const [selected, setSelected] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const gridRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (onGridDataChange) onGridDataChange(grid);
  }, [grid, onGridDataChange]);

  // Handle preset data when it changes
  useEffect(() => {
    if (presetData && presetData.length > 0) {
      // Create a new grid with preset data
      const newGrid = Array.from({ length: gridRows }, () => Array(gridCols).fill(''));
      
      // Fill the grid with preset data
      presetData.forEach((row, rowIndex) => {
        if (rowIndex < gridRows) {
          row.forEach((cell, colIndex) => {
            if (colIndex < gridCols) {
              newGrid[rowIndex][colIndex] = cell;
            }
          });
        }
      });
      
      setGrid(newGrid);
    }
  }, [presetData]);

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    setSelected({ row, col });
  };

  // Handle cell change
  const handleCellChange = (row: number, col: number, value: string) => {
    setGrid(prev => {
      const newGrid = prev.map(rowArr => [...rowArr]);
      newGrid[row][col] = value;
      return newGrid;
    });
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const rows = text.split(/\r?\n/).filter(Boolean);
    const newGrid = grid.map(row => [...row]);
    rows.forEach((rowStr, i) => {
      const cells = rowStr.split(/\t/);
      cells.forEach((cell, j) => {
        const r = selected.row + i;
        const c = selected.col + j;
        if (r < gridRows && c < gridCols) {
          newGrid[r][c] = cell;
        }
      });
    });
    setGrid(newGrid);
  };

  return (
    <div className="mb-8 w-full">
      <div className="font-bold mb-2">kzelement6</div>
      <div className="w-full">
        <table
          ref={gridRef}
          className="border border-gray-300 w-full"
          tabIndex={0}
          onPaste={handlePaste}
        >
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 w-12 text-center">Row</th>
              {colHeaders.map((col, idx) => (
                <th key={col} className="border border-gray-300 bg-gray-100 min-w-[120px] text-center">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: gridRows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                <th className="border border-gray-300 bg-gray-100 text-center w-12">{rowIdx + 1}</th>
                {Array.from({ length: gridCols }).map((_, colIdx) => (
                  <td
                    key={colIdx}
                    className={`border border-gray-300 min-w-[120px] h-10 cursor-pointer ${selected.row === rowIdx && selected.col === colIdx ? 'bg-blue-100' : ''}`}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                  >
                    <input
                      type="text"
                      value={grid[rowIdx][colIdx]}
                      onChange={e => handleCellChange(rowIdx, colIdx, e.target.value)}
                      className="w-full h-full px-2 bg-transparent outline-none border-none"
                      onFocus={() => handleCellClick(rowIdx, colIdx)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs text-gray-500 mt-2">Click a cell to edit, or paste (Ctrl+V or Cmd+V) from Excel or Google Sheets. Data will fill from the selected cell.</div>
      </div>
    </div>
  );
}

export default function Tebnar1() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gridData, setGridData] = useState<string[][]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [qtyPerPlan, setQtyPerPlan] = useState<number>(1);
  const [aiModel, setAiModel] = useState<string>('openai');
  const [makeImagesLoading, setMakeImagesLoading] = useState(false);
  const [makeImagesResult, setMakeImagesResult] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [5, 10, 20, 50, 100];
  // New: images lookup
  const [imagesById, setImagesById] = useState<Record<string, any>>({});
  const [generateZip, setGenerateZip] = useState(false);
  const [wipeMeta, setWipeMeta] = useState(false);
  const [throttle1, setThrottle1] = useState({
    enabled: false,
    delayBetweenImages: 3000, // milliseconds, default 3 seconds
    delayBetweenPlans: 1000,  // milliseconds, default 1 second
  });
  const [fetchingImages, setFetchingImages] = useState<Set<string>>(new Set()); // Track which images are being fetched
  const [loadingPreset, setLoadingPreset] = useState(false); // Track loading state for preset button
  const [presetData, setPresetData] = useState<string[][] | null>(null); // Store preset data to pass to grid

  // Inject CSS styles for main element styling
  useEffect(() => {
    if (!mainElementStyling.injection.enabled) return;

    const generateCSS = () => {
      const important = mainElementStyling.injection.important ? ' !important' : '';
      const selectors = [
        mainElementStyling.injection.selector,
        ...mainElementStyling.injection.additionalSelectors
      ];
      
      const cssRules = selectors.map(selector => {
        return `
          ${selector} {
            /* Layout */
            width: ${mainElementStyling.layout.width}${important};
            max-width: ${mainElementStyling.layout.maxWidth}${important};
            min-width: ${mainElementStyling.layout.minWidth}${important};
            height: ${mainElementStyling.layout.height}${important};
            min-height: ${mainElementStyling.layout.minHeight}${important};
            max-height: ${mainElementStyling.layout.maxHeight}${important};
            
            /* Margins - High specificity overrides */
            margin: ${mainElementStyling.margins.margin}${important};
            margin-top: ${mainElementStyling.margins.marginTop}${important};
            margin-right: ${mainElementStyling.margins.marginRight}${important};
            margin-bottom: ${mainElementStyling.margins.marginBottom}${important};
            margin-left: ${mainElementStyling.margins.marginLeft}${important};
            margin-block: ${mainElementStyling.margins.marginBlock}${important};
            margin-inline: ${mainElementStyling.margins.marginInline}${important};
            
            /* Padding */
            padding: ${mainElementStyling.padding.padding}${important};
            padding-top: ${mainElementStyling.padding.paddingTop}${important};
            padding-right: ${mainElementStyling.padding.paddingRight}${important};
            padding-bottom: ${mainElementStyling.padding.paddingBottom}${important};
            padding-left: ${mainElementStyling.padding.paddingLeft}${important};
            padding-block: ${mainElementStyling.padding.paddingBlock}${important};
            padding-inline: ${mainElementStyling.padding.paddingInline}${important};
            
            /* Background */
            background-color: ${mainElementStyling.appearance.backgroundColor}${important};
            background-image: ${mainElementStyling.appearance.backgroundImage}${important};
            background-size: ${mainElementStyling.appearance.backgroundSize}${important};
            background-position: ${mainElementStyling.appearance.backgroundPosition}${important};
            background-repeat: ${mainElementStyling.appearance.backgroundRepeat}${important};
            background-attachment: ${mainElementStyling.appearance.backgroundAttachment}${important};
            
            /* Overflow */
            overflow: ${mainElementStyling.overflow.overflow}${important};
            overflow-x: ${mainElementStyling.overflow.overflowX}${important};
            overflow-y: ${mainElementStyling.overflow.overflowY}${important};
            overflow-wrap: ${mainElementStyling.overflow.overflowWrap}${important};
            word-wrap: ${mainElementStyling.overflow.wordWrap}${important};
            
            /* Display and Position */
            display: ${mainElementStyling.display.display}${important};
            position: ${mainElementStyling.display.position}${important};
            top: ${mainElementStyling.display.top}${important};
            right: ${mainElementStyling.display.right}${important};
            bottom: ${mainElementStyling.display.bottom}${important};
            left: ${mainElementStyling.display.left}${important};
            z-index: ${mainElementStyling.display.zIndex}${important};
            
            /* Flexbox */
            flex-direction: ${mainElementStyling.flexbox.flexDirection}${important};
            flex-wrap: ${mainElementStyling.flexbox.flexWrap}${important};
            justify-content: ${mainElementStyling.flexbox.justifyContent}${important};
            align-items: ${mainElementStyling.flexbox.alignItems}${important};
            align-content: ${mainElementStyling.flexbox.alignContent}${important};
            gap: ${mainElementStyling.flexbox.gap}${important};
            
            /* Borders */
            border: ${mainElementStyling.borders.border}${important};
            border-top: ${mainElementStyling.borders.borderTop}${important};
            border-right: ${mainElementStyling.borders.borderRight}${important};
            border-bottom: ${mainElementStyling.borders.borderBottom}${important};
            border-left: ${mainElementStyling.borders.borderLeft}${important};
            border-radius: ${mainElementStyling.borders.borderRadius}${important};
            outline: ${mainElementStyling.borders.outline}${important};
            
            /* Box Model */
            box-sizing: ${mainElementStyling.boxModel.boxSizing}${important};
            float: ${mainElementStyling.boxModel.float}${important};
            clear: ${mainElementStyling.boxModel.clear}${important};
            resize: ${mainElementStyling.boxModel.resize}${important};
            
            /* Typography */
            font-family: ${mainElementStyling.typography.fontFamily}${important};
            font-size: ${mainElementStyling.typography.fontSize}${important};
            font-weight: ${mainElementStyling.typography.fontWeight}${important};
            line-height: ${mainElementStyling.typography.lineHeight}${important};
            color: ${mainElementStyling.typography.color}${important};
            text-align: ${mainElementStyling.typography.textAlign}${important};
          }
        `;
      }).join('\n');
      
      return cssRules;
    };

    // Create and inject style element
    const styleId = 'tebnar1-main-element-styles';
    let existingStyle = document.getElementById(styleId);
    
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = generateCSS();
    document.head.appendChild(styleElement);
    
    // Cleanup function
    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Fetch all images for the user and map by id
  useEffect(() => {
    const fetchImages = async () => {
      if (!user?.id) {
        setImagesById({});
        return;
      }
      // Get user's DB id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      if (userError || !userData) {
        setImagesById({});
        return;
      }
      // Fetch all images for this user
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('rel_users_id', userData.id);
      if (error) {
        setImagesById({});
        return;
      }
      const map: Record<string, any> = {};
      (data || []).forEach(img => { if (img.id) map[img.id] = img; });
      setImagesById(map);
    };
    fetchImages();
  }, [user, supabase]);

  // Fetch batches for dropdown
  useEffect(() => {
    const fetchBatches = async () => {
      if (!user?.id) {
        setBatches([]);
        return;
      }
      // Get user's DB id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      if (userError || !userData) {
        setBatches([]);
        return;
      }
      // Fetch images_plans_batches for this user
      const { data, error } = await supabase
        .from('images_plans_batches')
        .select('*')
        .eq('rel_users_id', userData.id)
        .order('created_at', { ascending: false });
      if (error) {
        setBatches([]);
        return;
      }
      setBatches(data || []);
    };
    fetchBatches();
  }, [user, supabase]);

  // Helper to refresh batches and select a batch by id
  const refreshBatchesAndSelect = async (batchId: string) => {
    if (!user?.id) return;
    // Get user's DB id from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();
    if (userError || !userData) return;
    // Fetch images_plans_batches for this user
    const { data, error } = await supabase
      .from('images_plans_batches')
      .select('*')
      .eq('rel_users_id', userData.id)
      .order('created_at', { ascending: false });
    if (error) return;
    setBatches(data || []);
    // Only set selectedBatchId if the batch is present
    if (data && data.some((b: any) => b.id === batchId)) {
      setSelectedBatchId(batchId);
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user?.id) {
          setPlans([]);
          setLoading(false);
          return;
        }
        // Get user's DB id from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        if (userError || !userData) {
          setError('Could not find user record.');
          setPlans([]);
          setLoading(false);
          return;
        }
        // Fetch images_plans for this user
        const { data, error } = await supabase
          .from('images_plans')
          .select('*')
          .eq('rel_users_id', userData.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setPlans(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch plans');
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [user, supabase]);

  // Filter plans by selected batch
  const filteredPlans = selectedBatchId
    ? plans.filter(plan => plan.rel_images_plans_batches_id === selectedBatchId)
    : plans;

  // Pagination calculations
  const totalItems = filteredPlans.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = filteredPlans.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setSubmitResult(null);
    try {
      if (!user?.id) throw new Error('User not authenticated');
      if (!gridData || gridData.length < 2) throw new Error('No data to submit');
      const fieldNames = gridData[0].map(f => f.trim()).filter(Boolean);
      const rows = gridData.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
      if (fieldNames.length === 0 || rows.length === 0) throw new Error('Grid is empty or missing headers');
      // Map each row to an object
      const records = rows.map(row => {
        const obj: Record<string, string> = {};
        fieldNames.forEach((field, idx) => {
          if (field) obj[field] = row[idx] ?? '';
        });
        return obj;
      });
      // Import client function
      const { func_create_plans_from_xls_1 } = await import('../utils/cfunc_create_plans_from_xls_1');
      const result = await func_create_plans_from_xls_1(records, gridData);
      setSubmitResult(result?.message || (result?.success ? 'Success' : 'Failed'));
    } catch (err) {
      setSubmitResult(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  // For uitablegrid21, build columns with preview columns after each fk_imageX_id
  const tableColumns = [
    'int1', 'fk_image1_id', 'image1-preview',
    'int2', 'fk_image2_id', 'image2-preview',
    'int3', 'fk_image3_id', 'image3-preview',
    'int4', 'fk_image4_id', 'image4-preview',
    ...columns.slice(8), // Skip the first 8 columns (int1-4, fk_image1-4) since we've already included them above
  ];

  // Helper function to determine if "fetch now" button should be shown
  const shouldShowFetchButton = (plan: any, imageSlot: number): boolean => {
    if (!plan) return false;
    
    // Check if this specific image slot already has an image
    const imageFieldName = `fk_image${imageSlot}_id`;
    const hasImage = plan[imageFieldName];
    
    if (hasImage) return false; // Already has image
    
    // Always allow fetching image 1 if it's missing
    if (imageSlot === 1) return true;
    
    // For slots 2-4, only show if all previous slots have images
    // This ensures we fill images in order: 1, then 2, then 3, then 4
    for (let i = 1; i < imageSlot; i++) {
      const prevImageField = `fk_image${i}_id`;
      if (!plan[prevImageField]) {
        return false; // Previous slot is empty, don't show this slot
      }
    }
    
    return true; // All previous slots have images, this slot can be fetched
  };

  // Function to fetch a single image for a specific plan and slot
  const fetchSingleImage = async (plan: any, imageSlot: number) => {
    console.log('🚀 FETCH SINGLE IMAGE FUNCTION CALLED!', { plan_id: plan.id, imageSlot });
    
    const fetchKey = `${plan.id}-${imageSlot}`;
    
    try {
      setFetchingImages(prev => new Set([...prev, fetchKey]));
      setError(null); // Clear any previous errors
      
      console.log('Fetching single image:', { plan_id: plan.id, imageSlot, aiModel });
      
      // Create a single record for this image generation
      const imageData = {
        plan_id: plan.id,
        image_slot: imageSlot,
        prompt: plan.e_prompt1 || plan.e_more_instructions1 || plan.e_file_name1 || 'AI Image',
        aiModel: aiModel
      };
      
      console.log('Sending request with data:', imageData);
      
      const response = await fetch('/api/sfunc_fetch_single_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Response result:', result);
      
      if (result.success) {
        // Refresh images data to show the new image
        if (user?.id) {
          console.log('Refreshing images data...');
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();
            
          if (userData) {
            // Refresh images
            const { data: imagesData } = await supabase
              .from('images')
              .select('*')
              .eq('rel_users_id', userData.id);
            
            const imageMap: Record<string, any> = {};
            (imagesData || []).forEach(img => { if (img.id) imageMap[img.id] = img; });
            setImagesById(imageMap);
            console.log('Images refreshed, new count:', Object.keys(imageMap).length);
            
            // Also refresh plans to get updated fk_image fields
            const { data: plansData } = await supabase
              .from('images_plans')
              .select('*')
              .eq('rel_users_id', userData.id)
              .order('created_at', { ascending: false });
              
            if (plansData) {
              setPlans(plansData);
              console.log('Plans refreshed, count:', plansData.length);
            }
          }
        }
        
        setError(`✅ Image ${imageSlot} generated successfully for plan ${plan.id}`);
      } else {
        setError(`❌ Failed to generate image ${imageSlot}: ${result.message || 'Unknown error'}`);
      }
      
    } catch (err) {
      console.error('Fetch single image error:', err);
      setError(`❌ Error fetching image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFetchingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(fetchKey);
        return newSet;
      });
    }
  };

  // Function to load dummy data from admin_options
  const loadDummyData = async () => {
    setLoadingPreset(true);
    try {
      const response = await fetch('/api/admin-options/kregno_xls_info_1');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      if (result.success && result.data?.json1) {
        const { headers, rows } = result.data.json1;
        
        // Create grid data with headers as first row
        const newGridData = [headers, ...rows];
        setPresetData(newGridData);
        setError('✅ Dummy data loaded successfully!');
      } else {
        throw new Error('No data found or invalid format');
      }
    } catch (err) {
      console.error('Error loading dummy data:', err);
      setError(`❌ Failed to load dummy data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingPreset(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="w-full mx-auto">
      {/* Black bar with batch dropdown, only on tebnar1 */}
      <div className="sticky top-0 w-full h-10 bg-black z-30 flex items-center px-4 text-white space-x-4">
        <span>rel_images_plans_batches_id</span>
        <select
          value={selectedBatchId}
          onChange={e => setSelectedBatchId(e.target.value)}
          className={`h-7 px-2 rounded text-black ${selectedBatchId ? 'bg-teal-200' : 'bg-white'}`}
          style={{ minWidth: 120 }}
        >
          <option value="">All Batches ({batches.length})</option>
          {batches.map(batch => (
            <option key={batch.id} value={batch.id}>{batch.id}</option>
          ))}
        </select>
      </div>
      
      {/* Error/Success Message Banner */}
      {error && (
        <div className={`w-full px-4 py-3 text-sm font-medium ${
          error.includes('✅') 
            ? 'bg-green-100 text-green-700 border-b border-green-200' 
            : 'bg-red-100 text-red-700 border-b border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-lg font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="w-full px-4">
        {/* Preset Data Button - positioned above kzelement6 */}
        <div className="mb-4">
          <button
            onClick={loadDummyData}
            disabled={loadingPreset}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loadingPreset ? 'Loading...' : 'use dummy kregno xls info 1'}
          </button>
        </div>

        <ExcelPasteGrid onGridDataChange={setGridData} presetData={presetData} />
        <hr className="my-6 border-t-2 border-gray-300" />
        {/* OPTION 1: Submit func_create_plans_from_xls_1 button */}
        <div className="my-4">
          <div className="font-bold mb-1">Option 1</div>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            onClick={handleSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? 'Submitting...' : 'Submit func_create_plans_from_xls_1'}
          </button>
          {submitResult && <div className="mt-2 text-sm text-gray-700">{submitResult}</div>}
        </div>
        <hr className="my-6 border-t-2 border-gray-300" />
        {/* OPTION 2: QTY selector and Submit func_create_plans_make_images_1 button */}
        <div className="mb-4">
          <div className="font-bold mb-2">Option 2</div>
          <div className="font-bold mb-2">QTY Of Images Per Plan To Generate</div>
          <div className="flex space-x-2 mb-2">
            {[1, 2, 3, 4].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setQtyPerPlan(opt)}
                className={`px-4 py-2 rounded-full border font-bold transition-colors duration-150 ${qtyPerPlan === opt ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-indigo-100'}`}
              >
                {opt}
              </button>
            ))}
          </div>
          {/* AI Model Selector */}
          <div className="font-bold mb-2">Select AI Model To Use</div>
          <div className="flex space-x-2 mb-2">
            {['openai', 'grok', 'gemini'].map(model => (
              <button
                key={model}
                type="button"
                onClick={() => setAiModel(model)}
                className={`px-4 py-2 rounded-full border font-bold transition-colors duration-150 capitalize ${aiModel === model ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-teal-100'}`}
              >
                {model}
              </button>
            ))}
          </div>
          {/* Generate Zip Checkbox */}
          <div className="flex items-center mb-2">
            <input
              id="generate-zip"
              type="checkbox"
              checked={generateZip}
              onChange={e => setGenerateZip(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="generate-zip" className="text-sm font-medium">Generate .zip file inside the main folder</label>
          </div>
          {/* Wipe Meta Checkbox */}
          <div className="flex items-center mb-2">
            <input
              id="wipe-meta"
              type="checkbox"
              checked={wipeMeta}
              onChange={e => setWipeMeta(e.target.checked)}
              className="mr-2"
              disabled={!generateZip}
            />
            <label htmlFor="wipe-meta" className="text-sm font-medium">Wipe all meta data from images</label>
          </div>
          
          {/* Throttle1 Controls */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center mb-3">
              <input
                id="throttle1-enabled"
                type="checkbox"
                checked={throttle1.enabled}
                onChange={e => setThrottle1(prev => ({ ...prev, enabled: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="throttle1-enabled" className="text-sm font-medium text-blue-700">
                🐌 Enable Throttle1 (Slow down API requests to prevent timeouts)
              </label>
            </div>
            
            {throttle1.enabled && (
              <div className="ml-6 space-y-3 bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 min-w-[140px]">
                    Delay between images:
                  </label>
                  <input
                    type="number"
                    value={throttle1.delayBetweenImages}
                    onChange={e => setThrottle1(prev => ({ ...prev, delayBetweenImages: Number(e.target.value) }))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="1000"
                    max="30000"
                    step="500"
                  />
                  <span className="text-sm text-gray-500">ms ({(throttle1.delayBetweenImages / 1000).toFixed(1)}s)</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 min-w-[140px]">
                    Delay between plans:
                  </label>
                  <input
                    type="number"
                    value={throttle1.delayBetweenPlans}
                    onChange={e => setThrottle1(prev => ({ ...prev, delayBetweenPlans: Number(e.target.value) }))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="500"
                    max="10000"
                    step="250"
                  />
                  <span className="text-sm text-gray-500">ms ({(throttle1.delayBetweenPlans / 1000).toFixed(1)}s)</span>
                </div>
                
                <div className="text-xs text-gray-600 mt-2">
                  💡 Recommended: 3-5 seconds between images, 1-2 seconds between plans. Higher values reduce API timeouts but take longer.
                </div>
              </div>
            )}
          </div>
          <button
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
            onClick={async () => {
              setMakeImagesLoading(true);
              setMakeImagesResult(null);
              try {
                if (!user?.id) throw new Error('User not authenticated');
                if (!gridData || gridData.length < 2) throw new Error('No data to submit');
                const fieldNames = gridData[0].map(f => f.trim()).filter(Boolean);
                const rows = gridData.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
                if (fieldNames.length === 0 || rows.length === 0) throw new Error('Grid is empty or missing headers');
                const records = rows.map(row => {
                  const obj: Record<string, string> = {};
                  fieldNames.forEach((field, idx) => {
                    if (field) obj[field] = row[idx] ?? '';
                  });
                  return obj;
                });
                
                // Show progress message
                setMakeImagesResult('🚀 Starting image generation... Check the statusbox1 logs for detailed progress!');
                
                const { func_create_plans_make_images_1 } = await import('../utils/cfunc_create_plans_make_images_1');
                const result = await func_create_plans_make_images_1({ records, qty: qtyPerPlan, aiModel, generateZip, wipeMeta, throttle1, gridData });
                setMakeImagesResult(result?.message || (result?.success ? 'Success' : 'Failed'));
                if (result?.batch_id) {
                  await refreshBatchesAndSelect(result.batch_id);
                }
              } catch (err) {
                setMakeImagesResult(err instanceof Error ? err.message : String(err));
              } finally {
                setMakeImagesLoading(false);
              }
            }}
            disabled={makeImagesLoading}
          >
            {makeImagesLoading ? 'Generating Images...' : 'Submit func_create_plans_make_images_1'}
          </button>
          {makeImagesResult && (
            <div className="mt-2 text-sm">
              <div className={makeImagesResult.includes('🚀') ? 'text-blue-700' : 'text-gray-700'}>
                {makeImagesResult}
              </div>
              {makeImagesLoading && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm text-blue-800">
                    <strong>💡 Debug Tips:</strong>
                    <ul className="mt-1 ml-4 list-disc text-xs">
                      <li>Go to <strong>bin35/statusbox1</strong> to see real-time logs</li>
                      <li>Filter by "image_generation" or "throttle_system" category</li>
                      <li>Watch for timeout errors or OpenAI API failures</li>
                      <li>Each image generation step is logged with details</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <hr className="my-6 border-t-2 border-gray-300" />
        {/* uitablegrid21 label */}
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <span className="font-bold">uitablegrid21</span>
          <span>- uitablegrid chiefly represents rows of</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText('db table images_plans');
            }}
            className="px-2 py-1 border border-solid border-gray-400 rounded text-sm hover:bg-gray-50 transition-colors"
            title="Click to copy"
          >
            db table images_plans
          </button>
          <span>(copy button)</span>
        </div>
        <div className="overflow-x-auto w-full">
          <table 
            className="w-full divide-y divide-gray-200"
            style={{
              tableLayout: tableStyleSettings.table.tableLayout,
              width: tableStyleSettings.table.width,
              maxWidth: tableStyleSettings.table.maxWidth,
              overflow: tableStyleSettings.table.overflow,
              borderCollapse: tableBorderSettings.global.borderCollapse,
              borderSpacing: tableBorderSettings.global.borderSpacing,
              border: tableBorderSettings.tableBorders.enabled ? `${tableBorderSettings.tableBorders.top}` : 'none',
              borderRadius: tableBorderSettings.tableBorders.borderRadius,
            }}
          >
            <thead className="bg-gray-50">
              <tr
                style={{
                  height: headerCustomizationSettings.headerRow.height,
                  minHeight: headerCustomizationSettings.headerRow.minHeight,
                  maxHeight: headerCustomizationSettings.headerRow.maxHeight,
                  backgroundColor: headerCustomizationSettings.headerRow.backgroundColor,
                  borderBottom: headerCustomizationSettings.headerRow.borderBottom,
                  position: headerCustomizationSettings.headerRow.position,
                  top: headerCustomizationSettings.headerRow.top,
                  zIndex: headerCustomizationSettings.headerRow.zIndex,
                  borderTop: headerCustomizationSettings.headerBorders.topBorder,
                }}
              >
                {tableColumns.map((col, index) => {
                  // Get width settings - headerCellWidths takes precedence over columnSettings
                  const widthSettings = headerCustomizationSettings.headerCellWidths[col] || 
                                      columnSettings[col] || 
                                      { width: 'auto', minWidth: '100px', maxWidth: 'none' };
                  
                  // Get text alignment - headerTextAlign takes precedence
                  const textAlign = headerCustomizationSettings.headerTextAlign[col] || 
                                  headerCustomizationSettings.headerCell.textAlign;
                  
                  // Get padding settings - tableCellPaddingSettings takes precedence
                  const paddingSettings = tableCellPaddingSettings.rowTypePadding.headerRow;
                  
                  // Get border settings - tableBorderSettings takes precedence
                  const borderSettings = tableBorderSettings.headerBorders.enabled ? {
                    borderRight: index < tableColumns.length - 1 ? 
                               tableBorderSettings.headerBorders.cellBorderRight : 
                               tableBorderSettings.headerBorders.lastHeaderCellRight,
                    borderLeft: tableBorderSettings.headerBorders.cellBorderLeft,
                    borderTop: tableBorderSettings.headerBorders.cellBorderTop,
                    borderBottom: tableBorderSettings.headerBorders.cellBorderBottom,
                  } : {
                    borderRight: headerCustomizationSettings.headerBorders.cellBorderRight,
                    borderLeft: headerCustomizationSettings.headerBorders.cellBorderLeft,
                    borderTop: headerCustomizationSettings.headerBorders.topBorder,
                    borderBottom: headerCustomizationSettings.headerBorders.bottomBorder,
                  };
                  
                  return (
                    <th
                      key={col}
                      style={{
                        // Width and sizing
                        width: widthSettings.width,
                        minWidth: widthSettings.minWidth,
                        maxWidth: widthSettings.maxWidth,
                        height: headerCustomizationSettings.headerRow.height,
                        
                        // Cell styling
                        padding: paddingSettings.padding,
                        verticalAlign: headerCustomizationSettings.headerCell.verticalAlign,
                        textAlign: textAlign,
                        backgroundColor: headerCustomizationSettings.headerCell.backgroundColor,
                        overflow: headerCustomizationSettings.headerCell.overflow,
                        textOverflow: headerCustomizationSettings.headerCell.textOverflow,
                        whiteSpace: headerCustomizationSettings.headerCell.whiteSpace,
                        wordBreak: headerCustomizationSettings.headerCell.wordBreak,
                        boxSizing: headerCustomizationSettings.headerCell.boxSizing,
                        
                        // Text styling
                        fontSize: headerCustomizationSettings.headerText.fontSize,
                        fontWeight: headerCustomizationSettings.headerText.fontWeight,
                        color: headerCustomizationSettings.headerText.color,
                        textTransform: headerCustomizationSettings.headerText.textTransform,
                        letterSpacing: headerCustomizationSettings.headerText.letterSpacing,
                        lineHeight: headerCustomizationSettings.headerText.lineHeight,
                        fontFamily: headerCustomizationSettings.headerText.fontFamily,
                        
                        // Borders
                        borderRight: borderSettings.borderRight,
                        borderLeft: borderSettings.borderLeft,
                        borderTop: borderSettings.borderTop,
                        borderBottom: borderSettings.borderBottom,
                        borderRadius: headerCustomizationSettings.headerBorders.borderRadius,
                        
                        // Hover effects
                        cursor: headerCustomizationSettings.headerHover.enabled ? 
                               headerCustomizationSettings.headerHover.cursor : 'default',
                        transition: headerCustomizationSettings.headerHover.enabled ? 
                                  headerCustomizationSettings.headerHover.transition : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (headerCustomizationSettings.headerHover.enabled) {
                          e.currentTarget.style.backgroundColor = headerCustomizationSettings.headerHover.backgroundColor;
                          e.currentTarget.style.color = headerCustomizationSettings.headerHover.textColor;
                          e.currentTarget.style.borderColor = headerCustomizationSettings.headerHover.borderColor;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (headerCustomizationSettings.headerHover.enabled) {
                          e.currentTarget.style.backgroundColor = headerCustomizationSettings.headerCell.backgroundColor;
                          e.currentTarget.style.color = headerCustomizationSettings.headerText.color;
                          e.currentTarget.style.borderColor = headerCustomizationSettings.headerBorders.cellBorderRight.split(' ')[2] || 'transparent';
                        }
                      }}
                    >
                      {col.startsWith('image') ? 'Preview' : col}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map(plan => (
                <tr 
                  key={plan.id} 
                  className="hover:bg-gray-50"
                  style={{ 
                    height: tableStyleSettings.row.height,
                    minHeight: tableStyleSettings.row.minHeight,
                    maxHeight: tableStyleSettings.row.maxHeight,
                    verticalAlign: tableStyleSettings.row.verticalAlign,
                    backgroundColor: tableStyleSettings.row.backgroundColor,
                    borderBottom: tableStyleSettings.row.borderBottom,
                    overflow: tableStyleSettings.row.overflow,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = tableStyleSettings.row.hoverBackgroundColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = tableStyleSettings.row.backgroundColor;
                  }}
                >
                  {tableColumns.map(col => {
                    const settings = columnSettings[col] || { width: 'auto', minWidth: '100px', maxWidth: 'none', textAlign: 'left' };
                    
                    // Get padding settings for this column
                    const columnPadding = tableCellPaddingSettings.columnPadding[col] || tableCellPaddingSettings.globalDefault;
                    
                    // Get border settings for this column
                    const columnBorder = tableBorderSettings.columnBorders.columnSpecific[col] || {
                      right: tableBorderSettings.columnBorders.defaultRight,
                      left: tableBorderSettings.columnBorders.defaultLeft,
                    };
                    
                    if (col === 'image1-preview') {
                      const imgId = plan['fk_image1_id'];
                      const img = imgId ? imagesById[imgId] : null;
                      const fetchKey = `${plan.id}-1`;
                      const isFetching = fetchingImages.has(fetchKey);
                      const showFetchButton = shouldShowFetchButton(plan, 1);
                      
                      return (
                        <td
                          key={col}
                          style={{
                            width: settings.width,
                            minWidth: settings.minWidth,
                            maxWidth: settings.maxWidth,
                            textAlign: settings.textAlign || 'center',
                            height: tableStyleSettings.row.height,
                            padding: columnPadding.padding,
                            backgroundColor: tableStyleSettings.previewCell.backgroundColor,
                            verticalAlign: tableStyleSettings.cell.verticalAlign,
                            overflow: tableStyleSettings.cell.overflow,
                            borderRight: tableBorderSettings.columnBorders.enabled ? columnBorder.right : '0px',
                            borderLeft: tableBorderSettings.columnBorders.enabled ? columnBorder.left : '0px',
                            borderBottom: tableBorderSettings.rowBorders.enabled ? tableBorderSettings.rowBorders.dataRowBottom : '0px',
                          }}
                        >
                          {img ? (
                            <img
                              src={img.img_file_url1}
                              alt={`Image ${1}`}
                              style={{
                                width: tableStyleSettings.previewImage.width,
                                height: tableStyleSettings.previewImage.height,
                                objectFit: tableStyleSettings.previewImage.objectFit,
                                borderRadius: tableStyleSettings.previewImage.borderRadius,
                                border: tableStyleSettings.previewImage.border,
                              }}
                            />
                          ) : isFetching ? (
                            <div 
                              className="flex items-center justify-center bg-gray-100 rounded"
                              style={{
                                width: tableStyleSettings.loadingSpinner.width,
                                height: tableStyleSettings.loadingSpinner.height,
                                backgroundColor: tableStyleSettings.loadingSpinner.backgroundColor,
                              }}
                            >
                              <div 
                                className="animate-spin rounded-full border-b-2 border-blue-600"
                                style={{
                                  width: tableStyleSettings.loadingSpinner.spinnerSize,
                                  height: tableStyleSettings.loadingSpinner.spinnerSize,
                                  borderColor: `transparent transparent ${tableStyleSettings.loadingSpinner.spinnerColor} transparent`,
                                }}
                              ></div>
                            </div>
                          ) : shouldShowFetchButton(plan, 1) ? (
                            <button
                              onClick={() => fetchSingleImage(plan, 1)}
                              className="border border-blue-300 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg transition-colors duration-200 ease-in-out"
                              style={{
                                width: tableStyleSettings.fetchButton.width,
                                height: tableStyleSettings.fetchButton.height,
                                borderRadius: tableStyleSettings.fetchButton.borderRadius,
                                fontSize: tableStyleSettings.fetchButton.fontSize,
                                fontWeight: tableStyleSettings.fetchButton.fontWeight,
                                transition: tableStyleSettings.fetchButton.transition,
                                backgroundColor: tableStyleSettings.fetchButton.backgroundColor,
                                borderColor: tableStyleSettings.fetchButton.borderColor,
                                color: tableStyleSettings.fetchButton.textColor,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = tableStyleSettings.fetchButton.hoverBackgroundColor;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = tableStyleSettings.fetchButton.backgroundColor;
                              }}
                            >
                              Fetch Now
                            </button>
                          ) : (
                            <div className="text-gray-400 text-sm">No image</div>
                          )}
                        </td>
                      );
                    }
                    if (col === 'image2-preview') {
                      const imgId = plan['fk_image2_id'];
                      const img = imgId ? imagesById[imgId] : null;
                      const fetchKey = `${plan.id}-2`;
                      const isFetching = fetchingImages.has(fetchKey);
                      const showFetchButton = shouldShowFetchButton(plan, 2);
                      
                      return (
                        <td
                          key={col}
                          style={{
                            width: settings.width,
                            minWidth: settings.minWidth,
                            maxWidth: settings.maxWidth,
                            textAlign: settings.textAlign || 'center',
                            height: tableStyleSettings.row.height,
                            padding: columnPadding.padding,
                            backgroundColor: tableStyleSettings.previewCell.backgroundColor,
                            verticalAlign: tableStyleSettings.cell.verticalAlign,
                            overflow: tableStyleSettings.cell.overflow,
                            borderRight: tableBorderSettings.columnBorders.enabled ? columnBorder.right : '0px',
                            borderLeft: tableBorderSettings.columnBorders.enabled ? columnBorder.left : '0px',
                            borderBottom: tableBorderSettings.rowBorders.enabled ? tableBorderSettings.rowBorders.dataRowBottom : '0px',
                          }}
                        >
                          {img ? (
                            <img
                              src={img.img_file_url1}
                              alt={`Image ${2}`}
                              style={{
                                width: tableStyleSettings.previewImage.width,
                                height: tableStyleSettings.previewImage.height,
                                objectFit: tableStyleSettings.previewImage.objectFit,
                                borderRadius: tableStyleSettings.previewImage.borderRadius,
                                border: tableStyleSettings.previewImage.border,
                              }}
                            />
                          ) : isFetching ? (
                            <div 
                              className="flex items-center justify-center bg-gray-100 rounded"
                              style={{
                                width: tableStyleSettings.loadingSpinner.width,
                                height: tableStyleSettings.loadingSpinner.height,
                                backgroundColor: tableStyleSettings.loadingSpinner.backgroundColor,
                              }}
                            >
                              <div 
                                className="animate-spin rounded-full border-b-2 border-blue-600"
                                style={{
                                  width: tableStyleSettings.loadingSpinner.spinnerSize,
                                  height: tableStyleSettings.loadingSpinner.spinnerSize,
                                  borderColor: `transparent transparent ${tableStyleSettings.loadingSpinner.spinnerColor} transparent`,
                                }}
                              ></div>
                            </div>
                          ) : shouldShowFetchButton(plan, 2) ? (
                            <button
                              onClick={() => fetchSingleImage(plan, 2)}
                              className="border border-blue-300 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg transition-colors duration-200 ease-in-out"
                              style={{
                                width: tableStyleSettings.fetchButton.width,
                                height: tableStyleSettings.fetchButton.height,
                                borderRadius: tableStyleSettings.fetchButton.borderRadius,
                                fontSize: tableStyleSettings.fetchButton.fontSize,
                                fontWeight: tableStyleSettings.fetchButton.fontWeight,
                                transition: tableStyleSettings.fetchButton.transition,
                                backgroundColor: tableStyleSettings.fetchButton.backgroundColor,
                                borderColor: tableStyleSettings.fetchButton.borderColor,
                                color: tableStyleSettings.fetchButton.textColor,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = tableStyleSettings.fetchButton.hoverBackgroundColor;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = tableStyleSettings.fetchButton.backgroundColor;
                              }}
                            >
                              Fetch Now
                            </button>
                          ) : (
                            <div className="text-gray-400 text-sm">No image</div>
                          )}
                        </td>
                      );
                    }
                    if (col === 'image3-preview') {
                      const imgId = plan['fk_image3_id'];
                      const img = imgId ? imagesById[imgId] : null;
                      const fetchKey = `${plan.id}-3`;
                      const isFetching = fetchingImages.has(fetchKey);
                      const showFetchButton = shouldShowFetchButton(plan, 3);
                      
                      return (
                        <td
                          key={col}
                          style={{
                            width: settings.width,
                            minWidth: settings.minWidth,
                            maxWidth: settings.maxWidth,
                            textAlign: settings.textAlign || 'center',
                            height: tableStyleSettings.row.height,
                            padding: columnPadding.padding,
                            backgroundColor: tableStyleSettings.previewCell.backgroundColor,
                            verticalAlign: tableStyleSettings.cell.verticalAlign,
                            overflow: tableStyleSettings.cell.overflow,
                            borderRight: tableBorderSettings.columnBorders.enabled ? columnBorder.right : '0px',
                            borderLeft: tableBorderSettings.columnBorders.enabled ? columnBorder.left : '0px',
                            borderBottom: tableBorderSettings.rowBorders.enabled ? tableBorderSettings.rowBorders.dataRowBottom : '0px',
                          }}
                        >
                          {img ? (
                            <img
                              src={img.img_file_url1}
                              alt={`Image ${3}`}
                              style={{
                                width: tableStyleSettings.previewImage.width,
                                height: tableStyleSettings.previewImage.height,
                                objectFit: tableStyleSettings.previewImage.objectFit,
                                borderRadius: tableStyleSettings.previewImage.borderRadius,
                                border: tableStyleSettings.previewImage.border,
                              }}
                            />
                          ) : isFetching ? (
                            <div 
                              className="flex items-center justify-center bg-gray-100 rounded"
                              style={{
                                width: tableStyleSettings.loadingSpinner.width,
                                height: tableStyleSettings.loadingSpinner.height,
                                backgroundColor: tableStyleSettings.loadingSpinner.backgroundColor,
                              }}
                            >
                              <div 
                                className="animate-spin rounded-full border-b-2 border-blue-600"
                                style={{
                                  width: tableStyleSettings.loadingSpinner.spinnerSize,
                                  height: tableStyleSettings.loadingSpinner.spinnerSize,
                                  borderColor: `transparent transparent ${tableStyleSettings.loadingSpinner.spinnerColor} transparent`,
                                }}
                              ></div>
                            </div>
                          ) : shouldShowFetchButton(plan, 3) ? (
                            <button
                              onClick={() => fetchSingleImage(plan, 3)}
                              className="border border-blue-300 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg transition-colors duration-200 ease-in-out"
                              style={{
                                width: tableStyleSettings.fetchButton.width,
                                height: tableStyleSettings.fetchButton.height,
                                borderRadius: tableStyleSettings.fetchButton.borderRadius,
                                fontSize: tableStyleSettings.fetchButton.fontSize,
                                fontWeight: tableStyleSettings.fetchButton.fontWeight,
                                transition: tableStyleSettings.fetchButton.transition,
                                backgroundColor: tableStyleSettings.fetchButton.backgroundColor,
                                borderColor: tableStyleSettings.fetchButton.borderColor,
                                color: tableStyleSettings.fetchButton.textColor,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = tableStyleSettings.fetchButton.hoverBackgroundColor;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = tableStyleSettings.fetchButton.backgroundColor;
                              }}
                            >
                              Fetch Now
                            </button>
                          ) : (
                            <div className="text-gray-400 text-sm">No image</div>
                          )}
                        </td>
                      );
                    }
                    if (col === 'image4-preview') {
                      const imgId = plan['fk_image4_id'];
                      const img = imgId ? imagesById[imgId] : null;
                      const fetchKey = `${plan.id}-4`;
                      const isFetching = fetchingImages.has(fetchKey);
                      const showFetchButton = shouldShowFetchButton(plan, 4);
                      
                      return (
                        <td
                          key={col}
                          style={{
                            width: settings.width,
                            minWidth: settings.minWidth,
                            maxWidth: settings.maxWidth,
                            textAlign: settings.textAlign || 'center',
                            height: tableStyleSettings.row.height,
                            padding: columnPadding.padding,
                            backgroundColor: tableStyleSettings.previewCell.backgroundColor,
                            verticalAlign: tableStyleSettings.cell.verticalAlign,
                            overflow: tableStyleSettings.cell.overflow,
                            borderRight: tableBorderSettings.columnBorders.enabled ? columnBorder.right : '0px',
                            borderLeft: tableBorderSettings.columnBorders.enabled ? columnBorder.left : '0px',
                            borderBottom: tableBorderSettings.rowBorders.enabled ? tableBorderSettings.rowBorders.dataRowBottom : '0px',
                          }}
                        >
                          {img ? (
                            <img
                              src={img.img_file_url1}
                              alt={`Image ${4}`}
                              style={{
                                width: tableStyleSettings.previewImage.width,
                                height: tableStyleSettings.previewImage.height,
                                objectFit: tableStyleSettings.previewImage.objectFit,
                                borderRadius: tableStyleSettings.previewImage.borderRadius,
                                border: tableStyleSettings.previewImage.border,
                              }}
                            />
                          ) : isFetching ? (
                            <div 
                              className="flex items-center justify-center bg-gray-100 rounded"
                              style={{
                                width: tableStyleSettings.loadingSpinner.width,
                                height: tableStyleSettings.loadingSpinner.height,
                                backgroundColor: tableStyleSettings.loadingSpinner.backgroundColor,
                              }}
                            >
                              <div 
                                className="animate-spin rounded-full border-b-2 border-blue-600"
                                style={{
                                  width: tableStyleSettings.loadingSpinner.spinnerSize,
                                  height: tableStyleSettings.loadingSpinner.spinnerSize,
                                  borderColor: `transparent transparent ${tableStyleSettings.loadingSpinner.spinnerColor} transparent`,
                                }}
                              ></div>
                            </div>
                          ) : shouldShowFetchButton(plan, 4) ? (
                            <button
                              onClick={() => fetchSingleImage(plan, 4)}
                              className="border border-blue-300 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg transition-colors duration-200 ease-in-out"
                              style={{
                                width: tableStyleSettings.fetchButton.width,
                                height: tableStyleSettings.fetchButton.height,
                                borderRadius: tableStyleSettings.fetchButton.borderRadius,
                                fontSize: tableStyleSettings.fetchButton.fontSize,
                                fontWeight: tableStyleSettings.fetchButton.fontWeight,
                                transition: tableStyleSettings.fetchButton.transition,
                                backgroundColor: tableStyleSettings.fetchButton.backgroundColor,
                                borderColor: tableStyleSettings.fetchButton.borderColor,
                                color: tableStyleSettings.fetchButton.textColor,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = tableStyleSettings.fetchButton.hoverBackgroundColor;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = tableStyleSettings.fetchButton.backgroundColor;
                              }}
                            >
                              Fetch Now
                            </button>
                          ) : (
                            <div className="text-gray-400 text-sm">No image</div>
                          )}
                        </td>
                      );
                    } else {
                      // Regular data cell
                      return (
                        <td
                          key={col}
                          style={{
                            width: settings.width,
                            minWidth: settings.minWidth,
                            maxWidth: settings.maxWidth,
                            textAlign: settings.textAlign || 'left',
                            height: tableStyleSettings.row.height,
                            padding: columnPadding.padding,
                            verticalAlign: tableStyleSettings.cell.verticalAlign,
                            overflow: tableStyleSettings.cell.overflow,
                            textOverflow: tableStyleSettings.cell.textOverflow,
                            whiteSpace: tableStyleSettings.cell.whiteSpace,
                            wordBreak: tableStyleSettings.cell.wordBreak,
                            fontSize: tableStyleSettings.textCell.fontSize,
                            lineHeight: tableStyleSettings.textCell.lineHeight,
                            color: tableStyleSettings.textCell.color,
                            fontWeight: tableStyleSettings.textCell.fontWeight,
                            borderRight: tableBorderSettings.columnBorders.enabled ? columnBorder.right : '0px',
                            borderLeft: tableBorderSettings.columnBorders.enabled ? columnBorder.left : '0px',
                            borderBottom: tableBorderSettings.rowBorders.enabled ? tableBorderSettings.rowBorders.dataRowBottom : '0px',
                          }}
                        >
                          {String(plan[col as keyof typeof plan] ?? '')}
                        </td>
                      );
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          <div 
            className="px-6 py-3 border-t border-gray-200 bg-white"
            style={{
              backgroundColor: tableStyleSettings.pagination.backgroundColor,
              borderTop: tableStyleSettings.pagination.borderTop,
              padding: tableStyleSettings.pagination.padding,
              fontSize: tableStyleSettings.pagination.fontSize,
              color: tableStyleSettings.pagination.color,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{endIndex}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> results
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="ml-4 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>
                      {size} per page
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
          
          {filteredPlans.length === 0 && <div className="mt-4 text-gray-500">No plans found for your user.</div>}
        </div>
      </div>
    </div>
  );
} 