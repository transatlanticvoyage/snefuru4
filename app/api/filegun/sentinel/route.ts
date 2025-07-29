import { NextRequest, NextResponse } from 'next/server';
import { FilegunSentinel } from '@/app/utils/filegun/sentinel/SentinelCore';
import path from 'path';

// Global Sentinel instance
let sentinel: FilegunSentinel | null = null;

// Helper to convert relative paths to absolute
const getAbsolutePath = (inputPath: string): string => {
  // If it's a full absolute path, use it as-is
  if (path.isAbsolute(inputPath) && inputPath.includes(process.cwd())) {
    return inputPath;
  }
  // Convert relative paths like "/app" or "app" to full project paths
  const cleanPath = inputPath.startsWith('/') ? inputPath.slice(1) : inputPath;
  return path.join(process.cwd(), cleanPath);
};

// GET - Get Sentinel status
export async function GET(request: NextRequest) {
  try {
    if (!sentinel) {
      return NextResponse.json({
        success: true,
        data: {
          isActive: false,
          isScanning: false,
          lastSyncTime: null,
          totalFiles: 0,
          totalFolders: 0,
          pendingChanges: 0,
          errorCount: 0,
          watchedPaths: []
        }
      });
    }

    const status = sentinel.getCurrentStatus();
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting Sentinel status:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST - Start/Stop Sentinel or trigger sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, path } = body;

    // Initialize Sentinel if needed
    if (!sentinel) {
      sentinel = FilegunSentinel.getInstance();
    }

    switch (action) {
      case 'start':
        const projectRoot = getAbsolutePath(path || 'app');
        console.log('Starting Sentinel with path:', projectRoot);
        const started = await sentinel.startWatching(projectRoot);
        
        return NextResponse.json({
          success: started,
          message: started ? 'Sentinel started successfully' : 'Failed to start Sentinel',
          data: sentinel.getCurrentStatus()
        });

      case 'stop':
        await sentinel.stopWatching();
        
        return NextResponse.json({
          success: true,
          message: 'Sentinel stopped successfully',
          data: sentinel.getCurrentStatus()
        });

      case 'sync':
        const syncPath = getAbsolutePath(path || 'app');
        console.log('Syncing Sentinel with path:', syncPath);
        const result = await sentinel.syncDirectory(syncPath);
        
        return NextResponse.json({
          success: result.success,
          message: `Sync completed: ${result.itemsProcessed} items processed`,
          data: result
        });

      case 'restart':
        await sentinel.stopWatching();
        const restartPath = getAbsolutePath(path || 'app');
        console.log('Restarting Sentinel with path:', restartPath);
        const restarted = await sentinel.startWatching(restartPath);
        
        return NextResponse.json({
          success: restarted,
          message: restarted ? 'Sentinel restarted successfully' : 'Failed to restart Sentinel',
          data: sentinel.getCurrentStatus()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: start, stop, sync, or restart'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in Sentinel API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Stop and destroy Sentinel
export async function DELETE(request: NextRequest) {
  try {
    if (sentinel) {
      await sentinel.destroy();
      sentinel = null;
    }

    return NextResponse.json({
      success: true,
      message: 'Sentinel destroyed successfully'
    });
  } catch (error) {
    console.error('Error destroying Sentinel:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}