// Client-side security utilities (no Node.js modules)

/**
 * Check if Filegun is enabled (client-side check)
 */
export const isFilegunEnabled = () => {
  return process.env.NODE_ENV === 'development';
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

/**
 * Basic path validation (client-side)
 */
export const isValidPath = (targetPath: string): boolean => {
  if (!targetPath || typeof targetPath !== 'string') {
    return false;
  }

  // Basic checks without filesystem access
  if (targetPath.includes('..')) {
    return false;
  }

  if (targetPath.length > 1000) {
    return false;
  }

  return true;
};