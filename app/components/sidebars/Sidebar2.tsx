'use client';

// Updated sidebar with dark mode WP-admin styling and full navigation
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getSystem2Navigation } from '@/app/config/navigation/system2Navigation';
import AvatarDisplay from '@/app/components/profile/AvatarDisplay';
import LayoutSystemSwitcher from '@/app/components/layout-systems/LayoutSystemSwitcher';
import HeaderVisibilityToggle from '@/app/components/layout-systems/HeaderVisibilityToggle';
import { BezelButton } from '@/app/components/bezel-visibility-system';

interface SidebarMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  showToggleButton?: boolean; // Optional prop to hide the default toggle button
  onHeaderVisibilityChange: (visible: boolean) => void;
}

interface UserSettings {
  avatar_url?: string | null;
}

interface NavItem {
  name: string;
  path?: string;
  children?: NavItem[];
}

export default function Sidebar2({ isOpen, onToggle, showToggleButton = true, onHeaderVisibilityChange }: SidebarMenuProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [shouldShow, setShouldShow] = useState(false);
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const supabase = createClientComponentClient();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Navigation structure will be created from the shared utility
  const [navigationStructure, setNavigationStructure] = useState<{
    adminMenuItem: NavItem;
    specialFirstItem: NavItem;
    oldAllGroupItem: NavItem;
    hardcodedNavItems: NavItem[];
  } | null>(null);

  useEffect(() => {
    const checkSidebarSetting = async () => {
      if (!user?.id) {
        setShouldShow(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('sidebar_menu_active')
          .eq('auth_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching sidebar setting:', error);
          setShouldShow(false);
          return;
        }

        setShouldShow(data?.sidebar_menu_active || false);
      } catch (err) {
        console.error('Error:', err);
        setShouldShow(false);
      }
    };

    checkSidebarSetting();
  }, [user, supabase]);

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user?.id) {
        setUserSettings(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('auth_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user avatar:', error);
          setUserSettings(null);
          return;
        }

        setUserSettings(data);
      } catch (err) {
        console.error('Error:', err);
        setUserSettings(null);
      }
    };

    fetchUserSettings();
  }, [user, supabase]);

  useEffect(() => {
    // Load system2 navigation
    const loadNavigation = async () => {
      try {
        const data = await getSystem2Navigation();
        setNavItems(data);
        
        // Create navigation structure using shared utility
        const { createNavigationStructure } = require('@/app/utils/navigationHelper');
        const navStructure = createNavigationStructure(data);
        setNavigationStructure(navStructure);
      } catch (error) {
        console.error('Error loading system2 navigation:', error);
      }
    };

    loadNavigation();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      
      // Don't close dropdown if clicking on a link or inside a link
      const isLinkClick = target.tagName === 'A' || target.closest('a');
      if (isLinkClick) {
        return;
      }
      
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const renderNavItem = (item: NavItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.name];
    const isStarred = item.name === 'admin' || item.name === 'navgroup1';
    
    
    
    // Handle separator items (no path)
    if (hasChildren && item.children?.some(child => !child.path)) {
      // This is a dropdown with separator items
    } else if (!item.path && hasChildren) {
      // This is a separator item itself
      return (
        <div key={item.name} className="px-4 py-1">
          <div className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
            {item.name}
          </div>
        </div>
      );
    }

    if (hasChildren) {
      return (
        <div key={item.name} className="mb-1">
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-800 transition-colors ${
              depth > 0 ? 'pl-8' : ''
            }`}
          >
            <span className="flex items-center">
              {isStarred && (
                <svg 
                  className="w-4 h-4 mr-2 text-yellow-400" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              <span className="text-gray-200">{item.name}</span>
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isExpanded && (
            <div className="bg-gray-900">
              {item.children?.map(child => {
                // Handle separator items in dropdown
                if (!child.path) {
                  return (
                    <div key={child.name} className="px-8 py-1">
                      <div className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                        {child.name}
                      </div>
                    </div>
                  );
                }
                return renderNavItem(child, depth + 1);
              })}
            </div>
          )}
        </div>
      );
    }

    
    // Only render Link if path exists
    if (!item.path) {
      return (
        <div key={item.name} className="px-4 py-2 text-sm text-gray-400">
          {item.name} (no path)
        </div>
      );
    }
    
    return (
      <Link
        key={item.path}
        href={item.path}
        className={`block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition-colors ${
          depth > 0 ? 'pl-8 text-gray-300' : ''
        }`}
        onClick={onToggle}
      >
        {item.name}
      </Link>
    );
  };

  // Organize all navigation items
  const getAllNavItems = () => {
    if (!navigationStructure) return [];
    
    const items = [
      navigationStructure.adminMenuItem, 
      navigationStructure.specialFirstItem, 
      navigationStructure.oldAllGroupItem,
      ...navigationStructure.hardcodedNavItems
    ];
    
    return items;
  };

  // Always show sidebar when using layout system provider
  // if (!shouldShow) {
  //   return null;
  // }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 z-30 h-full w-64 bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{
        backgroundColor: '#23282d', // WP-admin dark color
      }}>
        {/* Header with Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative h-8 w-8 flex-shrink-0">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="#87CEEB"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">
              Tregnar
            </span>
          </Link>
          <button
            onClick={onToggle}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Header Visibility Toggle */}
        <HeaderVisibilityToggle onToggle={onHeaderVisibilityChange} />

        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center w-full text-left hover:bg-gray-800 p-2 rounded transition-colors"
            >
              <div className="mr-3">
                <AvatarDisplay 
                  avatarUrl={userSettings?.avatar_url}
                  email={user?.email}
                  size="sm"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{user?.email}</p>
                <p className="text-xs text-gray-400">Logged in</p>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isUserMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-md shadow-lg py-1 z-50">
                <Link
                  href="/myhub"
                  className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onToggle();
                  }}
                >
                  MyHub Account Settings
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onToggle();
                  }}
                >
                  Profile Settings
                </Link>
                <Link
                  href="/downloadplugin"
                  className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onToggle();
                  }}
                >
                  Download Snefuruplin WP Plugin
                </Link>
                <Link
                  href="/ruplin-api-keys-p1"
                  className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onToggle();
                  }}
                >
                  API Keys - Ruplin WP Plugin
                </Link>
                <Link
                  href="/clevnar3"
                  className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onToggle();
                  }}
                >
                  API Keys - External
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsUserMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1">
            {getAllNavItems().map(item => renderNavItem(item))}
          </nav>
        </div>

        {/* Layout System Switcher */}
        <LayoutSystemSwitcher />

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center text-xs text-gray-400">
            <svg 
              className="w-3 h-3 mr-1 text-yellow-400" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Full Navigation Menu - Admin System
          </div>
        </div>
      </div>

      {/* Toggle Button - only show if showToggleButton is true */}
      {showToggleButton && (
        <button
          onClick={onToggle}
          className="fixed z-40 p-2 rounded-md shadow-lg border border-gray-600 hover:bg-gray-700 transition-colors"
          style={{ top: '1px', left: '1px', backgroundColor: '#cecece' }}
          title="Toggle Navigation Menu"
        >
          <svg className="h-5 w-5 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Bezel Button - always visible below hamburger */}
      <BezelButton showButton={true} />
    </>
  );
}