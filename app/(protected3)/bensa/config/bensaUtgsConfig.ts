import { BensaTableConfig } from '../components/BensaFieldTableTypes';

export const bensaUtgsConfig: BensaTableConfig = {
  tableName: 'utgs',
  primaryKey: 'utg_id',
  fields: [
    { key: 'utg_id', type: 'text', editable: false },
    { key: 'utg_name', type: 'text', editable: true },
    { key: 'utg_description', type: 'text', editable: true },
    { key: 'rel_xpage', type: 'text', editable: true },
    { key: 'main_db_table', type: 'text', editable: true },
    { key: 'sql_view', type: 'text', editable: true },
    { key: 'associated_files', type: 'jsonb', editable: true },
    { key: 'utg_class', type: 'text', editable: true },
    { key: 'created_at', type: 'timestamp', editable: false },
    { key: 'updated_at', type: 'timestamp', editable: false },
    { key: 'is_active', type: 'boolean', editable: true },
    { key: 'sort_order', type: 'integer', editable: true },
    { key: 'utg_columns_definition_location', type: 'text', editable: true },
    { key: 'rel_xpage_id', type: 'integer', editable: true },
    { key: 'horomi_active', type: 'boolean', editable: true },
    { key: 'vertomi_active', type: 'boolean', editable: true },
    { key: 'header_rows_definition_fantasy', type: 'jsonb', editable: true },
    { key: 'filters_notes', type: 'text', editable: true },
    { key: 'pagination_notes', type: 'text', editable: true },
    { key: 'searchbox_notes', type: 'text', editable: true }
  ]
};