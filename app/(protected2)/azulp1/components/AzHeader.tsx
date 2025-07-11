'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Header Styles
const headerStyles = `
  .az-header-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%);
    border-bottom: 2px solid #1d4ed8;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 1000;
    padding: 0 20px 0 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .az-header-brand {
    color: #ffffff;
    font-size: 20px;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    margin: 0;
    letter-spacing: 0.5px;
  }

  .az-header-nav {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 100%;
  }

  .az-nav-item {
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
  }

  .az-nav-link {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 16px;
    color: #e0e7ff;
    text-decoration: none;
    font-weight: 500;
    font-size: 14px;
    border-radius: 0;
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
    background: none;
    white-space: nowrap;
  }

  .az-nav-link:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    transform: translateY(-1px);
  }

  .az-nav-dropdown {
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
  }

  .az-nav-dropdown-btn {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 16px;
    color: #e0e7ff;
    text-decoration: none;
    font-weight: 500;
    font-size: 14px;
    border: none;
    background: none;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .az-nav-dropdown-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    transform: translateY(-1px);
  }

  .az-nav-dropdown.active .az-nav-dropdown-btn {
    background-color: rgba(255, 255, 255, 0.15);
    color: #ffffff;
  }

  .az-dropdown-arrow {
    margin-left: 6px;
    font-size: 10px;
    transition: transform 0.2s ease;
  }

  .az-nav-dropdown.active .az-dropdown-arrow {
    transform: rotate(180deg);
  }

  .az-dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 220px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    z-index: 1001;
    overflow: hidden;
    margin-top: 2px;
  }

  .az-dropdown-item {
    display: block;
    padding: 12px 16px;
    color: #374151;
    text-decoration: none;
    font-size: 14px;
    font-weight: 400;
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }

  .az-dropdown-item:last-child {
    border-bottom: none;
  }

  .az-dropdown-item:hover {
    background-color: #f8fafc;
    color: #1e40af;
    padding-left: 20px;
  }

  .az-admin-item {
    background-color: #fef3c7;
    border-bottom: 1px solid #fbbf24;
  }

  .az-admin-item:hover {
    background-color: #fde68a;
    color: #92400e;
  }

  .az-dropdown-separator {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    margin: 4px 0;
  }

  .az-separator-line {
    flex: 1;
    height: 1px;
    background-color: #e2e8f0;
  }

  .az-separator-text {
    margin: 0 12px;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  @media (max-width: 768px) {
    .az-header-nav {
      gap: 2px;
    }
    
    .az-nav-link, .az-nav-dropdown-btn {
      padding: 0 12px;
      font-size: 13px;
    }
    
    .az-dropdown-menu {
      min-width: 200px;
    }
  }
`;

interface NavigationItem {
  name: string;
  path?: string;
  children?: NavigationItem[];
}

export default function AzHeader() {
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    // Inject styles
    const styleElement = document.createElement('style');
    styleElement.textContent = headerStyles;
    document.head.appendChild(styleElement);

    // Load visibility state from localStorage
    const savedVisibility = localStorage.getItem('az-nav-visible');
    if (savedVisibility !== null) {
      setIsVisible(JSON.parse(savedVisibility));
    }

    // Listen for visibility changes from toggle
    const handleStorageChange = () => {
      const visibility = localStorage.getItem('az-nav-visible');
      if (visibility !== null) {
        setIsVisible(JSON.parse(visibility));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('az-nav-toggle', handleStorageChange);

    // Fetch navigation data
    fetchNavigation();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('az-nav-toggle', handleStorageChange);
      // Clean up styles
      document.head.removeChild(styleElement);
    };
  }, []);

  const fetchNavigation = async () => {
    try {
      const response = await fetch('/api/navigation');
      if (response.ok) {
        const rawNavData = await response.json();
        
        // Import and use navigationHelper to create proper structure
        const { createNavigationStructure } = await import('@/app/utils/navigationHelper');
        const { adminMenuItem, specialFirstItem, nonAdminItems } = createNavigationStructure(rawNavData);
        
        // Combine into final navigation structure (same as main app)
        const finalNavigation = [adminMenuItem, specialFirstItem, ...nonAdminItems];
        
        setNavigationItems(finalNavigation);
        console.log('AzHeader: Navigation loaded with admin/navgroup1:', finalNavigation.length, 'items');
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

  const isAdminItem = (itemName: string) => {
    return itemName.toLowerCase().includes('admin') || 
           itemName.toLowerCase().includes('azo') ||
           itemName.toLowerCase().includes('utg') ||
           itemName.toLowerCase().includes('manager') ||
           itemName.toLowerCase().includes('style rocket') ||
           itemName.toLowerCase().includes('api key') ||
           itemName.toLowerCase().includes('user management');
  };

  const renderSeparator = (itemName: string) => {
    // Render separators (items with no path) as dividers
    return (
      <div key={itemName} className="az-dropdown-separator">
        <div className="az-separator-line"></div>
        <span className="az-separator-text">{itemName}</span>
        <div className="az-separator-line"></div>
      </div>
    );
  };

  const renderNavItem = (item: NavigationItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.name);

    if (!hasChildren) {
      return (
        <div key={item.name} className="az-nav-item">
          <a
            className="az-nav-link"
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
        </div>
      );
    }

    return (
      <div key={item.name} className={`az-nav-dropdown ${isExpanded ? 'active' : ''}`}>
        <button 
          className="az-nav-dropdown-btn"
          onClick={() => toggleExpanded(item.name)}
        >
          {item.name}
          <span className="az-dropdown-arrow">▼</span>
        </button>
        {isExpanded && (
          <div className="az-dropdown-menu">
            {item.children!.map(child => 
              child.path ? (
                <a
                  key={child.name}
                  className={`az-dropdown-item ${isAdminItem(child.name) ? 'az-admin-item' : ''}`}
                  href={child.path}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey || e.button === 1) {
                      // Let browser handle Ctrl+click, Cmd+click, or middle-click naturally
                      return;
                    }
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleNavigation(child.path);
                    }
                  }}
                >
                  {child.name}
                </a>
              ) : (
                renderSeparator(child.name)
              )
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <header className="az-header-container">
      <h1 className="az-header-brand">Snefuru - Azulp1</h1>
      <nav className="az-header-nav">
        {navigationItems.map(item => renderNavItem(item))}
      </nav>
    </header>
  );
}