// TypeScript interfaces for Sun Row Slots system

export interface SunRowCellConfig {
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

export interface SunRowConfig {
  id: string;
  cells: SunRowCellConfig[];
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export interface SunRowsConfig {
  rows: SunRowConfig[];
  defaultRowCount: number;
  stickyHeader?: boolean;
  pageKey?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface SunRowsHookResult {
  config: SunRowsConfig;
  isLoading: boolean;
  error?: string;
}

// Page-specific configuration override interface
export interface PageSunRowsConfig extends Partial<SunRowsConfig> {
  pageKey: string;
  extends?: 'default' | string; // Which config to extend from
}