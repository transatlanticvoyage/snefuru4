import path from 'path';
import { FILEGUN_CONFIG } from './filegunConstants';

const PROJECT_ROOT = process.cwd();

/**
 * Check if Filegun is enabled (development only)
 */
export const isFilegunEnabled = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Validate if a path is safe to access
 */
export const isValidFilegunPath = (targetPath: string): boolean => {
  if (!targetPath || typeof targetPath !== 'string') {
    return false;
  }

  // Resolve the full path
  const fullPath = path.resolve(PROJECT_ROOT, targetPath.startsWith('/') ? `.${targetPath}` : targetPath);
  
  // Ensure path stays within project root
  if (!fullPath.startsWith(PROJECT_ROOT)) {
    return false;
  }

  // Check against protected paths
  const relativePath = path.relative(PROJECT_ROOT, fullPath);
  const normalizedPath = '/' + relativePath.replace(/\\/g, '/');
  
  for (const protectedPath of FILEGUN_CONFIG.PROTECTED_PATHS) {
    if (normalizedPath.startsWith(protectedPath)) {
      return false;
    }
  }

  return true;
};

/**
 * Check if a path is protected from modification
 */
export const isProtectedPath = (targetPath: string): boolean => {
  const relativePath = path.relative(PROJECT_ROOT, path.resolve(PROJECT_ROOT, targetPath));
  const normalizedPath = '/' + relativePath.replace(/\\/g, '/');
  
  return FILEGUN_CONFIG.PROTECTED_PATHS.some(protectedPath => 
    normalizedPath.startsWith(protectedPath)
  );
};

/**
 * Sanitize filename to prevent issues
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .substring(0, 255); // Limit length
};

/**
 * Get the full system path from a relative path
 */
export const getFullPath = (relativePath: string): string => {
  return path.resolve(PROJECT_ROOT, relativePath.startsWith('/') ? `.${relativePath}` : relativePath);
};

/**
 * Get relative path from full system path
 */
export const getRelativePath = (fullPath: string): string => {
  const relativePath = path.relative(PROJECT_ROOT, fullPath);
  return '/' + relativePath.replace(/\\/g, '/');
};

/**
 * Validate file operation permissions
 */
export const canPerformOperation = (operation: string, targetPath: string): boolean => {
  if (!isFilegunEnabled()) {
    return false;
  }

  if (!isValidFilegunPath(targetPath)) {
    return false;
  }

  // Additional checks for destructive operations
  if (['delete', 'move'].includes(operation) && isProtectedPath(targetPath)) {
    return false;
  }

  return true;
};