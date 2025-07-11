import { BensaTableConfig } from '../components/BensaFieldTableTypes';

export const bensaUsersConfig: BensaTableConfig = {
  tableName: 'users',
  primaryKey: 'id',
  fields: [
    { key: 'id', type: 'uuid', editable: false },
    { key: 'email', type: 'text', editable: true },
    { key: 'is_admin', type: 'boolean', editable: true, adminOnly: true },
    { key: 'sidebar_menu_active', type: 'boolean', editable: true },
    { key: 'ruplin_api_key_1', type: 'text', editable: true, adminOnly: true },
    { key: 'background_processing_settings', type: 'jsonb', editable: true, adminOnly: true },
    { key: 'created_at', type: 'timestamp', editable: false },
    { key: 'auth_id', type: 'uuid', editable: false }
  ]
};