import { NextResponse } from 'next/server';
import archiver from 'archiver';
import { promises as fs } from 'fs';
import path from 'path';
import { PassThrough } from 'stream';

export async function GET() {
  try {
    // Create a PassThrough stream for the response
    const stream = new PassThrough();
    
    // Create archiver instance
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Set up error handling
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      throw err;
    });

    // Pipe archive data to the stream
    archive.pipe(stream);

    // Path to the snefuruplin plugin directory
    const pluginPath = path.join(process.cwd(), 'snefuruplin');

    // Function to recursively add files to archive
    const addDirectoryToArchive = async (dirPath: string, archivePath: string = '') => {
      try {
        const items = await fs.readdir(dirPath);
        
        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const stat = await fs.stat(fullPath);
          const archiveItemPath = archivePath ? path.join(archivePath, item) : item;
          
          if (stat.isDirectory()) {
            // Recursively add directory
            await addDirectoryToArchive(fullPath, archiveItemPath);
          } else {
            // Add file to archive
            const fileBuffer = await fs.readFile(fullPath);
            archive.append(fileBuffer, { name: `snefuruplin/${archiveItemPath}` });
          }
        }
      } catch (error) {
        console.error(`Error processing directory ${dirPath}:`, error);
        throw error;
      }
    };

    // Add all files from the plugin directory
    await addDirectoryToArchive(pluginPath);

    // Finalize the archive
    await archive.finalize();

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Get current date for filename
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0');
    
    const filename = `SnefuruplinWPPlugin${dateStr}.zip`;

    // Return the zip file as a response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating plugin zip:', error);
    return NextResponse.json(
      { error: 'Failed to generate plugin zip file' },
      { status: 500 }
    );
  }
}