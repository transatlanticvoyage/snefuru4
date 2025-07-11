'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AzNavigationToggle from './AzNavigationToggle';

interface NavigationItem {
  name: string;
  path?: string;
  children?: NavigationItem[];
}

export default function AzNavigation() {
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    // Load visibility state from localStorage
    const savedVisibility = localStorage.getItem('az-nav-visible');
    if (savedVisibility !== null) {
      setIsVisible(JSON.parse(savedVisibility));
    }

    // Fetch navigation data from existing API
    fetchNavigation();
  }, []);

  const fetchNavigation = async () => {
    try {
      const response = await fetch('/api/navigation');
      if (response.ok) {
        const data = await response.json();
        setNavigationItems(data.navigation || []);
      }
    } catch (error) {
      console.error('Failed to fetch navigation:', error);
    }
  };

  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    localStorage.setItem('az-nav-visible', JSON.stringify(newVisibility));
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

  const renderNavItem = (item: NavigationItem, isHeader = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.name);

    if (isHeader && hasChildren) {
      // Header dropdown
      return (
        <div key={item.name} className="az-nav-dropdown">
          <button 
            className="az-nav-dropdown-toggle"
            onClick={() => toggleExpanded(item.name)}
          >
            {item.name} {isExpanded ? '▼' : '▶'}
          </button>
          {isExpanded && (
            <div className="az-nav-dropdown-menu">
              {item.children!.map(child => (
                <a
                  key={child.name}
                  className="az-nav-dropdown-item"
                  onClick={() => child.path && handleNavigation(child.path)}
                >
                  {child.name}
                </a>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Sidebar item
    return (
      <li key={item.name} className="az-nav-sidebar-item">
        {hasChildren ? (
          <>
            <button
              className="az-nav-sidebar-toggle"
              onClick={() => toggleExpanded(item.name)}
            >
              {item.name} {isExpanded ? '▼' : '▶'}
            </button>
            {isExpanded && (
              <ul className="az-nav-sidebar-submenu">
                {item.children!.map(child => (
                  <li key={child.name}>
                    <a
                      className="az-nav-sidebar-link"
                      onClick={() => child.path && handleNavigation(child.path)}
                    >
                      {child.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <a
            className="az-nav-sidebar-link"
            onClick={() => item.path && handleNavigation(item.path)}
          >
            {item.name}
          </a>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Toggle Button */}
      <AzNavigationToggle isVisible={isVisible} onToggle={toggleVisibility} />

      {/* Navigation Container */}
      {isVisible && (
        <div className="az-nav-container">
          {/* Header */}
          <header className="az-nav-header">
            <div className="az-nav-header-content">
              <h1 className="az-nav-title">Azulp1</h1>
              <nav className="az-nav-header-menu">
                {navigationItems.map(item => renderNavItem(item, true))}
              </nav>
            </div>
          </header>

          {/* Sidebar */}
          <aside className="az-nav-sidebar">
            <nav>
              <ul className="az-nav-sidebar-menu">
                {navigationItems.map(item => renderNavItem(item, false))}
              </ul>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}