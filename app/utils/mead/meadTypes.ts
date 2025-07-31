// TypeScript interfaces for Mead function

export interface IMeadConfig {
  action: 'create new folder' | '+ new file' | '+open';
  fileType: 'none' | 'xls' | 'csv' | 'ts' | 'tsx' | 'txt' | 'html' | 'php' | 'docx';
  filename: string;
  increment: number;
  housingStrategy: MeadHousingStrategy;
  currentPath: string;
  selectedColumnPath?: string;
  selectedColumnActiveFolder?: string;
}

export type MeadHousingStrategy = 
  | 'create in end-selected folder'
  | 'create in cauldron vat paradigm'
  | 'create in selected column'
  | 'create in selected column\'s active folder';

export interface IMeadCraterResult {
  craterNumber: number;
  highestExisting: number;
  increment: number;
}

export interface IMeadOperationResult {
  success: boolean;
  path?: string;
  error?: string;
}