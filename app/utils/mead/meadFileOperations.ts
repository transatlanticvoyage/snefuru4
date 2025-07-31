// File and folder creation operations for Mead function
import { IMeadConfig, IMeadOperationResult } from './meadTypes';
import { MEAD_FILE_EXTENSIONS } from './meadConstants';

export async function createMeadFolder(
  basePath: string,
  folderName: string
): Promise<IMeadOperationResult> {
  try {
    const response = await fetch('/api/filegun/folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: basePath,
        name: folderName
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        path: `${basePath}/${folderName}`
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create folder'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function createMeadFile(
  basePath: string,
  fileName: string,
  fileType: IMeadConfig['fileType']
): Promise<IMeadOperationResult> {
  try {
    const extension = MEAD_FILE_EXTENSIONS[fileType];
    const fullFileName = fileType === 'none' ? fileName : `${fileName}${extension}`;
    
    const response = await fetch('/api/filegun/file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: basePath,
        name: fullFileName,
        content: '' // Empty file
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        path: `${basePath}/${fullFileName}`
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create file'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}