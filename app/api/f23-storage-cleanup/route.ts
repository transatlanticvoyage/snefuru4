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
    const folderPrefix = f23_buildStoragePath(folder);
    logs.push(`Previewing entire folder: ${folderPrefix}`);

    try {
      // Get ALL objects that start with this folder prefix
      const { data: allObjects, error } = await supabase.storage
        .from(F23_BUCKET_NAME)
        .list('', { 
          limit: 1000,
          prefix: folderPrefix
        });

      if (error) {
        logs.push(`❌ Error listing objects with prefix ${folderPrefix}: ${error.message}`);
        folderResults.push({
          folder,
          fileCount: 0,
          totalSize: 0,
          status: 'error',
          message: error.message
        });
        continue;
      }

      if (!allObjects || allObjects.length === 0) {
        logs.push(`⚠️ No objects found with prefix: ${folderPrefix}`);
        folderResults.push({
          folder,
          fileCount: 0,
          totalSize: 0,
          status: 'empty',
          message: 'Folder does not exist or is empty'
        });
        continue;
      }

      const folderSize = allObjects.reduce((sum, obj) => sum + (obj.metadata?.size || 0), 0);
      totalFiles += allObjects.length;
      totalSize += folderSize;

      logs.push(`✓ Found ${allObjects.length} objects (${f23_formatBytes(folderSize)}) in folder ${folderPrefix}`);
      folderResults.push({
        folder,
        fileCount: allObjects.length,
        totalSize: folderSize,
        status: 'success',
        message: `Would ${mode === 'permanent' ? 'permanently delete entire folder' : 'move entire folder to trash'} with ${allObjects.length} objects`,
        filePaths: allObjects.map(obj => obj.name)
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      logs.push(`❌ Exception processing ${folderPrefix}: ${errorMsg}`);
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
  logs.push(`Preview complete: ${totalFiles} objects, ${f23_formatBytes(totalSize)} total`);

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
    const folderPrefix = f23_buildStoragePath(folder);
    logs.push(`Processing entire folder: ${folderPrefix} (${mode})`);

    try {
      // Get ALL objects that start with this folder prefix
      const { data: allObjects, error: listError } = await supabase.storage
        .from(F23_BUCKET_NAME)
        .list('', { 
          limit: 1000,
          prefix: folderPrefix
        });

      if (listError) {
        logs.push(`❌ Error listing objects with prefix ${folderPrefix}: ${listError.message}`);
        folderResults.push({
          folder,
          fileCount: 0,
          totalSize: 0,
          status: 'error',
          message: listError.message
        });
        continue;
      }

      if (!allObjects || allObjects.length === 0) {
        logs.push(`⚠️ No objects found with prefix: ${folderPrefix}`);
        folderResults.push({
          folder,
          fileCount: 0,
          totalSize: 0,
          status: 'empty',
          message: 'Folder does not exist or is empty'
        });
        continue;
      }

      const objectPaths = allObjects.map(obj => obj.name);
      const folderSize = allObjects.reduce((sum, obj) => sum + (obj.metadata?.size || 0), 0);

      if (mode === 'permanent') {
        // Permanent deletion of entire folder
        const { error: deleteErr } = await supabase.storage
          .from(F23_BUCKET_NAME)
          .remove(objectPaths);

        if (deleteErr) {
          logs.push(`❌ Failed to delete folder ${folderPrefix}: ${deleteErr.message}`);
          folderResults.push({
            folder,
            fileCount: 0,
            totalSize: 0,
            status: 'error',
            message: deleteErr.message
          });
        } else {
          totalFiles += allObjects.length;
          totalSize += folderSize;
          logs.push(`✅ Permanently deleted entire folder ${folderPrefix} with ${allObjects.length} objects`);
          folderResults.push({
            folder,
            fileCount: allObjects.length,
            totalSize: folderSize,
            status: 'success',
            message: `Permanently deleted entire folder with ${allObjects.length} objects`
          });
        }
      } else if (mode === 'trash') {
        // Move entire folder to trash
        const trashFolderPath = `${F23_TRASH_PREFIX}/${new Date().toISOString().split('T')[0]}/${folder}`;
        let moveSuccessCount = 0;
        let moveErrors: string[] = [];

        for (const objectPath of objectPaths) {
          // Preserve the folder structure in trash by keeping relative path
          const relativePath = objectPath.replace(folderPrefix, '');
          const newPath = `${trashFolderPath}${relativePath}`;

          try {
            // Copy object to trash location
            const { error: copyError } = await supabase.storage
              .from(F23_BUCKET_NAME)
              .copy(objectPath, newPath);

            if (copyError) {
              moveErrors.push(`Failed to copy ${objectPath}: ${copyError.message}`);
              continue;
            }

            // Remove original object
            const { error: removeError } = await supabase.storage
              .from(F23_BUCKET_NAME)
              .remove([objectPath]);

            if (removeError) {
              moveErrors.push(`Failed to remove original ${objectPath}: ${removeError.message}`);
              // Try to clean up the copy
              await supabase.storage.from(F23_BUCKET_NAME).remove([newPath]);
              continue;
            }

            moveSuccessCount++;
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            moveErrors.push(`Exception moving ${objectPath}: ${errorMsg}`);
          }
        }

        if (moveSuccessCount === allObjects.length) {
          totalFiles += allObjects.length;
          totalSize += folderSize;
          logs.push(`✅ Moved entire folder ${folderPrefix} with ${allObjects.length} objects to trash`);
          folderResults.push({
            folder,
            fileCount: allObjects.length,
            totalSize: folderSize,
            status: 'success',
            message: `Moved entire folder to trash at ${trashFolderPath} with ${allObjects.length} objects`
          });
        } else {
          logs.push(`⚠️ Partially moved ${moveSuccessCount}/${allObjects.length} objects from folder ${folderPrefix}`);
          if (moveErrors.length > 0) {
            logs.push(`Errors: ${moveErrors.slice(0, 3).join(', ')}${moveErrors.length > 3 ? '...' : ''}`);
          }
          folderResults.push({
            folder,
            fileCount: moveSuccessCount,
            totalSize: Math.round(folderSize * (moveSuccessCount / allObjects.length)),
            status: moveSuccessCount > 0 ? 'success' : 'error',
            message: `Moved ${moveSuccessCount}/${allObjects.length} objects to trash${moveErrors.length > 0 ? ' (some errors)' : ''}`
          });
        }
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      logs.push(`❌ Exception processing ${folderPrefix}: ${errorMsg}`);
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
  logs.push(`Operation complete: ${totalFiles} objects processed, ${f23_formatBytes(totalSize)} total`);

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