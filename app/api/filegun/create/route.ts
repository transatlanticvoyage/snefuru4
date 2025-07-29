import { NextRequest } from 'next/server';
import { isFilegunEnabled, canPerformOperation, sanitizeFilename } from '@/app/utils/filegun/filegunSecurity';
import { createFolder, createFile } from '@/app/utils/filegun/filegunOperations';
import { FILEGUN_MESSAGES } from '@/app/utils/filegun/filegunConstants';

export async function POST(request: NextRequest) {
  if (!isFilegunEnabled()) {
    return new Response(FILEGUN_MESSAGES.PRODUCTION_DISABLED, { status: 404 });
  }

  try {
    const { path: parentPath, name, type, content = '' } = await request.json();

    if (!parentPath || !name || !type) {
      return Response.json({
        success: false,
        error: 'Missing required fields: path, name, type'
      }, { status: 400 });
    }

    const sanitizedName = sanitizeFilename(name);
    if (!sanitizedName) {
      return Response.json({
        success: false,
        error: 'Invalid filename'
      }, { status: 400 });
    }

    if (!canPerformOperation('create', parentPath)) {
      return Response.json({
        success: false,
        error: FILEGUN_MESSAGES.UNAUTHORIZED
      }, { status: 403 });
    }

    if (type === 'folder') {
      await createFolder(parentPath, sanitizedName);
    } else if (type === 'file') {
      await createFile(parentPath, sanitizedName, content);
    } else {
      return Response.json({
        success: false,
        error: 'Invalid type. Must be "folder" or "file"'
      }, { status: 400 });
    }

    return Response.json({
      success: true,
      message: `${type === 'folder' ? 'Folder' : 'File'} created successfully`,
      data: {
        name: sanitizedName,
        type,
        path: `${parentPath}/${sanitizedName}`
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}