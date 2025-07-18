export interface BensaFieldDefinition {
  key: string;
  type: 'text' | 'integer' | 'boolean' | 'timestamp' | 'jsonb' | 'filelink' | 'uuid';
  editable: boolean;
  label?: string;
  adminOnly?: boolean;
  syncButton?: {
    enabled: boolean;
    syncFunction: () => Promise<{ success: boolean; message: string; updatedPages?: number }>;
  };
}

export interface BensaTableConfig {
  tableName: string;
  fields: BensaFieldDefinition[];
  primaryKey: string;
}

export interface BensaFieldMetadata {
  starred: boolean;
  flagged: boolean;
  chain_of_custody_desc?: string | null;
}

export interface BensaTableProps {
  config: BensaTableConfig;
  selectedRecord: any;
  onRecordUpdate: (field: string, value: any) => Promise<void>;
  onBoxEditorOpen?: (field: string, value: string, record: any, updateHandler: (field: string, value: any) => Promise<void>) => void;
}

export interface BensaSortState {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export interface BensaEditingState {
  field: string | null;
  value: string;
}