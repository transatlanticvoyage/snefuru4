import { readdir } from 'fs/promises';
import { join } from 'path';

interface NavItem {
  name: string;
  path: string;
  children?: NavItem[];
}

export async function getNavigation() {
  const protectedDir = join(process.cwd(), 'app', '(protected)');
  const navItems: NavItem[] = [];

  try {
    // Read the protected directory
    const items = await readdir(protectedDir, { withFileTypes: true });
    
    // Group by parent directory
    const groups = new Map<string, NavItem[]>();

    for (const item of items) {
      if (item.isDirectory()) {
        const fullPath = join(protectedDir, item.name);
        const subItems = await readdir(fullPath, { withFileTypes: true });
        
        const pages = subItems
          .filter(subItem => subItem.isDirectory())
          .map(subItem => ({
            name: subItem.name,
            path: `/${item.name}/${subItem.name}`
          }));

        if (pages.length > 0) {
          groups.set(item.name, pages);
        }
      }
    }

    // Convert groups to navigation structure
    for (const [groupName, pages] of groups) {
      navItems.push({
        name: groupName,
        path: `/${groupName}`,
        children: pages
      });
    }

    return navItems;
  } catch (error) {
    console.error('Error getting navigation:', error);
    return [];
  }
} 