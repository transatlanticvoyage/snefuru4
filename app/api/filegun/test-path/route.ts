import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const cwd = process.cwd();
    console.log('Current working directory:', cwd);
    
    // Try to read /app directory relative to project root
    const appPath = path.join(cwd, 'app');
    console.log('Trying app path:', appPath);
    
    try {
      const appExists = await fs.access(appPath).then(() => true).catch(() => false);
      console.log('App directory exists:', appExists);
      
      if (appExists) {
        const appContents = await fs.readdir(appPath);
        console.log('App directory contents:', appContents.slice(0, 10));
        
        return NextResponse.json({
          success: true,
          data: {
            cwd,
            appPath,
            appExists,
            appContents: appContents.slice(0, 20)
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'App directory not found',
          data: { cwd, appPath }
        });
      }
    } catch (error) {
      console.error('Error reading app directory:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        data: { cwd, appPath }
      });
    }

  } catch (error) {
    console.error('Path test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}