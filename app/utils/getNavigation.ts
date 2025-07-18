import { readdir, stat } from 'fs/promises';
import { join, relative, sep } from 'path';

interface NavItem {
  name: string;
  path?: string;
  children?: NavItem[];
}

// Custom rule system for navigation grouping
const NAVIGATION_GROUPS = {
  navgroup5: {
    name: 'c',
    displayName: 'c', // Parent item for "c" dropdown
    children: [
      { name: 'fapikeys1', path: '/fapikeys1' }
    ]
  },
  navgroup6: {
    name: 'navgroup6',
    displayName: 'navgroup6', // You can customize this display name
    children: [
      { name: 'panjar1', path: '/fbin2/panjar1' },
      { name: 'panjar1', path: '/panjar1' },
      { name: 'panjar2', path: '/fbin2/panjar2' },
      { name: 'panjar3', path: '/bin4/panjar3' },
      { name: 'panjar3', path: '/panjar3' },
      { name: 'panjar4', path: '/bin31/panjar4' },
      { name: 'profile', path: '/profile' },
      { name: 'pubnar1', path: '/bin37/pubnar1' }
    ]
  }
};

// Get list of paths that should be excluded from main navigation
function getExcludedPaths(): string[] {
  const excludedPaths: string[] = [];
  Object.values(NAVIGATION_GROUPS).forEach(group => {
    group.children.forEach(child => {
      excludedPaths.push(child.path);
    });
  });
  return excludedPaths;
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

  // Also scan fbin directories (fbin2, fbin3, etc.)
  try {
    const appItems = await readdir(appDir, { withFileTypes: true });
    for (const item of appItems) {
      if (item.isDirectory() && item.name.match(/^fbin\d+$/)) {
        const fbinDir = join(appDir, item.name);
        const fbinPages = await findAllPages(fbinDir);
        pageFiles = pageFiles.concat(fbinPages);
      }
    }
  } catch (e) {
    console.error('Error scanning fbin directories:', e);
  }

  // Get excluded paths for filtering
  const excludedPaths = getExcludedPaths();

  // Build navigation structure - extract page names from all directories
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
    } else if (parts[0].match(/^fbin\d+$/)) {
      // Handle fbin routes: fbin2/fapikeys1/page.tsx
      if (parts.length === 3) {
        // e.g. ['fbin2', 'fapikeys1', 'page.tsx']
        pageName = parts[1]; // Get the page name (e.g., 'fapikeys1')
        pagePath = `/${parts.slice(0, -1).join('/')}`; // Full path without page.tsx
      }
    } else if (parts.length === 2) {
      // Handle root level routes: profile/page.tsx
      pageName = parts[0]; // Get the page name (e.g., 'profile')
      pagePath = `/${parts[0]}`; // Simple root path
    }
    
    // Filter out dynamic routes (paths containing brackets like [id])
    const isDynamicRoute = pagePath.includes('[') && pagePath.includes(']');
    
    // Only add to main navigation if not excluded, has valid name/path, and is not dynamic
    if (pageName && pagePath && !excludedPaths.includes(pagePath) && !isDynamicRoute) {
      navItems.push({ name: pageName, path: pagePath });
    }
  }

  // Add navigation groups as parent items with children
  Object.values(NAVIGATION_GROUPS).forEach(group => {
    navItems.push({
      name: group.name,
      children: group.children
        .filter(child => !(child.path.includes('[') && child.path.includes(']'))) // Filter out dynamic routes
        .map(child => ({
          name: child.name,
          path: child.path
        }))
    });
  });

  // Group remaining items by their first letter
  const alphabeticalGroups: { [key: string]: NavItem[] } = {};
  const finalNavItems: NavItem[] = [];
  
  // Separate navigation groups from regular items
  const navigationGroups: NavItem[] = [];
  const regularItems: NavItem[] = [];
  
  navItems.forEach(item => {
    if (item.children && item.children.length > 0) {
      navigationGroups.push(item);
    } else {
      regularItems.push(item);
    }
  });

  // Group regular items by first letter
  regularItems.forEach(item => {
    const firstLetter = item.name.charAt(0).toLowerCase();
    if (!alphabeticalGroups[firstLetter]) {
      alphabeticalGroups[firstLetter] = [];
    }
    alphabeticalGroups[firstLetter].push(item);
  });

  // Create parent items for each letter that has items
  Object.keys(alphabeticalGroups).sort().forEach(letter => {
    const items = alphabeticalGroups[letter];
    if (items.length === 1) {
      // If only one item, add it directly without grouping
      finalNavItems.push(items[0]);
    } else {
      // Create a parent group for this letter
      finalNavItems.push({
        name: letter.toUpperCase(),
        children: items.sort((a, b) => a.name.localeCompare(b.name))
      });
    }
  });

  // Add existing navigation groups
  finalNavItems.push(...navigationGroups);

  // Sort alphabetically by name (parent items will be mixed with regular items)
  return finalNavItems.sort((a, b) => a.name.localeCompare(b.name));
} 