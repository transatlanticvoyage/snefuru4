// System 3 Navigation - Advanced admin navigation with additional dev tools

export interface NavItem {
  name: string;
  path?: string;
  children?: NavItem[];
}

// For system3, we'll fetch from the API endpoint and add dev-specific items
export async function getSystem3Navigation(): Promise<NavItem[]> {
  // Get the full admin navigation via API
  let adminNavItems: NavItem[] = [];
  try {
    const response = await fetch('/api/navigation');
    if (!response.ok) {
      throw new Error('Failed to fetch navigation');
    }
    adminNavItems = await response.json();
  } catch (error) {
    console.error('Error fetching system3 navigation:', error);
    adminNavItems = [];
  }
  
  // Add developer-specific navigation items
  const devNavItems: NavItem[] = [
    {
      name: 'Dev Tools',
      children: [
        { name: 'Database Console', path: '/dev/database' },
        { name: 'API Testing', path: '/dev/api-test' },
        { name: 'Component Library', path: '/dev/components' },
        { name: 'System Monitor', path: '/dev/monitor' }
      ]
    },
    {
      name: 'Debug',
      children: [
        { name: 'Error Logs', path: '/dev/logs' },
        { name: 'Performance', path: '/dev/performance' },
        { name: 'Memory Usage', path: '/dev/memory' }
      ]
    }
  ];
  
  // Combine admin navigation with dev tools
  return [...devNavItems, ...adminNavItems];
}

export const system3BaseNavigation: NavItem[] = [
  {
    name: 'Dev Tools',
    children: [
      { name: 'Database Console', path: '/dev/database' },
      { name: 'API Testing', path: '/dev/api-test' },
      { name: 'Component Library', path: '/dev/components' },
      { name: 'System Monitor', path: '/dev/monitor' }
    ]
  },
  {
    name: 'Debug',
    children: [
      { name: 'Error Logs', path: '/dev/logs' },
      { name: 'Performance', path: '/dev/performance' },
      { name: 'Memory Usage', path: '/dev/memory' }
    ]
  }
];

export function createSystem3NavigationStructure(dynamicNavItems: NavItem[]): {
  firstRow: NavItem[];
  secondRow: NavItem[];
} {
  // Dev tools in first row, then admin items
  const allItems = [...system3BaseNavigation, ...dynamicNavItems];
  
  // Dev-focused split: dev tools in first row, admin tools in second
  const devToolsCount = system3BaseNavigation.length;
  return {
    firstRow: allItems.slice(0, devToolsCount + 3), // Dev tools + first few admin items
    secondRow: allItems.slice(devToolsCount + 3)
  };
}