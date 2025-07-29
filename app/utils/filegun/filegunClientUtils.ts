// Client-side utility functions (no Node.js modules)
import { FILEGUN_CONFIG } from './filegunConstants';

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex !== -1 ? filename.substring(lastDotIndex + 1).toLowerCase() : '';
};

/**
 * Get file icon based on extension
 */
export const getFileIcon = (filename: string, isDirectory: boolean): string => {
  if (isDirectory) {
    return FILEGUN_CONFIG.FILE_ICONS.folder;
  }
  
  const extension = getFileExtension(filename);
  return FILEGUN_CONFIG.FILE_ICONS[extension] || FILEGUN_CONFIG.FILE_ICONS.default;
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Format date in human-readable format
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Sanitize filename to prevent issues (client-side version)
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .substring(0, 255); // Limit length
};