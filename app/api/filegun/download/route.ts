// This endpoint has been removed - WebSocket bridge is used instead
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint has been removed - WebSocket bridge is used instead' },
    { status: 410 }
  );
}