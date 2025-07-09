export interface BensaFieldDefinition {
  key: string;
  type: 'text' | 'integer' | 'boolean' | 'timestamp' | 'jsonb';
  editable: boolean;
  label?: string;
}

export interface BensaTableConfig {
  tableName: string;
  fields: BensaFieldDefinition[];
  primaryKey: string;
}

export interface BensaFieldMetadata {
  starred: boolean;
  flagged: boolean;
}

export interface BensaTableProps {
  config: BensaTableConfig;
  selectedRecord: any;
  onRecordUpdate: (field: string, value: any) => Promise<void>;
}

export interface BensaSortState {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export interface BensaEditingState {
  field: string | null;
  value: string;
}