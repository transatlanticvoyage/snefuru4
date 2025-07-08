/**
 * Azul Plantilla Table Configuration
 * 
 * Artichoke Exports by Country Dataset - 30 rows, 30 columns
 */

import { TableConfig } from './tableConfig.sample';

export const tableConfig: TableConfig = {
  tableName: 'artichoke_exports',
  
  columns: [
    { field: 'id', header: 'id', width: '60px', sortable: true, searchable: false, editable: false },
    { field: 'country', header: 'country', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'region', header: 'region', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'export_volume_tons', header: 'volume_tons', width: '110px', sortable: true, searchable: false, editable: true, type: 'number', format: (v) => v.toLocaleString() },
    { field: 'export_value_usd', header: 'value_usd', width: '120px', sortable: true, searchable: false, editable: true, type: 'number', format: (v) => `$${v.toLocaleString()}` },
    { field: 'price_per_kg', header: 'price_kg', width: '90px', sortable: true, searchable: false, editable: false, type: 'number', format: (v) => `$${v.toFixed(2)}` },
    { field: 'market_share_percent', header: 'mark_percentage', width: '80px', sortable: true, searchable: false, editable: false, type: 'number', format: (v) => `${v.toFixed(1)}%` },
    { field: 'main_destination', header: 'main_destination', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'harvest_season', header: 'season', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'production_area_hectares', header: 'area_ha', width: '90px', sortable: true, searchable: false, editable: true, type: 'number', format: (v) => v.toLocaleString() },
    { field: 'yield_per_hectare', header: 'yield_ha', width: '80px', sortable: true, searchable: false, editable: false, type: 'number', format: (v) => `${v.toFixed(1)}t` },
    { field: 'quality_grade', header: 'grade', width: '70px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'organic_certified', header: 'organic', width: '70px', sortable: true, searchable: false, editable: true, type: 'boolean', format: (v) => v ? 'Yes' : 'No' },
    { field: 'irrigation_method', header: 'irrigation', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'soil_type', header: 'soil_type', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'climate_zone', header: 'climate', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'transportation_method', header: 'Transport', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'export_port', header: 'Export Port', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'tariff_rate_percent', header: 'Tariff %', width: '80px', sortable: true, searchable: false, editable: true, type: 'number', format: (v) => `${v.toFixed(1)}%` },
    { field: 'export_status', header: 'Status', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'gmo_free', header: 'GMO Free', width: '80px', sortable: true, searchable: false, editable: true, type: 'boolean', format: (v) => v ? 'Yes' : 'No' },
    { field: 'fair_trade_certified', header: 'Fair Trade', width: '90px', sortable: true, searchable: false, editable: true, type: 'boolean', format: (v) => v ? 'Yes' : 'No' },
    { field: 'pesticide_residue_tested', header: 'Pesticide Test', width: '110px', sortable: true, searchable: false, editable: true, type: 'boolean', format: (v) => v ? 'Yes' : 'No' },
    { field: 'cold_storage_required', header: 'Cold Storage', width: '100px', sortable: true, searchable: false, editable: true, type: 'boolean', format: (v) => v ? 'Required' : 'Optional' },
    { field: 'insurance_coverage_percent', header: 'Insurance %', width: '90px', sortable: true, searchable: false, editable: true, type: 'number', format: (v) => `${v.toFixed(0)}%` },
    { field: 'export_frequency_per_year', header: 'Export Freq/yr', width: '110px', sortable: true, searchable: false, editable: true, type: 'number', format: (v) => `${v}x` },
    { field: 'packaging_type', header: 'Packaging', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'shelf_stability_rating', header: 'Stability', width: '80px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'seasonal_price_volatility', header: 'Price Vol %', width: '90px', sortable: true, searchable: false, editable: true, type: 'number', format: (v) => `${v.toFixed(1)}%` },
    { field: 'export_documentation_score', header: 'Doc Score', width: '80px', sortable: true, searchable: false, editable: true, type: 'number', format: (v) => `${v.toFixed(1)}/10` }
  ],
  
  // Header Rows Configuration (Required: At least 1 row)
  headerRows: [
    {
      id: 'main-header',
      type: 'label',
      cells: [
        { content: 'id', alignment: 'center' },
        { content: 'country', alignment: 'left' },
        { content: 'region', alignment: 'center' },
        { content: 'volume_tons', alignment: 'right' },
        { content: 'value_usd', alignment: 'right' },
        { content: 'price_kg', alignment: 'right' },
        { content: 'mark_percentage', alignment: 'right' },
        { content: 'main_destination', alignment: 'left' },
        { content: 'season', alignment: 'center' },
        { content: 'area_ha', alignment: 'right' },
        { content: 'yield_ha', alignment: 'right' },
        { content: 'grade', alignment: 'center' },
        { content: 'organic', alignment: 'center' },
        { content: 'irrigation', alignment: 'center' },
        { content: 'soil_type', alignment: 'center' },
        { content: 'climate', alignment: 'center' },
        { content: 'transport', alignment: 'center' },
        { content: 'export_port', alignment: 'left' },
        { content: 'tariff_%', alignment: 'right' },
        { content: 'status', alignment: 'center' },
        { content: 'gmo_free', alignment: 'center' },
        { content: 'fair_trade', alignment: 'center' },
        { content: 'pesticide_test', alignment: 'center' },
        { content: 'cold_storage', alignment: 'center' },
        { content: 'insurance_%', alignment: 'right' },
        { content: 'export_freq', alignment: 'right' },
        { content: 'packaging', alignment: 'center' },
        { content: 'stability', alignment: 'center' },
        { content: 'price_vol_%', alignment: 'right' },
        { content: 'doc_score', alignment: 'right' }
      ]
    }
  ],
  
  filters: [
    {
      id: 'region',
      label: 'Region',
      type: 'dropdown',
      column: 'region',
      operator: 'eq',
      options: [
        { value: 'all', label: 'All Regions' },
        { value: 'Europe', label: 'Europe' },
        { value: 'North America', label: 'North America' },
        { value: 'South America', label: 'South America' },
        { value: 'Asia', label: 'Asia' },
        { value: 'Africa', label: 'Africa' },
        { value: 'Oceania', label: 'Oceania' }
      ]
    },
    {
      id: 'export_status',
      label: 'Export Status',
      type: 'dropdown',
      column: 'export_status',
      operator: 'eq',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'Active', label: 'Active' },
        { value: 'Seasonal', label: 'Seasonal' },
        { value: 'Suspended', label: 'Suspended' }
      ]
    },
    {
      id: 'organic_certified',
      label: 'Organic',
      type: 'dropdown',
      column: 'organic_certified',
      operator: 'eq',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'true', label: 'Organic' },
        { value: 'false', label: 'Conventional' }
      ]
    }
  ],
  
  // Pagination settings
  pageSizes: [10, 25, 50, 100, 200],
  defaultPageSize: 25,
  showAllOption: true,
  
  // Default sorting
  defaultSort: {
    field: 'id',
    order: 'asc'
  },
  
  // Search configuration
  enableSearch: true,
  searchPlaceholder: 'Search countries, destinations, ports...',
  searchDebounceMs: 300,
  searchFields: ['country', 'main_destination', 'export_port', 'region'],
  
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
        console.log('Edit row:', row);
        // Implement edit functionality
      }
    },
    {
      label: 'Delete',
      action: (row) => {
        console.log('Delete row:', row);
        // Implement delete functionality
      },
      condition: (row) => true // Always show delete
    }
  ],
  
  // Events
  onRowClick: (row) => {
    console.log('Row clicked:', row);
  },
  
  beforeSave: async (row, changes) => {
    console.log('Before save:', row, changes);
    // Validate changes
    return true; // Allow save
  },
  
  afterSave: (row) => {
    console.log('After save:', row);
  },
  
  // Custom styles matching the current implementation
  customStyles: {
    headerRow: {
      backgroundColor: '#f5f5f5',
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
export default tableConfig;