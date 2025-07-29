import { NextRequest, NextResponse } from 'next/server';
import { SentinelDatabase } from '@/app/utils/filegun/sentinel/SentinelDatabase';

// GET - Get database statistics
export async function GET(request: NextRequest) {
  try {
    const database = new SentinelDatabase();
    const stats = await database.getDbStats();
    const outOfSync = await database.getOutOfSyncItems();
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        outOfSyncFiles: outOfSync.files.length,
        outOfSyncFolders: outOfSync.folders.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting database stats:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST - Cleanup deleted items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'cleanup') {
      const database = new SentinelDatabase();
      const deletedCount = await database.cleanupDeletedItems();
      
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${deletedCount} deleted items`,
        data: { deletedCount }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: cleanup'
    }, { status: 400 });
  } catch (error) {
    console.error('Error in stats API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}