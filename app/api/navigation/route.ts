import { getNavigation } from '@/app/utils/getNavigation';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // This ensures the route is not cached

export async function GET() {
  try {
    console.log('API: Getting navigation items...');
    const navItems = await getNavigation();
    console.log('API: Navigation items:', navItems);
    return NextResponse.json(navItems);
  } catch (error) {
    console.error('API: Error getting navigation:', error);
    return NextResponse.json({ error: 'Failed to get navigation' }, { status: 500 });
  }
} 