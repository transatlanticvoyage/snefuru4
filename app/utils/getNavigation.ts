import { readdir, stat } from 'fs/promises';
import { join } from 'path';

interface NavItem {
  name: string;
  path: string;
  children?: NavItem[];
}

async function findPages(dir: string, basePath: string = ''): Promise<NavItem[]> {
  console.log('Finding pages in:', dir, 'with base path:', basePath);
  const items = await readdir(dir, { withFileTypes: true });
  console.log('Found items:', items.map(i => i.name));
  const pages: NavItem[] = [];

  for (const item of items) {
    const fullPath = join(dir, item.name);
    const relativePath = join(basePath, item.name);

    if (item.isDirectory()) {
      // Check if this directory has a page.tsx
      try {
        const stats = await stat(join(fullPath, 'page.tsx'));
        if (stats.isFile()) {
          console.log('Found page:', relativePath);
          // This is a page directory
          pages.push({
            name: item.name,
            path: `/${relativePath}`
          });
        }
      } catch (error) {
        // No page.tsx in this directory, check subdirectories
        const subPages = await findPages(fullPath, relativePath);
        if (subPages.length > 0) {
          console.log('Found subpages in:', relativePath, subPages);
          // This directory has pages in its subdirectories
          pages.push({
            name: item.name,
            path: `/${relativePath}`,
            children: subPages
          });
        }
      }
    }
  }

  return pages;
}

export async function getNavigation() {
  const protectedDir = join(process.cwd(), 'app', '(protected)');
  console.log('Getting navigation from:', protectedDir);
  
  try {
    const pages = await findPages(protectedDir);
    console.log('Found all pages:', pages);
    
    // Group pages by their top-level directory
    const groups = new Map<string, NavItem[]>();
    
    for (const page of pages) {
      const parts = page.path.split('/').filter(Boolean);
      const groupName = parts.length > 1 ? parts[0] : 'root';
      console.log('Processing page:', page.path, 'in group:', groupName);
      
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      
      if (parts.length === 1) {
        // This is a root-level page
        groups.get(groupName)?.push(page);
      } else {
        // This is a subdirectory page
        const existingGroup = groups.get(groupName)?.find(g => g.name === parts[0]);
        if (existingGroup) {
          if (!existingGroup.children) {
            existingGroup.children = [];
          }
          existingGroup.children.push({
            name: parts[parts.length - 1],
            path: page.path
          });
        } else {
          groups.get(groupName)?.push({
            name: parts[0],
            path: `/${parts[0]}`,
            children: [{
              name: parts[parts.length - 1],
              path: page.path
            }]
          });
        }
      }
    }

    // Convert groups to final navigation structure
    const navItems: NavItem[] = [];
    for (const [groupName, pages] of groups) {
      navItems.push({
        name: groupName,
        path: `/${groupName}`,
        children: pages
      });
    }

    console.log('Final navigation structure:', navItems);
    return navItems;
  } catch (error) {
    console.error('Error getting navigation:', error);
    return [];
  }
} 