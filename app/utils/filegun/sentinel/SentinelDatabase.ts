import { createClient } from '@supabase/supabase-js';
import { SentinelFileItem, SentinelSyncResult } from './SentinelTypes';
import crypto from 'crypto';
import path from 'path';

export class SentinelDatabase {
  private supabase: any;

  constructor() {
    // Initialize Supabase client
    if (typeof window === 'undefined') {
      // Server-side: use environment variables
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server operations
      );
    }
  }

  // Sync a file to the database
  async syncFileToDb(item: SentinelFileItem): Promise<boolean> {
    try {
      const dbItem = {
        file_path: item.path,
        file_name: item.name,
        file_parent_path: path.dirname(item.path),
        extension: item.extension || null,
        mime_type: item.mimeType || null,
        file_size: item.size,
        encoding: null, // Will be detected separately
        file_system_created: item.created.toISOString(),
        file_system_modified: item.modified.toISOString(),
        last_accessed_at: new Date().toISOString(),
        is_hidden: item.isHidden,
        is_executable: item.permissions?.includes('x') || false,
        permissions: item.permissions || null,
        checksum: item.checksum || null,
        is_code_file: this.isCodeFile(item.extension || ''),
        programming_language: this.detectLanguage(item.extension || ''),
        sync_status: 'synced',
        last_sync_at: new Date().toISOString()
      };

      // Upsert (insert or update)
      const { data, error } = await this.supabase
        .from('filegun_files')
        .upsert(dbItem, { 
          onConflict: 'file_path',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error syncing file to DB:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception syncing file to DB:', error);
      return false;
    }
  }

  // Sync a folder to the database
  async syncFolderToDb(item: SentinelFileItem): Promise<boolean> {
    try {
      const dbItem = {
        folder_path: item.path,
        folder_name: item.name,
        folder_parent_path: item.path === '/' ? null : path.dirname(item.path),
        depth: item.path.split('/').length - 1,
        file_system_created: item.created.toISOString(),
        file_system_modified: item.modified.toISOString(),
        last_accessed_at: new Date().toISOString(),
        is_protected: this.isProtectedPath(item.path),
        permissions: item.permissions || null,
        checksum: this.generateFolderChecksum(item.path),
        sync_status: 'synced',
        last_sync_at: new Date().toISOString()
      };

      // Upsert folder
      const { data, error } = await this.supabase
        .from('filegun_folders')
        .upsert(dbItem, { 
          onConflict: 'folder_path',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error syncing folder to DB:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception syncing folder to DB:', error);
      return false;
    }
  }

  // Mark items as deleted (soft delete)
  async markAsDeleted(itemPath: string, isFolder: boolean = false): Promise<boolean> {
    try {
      const table = isFolder ? 'filegun_folders' : 'filegun_files';
      const pathColumn = isFolder ? 'folder_path' : 'file_path';

      const { data, error } = await this.supabase
        .from(table)
        .update({ 
          sync_status: 'deleted',
          last_sync_at: new Date().toISOString()
        })
        .eq(pathColumn, itemPath);

      if (error) {
        console.error('Error marking as deleted:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception marking as deleted:', error);
      return false;
    }
  }

  // Permanently remove deleted items
  async cleanupDeletedItems(): Promise<number> {
    try {
      let totalDeleted = 0;

      // Delete files marked as deleted
      const { data: deletedFiles, error: fileError } = await this.supabase
        .from('filegun_files')
        .delete()
        .eq('sync_status', 'deleted');

      if (!fileError && deletedFiles) {
        totalDeleted += deletedFiles.length;
      }

      // Delete folders marked as deleted
      const { data: deletedFolders, error: folderError } = await this.supabase
        .from('filegun_folders')
        .delete()
        .eq('sync_status', 'deleted');

      if (!folderError && deletedFolders) {
        totalDeleted += deletedFolders.length;
      }

      return totalDeleted;
    } catch (error) {
      console.error('Exception cleaning up deleted items:', error);
      return 0;
    }
  }

  // Get items that are out of sync
  async getOutOfSyncItems(): Promise<{ files: any[], folders: any[] }> {
    try {
      const { data: files } = await this.supabase
        .from('filegun_files')
        .select('*')
        .in('sync_status', ['pending', 'conflict']);

      const { data: folders } = await this.supabase
        .from('filegun_folders')
        .select('*')
        .in('sync_status', ['pending', 'conflict']);

      return {
        files: files || [],
        folders: folders || []
      };
    } catch (error) {
      console.error('Exception getting out of sync items:', error);
      return { files: [], folders: [] };
    }
  }

  // Get database statistics
  async getDbStats(): Promise<{ totalFiles: number, totalFolders: number, totalSize: number }> {
    try {
      // Get file count and total size
      const { count: fileCount } = await this.supabase
        .from('filegun_files')
        .select('*', { count: 'exact', head: true })
        .neq('sync_status', 'deleted');

      const { data: sizeData } = await this.supabase
        .from('filegun_files')
        .select('file_size')
        .neq('sync_status', 'deleted');

      const totalSize = sizeData?.reduce((sum, row) => sum + (row.file_size || 0), 0) || 0;

      // Get folder count
      const { count: folderCount } = await this.supabase
        .from('filegun_folders')
        .select('*', { count: 'exact', head: true })
        .neq('sync_status', 'deleted');

      return {
        totalFiles: fileCount || 0,
        totalFolders: folderCount || 0,
        totalSize: totalSize
      };
    } catch (error) {
      console.error('Exception getting DB stats:', error);
      return { totalFiles: 0, totalFolders: 0, totalSize: 0 };
    }
  }

  // Batch sync multiple items
  async batchSync(items: SentinelFileItem[]): Promise<SentinelSyncResult> {
    const startTime = Date.now();
    const result: SentinelSyncResult = {
      success: true,
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsDeleted: 0,
      errors: [],
      duration: 0,
      timestamp: new Date()
    };

    try {
      // Separate files and folders
      const files = items.filter(item => item.type === 'file');
      const folders = items.filter(item => item.type === 'folder');

      // Process folders first (required for foreign keys)
      for (const folder of folders) {
        const success = await this.syncFolderToDb(folder);
        if (success) {
          result.itemsCreated++;
        } else {
          result.errors.push(`Failed to sync folder: ${folder.path}`);
        }
        result.itemsProcessed++;
      }

      // Process files
      for (const file of files) {
        const success = await this.syncFileToDb(file);
        if (success) {
          result.itemsCreated++;
        } else {
          result.errors.push(`Failed to sync file: ${file.path}`);
        }
        result.itemsProcessed++;
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Batch sync failed: ${error.message}`);
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  // Helper methods
  private isCodeFile(extension: string): boolean {
    const codeExtensions = ['ts', 'tsx', 'js', 'jsx', 'vue', 'svelte', 'py', 'rb', 'php', 'java', 'c', 'cpp', 'cs', 'go', 'rs'];
    return codeExtensions.includes(extension.toLowerCase());
  }

  private detectLanguage(extension: string): string | null {
    const languageMap: { [key: string]: string } = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript', 
      'jsx': 'javascript',
      'py': 'python',
      'rb': 'ruby',
      'php': 'php',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'vue': 'vue',
      'svelte': 'svelte'
    };

    return languageMap[extension.toLowerCase()] || null;
  }

  private isProtectedPath(folderPath: string): boolean {
    const protectedPaths = [
      '/node_modules',
      '/.git',
      '/.next',
      '/dist',
      '/build'
    ];

    return protectedPaths.some(protectedPath => folderPath.startsWith(protectedPath));
  }

  private generateFolderChecksum(folderPath: string): string {
    // Simple checksum based on path and timestamp
    return crypto
      .createHash('md5')
      .update(`${folderPath}-${Date.now()}`)
      .digest('hex');
  }
}