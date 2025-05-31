import fs from 'fs';
import path from 'path';

interface NavItem {
  name: string;
  path: string;
  children?: NavItem[];
}

export async function getNavigation() {
  const protectedDir = path.join(process.cwd(), 'app', '(protected)');
  const navItems: NavItem[] = [];

  // Read the protected directory
  const items = fs.readdirSync(protectedDir);

  // Group by parent directory (fbin2, fbin3, etc.)
  const groups = new Map<string, NavItem[]>();

  for (const item of items) {
    const fullPath = path.join(protectedDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Check if it's a page directory (contains page.tsx)
      const hasPage = fs.existsSync(path.join(fullPath, 'page.tsx'));
      
      if (hasPage) {
        // Get the parent directory name (e.g., 'fbin2' from '/fbin2/gambar1')
        const parentDir = item.split('/')[0];
        
        if (!groups.has(parentDir)) {
          groups.set(parentDir, []);
        }

        groups.get(parentDir)?.push({
          name: item,
          path: `/${item}`
        });
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
} 