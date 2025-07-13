'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationItem {
  name: string;
  path?: string;
  children?: NavigationItem[];
}

export default function FavaSidebar() {
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    // Load visibility state from localStorage
    const savedVisibility = localStorage.getItem('fava-sidebar-visible');
    if (savedVisibility !== null) {
      setIsVisible(JSON.parse(savedVisibility));
    }

    // Listen for visibility changes from toggle
    const handleStorageChange = () => {
      const visibility = localStorage.getItem('fava-sidebar-visible');
      if (visibility !== null) {
        setIsVisible(JSON.parse(visibility));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-page toggle updates
    window.addEventListener('fava-sidebar-toggle', handleStorageChange);

    // Fetch navigation data
    fetchNavigation();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('fava-sidebar-toggle', handleStorageChange);
    };
  }, []);

  const fetchNavigation = async () => {
    try {
      const response = await fetch('/api/navigation');
      if (response.ok) {
        const rawNavData = await response.json();
        
        // Import and use navigationHelper to create proper structure
        const { createNavigationStructure } = await import('@/app/utils/navigationHelper');
        const { adminMenuItem, specialFirstItem, oldAllGroupItem } = createNavigationStructure(rawNavData);
        
        // Combine into final navigation structure (same as main app)
        const finalNavigation = [adminMenuItem, specialFirstItem, oldAllGroupItem];
        
        setNavigationItems(finalNavigation);
        console.log('FavaSidebar: Navigation loaded with admin/navgroup1:', finalNavigation.length, 'items');
      }
    } catch (error) {
      console.error('Failed to fetch navigation:', error);
    }
  };

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const renderNavItem = (item: NavigationItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.name);

    return (
      <li key={item.name} className="fava-nav-sidebar-item">
        {hasChildren ? (
          <>
            <button
              className="fava-nav-sidebar-toggle"
              onClick={() => toggleExpanded(item.name)}
            >
              {item.name} {isExpanded ? '▼' : '▶'}
            </button>
            {isExpanded && (
              <ul className="fava-nav-sidebar-submenu">
                {item.children!.map(child => (
                  <li key={child.name}>
                    {child.path ? (
                      <a
                        className="fava-nav-sidebar-link"
                        href={child.path}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey || e.button === 1) {
                            // Let browser handle Ctrl+click, Cmd+click, or middle-click naturally
                            return;
                          }
                          if (!e.shiftKey) {
                            e.preventDefault();
                            if (child.path) {
                              handleNavigation(child.path);
                            }
                          }
                        }}
                      >
                        {child.name}
                      </a>
                    ) : (
                      <div className="fava-nav-sidebar-separator">
                        {child.name}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <a
            className="fava-nav-sidebar-link"
            href={item.path}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey || e.button === 1) {
                // Let browser handle Ctrl+click, Cmd+click, or middle-click naturally
                return;
              }
              if (!e.shiftKey) {
                e.preventDefault();
                item.path && handleNavigation(item.path);
              }
            }}
          >
            {item.name}
          </a>
        )}
      </li>
    );
  };

  if (!isVisible) return null;

  return (
    <aside className="fava-nav-sidebar">
      <nav>
        <ul className="fava-nav-sidebar-menu">
          {navigationItems.map(item => renderNavItem(item))}
        </ul>
      </nav>
    </aside>
  );
}