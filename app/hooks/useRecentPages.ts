'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface RecentPage {
  path: string;
  title: string;
  timestamp: number;
}

const RECENT_PAGES_KEY = 'snefuru_recent_pages';
const MAX_RECENT_PAGES = 8;

// Pages to exclude from recents
const EXCLUDED_PATHS = [
  '/login',
  '/logout',
  '/error',
  '/404',
  '/500',
  '/'
];

// Page title mapping for better display names
const getPageTitle = (path: string): string => {
  const titleMap: { [key: string]: string } = {
    // Admin pages
    '/admin/sunjar': 'Sun Row Slots Management',
    '/admin/moonjar': 'Moon Row Modules Management', 
    '/admin/rackjar': 'Rackui Columns Jar',
    '/admin/yegjar': 'Yeg DB Columns Manager',
    '/admin/zugjar': 'Zug DB Tables Manager',
    '/admin/favaconfignow': 'Fava Config Now',
    '/admin/drahiman': 'Drahi Docking Stations',
    '/admin/coderangejar': 'Code Range Jar',
    '/admin/jetlamaster': 'Jetla Masterlist',
    '/admin/bensamaster': 'Bensa Masterlist',
    '/admin/obi': 'Obi Page Settings Manager',
    '/admin/azulpsql': 'Azulp SQL Swipes',
    '/admin/coltempcommand': 'ColTemp Command',
    '/admin/usersp1': 'User Management',
    '/admin/popnow': 'Popup Development',
    
    // Non-admin pages
    '/torna3': 'Tornado Page Editor System',
    '/bren1': 'Cricket Matches',
    '/sitejar4': 'Sitespren Table UTG',
    '/gconjar1': 'Gcon Pieces UTG', 
    '/nwjar1': 'NWPI Content UTG',
    '/cfdefjar': 'Custom Field Definitions',
    '/cfvaljar': 'Custom Field Values',
    '/pedbar': 'Gcon Pieces Item',
    '/pedtor1': 'Gcon Pieces Item Editor',
    '/flatx1': 'JSON Flattener (Elementor)',
    '/slotx1': 'Slot View (Elementor)',
    '/fanex1': 'Prex System Tools (Elementor)',
    '/narpijar': 'Narpi Image Pushes',
    '/myhub': 'MyHub Account Settings',
    '/profile': 'Profile Settings',
    '/downloadplugin': 'Download Snefuruplin WP Plugin'
  };

  // Return mapped title or fallback to path-based title
  if (titleMap[path]) {
    return titleMap[path];
  }

  // Generate title from path
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return 'Home';
  
  const lastSegment = segments[segments.length - 1];
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/[-_]/g, ' ');
};

const shouldTrackPage = (path: string): boolean => {
  // Don't track excluded paths
  if (EXCLUDED_PATHS.includes(path)) return false;
  
  // Don't track paths with query parameters or fragments for now
  if (path.includes('?') || path.includes('#')) return false;
  
  // Don't track very short paths
  if (path.length < 2) return false;
  
  return true;
};

export const useRecentPages = () => {
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const pathname = usePathname();

  // Load recent pages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_PAGES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentPages(parsed);
      }
    } catch (error) {
      console.error('Error loading recent pages:', error);
      setRecentPages([]);
    }
  }, []);

  // Track current page when pathname changes
  useEffect(() => {
    if (!pathname || !shouldTrackPage(pathname)) return;

    const addToRecents = (path: string) => {
      try {
        const newPage: RecentPage = {
          path,
          title: getPageTitle(path),
          timestamp: Date.now()
        };

        setRecentPages(prevRecents => {
          // Remove existing entry for this path (to avoid duplicates)
          const filtered = prevRecents.filter(page => page.path !== path);
          
          // Add new entry at the beginning
          const updated = [newPage, ...filtered].slice(0, MAX_RECENT_PAGES);
          
          // Save to localStorage
          localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(updated));
          
          return updated;
        });
      } catch (error) {
        console.error('Error adding to recent pages:', error);
      }
    };

    // Small delay to ensure page has loaded
    const timeoutId = setTimeout(() => {
      addToRecents(pathname);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  const clearRecents = () => {
    try {
      localStorage.removeItem(RECENT_PAGES_KEY);
      setRecentPages([]);
    } catch (error) {
      console.error('Error clearing recent pages:', error);
    }
  };

  const removeRecentPage = (path: string) => {
    try {
      setRecentPages(prevRecents => {
        const updated = prevRecents.filter(page => page.path !== path);
        localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error removing recent page:', error);
    }
  };

  return {
    recentPages,
    clearRecents,
    removeRecentPage
  };
};