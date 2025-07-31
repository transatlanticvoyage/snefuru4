// Constants for Mead function

export const MEAD_FILE_EXTENSIONS = {
  none: '',
  xls: '.xls',
  csv: '.csv',
  ts: '.ts',
  tsx: '.tsx',
  txt: '.txt',
  html: '.html',
  php: '.php',
  docx: '.docx'
} as const;

export const MEAD_ACTIONS = {
  CREATE_FOLDER: 'create new folder',
  CREATE_FILE: '+ new file',
  OPEN: '+open'
} as const;

export const MEAD_HOUSING_STRATEGIES = {
  END_SELECTED: 'create in end-selected folder',
  CAULDRON_VAT: 'create in cauldron vat paradigm',
  SELECTED_COLUMN: 'create in selected column',
  SELECTED_COLUMN_ACTIVE: 'create in selected column\'s active folder'
} as const;

// Cauldron vat paradigm base path (can be configured)
export const MEAD_CAULDRON_VAT_PATH = '/app/cauldron';