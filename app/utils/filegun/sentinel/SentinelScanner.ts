import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { SentinelFileItem } from './SentinelTypes';
import { SENTINEL_CONFIG, getSentinelConfig } from './SentinelConfig';

export class SentinelScanner {
  private config = getSentinelConfig();

  // Scan a directory and return all files and folders
  async scanDirectory(directoryPath: string): Promise<SentinelFileItem[]> {
    const items: SentinelFileItem[] = [];
    
    try {
      await this.scanRecursive(directoryPath, items);
      return items.sort((a, b) => a.path.localeCompare(b.path));
    } catch (error) {
      console.error('Error scanning directory:', error);
      return [];
    }
  }

  // Recursively scan a directory
  private async scanRecursive(currentPath: string, items: SentinelFileItem[]): Promise<void> {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        // Skip ignored patterns
        if (this.shouldIgnore(fullPath)) {
          continue;
        }

        const stats = await fs.stat(fullPath);
        const isFolder = entry.isDirectory();

        const item: SentinelFileItem = {
          path: fullPath,
          name: entry.name,
          type: isFolder ? 'folder' : 'file',
          size: isFolder ? 0 : stats.size,
          modified: stats.mtime,
          created: stats.birthtime,
          isHidden: entry.name.startsWith('.'),
          permissions: this.getPermissions(stats.mode)
        };

        // Add file-specific properties
        if (!isFolder) {
          item.extension = path.extname(entry.name).slice(1).toLowerCase();
          item.mimeType = this.getMimeType(item.extension || '');
          
          // Calculate checksum for files (but skip large files)
          if (stats.size <= this.config.maxFileSize) {
            item.checksum = await this.calculateFileChecksum(fullPath);
          }
        }

        items.push(item);

        // Recursively scan subdirectories
        if (isFolder) {
          await this.scanRecursive(fullPath, items);
        }
      }
    } catch (error) {
      console.error(`Error scanning ${currentPath}:`, error);
    }
  }

  // Scan a single file or folder
  async scanItem(itemPath: string): Promise<SentinelFileItem | null> {
    try {
      const stats = await fs.stat(itemPath);
      const isFolder = stats.isDirectory();
      const name = path.basename(itemPath);

      const item: SentinelFileItem = {
        path: itemPath,
        name,
        type: isFolder ? 'folder' : 'file',
        size: isFolder ? 0 : stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        isHidden: name.startsWith('.'),
        permissions: this.getPermissions(stats.mode)
      };

      // Add file-specific properties
      if (!isFolder) {
        item.extension = path.extname(name).slice(1).toLowerCase();
        item.mimeType = this.getMimeType(item.extension || '');
        
        // Calculate checksum for smaller files
        if (stats.size <= this.config.maxFileSize) {
          item.checksum = await this.calculateFileChecksum(itemPath);
        }
      }

      return item;
    } catch (error) {
      console.error(`Error scanning item ${itemPath}:`, error);
      return null;
    }
  }

  // Check if an item exists
  async itemExists(itemPath: string): Promise<boolean> {
    try {
      await fs.access(itemPath);
      return true;
    } catch {
      return false;
    }
  }

  // Get directory contents (non-recursive)
  async getDirectoryContents(directoryPath: string): Promise<SentinelFileItem[]> {
    const items: SentinelFileItem[] = [];
    
    try {
      const entries = await fs.readdir(directoryPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directoryPath, entry.name);
        
        // Skip ignored patterns
        if (this.shouldIgnore(fullPath)) {
          continue;
        }

        const item = await this.scanItem(fullPath);
        if (item) {
          items.push(item);
        }
      }

      return items.sort((a, b) => {
        // Folders first, then files
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error(`Error getting directory contents for ${directoryPath}:`, error);
      return [];
    }
  }

  // Compare two items to detect changes
  hasChanged(oldItem: SentinelFileItem, newItem: SentinelFileItem): boolean {
    // Check modification time
    if (oldItem.modified.getTime() !== newItem.modified.getTime()) {
      return true;
    }

    // Check size for files
    if (oldItem.type === 'file' && oldItem.size !== newItem.size) {
      return true;
    }

    // Check checksum if available
    if (oldItem.checksum && newItem.checksum && oldItem.checksum !== newItem.checksum) {
      return true;
    }

    return false;
  }

  // Private helper methods
  private shouldIgnore(filePath: string): boolean {
    return this.config.ignorePatterns.some(pattern => {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]');
      
      const regex = new RegExp(regexPattern);
      return regex.test(filePath);
    });
  }

  private async calculateFileChecksum(filePath: string): Promise<string> {
    try {
      const data = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      console.error(`Error calculating checksum for ${filePath}:`, error);
      return '';
    }
  }

  private getPermissions(mode: number): string {
    const perms = (mode & parseInt('777', 8)).toString(8);
    return perms;
  }

  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      // Text
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json',
      'xml': 'application/xml',
      'yaml': 'application/yaml',
      'yml': 'application/yaml',
      
      // Code
      'js': 'application/javascript',
      'jsx': 'application/javascript',
      'ts': 'application/typescript',
      'tsx': 'application/typescript',
      'css': 'text/css',
      'scss': 'text/scss',
      'sass': 'text/sass',
      'html': 'text/html',
      'htm': 'text/html',
      
      // Images
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'ico': 'image/x-icon',
      
      // Archives
      'zip': 'application/zip',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      
      // Fonts
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'ttf': 'font/ttf',
      'otf': 'font/otf'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  // Get scan statistics
  async getScanStats(items: SentinelFileItem[]): Promise<{
    totalItems: number;
    totalFiles: number;
    totalFolders: number;
    totalSize: number;
    largestFile: SentinelFileItem | null;
    oldestFile: SentinelFileItem | null;
    newestFile: SentinelFileItem | null;
  }> {
    const files = items.filter(item => item.type === 'file');
    const folders = items.filter(item => item.type === 'folder');
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    const largestFile = files.reduce((largest, file) => 
      !largest || file.size > largest.size ? file : largest, null as SentinelFileItem | null);
    
    const oldestFile = files.reduce((oldest, file) => 
      !oldest || file.modified < oldest.modified ? file : oldest, null as SentinelFileItem | null);
    
    const newestFile = files.reduce((newest, file) => 
      !newest || file.modified > newest.modified ? file : newest, null as SentinelFileItem | null);

    return {
      totalItems: items.length,
      totalFiles: files.length,
      totalFolders: folders.length,
      totalSize,
      largestFile,
      oldestFile,
      newestFile
    };
  }
}