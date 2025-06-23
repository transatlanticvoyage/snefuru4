import { NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import path from 'path';

export async function GET(request: Request) {
  try {
    // In production, you might want to add authentication here
    // to prevent unauthorized downloads
    
    // Create the plugin zip file from the snefuruplin directory
    const pluginDir = path.join(process.cwd(), 'snefuruplin');
    const zip = new AdmZip();
    
    // Add all files from the plugin directory
    zip.addLocalFolder(pluginDir, 'snefuruplin');
    
    // Get the zip buffer
    const zipBuffer = zip.toBuffer();

    // Return the zip file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="snefuruplin.zip"',
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Plugin download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate plugin download' },
      { status: 500 }
    );
  }
}