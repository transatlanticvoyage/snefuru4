/**
 * Nemtor Units Table Configuration
 * 
 * Nemtor Units Database - Live data with 32 columns
 */

import { TableConfig } from './tableConfig.sample';

export const torna3TableConfig: TableConfig = {
  tableName: 'nemtor_units',
  
  columns: [
    { field: 'unit_id', header: 'unit_id', width: '100px', sortable: true, searchable: false, editable: false },
    { field: 'fk_gcon_piece_id', header: 'fk_gcon_piece_id', width: '100px', sortable: true, searchable: false, editable: false },
    { field: 'unit_marker', header: 'unit_marker', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'el_id', header: 'el_id', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'el_type', header: 'el_type', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'widget_type', header: 'widget_type', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'parent_el_id', header: 'parent_el_id', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'position_order', header: 'position_order', width: '80px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'depth_level', header: 'depth_level', width: '80px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'sort_index', header: 'sort_index', width: '80px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'summary_text', header: 'summary_text', width: '200px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'unit_label', header: 'unit_label', width: '150px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'settings_json', header: 'settings_json', width: '150px', sortable: false, searchable: false, editable: false, type: 'json', format: (value: any) => value ? JSON.stringify(value).slice(0, 50) + '...' : '' },
    { field: 'style_json', header: 'style_json', width: '150px', sortable: false, searchable: false, editable: false, type: 'json', format: (value: any) => value ? JSON.stringify(value).slice(0, 50) + '...' : '' },
    { field: 'globals_json', header: 'globals_json', width: '150px', sortable: false, searchable: false, editable: false, type: 'json', format: (value: any) => value ? JSON.stringify(value).slice(0, 50) + '...' : '' },
    { field: 'raw_json', header: 'raw_json', width: '150px', sortable: false, searchable: false, editable: false, type: 'json', format: (value: any) => value ? JSON.stringify(value).slice(0, 50) + '...' : '' },
    { field: 'created_at', header: 'created_at', width: '150px', sortable: true, searchable: false, editable: false, type: 'date', format: (value: any) => value ? new Date(value).toLocaleString() : '' },
    { field: 'updated_at', header: 'updated_at', width: '150px', sortable: true, searchable: false, editable: false, type: 'date', format: (value: any) => value ? new Date(value).toLocaleString() : '' },
    { field: 'full_text_cached', header: 'full_text_cached', width: '200px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'full_text_edits', header: 'full_text_edits', width: '200px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'image_type', header: 'image_type', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'image_id', header: 'image_id', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'image_url', header: 'image_url', width: '200px', sortable: false, searchable: true, editable: true, type: 'text' },
    { field: 'image_alt', header: 'image_alt', width: '150px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'image_size', header: 'image_size', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'image_source', header: 'image_source', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'carousel_position', header: 'carousel_position', width: '80px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'image_context', header: 'image_context', width: '150px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'has_img_slot', header: 'has_img_slot', width: '80px', sortable: true, searchable: false, editable: true, type: 'boolean', format: (v) => v ? 'Yes' : 'No' },
    { field: 'img_slot_qty', header: 'img_slot_qty', width: '80px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'tar_description_text', header: 'tar_description_text', width: '200px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'tar_description_text_edits', header: 'tar_description_text_edits', width: '200px', sortable: true, searchable: true, editable: true, type: 'text' }
  ],
  
  // Header Rows Configuration (Required: At least 1 row)
  headerRows: [
    {
      id: 'main-header',
      type: 'label',
      cells: [
        { content: 'unit_id', alignment: 'center' },
        { content: 'fk_gcon_piece_id', alignment: 'center' },
        { content: 'unit_marker', alignment: 'left' },
        { content: 'el_id', alignment: 'left' },
        { content: 'el_type', alignment: 'left' },
        { content: 'widget_type', alignment: 'left' },
        { content: 'parent_el_id', alignment: 'left' },
        { content: 'position_order', alignment: 'center' },
        { content: 'depth_level', alignment: 'center' },
        { content: 'sort_index', alignment: 'center' },
        { content: 'summary_text', alignment: 'left' },
        { content: 'unit_label', alignment: 'left' },
        { content: 'settings_json', alignment: 'left' },
        { content: 'style_json', alignment: 'left' },
        { content: 'globals_json', alignment: 'left' },
        { content: 'raw_json', alignment: 'left' },
        { content: 'created_at', alignment: 'center' },
        { content: 'updated_at', alignment: 'center' },
        { content: 'full_text_cached', alignment: 'left' },
        { content: 'full_text_edits', alignment: 'left' },
        { content: 'image_type', alignment: 'left' },
        { content: 'image_id', alignment: 'left' },
        { content: 'image_url', alignment: 'left' },
        { content: 'image_alt', alignment: 'left' },
        { content: 'image_size', alignment: 'left' },
        { content: 'image_source', alignment: 'left' },
        { content: 'carousel_position', alignment: 'center' },
        { content: 'image_context', alignment: 'left' },
        { content: 'has_img_slot', alignment: 'center' },
        { content: 'img_slot_qty', alignment: 'center' },
        { content: 'tar_description_text', alignment: 'left' },
        { content: 'tar_description_text_edits', alignment: 'left' }
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