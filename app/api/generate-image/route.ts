import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated and no longer functional. The api_keys table it references does not exist.' },
    { status: 501 }
  );
} 