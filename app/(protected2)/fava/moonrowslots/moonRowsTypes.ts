// TypeScript interfaces for Moon Row Slots system

export interface MoonRowCellConfig {
  id: string;
  content: string | React.ReactNode;
  colspan?: number;
  rowspan?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  resizable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface MoonRowConfig {
  id: string;
  cells: MoonRowCellConfig[];
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export interface MoonRowsConfig {
  rows: MoonRowConfig[];
  defaultRowCount: number;
  stickyHeader?: boolean;
  pageKey?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface MoonRowsHookResult {
  config: MoonRowsConfig;
  isLoading: boolean;
  error?: string;
}

// Page-specific configuration override interface
export interface PageMoonRowsConfig extends Partial<MoonRowsConfig> {
  pageKey: string;
  extends?: 'default' | string; // Which config to extend from
}