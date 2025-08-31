// System 2 Navigation - Full admin navigation (current system functionality)

export interface NavItem {
  name: string;
  path?: string;
  children?: NavItem[];
}

// For system2, we'll fetch from the API endpoint to get the full dynamic navigation
export async function getSystem2Navigation(): Promise<NavItem[]> {
  try {
    const response = await fetch('/api/navigation');
    if (!response.ok) {
      throw new Error('Failed to fetch navigation');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching system2 navigation:', error);
    return [];
  }
}

// For static usage in components, we'll also provide a base structure
export const system2BaseNavigation: NavItem[] = [
  {
    name: 'admin',
    children: [
      { name: 'Admin Dashboard', path: '/admin' },
      { name: 'User Management', path: '/admin/users' },
      { name: 'System Settings', path: '/admin/settings' }
    ]
  },
  {
    name: 'recents',
    children: [] // Will be populated dynamically
  },
  {
    name: 'favorites', 
    children: [] // Will be populated dynamically
  }
  // Additional hardcoded admin items can be added here
];

export function createSystem2NavigationStructure(dynamicNavItems: NavItem[]): {
  firstRow: NavItem[];
  secondRow: NavItem[];
} {
  // Import the complex navigation structure builder
  const { createNavigationStructure } = require('@/app/utils/navigationHelper');
  
  // Create the complex structure using the original logic
  const { adminMenuItem, specialFirstItem, oldAllGroupItem, plutoJetstreamItem, hardcodedNavItems } = createNavigationStructure(dynamicNavItems);

  // Create the OPEN FULL NAV button item
  const openFullNavButton: NavItem = {
    name: 'OPEN FULL NAV',
    path: undefined
  };

  // Create recents and favorites (simplified for now)
  const recentsMenuItem: NavItem = {
    name: 'recents',
    children: [{ name: 'No recent pages', path: undefined }]
  };

  const favoritesMenuItem: NavItem = {
    name: 'favorites',
    children: [{ name: 'No favorites yet', path: undefined }]
  };

  // Create the final nav items array
  const finalNavItems = [openFullNavButton, recentsMenuItem, favoritesMenuItem, adminMenuItem, plutoJetstreamItem, specialFirstItem, oldAllGroupItem, ...hardcodedNavItems];

  const panjar3Index = finalNavItems.findIndex(item => item.name === 'panjar3');
  if (panjar3Index === -1) {
    const midPoint = Math.ceil(finalNavItems.length / 2);
    return {
      firstRow: finalNavItems.slice(0, midPoint),
      secondRow: finalNavItems.slice(midPoint)
    };
  } else {
    return {
      firstRow: finalNavItems.slice(0, panjar3Index + 1),
      secondRow: finalNavItems.slice(panjar3Index + 1)
    };
  }
}