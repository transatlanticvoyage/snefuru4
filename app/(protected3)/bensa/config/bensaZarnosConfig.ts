import { BensaTableConfig } from '../components/BensaFieldTableTypes';

export const bensaZarnosConfig: BensaTableConfig = {
  tableName: 'zarnos',
  primaryKey: 'zarno_id',
  fields: [
    { key: 'zarno_id', type: 'integer', editable: false },
    { key: 'fk_xpage_id', type: 'integer', editable: true },
    { key: 'zarno_type', type: 'text', editable: true },
    { key: 'zarno_name', type: 'text', editable: true },
    { key: 'zarno_path', type: 'text', editable: true },
    { key: 'zarno_status', type: 'text', editable: true },
    { key: 'zarno_config', type: 'jsonb', editable: true },
    { key: 'execution_order', type: 'integer', editable: true },
    { key: 'dependencies', type: 'jsonb', editable: true },
    { key: 'metadata', type: 'jsonb', editable: true },
    { key: 'is_enabled', type: 'boolean', editable: true },
    { key: 'created_at', type: 'timestamp', editable: false },
    { key: 'updated_at', type: 'timestamp', editable: false },
    { key: 'created_by', type: 'text', editable: true }
  ]
};