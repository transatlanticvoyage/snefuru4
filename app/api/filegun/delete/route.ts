import { NextRequest } from 'next/server';
import { isFilegunEnabled, canPerformOperation } from '@/app/utils/filegun/filegunSecurity';
import { deleteItem } from '@/app/utils/filegun/filegunOperations';
import { FILEGUN_MESSAGES } from '@/app/utils/filegun/filegunConstants';

export async function DELETE(request: NextRequest) {
  if (!isFilegunEnabled()) {
    return new Response(FILEGUN_MESSAGES.PRODUCTION_DISABLED, { status: 404 });
  }

  try {
    const { path: itemPath } = await request.json();

    if (!itemPath) {
      return Response.json({
        success: false,
        error: 'Missing required field: path'
      }, { status: 400 });
    }

    if (!canPerformOperation('delete', itemPath)) {
      return Response.json({
        success: false,
        error: FILEGUN_MESSAGES.UNAUTHORIZED
      }, { status: 403 });
    }

    await deleteItem(itemPath);

    return Response.json({
      success: true,
      message: 'Item deleted successfully',
      data: {
        path: itemPath
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}