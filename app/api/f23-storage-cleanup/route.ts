import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { F23ApiRequest, F23ApiResponse, F23FolderResult, F23OperationResult } from '@/app/(protected)/admin-tools/f23-storage-cleanup/types/f23-types';
import { F23_BUCKET_NAME, F23_PARENT_PREFIX, F23_TRASH_PREFIX } from '@/app/(protected)/admin-tools/f23-storage-cleanup/constants/f23-constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { f23_folders, f23_mode }: F23ApiRequest = await req.json();
    const f23_logs: string[] = [];

    f23_logs.push(`F23 Storage Cleanup - Mode: ${f23_mode}`);
    f23_logs.push(`Processing ${f23_folders.length} folders`);
    f23_logs.push(`Bucket: ${F23_BUCKET_NAME}`);
    f23_logs.push(`Parent prefix: ${F23_PARENT_PREFIX}`);
    f23_logs.push('---');

    let f23_results: F23OperationResult;

    if (f23_mode === 'preview') {
      f23_results = await f23_previewDeletion(f23_folders, f23_logs, f23_mode);
    } else {
      f23_results = await f23_executeDeletion(f23_folders, f23_mode, f23_logs);
    }

    const response: F23ApiResponse = {
      success: true,
      f23_results,
      f23_log: f23_logs
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('F23 Storage cleanup error:', error);
    
    const errorResponse: F23ApiResponse = {
      success: false,
      f23_results: {
        mode: 'error',
        folders: [],
        totalFilesProcessed: 0,
        totalSizeProcessed: 0
      },
      f23_log: [
        'F23 Storage Cleanup Error',
        error instanceof Error ? error.message : 'Unknown error occurred'
      ]
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

async function f23_previewDeletion(folders: string[], logs: string[], mode: string = 'preview'): Promise<F23OperationResult> {
  const folderResults: F23FolderResult[] = [];
  let totalFiles = 0;
  let totalSize = 0;

  for (const folder of folders) {
    const fullPath = f23_buildStoragePath(folder);
    logs.push(`Previewing: ${fullPath}`);

    try {
      const { data: files, error } = await supabase.storage
        .from(F23_BUCKET_NAME)
        .list(fullPath, { limit: 1000 });

      if (error) {
        logs.push(`❌ Error listing ${fullPath}: ${error.message}`);
        folderResults.push({
          folder,
          fileCount: 0,
          totalSize: 0,
          status: 'error',
          message: error.message
        });
        continue;
      }

      if (!files || files.length === 0) {
        logs.push(`⚠️ No files found in: ${fullPath}`);
        folderResults.push({
          folder,
          fileCount: 0,
          totalSize: 0,
          status: 'empty',
          message: 'Folder is empty or does not exist'
        });
        continue;
      }

      const folderSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      totalFiles += files.length;
      totalSize += folderSize;

      logs.push(`✓ Found ${files.length} files (${f23_formatBytes(folderSize)}) in ${fullPath}`);
      folderResults.push({
        folder,
        fileCount: files.length,
        totalSize: folderSize,
        status: 'success',
        message: `Would ${mode === 'permanent' ? 'permanently delete' : 'move to trash'} ${files.length} files`,
        filePaths: files.map(f => `${fullPath}/${f.name}`)
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      logs.push(`❌ Exception processing ${fullPath}: ${errorMsg}`);
      folderResults.push({
        folder,
        fileCount: 0,
        totalSize: 0,
        status: 'error',
        message: errorMsg
      });
    }
  }

  logs.push('---');
  logs.push(`Preview complete: ${totalFiles} files, ${f23_formatBytes(totalSize)} total`);

  return {
    mode: 'preview',
    folders: folderResults,
    totalFilesProcessed: totalFiles,
    totalSizeProcessed: totalSize
  };
}

async function f23_executeDeletion(folders: string[], mode: string, logs: string[]): Promise<F23OperationResult> {
  const folderResults: F23FolderResult[] = [];
  let totalFiles = 0;
  let totalSize = 0;

  for (const folder of folders) {
    const fullPath = f23_buildStoragePath(folder);
    logs.push(`Processing: ${fullPath} (${mode})`);

    try {
      const { data: files, error: listError } = await supabase.storage
        .from(F23_BUCKET_NAME)
        .list(fullPath, { limit: 1000 });

      if (listError) {
        logs.push(`❌ Error listing ${fullPath}: ${listError.message}`);
        folderResults.push({
          folder,
          fileCount: 0,
          totalSize: 0,
          status: 'error',
          message: listError.message
        });
        continue;
      }

      if (!files || files.length === 0) {
        logs.push(`⚠️ No files found in: ${fullPath}`);
        folderResults.push({
          folder,
          fileCount: 0,
          totalSize: 0,
          status: 'empty',
          message: 'Folder is empty or does not exist'
        });
        continue;
      }

      const filePaths = files.map(f => `${fullPath}/${f.name}`);
      const folderSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);

      if (mode === 'permanent') {
        // Permanent deletion
        const { error: deleteErr } = await supabase.storage
          .from(F23_BUCKET_NAME)
          .remove(filePaths);

        if (deleteErr) {
          logs.push(`❌ Failed to delete from ${fullPath}: ${deleteErr.message}`);
          folderResults.push({
            folder,
            fileCount: 0,
            totalSize: 0,
            status: 'error',
            message: deleteErr.message
          });
        } else {
          totalFiles += files.length;
          totalSize += folderSize;
          logs.push(`✅ Permanently deleted ${files.length} files from ${fullPath}`);
          folderResults.push({
            folder,
            fileCount: files.length,
            totalSize: folderSize,
            status: 'success',
            message: `Permanently deleted ${files.length} files`
          });
        }
      } else if (mode === 'trash') {
        // Move to trash folder
        const trashPath = `${F23_TRASH_PREFIX}/${new Date().toISOString().split('T')[0]}/${folder}`;
        let moveSuccessCount = 0;
        let moveErrors: string[] = [];

        for (const filePath of filePaths) {
          const fileName = filePath.split('/').pop();
          const newPath = `${trashPath}/${fileName}`;

          try {
            // Copy file to trash location
            const { error: copyError } = await supabase.storage
              .from(F23_BUCKET_NAME)
              .copy(filePath, newPath);

            if (copyError) {
              moveErrors.push(`Failed to copy ${fileName}: ${copyError.message}`);
              continue;
            }

            // Remove original file
            const { error: removeError } = await supabase.storage
              .from(F23_BUCKET_NAME)
              .remove([filePath]);

            if (removeError) {
              moveErrors.push(`Failed to remove original ${fileName}: ${removeError.message}`);
              // Try to clean up the copy
              await supabase.storage.from(F23_BUCKET_NAME).remove([newPath]);
              continue;
            }

            moveSuccessCount++;
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            moveErrors.push(`Exception moving ${fileName}: ${errorMsg}`);
          }
        }

        if (moveSuccessCount === files.length) {
          totalFiles += files.length;
          totalSize += folderSize;
          logs.push(`✅ Moved ${files.length} files from ${fullPath} to trash`);
          folderResults.push({
            folder,
            fileCount: files.length,
            totalSize: folderSize,
            status: 'success',
            message: `Moved ${files.length} files to trash at ${trashPath}`
          });
        } else {
          logs.push(`⚠️ Partially moved ${moveSuccessCount}/${files.length} files from ${fullPath}`);
          if (moveErrors.length > 0) {
            logs.push(`Errors: ${moveErrors.slice(0, 3).join(', ')}${moveErrors.length > 3 ? '...' : ''}`);
          }
          folderResults.push({
            folder,
            fileCount: moveSuccessCount,
            totalSize: Math.round(folderSize * (moveSuccessCount / files.length)),
            status: moveSuccessCount > 0 ? 'success' : 'error',
            message: `Moved ${moveSuccessCount}/${files.length} files to trash${moveErrors.length > 0 ? ' (some errors)' : ''}`
          });
        }
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      logs.push(`❌ Exception processing ${fullPath}: ${errorMsg}`);
      folderResults.push({
        folder,
        fileCount: 0,
        totalSize: 0,
        status: 'error',
        message: errorMsg
      });
    }
  }

  logs.push('---');
  logs.push(`Operation complete: ${totalFiles} files processed, ${f23_formatBytes(totalSize)} total`);

  return {
    mode,
    folders: folderResults,
    totalFilesProcessed: totalFiles,
    totalSizeProcessed: totalSize
  };
}

function f23_buildStoragePath(folder: string): string {
  return `${F23_PARENT_PREFIX}/${folder}`;
}

function f23_formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}