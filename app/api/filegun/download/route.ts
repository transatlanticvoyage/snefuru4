import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'File path is required' },
        { status: 400 }
      );
    }

    // Security check - ensure path is within allowed directory
    const projectRoot = process.cwd();
    const absolutePath = path.resolve(projectRoot, filePath.startsWith('/') ? filePath.slice(1) : filePath);
    
    if (!absolutePath.startsWith(projectRoot)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    try {
      // Check if file exists
      const stats = await stat(absolutePath);
      
      if (!stats.isFile()) {
        return NextResponse.json(
          { success: false, error: 'Path is not a file' },
          { status: 400 }
        );
      }

      // Read the file
      const fileBuffer = await readFile(absolutePath);
      const fileName = path.basename(absolutePath);
      
      // Determine content type based on extension
      const ext = path.extname(fileName).toLowerCase();
      const contentTypeMap: { [key: string]: string } = {
        '.txt': 'text/plain',
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.csv': 'text/csv',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
      
      const contentType = contentTypeMap[ext] || 'application/octet-stream';

      // Return file with proper headers to trigger download
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': stats.size.toString(),
        },
      });

    } catch (fileError) {
      return NextResponse.json(
        { success: false, error: 'File not found or cannot be read' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}