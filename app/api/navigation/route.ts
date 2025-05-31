import { getNavigation } from '@/app/utils/getNavigation';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // This ensures the route is not cached

export async function GET() {
  try {
    console.log('API: Starting navigation request...');
    
    // Log the current working directory
    const cwd = process.cwd();
    console.log('API: Current working directory:', cwd);
    
    // Log the app directory path
    const appDir = `${cwd}/app`;
    console.log('API: App directory path:', appDir);
    
    // Log the protected directory path
    const protectedDir = `${appDir}/(protected)`;
    console.log('API: Protected directory path:', protectedDir);
    
    // Try to get navigation items
    console.log('API: Calling getNavigation...');
    const navItems = await getNavigation();
    console.log('API: Navigation items received:', navItems);
    
    if (!navItems || navItems.length === 0) {
      console.log('API: No navigation items found');
      return NextResponse.json([], { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }
    
    return NextResponse.json(navItems, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('API: Error in navigation route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get navigation', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
} 