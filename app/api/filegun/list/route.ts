import { NextRequest } from 'next/server';
import { isFilegunEnabled } from '@/app/utils/filegun/filegunSecurity';
import { listDirectory } from '@/app/utils/filegun/filegunOperations';
import { FILEGUN_MESSAGES } from '@/app/utils/filegun/filegunConstants';

export async function GET(request: NextRequest) {
  if (!isFilegunEnabled()) {
    return new Response(FILEGUN_MESSAGES.PRODUCTION_DISABLED, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const targetPath = searchParams.get('path') || '/';
  
  try {
    const items = await listDirectory(targetPath);
    
    return Response.json({
      success: true,
      data: {
        items,
        path: targetPath,
        count: items.length
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}