/**
 * Nemtor Units Table Configuration
 * 
 * Nemtor Units Database - Live data with 32 columns
 */

import { TableConfig } from './tableConfig.sample';

export const torna3TableConfig: TableConfig = {
  tableName: 'nemtor_units',
  
  columns: [
    { field: 'unit_id', header: 'Unit ID', width: '100px', sortable: true, searchable: false, editable: false },
    { field: 'fk_gcon_piece_id', header: 'GCon Piece ID', width: '100px', sortable: true, searchable: false, editable: false },
    { field: 'unit_marker', header: 'Unit Marker', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'el_id', header: 'Element ID', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'el_type', header: 'Element Type', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'widget_type', header: 'Widget Type', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'parent_el_id', header: 'Parent Element ID', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'position_order', header: 'Position Order', width: '80px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'depth_level', header: 'Depth Level', width: '80px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'sort_index', header: 'Sort Index', width: '80px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'summary_text', header: 'Summary Text', width: '200px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'unit_label', header: 'Unit Label', width: '150px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'settings_json', header: 'Settings JSON', width: '150px', sortable: false, searchable: false, editable: false, type: 'json', format: (value: any) => value ? JSON.stringify(value).slice(0, 50) + '...' : '' },
    { field: 'style_json', header: 'Style JSON', width: '150px', sortable: false, searchable: false, editable: false, type: 'json', format: (value: any) => value ? JSON.stringify(value).slice(0, 50) + '...' : '' },
    { field: 'globals_json', header: 'Globals JSON', width: '150px', sortable: false, searchable: false, editable: false, type: 'json', format: (value: any) => value ? JSON.stringify(value).slice(0, 50) + '...' : '' },
    { field: 'raw_json', header: 'Raw JSON', width: '150px', sortable: false, searchable: false, editable: false, type: 'json', format: (value: any) => value ? JSON.stringify(value).slice(0, 50) + '...' : '' },
    { field: 'created_at', header: 'Created At', width: '150px', sortable: true, searchable: false, editable: false, type: 'date', format: (value: any) => value ? new Date(value).toLocaleString() : '' },
    { field: 'updated_at', header: 'Updated At', width: '150px', sortable: true, searchable: false, editable: false, type: 'date', format: (value: any) => value ? new Date(value).toLocaleString() : '' },
    { field: 'full_text_cached', header: 'Full Text Cached', width: '200px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'full_text_edits', header: 'Full Text Edits', width: '200px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'image_type', header: 'Image Type', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'image_id', header: 'Image ID', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'image_url', header: 'Image URL', width: '200px', sortable: false, searchable: true, editable: true, type: 'text' },
    { field: 'image_alt', header: 'Image Alt', width: '150px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'image_size', header: 'Image Size', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'image_source', header: 'Image Source', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'carousel_position', header: 'Carousel Position', width: '80px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'image_context', header: 'Image Context', width: '150px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'has_img_slot', header: 'Has Image Slot', width: '80px', sortable: true, searchable: false, editable: true, type: 'boolean', format: (v) => v ? 'Yes' : 'No' },
    { field: 'img_slot_qty', header: 'Image Slot Qty', width: '80px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'tar_description_text', header: 'TAR Description Text', width: '200px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'tar_description_text_edits', header: 'TAR Description Edits', width: '200px', sortable: true, searchable: true, editable: true, type: 'text' }
  ],
  
  // Header Rows Configuration (Required: At least 1 row)
  headerRows: [
    {
      id: 'main-header',
      type: 'label',
      cells: [
        { content: 'Unit ID', alignment: 'center' },
        { content: 'GCon Piece ID', alignment: 'center' },
        { content: 'Unit Marker', alignment: 'left' },
        { content: 'Element ID', alignment: 'left' },
        { content: 'Element Type', alignment: 'left' },
        { content: 'Widget Type', alignment: 'left' },
        { content: 'Parent Element ID', alignment: 'left' },
        { content: 'Position Order', alignment: 'center' },
        { content: 'Depth Level', alignment: 'center' },
        { content: 'Sort Index', alignment: 'center' },
        { content: 'Summary Text', alignment: 'left' },
        { content: 'Unit Label', alignment: 'left' },
        { content: 'Settings JSON', alignment: 'left' },
        { content: 'Style JSON', alignment: 'left' },
        { content: 'Globals JSON', alignment: 'left' },
        { content: 'Raw JSON', alignment: 'left' },
        { content: 'Created At', alignment: 'center' },
        { content: 'Updated At', alignment: 'center' },
        { content: 'Full Text Cached', alignment: 'left' },
        { content: 'Full Text Edits', alignment: 'left' },
        { content: 'Image Type', alignment: 'left' },
        { content: 'Image ID', alignment: 'left' },
        { content: 'Image URL', alignment: 'left' },
        { content: 'Image Alt', alignment: 'left' },
        { content: 'Image Size', alignment: 'left' },
        { content: 'Image Source', alignment: 'left' },
        { content: 'Carousel Position', alignment: 'center' },
        { content: 'Image Context', alignment: 'left' },
        { content: 'Has Image Slot', alignment: 'center' },
        { content: 'Image Slot Qty', alignment: 'center' },
        { content: 'TAR Description Text', alignment: 'left' },
        { content: 'TAR Description Edits', alignment: 'left' }
      ]
    }
  ],
  
  filters: [
    {
      id: 'el_type',
      label: 'Element Type',
      type: 'dropdown',
      column: 'el_type',
      operator: 'eq',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'widget', label: 'Widget' },
        { value: 'section', label: 'Section' },
        { value: 'column', label: 'Column' }
      ]
    },
    {
      id: 'widget_type',
      label: 'Widget Type',
      type: 'dropdown',
      column: 'widget_type',
      operator: 'eq',
      options: [
        { value: 'all', label: 'All Widgets' },
        { value: 'text-editor', label: 'Text Editor' },
        { value: 'image', label: 'Image' },
        { value: 'heading', label: 'Heading' },
        { value: 'button', label: 'Button' }
      ]
    },
    {
      id: 'has_img_slot',
      label: 'Has Image Slot',
      type: 'dropdown',
      column: 'has_img_slot',
      operator: 'eq',
      options: [
        { value: 'all', label: 'All Units' },
        { value: 'true', label: 'With Image Slot' },
        { value: 'false', label: 'Without Image Slot' }
      ]
    }
  ],
  
  // Pagination settings
  pageSizes: [10, 25, 50, 100, 200],
  defaultPageSize: 25,
  showAllOption: true,
  
  // Default sorting
  defaultSort: {
    field: 'sort_index',
    order: 'asc'
  },
  
  // Search configuration
  enableSearch: true,
  searchPlaceholder: 'Search units, labels, elements...',
  searchDebounceMs: 300,
  searchFields: ['unit_marker', 'unit_label', 'el_id', 'el_type', 'widget_type', 'summary_text'],
  
  // Feature flags
  enableInlineEdit: true,
  enableBulkActions: false,
  enableExport: false,
  enableColumnToggle: true,
  
  // Row actions
  rowActions: [
    {
      label: 'Edit',
      action: (row) => {
        console.log('Edit nemtor unit:', row);
        // Implement edit functionality
      }
    },
    {
      label: 'View JSON',
      action: (row) => {
        console.log('View JSON data:', row);
        // Implement JSON viewer
      }
    }
  ],
  
  // Events
  onRowClick: (row) => {
    console.log('Nemtor unit clicked:', row);
  },
  
  beforeSave: async (row, changes) => {
    console.log('Before save nemtor unit:', row, changes);
    // Validate changes
    return true; // Allow save
  },
  
  afterSave: (row) => {
    console.log('After save nemtor unit:', row);
  },
  
  // Custom styles matching the current implementation
  customStyles: {
    headerRow: {
      backgroundColor: '#e6f3ff',
      fontWeight: 'bold'
    },
    dataRow: {
      borderBottom: '1px solid #ddd'
    },
    cell: {
      padding: '12px'
    }
  }
};

// Export as default for easy import
export default torna3TableConfig;