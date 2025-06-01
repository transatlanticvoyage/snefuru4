import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { records, qty, aiModel } = await request.json();
    // TODO: Implement logic to create plans and generate images
    return NextResponse.json({ success: true, message: 'Scaffold: received data', received: { records, qty, aiModel } });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
} 