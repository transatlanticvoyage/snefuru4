import { promises as fs } from 'fs';
import path from 'path';
import { FilegunItem } from '@/app/(protected)/admin/filegun/types/filegun.types';
import { FILEGUN_CONFIG } from './filegunConstants';
import { getFullPath, isValidFilegunPath } from './filegunSecurity';

/**
 * Get file extension (server-side version)
 */
const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase().substring(1);
};

/**
 * List directory contents
 */
export const listDirectory = async (dirPath: string): Promise<FilegunItem[]> => {
  if (!isValidFilegunPath(dirPath)) {
    throw new Error('Invalid path');
  }

  const fullPath = getFullPath(dirPath);
  
  try {
    const items = await fs.readdir(fullPath, { withFileTypes: true });
    const filegunItems: FilegunItem[] = [];

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      const itemFullPath = path.join(fullPath, item.name);
      
      try {
        const stats = await fs.stat(itemFullPath);
        
        filegunItems.push({
          name: item.name,
          path: itemPath,
          type: item.isDirectory() ? 'folder' : 'file',
          size: stats.size,
          modified: stats.mtime,
          extension: item.isDirectory() ? undefined : getFileExtension(item.name),
          permissions: stats.mode.toString(8),
          isHidden: item.name.startsWith('.'),
          isProtected: false // Will be determined by security checks
        });
      } catch (error) {
        // Skip items we can't read
        console.warn(`Cannot read item: ${item.name}`, error);
      }
    }

    // Sort by type (folders first) then by name
    return filegunItems.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    throw new Error(`Cannot read directory: ${error.message}`);
  }
};

/**
 * Create a new folder
 */
export const createFolder = async (parentPath: string, folderName: string): Promise<void> => {
  const newPath = path.join(parentPath, folderName);
  
  if (!isValidFilegunPath(newPath)) {
    throw new Error('Invalid path');
  }

  const fullPath = getFullPath(newPath);
  
  try {
    await fs.mkdir(fullPath, { recursive: false });
  } catch (error) {
    throw new Error(`Cannot create folder: ${error.message}`);
  }
};

/**
 * Create a new file
 */
export const createFile = async (parentPath: string, filename: string, content: string = ''): Promise<void> => {
  const newPath = path.join(parentPath, filename);
  
  if (!isValidFilegunPath(newPath)) {
    throw new Error('Invalid path');
  }

  const fullPath = getFullPath(newPath);
  
  try {
    await fs.writeFile(fullPath, content, 'utf8');
  } catch (error) {
    throw new Error(`Cannot create file: ${error.message}`);
  }
};

/**
 * Rename a file or folder
 */
export const renameItem = async (oldPath: string, newName: string): Promise<void> => {
  if (!isValidFilegunPath(oldPath)) {
    throw new Error('Invalid path');
  }

  const parentDir = path.dirname(oldPath);
  const newPath = path.join(parentDir, newName);
  
  if (!isValidFilegunPath(newPath)) {
    throw new Error('Invalid new path');
  }

  const oldFullPath = getFullPath(oldPath);
  const newFullPath = getFullPath(newPath);
  
  try {
    await fs.rename(oldFullPath, newFullPath);
  } catch (error) {
    throw new Error(`Cannot rename item: ${error.message}`);
  }
};

/**
 * Delete a file or folder
 */
export const deleteItem = async (itemPath: string): Promise<void> => {
  if (!isValidFilegunPath(itemPath)) {
    throw new Error('Invalid path');
  }

  const fullPath = getFullPath(itemPath);
  
  try {
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      await fs.rmdir(fullPath, { recursive: true });
    } else {
      await fs.unlink(fullPath);
    }
  } catch (error) {
    throw new Error(`Cannot delete item: ${error.message}`);
  }
};

/**
 * Read file content (for preview)
 */
export const readFileContent = async (filePath: string): Promise<string> => {
  if (!isValidFilegunPath(filePath)) {
    throw new Error('Invalid path');
  }

  const fullPath = getFullPath(filePath);
  const extension = getFileExtension(path.basename(filePath));
  
  if (!FILEGUN_CONFIG.PREVIEW_EXTENSIONS.includes(extension)) {
    throw new Error('File type not supported for preview');
  }

  try {
    const stats = await fs.stat(fullPath);
    
    if (stats.size > FILEGUN_CONFIG.MAX_FILE_SIZE) {
      throw new Error('File too large for preview');
    }

    return await fs.readFile(fullPath, 'utf8');
  } catch (error) {
    throw new Error(`Cannot read file: ${error.message}`);
  }
};