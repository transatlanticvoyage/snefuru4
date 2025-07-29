export const FILEGUN_CONFIG = {
  // Protected paths that can't be modified
  PROTECTED_PATHS: [
    '/.next',
    '/node_modules',
    '/.git',
    '/.env',
    '/.env.local',
    '/dist',
    '/build',
    '/coverage'
  ],
  
  // Quick access shortcuts
  FILEGUN_QUICK_ACCESS: {
    'Components': '/app/components',
    'API Routes': '/app/api',
    'Utils': '/app/utils',
    'Hooks': '/app/hooks',
    'Admin Pages': '/app/(protected)/admin',
    'Public Pages': '/app/(protected)',
    'Styles': '/app/globals.css',
    'Types': '/app/types',
    'Root': '/'
  },
  
  // Operation limits
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_BATCH_OPERATIONS: 50, // Max files in one operation
  MAX_PATH_DEPTH: 20, // Maximum folder depth
  
  // View preferences
  DEFAULT_VIEW: 'column' as const,
  ITEMS_PER_PAGE: 100,
  SHOW_HIDDEN_FILES: false,
  
  // File preview
  PREVIEW_EXTENSIONS: ['txt', 'md', 'json', 'ts', 'tsx', 'js', 'jsx', 'css', 'html', 'yaml', 'yml'],
  IMAGE_EXTENSIONS: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'],
  CODE_EXTENSIONS: ['ts', 'tsx', 'js', 'jsx', 'css', 'scss', 'sass', 'less'],
  
  // File type icons
  FILE_ICONS: {
    // Folders
    folder: '📁',
    'folder-open': '📂',
    
    // Code files
    ts: '🟦',
    tsx: '⚛️',
    js: '🟨',
    jsx: '⚛️',
    css: '🎨',
    scss: '🎨',
    sass: '🎨',
    
    // Data files
    json: '📋',
    yaml: '📄',
    yml: '📄',
    
    // Documentation
    md: '📝',
    txt: '📄',
    
    // Images
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    
    // Default
    default: '📄'
  }
};

// Environment checks
export const isFilegunEnabled = () => {
  return process.env.NODE_ENV === 'development';
};

export const FILEGUN_MESSAGES = {
  PRODUCTION_DISABLED: 'Filegun is not available in production',
  INVALID_PATH: 'Invalid Filegun path',
  PROTECTED_PATH: 'Cannot modify protected path',
  OPERATION_SUCCESS: 'Operation completed successfully',
  OPERATION_FAILED: 'Operation failed',
  UNAUTHORIZED: 'Unauthorized access'
};