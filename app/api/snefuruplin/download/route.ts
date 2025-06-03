import { NextRequest, NextResponse } from 'next/server';
import { stat } from 'fs/promises';
import { join } from 'path';
import archiver from 'archiver';
import { Readable } from 'stream';

export async function GET(request: NextRequest) {
  try {
    // Path to the plugin folder
    const pluginPath = join(process.cwd(), 'snefuruplin');
    
    // Check if plugin folder exists
    try {
      await stat(pluginPath);
    } catch (error) {
      return NextResponse.json(
        { error: 'Plugin folder not found' },
        { status: 404 }
      );
    }
    
    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Create a promise to handle the archive creation
    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      archive.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      archive.on('error', (err) => {
        reject(err);
      });
      
      // Add the entire snefuruplin directory to the archive
      // This preserves the folder structure
      archive.directory(pluginPath, 'snefuruplin');
      
      // Finalize the archive
      archive.finalize();
    });
    
    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', 'attachment; filename="snefuruplin-cloud-connector.zip"');
    headers.set('Content-Length', zipBuffer.length.toString());
    headers.set('Cache-Control', 'no-cache');
    
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: headers,
    });
    
  } catch (error) {
    console.error('Error creating plugin download:', error);
    return NextResponse.json(
      { error: 'Failed to create plugin download', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 