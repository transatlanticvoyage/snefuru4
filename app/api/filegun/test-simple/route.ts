import { NextRequest, NextResponse } from 'next/server';
import { SentinelDatabase } from '@/app/utils/filegun/sentinel/SentinelDatabase';
import { SentinelFileItem } from '@/app/utils/filegun/sentinel/SentinelTypes';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Sentinel database operations...');
    
    const database = new SentinelDatabase();

    // Create test folder first
    const testFolder: SentinelFileItem = {
      path: '/app/test',
      name: 'test',
      type: 'folder',
      size: 0,
      modified: new Date(),
      created: new Date(),
      isHidden: false,
      permissions: '755'
    };

    console.log('1. Creating test folder...');
    const folderResult = await database.syncFolderToDb(testFolder);
    console.log('Folder sync result:', folderResult);

    // Create test file
    const testFile: SentinelFileItem = {
      path: '/app/test/sample.txt',
      name: 'sample.txt',
      type: 'file',
      size: 100,
      modified: new Date(),
      created: new Date(),
      isHidden: false,
      permissions: '644',
      extension: 'txt',
      mimeType: 'text/plain',
      checksum: 'test-checksum-123'
    };

    console.log('2. Creating test file...');
    const fileResult = await database.syncFileToDb(testFile);
    console.log('File sync result:', fileResult);

    // Get database stats
    console.log('3. Getting database stats...');
    const stats = await database.getDbStats();
    console.log('Database stats:', stats);

    // Clean up test data
    console.log('4. Cleaning up...');
    await database.markAsDeleted('/app/test/sample.txt', false);
    await database.markAsDeleted('/app/test', true);
    await database.cleanupDeletedItems();

    return NextResponse.json({
      success: true,
      message: 'Sentinel database operations working!',
      results: {
        folderSync: folderResult,
        fileSync: fileResult,
        stats: stats
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}