// Shared navigation logic for both Header and Sidebar components

interface NavItem {
  name: string;
  path?: string;
  children?: NavItem[];
}

// Function to get base URL for external links
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
};

export const createNavigationStructure = (navItems: NavItem[]) => {
  const baseUrl = getBaseUrl();
  
  // Filter out admin pages from regular navigation
  const adminPages: NavItem[] = [];
  const nonAdminItems: NavItem[] = [];
  
  navItems.forEach(item => {
    if (item.path && item.path.includes('/admin/')) {
      adminPages.push(item);
    } else if (item.children) {
      // Check children for admin pages
      const adminChildren = item.children.filter(child => child.path && child.path.includes('/admin/'));
      const nonAdminChildren = item.children.filter(child => !child.path || !child.path.includes('/admin/'));
      
      // Add admin children to adminPages
      adminPages.push(...adminChildren);
      
      // Only add parent item if it has non-admin children
      if (nonAdminChildren.length > 0) {
        nonAdminItems.push({
          ...item,
          children: nonAdminChildren
        });
      }
    } else {
      // This is a direct link item (not admin, no children)
      nonAdminItems.push(item);
    }
  });

  // Create the admin menu item with all admin pages
  const adminMenuItem: NavItem = {
    name: 'admin',
    children: [
      {
        name: 'Drahi Docking Stations',
        path: '/admin/drahiman'
      },
      {
        name: 'Code Range Jar',
        path: '/admin/coderangejar'
      },
      {
        name: 'Jetla Masterlist',
        path: '/admin/jetlamaster'
      },
      {
        name: 'Bensa Masterlist',
        path: '/admin/bensamaster'
      },
      {
        name: 'Azo System',
        path: undefined // No link - separator
      },
      {
        name: 'Obi Page Settings Manager',
        path: '/admin/obi'
      },
      {
        name: 'Bren1 - Cricket Matches',
        path: '/bren1'
      },
      {
        name: 'Azulp SQL Swipes',
        path: '/admin/azulpsql'
      },
      {
        name: 'ColTemp System',
        path: undefined // No link - separator
      },
      {
        name: 'ColTemp Command',
        path: '/admin/coltempcommand'
      },
      {
        name: 'rackjar',
        path: '/admin/rackjar'
      },
      {
        name: 'Style Rocket',
        path: undefined // No link - separator
      },
      {
        name: 'XPages Manager',
        path: `${baseUrl}/admin/xpagesmanager1`
      },
      {
        name: 'UTG Manager',
        path: `${baseUrl}/admin/utg_manager`
      },
      {
        name: 'Zarno Manager',
        path: `${baseUrl}/admin/zarnomanager`
      },
      {
        name: 'Ketch Manager',
        path: '/admin/ketch_manager'
      },
      {
        name: 'Column Robot',
        path: `${baseUrl}/admin/columnrobot`
      },
      {
        name: 'Bakli Mockups',
        path: `${baseUrl}/admin/baklijar`
      },
      {
        name: 'Jexplanations',
        path: '/admin/jexplain'
      },
      {
        name: 'RSTOR Manager',
        path: `${baseUrl}/admin/rstormanager`
      },
      {
        name: 'End Of Style Rocket',
        path: undefined // No link - separator
      },
      {
        name: 'API Key Slots Management',
        path: `${baseUrl}/admin/create-new-api-key-slots`
      },
      {
        name: 'User Management',
        path: '/admin/usersp1'
      },
      {
        name: 'Popup Development',
        path: '/admin/popnow'
      },
      {
        name: 'Download Plugin',
        path: '/downloadplugin'
      },
      ...adminPages.filter(page => 
        !page.path?.includes('/admin/ketch_manager') &&
        !page.path?.includes('/admin/columnrobot') &&
        !page.path?.includes('/admin/baklijar') &&
        !page.path?.includes('/admin/xpagesmanager1') &&
        !page.path?.includes('/admin/rstormanager') &&
        !page.path?.includes('/admin/utg_manager') &&
        !page.path?.includes('/admin/obi')
      ) // Add any other admin pages found in navigation, excluding duplicates
    ]
  };

  // Create the special first item that always comes first
  const specialFirstItem: NavItem = {
    name: 'navgroup1',
    children: [
      {
        name: '/tebnar2 - Generate Images In A Batch',
        path: `${baseUrl}/bin34/tebnar2`
      },
      {
        name: '/nwjar1 - T.NWPI_CONTENT - UTG',
        path: '/nwjar1'
      },
      {
        name: '/nwivid - t.nwpi_content - item',
        path: '/nwivid'
      },
      {
        name: '/sitejar4 - T.SITESPREN - UTG',
        path: '/sitejar4'
      },
      {
        name: '/gconjar1 - T.GCON_PIECES - UTG',
        path: '/gconjar1'
      },
      {
        name: '/pedbar - t.gcon_pieces - item',
        path: '/pedbar'
      },
      {
        name: '/pedtor - t.gcon_pieces - item',
        path: '/pedtor'
      },
      {
        name: '/flatx1 - JSON Flattener (Elementor) - t.gcon_pieces - item',
        path: '/flatx1'
      },
      {
        name: '/slotx1 - Slot View (Elementor) - t.gcon_pieces - item',
        path: '/slotx1'
      },
      {
        name: '/fanex1 - Prex System Tools (Elementor) - t.gcon_pieces - item',
        path: '/fanex1'
      },
      {
        name: '/karfi1 - Karfi Arrangements - Arrange narpi_pushes.kareench1 into elementor data',
        path: `${baseUrl}/karfi1`
      },
      {
        name: '/narpo1 - Narpi Image Pushes',
        path: '/narpo1'
      }
    ]
  };

  // Create the new oldallgroup dropdown containing all nonAdminItems
  const oldAllGroupItem: NavItem = {
    name: 'oldallgroup',
    children: nonAdminItems
  };

  // Create the pluto jetstream menu item
  const plutoJetstreamItem: NavItem = {
    name: 'pluto jetstream',
    children: [
      {
        name: 'sunjar',
        path: '/admin/sunjar'
      },
      {
        name: 'moonjar',
        path: '/admin/moonjar'
      },
      {
        name: '---separator2---',
        path: undefined // No link - separator
      },
      {
        name: 'rackjar',
        path: '/admin/rackjar'
      },
      {
        name: '---separator4---',
        path: undefined // No link - separator
      },
      {
        name: 'yegjar',
        path: '/admin/yegjar'
      },
      {
        name: 'zugjar',
        path: '/admin/zugjar'
      },
      {
        name: '---separator3---',
        path: undefined // No link - separator
      },
      {
        name: 'cfdefjar',
        path: '/cfdefjar'
      },
      {
        name: 'cfvaljar',
        path: '/cfvaljar'
      },
      {
        name: '---separator---',
        path: undefined // No link - separator
      },
      {
        name: 'favaconfignow',
        path: '/admin/favaconfignow'
      }
    ]
  };

  // Create hardcoded navigation items
  const hardcodedNavItems: NavItem[] = [
    { name: 'torna3', path: '/torna3' },
    { name: 'bren1', path: '/bren1' },
    { name: 'sitejar4', path: '/sitejar4' },
    { name: 'gconjar1', path: '/gconjar1' },
    { name: 'nwjar1', path: '/nwjar1' }
  ];

  // Debug logging
  console.log('adminMenuItem children:', adminMenuItem.children?.map(c => c.name) || []);
  console.log('specialFirstItem children:', specialFirstItem.children?.map(c => c.name) || []);
  console.log('oldAllGroupItem children:', oldAllGroupItem.children?.map(c => c.name) || []);
  console.log('plutoJetstreamItem children:', plutoJetstreamItem.children?.map(c => c.name) || []);

  return {
    adminMenuItem,
    specialFirstItem,
    oldAllGroupItem,
    plutoJetstreamItem,
    hardcodedNavItems
  };
};