// System 1 Navigation - Minimal navigation for default users

export interface NavItem {
  name: string;
  path?: string;
  children?: NavItem[];
}

export const system1Navigation: NavItem[] = [
  {
    name: 'Voyager Site Table',
    path: '/sitejar4'
  },
  {
    name: 'Andromeda Editor',
    path: '/drom'
  },
  {
    name: 'Image Generation',
    children: [
      {
        name: 'Generate Images (/tebnar2)',
        path: '/bin34/tebnar2'
      },
      {
        name: '__separator__',
        path: undefined
      },
      {
        name: 'Karma Wizard',
        path: '/karmawiz'
      },
      {
        name: 'Karma Jar',
        path: '/karmajar'
      },
      {
        name: 'Narpi Pushes Jar',
        path: '/narpijar'
      }
    ]
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
      },
      {
        name: 'Call Platform Manager',
        path: '/callplatzar'
      }
    ]
  },
  {
    name: 'Market Research',
    children: [
      {
        name: 'City Jar',
        path: '/cityjar'
      },
      {
        name: 'Industry Jar',
        path: '/indusjar'
      },
      {
        name: 'City-Niche-Combo Jar',
        path: '/cnjar1'
      },
      {
        name: 'Keyword Jar',
        path: '/kwjar'
      },
      {
        name: 'Fabric Page',
        path: '/fabric'
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