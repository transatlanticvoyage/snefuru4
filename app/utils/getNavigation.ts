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
  try {
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
  } catch (e) {
    // Skip directories that don't exist or can't be read
    console.log(`Skipping directory ${dir}:`, e instanceof Error ? e.message : 'Unknown error');
  }
  return results;
}

export async function getNavigation() {
  const appDir = join(process.cwd(), 'app');
  const protectedDir = join(appDir, '(protected)');
  
  let pageFiles: string[] = [];
  
  // Scan protected directory
  try {
    const protectedPages = await findAllPages(protectedDir);
    pageFiles = pageFiles.concat(protectedPages);
  } catch (e) {
    console.error('Error reading protectedDir:', e);
  }
  
  // Scan bin directories (bin4, bin31, bin32, etc.)
  try {
    const appItems = await readdir(appDir, { withFileTypes: true });
    for (const item of appItems) {
      if (item.isDirectory() && item.name.match(/^bin\d+$/)) {
        const binDir = join(appDir, item.name);
        const binPages = await findAllPages(binDir);
        pageFiles = pageFiles.concat(binPages);
      }
    }
  } catch (e) {
    console.error('Error scanning bin directories:', e);
  }

  // Build flat nav structure - extract page names from all directories
  const navItems: NavItem[] = [];
  for (const file of pageFiles) {
    const rel = relative(appDir, file);
    const parts = rel.split(sep);
    let pageName = '';
    let pagePath = '';
    
    if (parts[0] === '(protected)') {
      // Handle protected routes: (protected)/bin31/panjar4/page.tsx
      if (parts.length === 3) {
        // e.g. ['(protected)', 'profile', 'page.tsx']
        pageName = parts[1];
        pagePath = `/${parts[1]}`;
      } else if (parts.length > 3) {
        // e.g. ['(protected)', 'bin31', 'panjar4', 'page.tsx']
        pageName = parts[parts.length - 2]; // Get the page name (e.g., 'panjar4')
        pagePath = `/${parts.slice(1, -1).join('/')}`; // Full path without (protected) and page.tsx
      }
    } else if (parts[0].match(/^bin\d+$/)) {
      // Handle bin routes: bin45/weplich1/page.tsx
      if (parts.length === 3) {
        // e.g. ['bin45', 'weplich1', 'page.tsx']
        pageName = parts[1]; // Get the page name (e.g., 'weplich1')
        pagePath = `/${parts.slice(0, -1).join('/')}`; // Full path without page.tsx
      }
    }
    
    if (pageName) {
      navItems.push({ name: pageName, path: pagePath });
    }
  }

  // Sort alphabetically by name
  return navItems.sort((a, b) => a.name.localeCompare(b.name));
} 