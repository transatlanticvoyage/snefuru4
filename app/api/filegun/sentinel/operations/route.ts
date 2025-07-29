import { NextRequest, NextResponse } from 'next/server';
import { FilegunSentinel } from '@/app/utils/filegun/sentinel/SentinelCore';

// GET - Get operation history
export async function GET(request: NextRequest) {
  try {
    const sentinel = FilegunSentinel.getInstance();
    const operations = sentinel.getOperationHistory();
    
    return NextResponse.json({
      success: true,
      data: operations
    });
  } catch (error) {
    console.error('Error getting operations:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Clear operation history
export async function DELETE(request: NextRequest) {
  try {
    const sentinel = FilegunSentinel.getInstance();
    sentinel.clearOperationHistory();
    
    return NextResponse.json({
      success: true,
      message: 'Operation history cleared'
    });
  } catch (error) {
    console.error('Error clearing operations:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}