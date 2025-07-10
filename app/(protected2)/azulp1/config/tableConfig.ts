/**
 * Azul Plantilla Table Configuration
 * 
 * Cricket Matches Database - Live data with 30 columns
 */

import { TableConfig } from './tableConfig.sample';

export const tableConfig: TableConfig = {
  tableName: 'cricket_matches',
  
  columns: [
    { field: 'match_id', header: 'match_id', width: '80px', sortable: true, searchable: false, editable: false },
    { field: 'match_format', header: 'match_format', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'tournament_name', header: 'tournament_name', width: '150px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'series_name', header: 'series_name', width: '140px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'match_number', header: 'match_number', width: '100px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'venue_name', header: 'venue_name', width: '150px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'city', header: 'city', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'country', header: 'country', width: '100px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'match_date', header: 'match_date', width: '120px', sortable: true, searchable: false, editable: true, type: 'text' },
    { field: 'start_time', header: 'start_time', width: '100px', sortable: true, searchable: false, editable: true, type: 'text' },
    { field: 'team_1', header: 'team_1', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'team_2', header: 'team_2', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'toss_winner', header: 'toss_winner', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'toss_decision', header: 'toss_decision', width: '110px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'winning_team', header: 'winning_team', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'losing_team', header: 'losing_team', width: '120px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'match_result', header: 'match_result', width: '110px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'winning_margin_type', header: 'winning_margin_type', width: '140px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'winning_margin_value', header: 'winning_margin_value', width: '150px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'man_of_match', header: 'man_of_match', width: '140px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'total_runs_scored', header: 'total_runs_scored', width: '140px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'total_wickets_fallen', header: 'total_wickets_fallen', width: '150px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'total_overs_bowled', header: 'total_overs_bowled', width: '140px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'highest_individual_score', header: 'highest_individual_score', width: '170px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'best_bowling_figures', header: 'best_bowling_figures', width: '150px', sortable: true, searchable: true, editable: true, type: 'text' },
    { field: 'boundaries_hit', header: 'boundaries_hit', width: '120px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'sixes_hit', header: 'sixes_hit', width: '100px', sortable: true, searchable: false, editable: true, type: 'number' },
    { field: 'day_night_match', header: 'day_night_match', width: '130px', sortable: true, searchable: false, editable: true, type: 'boolean', format: (v) => v ? 'Yes' : 'No' },
    { field: 'rain_affected', header: 'rain_affected', width: '120px', sortable: true, searchable: false, editable: true, type: 'boolean', format: (v) => v ? 'Yes' : 'No' },
    { field: 'dls_applied', header: 'dls_applied', width: '110px', sortable: true, searchable: false, editable: true, type: 'boolean', format: (v) => v ? 'Yes' : 'No' }
  ],
  
  // Header Rows Configuration (Required: At least 1 row)
  headerRows: [
    {
      id: 'main-header',
      type: 'label',
      cells: [
        { content: 'match_id', alignment: 'center' },
        { content: 'match_format', alignment: 'center' },
        { content: 'tournament_name', alignment: 'left' },
        { content: 'series_name', alignment: 'left' },
        { content: 'match_number', alignment: 'center' },
        { content: 'venue_name', alignment: 'left' },
        { content: 'city', alignment: 'left' },
        { content: 'country', alignment: 'left' },
        { content: 'match_date', alignment: 'center' },
        { content: 'start_time', alignment: 'center' },
        { content: 'team_1', alignment: 'left' },
        { content: 'team_2', alignment: 'left' },
        { content: 'toss_winner', alignment: 'left' },
        { content: 'toss_decision', alignment: 'center' },
        { content: 'winning_team', alignment: 'left' },
        { content: 'losing_team', alignment: 'left' },
        { content: 'match_result', alignment: 'center' },
        { content: 'winning_margin_type', alignment: 'center' },
        { content: 'winning_margin_value', alignment: 'right' },
        { content: 'man_of_match', alignment: 'left' },
        { content: 'total_runs_scored', alignment: 'right' },
        { content: 'total_wickets_fallen', alignment: 'right' },
        { content: 'total_overs_bowled', alignment: 'right' },
        { content: 'highest_individual_score', alignment: 'right' },
        { content: 'best_bowling_figures', alignment: 'center' },
        { content: 'boundaries_hit', alignment: 'right' },
        { content: 'sixes_hit', alignment: 'right' },
        { content: 'day_night_match', alignment: 'center' },
        { content: 'rain_affected', alignment: 'center' },
        { content: 'dls_applied', alignment: 'center' }
      ]
    }
  ],
  
  filters: [
    {
      id: 'match_format',
      label: 'Match Format',
      type: 'dropdown',
      column: 'match_format',
      operator: 'eq',
      options: [
        { value: 'all', label: 'All Formats' },
        { value: 'Test', label: 'Test' },
        { value: 'ODI', label: 'ODI' },
        { value: 'T20', label: 'T20' },
        { value: 'IPL', label: 'IPL' }
      ]
    },
    {
      id: 'match_result',
      label: 'Match Result',
      type: 'dropdown',
      column: 'match_result',
      operator: 'eq',
      options: [
        { value: 'all', label: 'All Results' },
        { value: 'completed', label: 'Completed' },
        { value: 'no_result', label: 'No Result' },
        { value: 'abandoned', label: 'Abandoned' }
      ]
    },
    {
      id: 'day_night_match',
      label: 'Day/Night',
      type: 'dropdown',
      column: 'day_night_match',
      operator: 'eq',
      options: [
        { value: 'all', label: 'All Matches' },
        { value: 'true', label: 'Day/Night' },
        { value: 'false', label: 'Day Only' }
      ]
    }
  ],
  
  // Pagination settings
  pageSizes: [10, 25, 50, 100, 200],
  defaultPageSize: 25,
  showAllOption: true,
  
  // Default sorting
  defaultSort: {
    field: 'match_id',
    order: 'asc'
  },
  
  // Search configuration
  enableSearch: true,
  searchPlaceholder: 'Search teams, venues, tournaments...',
  searchDebounceMs: 300,
  searchFields: ['team_1', 'team_2', 'venue_name', 'tournament_name', 'city', 'country'],
  
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