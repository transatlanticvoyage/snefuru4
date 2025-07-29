import { SentinelConfig } from './SentinelTypes';

export const SENTINEL_CONFIG: SentinelConfig = {
  // Core settings
  enabled: true,
  enableRealtime: true,
  enablePolling: false,
  
  // Watch patterns
  watchPatterns: [
    '**/*'
  ],
  
  // Ignore patterns - files/folders to skip
  ignorePatterns: [
    // Dependencies
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**',
    
    // Version control
    '**/.git/**',
    '**/.svn/**',
    
    // Environment & Config
    '**/.env',
    '**/.env.*',
    '**/package-lock.json',
    '**/yarn.lock',
    
    // IDE & Editor
    '**/.vscode/**',
    '**/.idea/**',
    '**/*.swp',
    '**/*.tmp',
    
    // OS files
    '**/.DS_Store',
    '**/Thumbs.db',
    
    // Filegun internal
    '**/filegun-cache/**',
    '**/sentinel-logs/**'
  ],
  
  // Timing settings (milliseconds)
  syncInterval: 2000,        // 2 seconds between sync operations
  pollingInterval: 30000,    // 30 seconds for polling mode
  
  // Performance limits
  maxQueueSize: 1000,        // Max pending operations
  maxFileSize: 100 * 1024 * 1024, // 100MB max file size
  batchSize: 50              // Process 50 items at once
};

// Environment-specific overrides
export const getSentinelConfig = (): SentinelConfig => {
  const config = { ...SENTINEL_CONFIG };
  
  // Disable in production
  if (process.env.NODE_ENV === 'production') {
    config.enabled = false;
  }
  
  // Development optimizations
  if (process.env.NODE_ENV === 'development') {
    config.syncInterval = 1000; // Faster sync in dev
    config.enableRealtime = true;
  }
  
  // Test mode optimizations
  if (process.env.NODE_ENV === 'test') {
    config.enabled = false;
    config.syncInterval = 100;
  }
  
  return config;
};

// Quick access paths for Filegun
export const SENTINEL_QUICK_PATHS = {
  'App Root': '/app',
  'Components': '/app/components',
  'API Routes': '/app/api',
  'Utils': '/app/utils',
  'Admin Pages': '/app/(protected)/admin',
  'Filegun': '/app/(protected)/admin/filegun',
  'Hooks': '/app/hooks',
  'Types': '/app/types'
};

// File categorization
export const FILE_CATEGORIES = {
  CODE: ['ts', 'tsx', 'js', 'jsx', 'vue', 'svelte'],
  STYLES: ['css', 'scss', 'sass', 'less', 'stylus'],
  MARKUP: ['html', 'htm', 'xml', 'svg'],
  DATA: ['json', 'yaml', 'yml', 'toml', 'ini'],
  DOCS: ['md', 'txt', 'rst', 'adoc'],
  IMAGES: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'],
  FONTS: ['woff', 'woff2', 'ttf', 'otf', 'eot'],
  ARCHIVES: ['zip', 'tar', 'gz', 'rar', '7z']
};

// Sync priorities (higher = more important)
export const SYNC_PRIORITIES = {
  CODE_FILES: 10,
  CONFIG_FILES: 9,
  PACKAGE_FILES: 8,
  STYLE_FILES: 7,
  MARKUP_FILES: 6,
  DATA_FILES: 5,
  DOC_FILES: 4,
  IMAGE_FILES: 3,
  OTHER_FILES: 2,
  TEMP_FILES: 1
};

export const getSyncPriority = (filePath: string): number => {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  if (!extension) return SYNC_PRIORITIES.OTHER_FILES;
  
  if (FILE_CATEGORIES.CODE.includes(extension)) return SYNC_PRIORITIES.CODE_FILES;
  if (filePath.includes('package.json') || filePath.includes('tsconfig')) return SYNC_PRIORITIES.CONFIG_FILES;
  if (FILE_CATEGORIES.STYLES.includes(extension)) return SYNC_PRIORITIES.STYLE_FILES;
  if (FILE_CATEGORIES.MARKUP.includes(extension)) return SYNC_PRIORITIES.MARKUP_FILES;
  if (FILE_CATEGORIES.DATA.includes(extension)) return SYNC_PRIORITIES.DATA_FILES;
  if (FILE_CATEGORIES.DOCS.includes(extension)) return SYNC_PRIORITIES.DOC_FILES;
  if (FILE_CATEGORIES.IMAGES.includes(extension)) return SYNC_PRIORITIES.IMAGE_FILES;
  
  return SYNC_PRIORITIES.OTHER_FILES;
};