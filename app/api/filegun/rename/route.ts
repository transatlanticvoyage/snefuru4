import { NextRequest } from 'next/server';
import { isFilegunEnabled, canPerformOperation, sanitizeFilename } from '@/app/utils/filegun/filegunSecurity';
import { renameItem } from '@/app/utils/filegun/filegunOperations';
import { FILEGUN_MESSAGES } from '@/app/utils/filegun/filegunConstants';

export async function PUT(request: NextRequest) {
  if (!isFilegunEnabled()) {
    return new Response(FILEGUN_MESSAGES.PRODUCTION_DISABLED, { status: 404 });
  }

  try {
    const { oldPath, newName } = await request.json();

    if (!oldPath || !newName) {
      return Response.json({
        success: false,
        error: 'Missing required fields: oldPath, newName'
      }, { status: 400 });
    }

    const sanitizedName = sanitizeFilename(newName);
    if (!sanitizedName) {
      return Response.json({
        success: false,
        error: 'Invalid filename'
      }, { status: 400 });
    }

    if (!canPerformOperation('rename', oldPath)) {
      return Response.json({
        success: false,
        error: FILEGUN_MESSAGES.UNAUTHORIZED
      }, { status: 403 });
    }

    await renameItem(oldPath, sanitizedName);

    return Response.json({
      success: true,
      message: 'Item renamed successfully',
      data: {
        oldPath,
        newName: sanitizedName
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}