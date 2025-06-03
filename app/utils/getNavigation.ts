import { readdir, stat } from 'fs/promises';
import { join, relative, sep } from 'path';

interface NavItem {
  name: string;
  path?: string;
  children?: NavItem[];
}

// Recursively find all page.tsx files under dir
async function findAllPages(dir: string): Promise<string[]> {
  let results: string[] = [];
  const items = await readdir(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.name.startsWith('.') || item.name === 'node_modules') continue;
    const fullPath = join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(await findAllPages(fullPath));
    } else if (item.isFile() && item.name === 'page.tsx') {
      results.push(fullPath);
    }
  }
  return results;
}

export async function getNavigation() {
  const protectedDir = join(process.cwd(), 'app', '(protected)');
  let pageFiles: string[] = [];
  try {
    pageFiles = await findAllPages(protectedDir);
  } catch (e) {
    console.error('Error reading protectedDir:', e);
    return [];
  }

  // Build flat nav structure - just extract the page names directly
  const navItems: NavItem[] = [];
  for (const file of pageFiles) {
    // Get the path after (protected)
    const rel = relative(protectedDir, file);
    const parts = rel.split(sep); // e.g. ['fbin2', 'panjar1', 'page.tsx']
    let pageName = '';
    let pagePath = '';
    
    if (parts.length === 2) {
      // e.g. ['profile', 'page.tsx']
      pageName = parts[0];
      pagePath = `/${parts[0]}`;
    } else if (parts.length > 2) {
      // e.g. ['fbin2', 'panjar1', 'page.tsx'] -> use the last folder name
      pageName = parts[parts.length - 2]; // Get the page name (e.g., 'panjar1')
      pagePath = `/${parts.slice(0, -1).join('/')}`; // Full path without page.tsx
    }
    
    if (pageName) {
      navItems.push({ name: pageName, path: pagePath });
    }
  }

  // Sort alphabetically by name
  return navItems.sort((a, b) => a.name.localeCompare(b.name));
} 