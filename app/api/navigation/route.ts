import { getNavigation } from '@/app/utils/getNavigation';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // This ensures the route is not cached

export async function GET() {
  try {
    console.log('API: Getting navigation items...');
    const navItems = await getNavigation();
    console.log('API: Navigation items:', navItems);
    
    if (!navItems || navItems.length === 0) {
      console.log('API: No navigation items found');
      return NextResponse.json([], { status: 200 });
    }
    
    return NextResponse.json(navItems);
  } catch (error) {
    console.error('API: Error getting navigation:', error);
    return NextResponse.json(
      { error: 'Failed to get navigation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 