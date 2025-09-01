// System 1 Navigation - Minimal navigation for default users

export interface NavItem {
  name: string;
  path?: string;
  children?: NavItem[];
}

export const system1Navigation: NavItem[] = [
  {
    name: 'Voyager Site Table',
    path: '/sitejar'
  },
  {
    name: 'Andromeda Editor',
    path: '/driggsman'
  },
  {
    name: 'Other Links',
    children: [
      {
        name: 'Host Entity Manager',
        path: '/haccjar2'
      },
      {
        name: 'CDN Manager',
        path: '/cdnjar'
      }
    ]
  }
];

export function createSystem1NavigationStructure(): {
  firstRow: NavItem[];
  secondRow: NavItem[];
} {
  // Simple single-row layout for system1
  return {
    firstRow: system1Navigation,
    secondRow: []
  };
}