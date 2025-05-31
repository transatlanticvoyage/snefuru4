import { getNavigation } from '@/app/utils/getNavigation';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const navItems = await getNavigation();
    return NextResponse.json(navItems);
  } catch (error) {
    console.error('Error getting navigation:', error);
    return NextResponse.json({ error: 'Failed to get navigation' }, { status: 500 });
  }
} 