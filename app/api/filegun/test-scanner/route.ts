import { NextRequest, NextResponse } from 'next/server';
import { SentinelScanner } from '@/app/utils/filegun/sentinel/SentinelScanner';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing SentinelScanner...');
    
    const scanner = new SentinelScanner();
    
    // Test scanning full app directory path
    const fullAppPath = '/Users/kylecampbell/Documents/repos/localrepo-snefuru4/app';
    console.log('Scanning app directory:', fullAppPath);
    const items = await scanner.scanDirectory(fullAppPath);
    
    console.log(`Found ${items.length} items`);
    
    // Show first few items
    const preview = items.slice(0, 10).map(item => ({
      path: item.path,
      name: item.name,
      type: item.type,
      size: item.size
    }));

    console.log('Preview:', preview);

    // Get stats
    const stats = await scanner.getScanStats(items);
    console.log('Stats:', stats);

    return NextResponse.json({
      success: true,
      data: {
        totalItems: items.length,
        preview: preview,
        stats: stats
      }
    });

  } catch (error) {
    console.error('Scanner test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}