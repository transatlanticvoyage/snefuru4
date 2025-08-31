// System 1 Navigation - Minimal navigation for default users

export interface NavItem {
  name: string;
  path?: string;
  children?: NavItem[];
}

export const system1Navigation: NavItem[] = [
  {
    name: 'Home',
    path: '/home'
  },
  {
    name: 'Profile',
    path: '/profile'
  },
  {
    name: 'MyHub',
    path: '/myhub'
  },
  {
    name: 'Tools',
    children: [
      {
        name: 'Download Plugin',
        path: '/downloadplugin'
      },
      {
        name: 'API Keys',
        path: '/ruplin-api-keys-p1'
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