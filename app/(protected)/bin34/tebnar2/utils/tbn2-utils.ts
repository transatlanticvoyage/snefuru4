// Tebnar2 Utility Functions - Independent clones from tebnar1

import { Tebnar2ImagePlan, Tebnar2Batch, Tebnar2ThrottleSettings } from '../types/tebnar2-types';
import { TBN2_DEBOUNCE_MS } from '../constants/tebnar2-constants';

// Debounce utility for preventing rapid clicks
export const tbn2_debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = TBN2_DEBOUNCE_MS
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility for rate limiting function calls
export const tbn2_throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Check if enough time has passed since last click (debounce check)
export const tbn2_canPerformAction = (
  lastClickTime: Record<string, number>,
  actionKey: string,
  debounceMs: number = TBN2_DEBOUNCE_MS
): boolean => {
  const now = Date.now();
  const lastClick = lastClickTime[actionKey] || 0;
  return now - lastClick >= debounceMs;
};

// Update last click time for debounce tracking
export const tbn2_updateLastClickTime = (
  lastClickTime: Record<string, number>,
  actionKey: string
): Record<string, number> => {
  return {
    ...lastClickTime,
    [actionKey]: Date.now()
  };
};

// Generate fetch key for image operations
export const tbn2_generateFetchKey = (planId: string, imageNumber: number): string => {
  return `${planId}-${imageNumber}`;
};

// Sleep utility for adding delays
export const tbn2_sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Check if string is valid UUID format
export const tbn2_isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Safely parse JSON with error handling
export const tbn2_safeJsonParse = <T>(jsonString: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
};

// Format file size in human readable format
export const tbn2_formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate random string for temporary IDs
export const tbn2_generateRandomString = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Clean and normalize text content
export const tbn2_cleanText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
};

// Check if value is empty (null, undefined, empty string, or whitespace only)
export const tbn2_isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Safe array access with default value
export const tbn2_safeArrayAccess = <T>(array: T[], index: number, defaultValue: T): T => {
  return array && array[index] !== undefined ? array[index] : defaultValue;
};

// Capitalize first letter of string
export const tbn2_capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Convert snake_case to Title Case
export const tbn2_snakeToTitle = (str: string): string => {
  if (!str) return '';
  return str
    .split('_')
    .map(word => tbn2_capitalize(word))
    .join(' ');
};

// URL validation
export const tbn2_isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Extract domain from URL
export const tbn2_extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

// Generate CSS color from string (for consistent coloring)
export const tbn2_stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

// Format number with commas
export const tbn2_formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Check if two objects are deeply equal (simple version)
export const tbn2_deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 === 'object') {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (let key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!tbn2_deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }
  
  return false;
};

// Create a copy of object with selected keys only
export const tbn2_pickKeys = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

// Remove keys from object
export const tbn2_omitKeys = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

// Batch processing utility - process array in chunks
export const tbn2_processInBatches = async <T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  delayMs: number = 0
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
    
    // Add delay between batches if specified
    if (delayMs > 0 && i + batchSize < items.length) {
      await tbn2_sleep(delayMs);
    }
  }
  
  return results;
};

// Retry utility with exponential backoff
export const tbn2_retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = initialDelayMs * Math.pow(2, attempt);
      await tbn2_sleep(delay);
    }
  }
  
  throw new Error('Max retries exceeded');
};

// Log with timestamp and prefix
export const tbn2_log = (message: string, type: 'info' | 'warn' | 'error' = 'info'): void => {
  const timestamp = new Date().toISOString();
  const prefix = `[TBN2-${type.toUpperCase()}] ${timestamp}:`;
  
  switch (type) {
    case 'error':
      console.error(prefix, message);
      break;
    case 'warn':
      console.warn(prefix, message);
      break;
    default:
      console.log(prefix, message);
  }
};

// Environment detection utilities
export const tbn2_isClient = (): boolean => typeof window !== 'undefined';
export const tbn2_isServer = (): boolean => typeof window === 'undefined';
export const tbn2_isDevelopment = (): boolean => process.env.NODE_ENV === 'development';
export const tbn2_isProduction = (): boolean => process.env.NODE_ENV === 'production';