import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inputPath } = body;

    const getAbsolutePath = (inputPath: string): string => {
      if (path.isAbsolute(inputPath)) {
        return inputPath;
      }
      // Convert relative paths like "/app" to full project paths
      return path.join(process.cwd(), inputPath.startsWith('/') ? inputPath.slice(1) : inputPath);
    };

    const result = getAbsolutePath(inputPath || 'app');

    return NextResponse.json({
      success: true,
      data: {
        inputPath,
        processedPath: result,
        cwd: process.cwd(),
        isAbsolute: path.isAbsolute(result)
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}