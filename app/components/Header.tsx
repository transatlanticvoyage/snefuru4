'use client';

import React from "react";
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCustomColors } from '@/app/hooks/useCustomColors';
import { createNavigationStructure } from '@/app/utils/navigationHelper';

interface NavItem {
  name: string;
  path?: string;
  children?: NavItem[];
}

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  
  // Get dynamic base URL
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://snef.me'; // Fallback for SSR
  };
  
  const baseUrl = getBaseUrl();
  
  // kzstylerule - custom header bg color for /admin/ pages
  const isAdminPage = pathname?.startsWith('/admin/');
  // kzstylerule - custom header bg color for /pedbar page
  const isPedbarPage = pathname === '/pedbar';
  // kzstylerule - custom header bg color for /pedtor1 page
  const isPedtorPage = pathname === '/pedtor1';
  // kzstylerule - custom header bg color for /gconjar1 page
  const isGconjarPage = pathname === '/gconjar1';
  // kzstylerule - custom header bg color for /nwjar1 page
  const isNwjarPage = pathname === '/nwjar1';
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [navDropdowns, setNavDropdowns] = useState<{[key: string]: boolean}>({});
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const navDropdownRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Fetch custom colors for headers
  const { colors } = useCustomColors([
    'headerbg_pedbar',
    'headerbg1_pedtor',
    'headerbg1_gconjar1',
    'headerbg1_nwjar1'
  ]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      
      // Don't close dropdown if clicking on a link or inside a link
      const isLinkClick = target.tagName === 'A' || target.closest('a');
      if (isLinkClick) {
        return;
      }
      
      // Close user dropdown
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(target)
      ) {
        setIsUserDropdownOpen(false);
      }
      
      // Close nav dropdowns
      Object.keys(navDropdowns).forEach(key => {
        if (
          navDropdownRefs.current[key] &&
          !navDropdownRefs.current[key]?.contains(target)
        ) {
          setNavDropdowns(prev => ({ ...prev, [key]: false }));
        }
      });
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navDropdowns]);


  useEffect(() => {
    // Fetch navigation items when component mounts
    const fetchNavItems = async () => {
      try {
        console.log('Fetching navigation items...');
        const response = await fetch('/api/navigation');
        console.log('Navigation response:', response);
        const data = await response.json();
        console.log('Navigation data:', data);
        setNavItems(data);
      } catch (error) {
        console.error('Error fetching navigation:', error);
      }
    };

    fetchNavItems();
  }, []);


  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleNavDropdown = (itemName: string) => {
    setNavDropdowns(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // Split navigation items into 2 rows, with break after panjar3
  const splitNavItems = () => {
    const { adminMenuItem, specialFirstItem, oldAllGroupItem, hardcodedNavItems } = createNavigationStructure(navItems);

    // Create the final nav items array with admin first, then special item, then oldallgroup, then hardcoded items
    const finalNavItems = [adminMenuItem, specialFirstItem, oldAllGroupItem, ...hardcodedNavItems];

    const panjar3Index = finalNavItems.findIndex(item => item.name === 'panjar3');
    if (panjar3Index === -1) {
      // If panjar3 not found, split roughly in half
      const midPoint = Math.ceil(finalNavItems.length / 2);
      return {
        firstRow: finalNavItems.slice(0, midPoint),
        secondRow: finalNavItems.slice(midPoint)
      };
    } else {
      // Split after panjar3 (include panjar3 in first row)
      return {
        firstRow: finalNavItems.slice(0, panjar3Index + 1),
        secondRow: finalNavItems.slice(panjar3Index + 1)
      };
    }
  };

  const renderNavItem = (item: NavItem) => {
    if (item.children && item.children.length > 0) {
      // Render dropdown menu for parent items
      return (
        <div
          key={item.name}
          className="relative"
          ref={(el) => { navDropdownRefs.current[item.name] = el; }}
        >
          <button
            onClick={() => toggleNavDropdown(item.name)}
            className="inline-flex items-center px-1 py-1 text-sm font-medium text-gray-900 hover:text-gray-700 focus:outline-none"
          >
            {(item.name === 'admin' || item.name === 'navgroup1') && (
              <svg 
                className="w-4 h-4 mr-1 text-black" 
                style={{ 
                  filter: 'drop-shadow(0 0 1px white) drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)'
                }}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
            {item.name}
            <svg
              className={`ml-1 h-4 w-4 transition-transform ${
                navDropdowns[item.name] ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {navDropdowns[item.name] && (
            <div className={`absolute left-0 mt-1 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50 ${
              item.name === 'navgroup1' ? 'w-auto min-w-96' : 'w-48'
            }`}>
              {item.children.map((child, childIndex) => {
                // Check if this is a separator item (no path)
                if (!child.path && !child.children) {
                  return (
                    <div
                      key={`${item.name}-${child.name}-${childIndex}`}
                      className={`block px-4 py-2 text-sm font-medium bg-black text-white ${
                        item.name === 'navgroup1' ? 'whitespace-nowrap' : ''
                      }`}
                    >
                      {child.name}
                    </div>
                  );
                }
                
                // Check if this child has its own children (sub-dropdown)
                if (child.children && child.children.length > 0) {
                  return (
                    <div
                      key={`${item.name}-${child.name}-${childIndex}`}
                      className="relative group"
                    >
                      <button
                        className={`w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between ${
                          item.name === 'navgroup1' ? 'whitespace-nowrap' : ''
                        }`}
                      >
                        {child.name}
                        <svg
                          className="ml-1 h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      {/* Sub-dropdown menu */}
                      <div className="absolute left-full top-0 ml-1 hidden group-hover:block rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50 w-48">
                        {child.children.map((grandchild, grandchildIndex) => {
                          if (!grandchild.path) {
                            return (
                              <div
                                key={`${child.name}-${grandchild.name}-${grandchildIndex}`}
                                className="block px-4 py-2 text-sm font-medium bg-black text-white"
                              >
                                {grandchild.name}
                              </div>
                            );
                          }
                          
                          return (
                            <Link
                              key={`${child.name}-${grandchild.name}-${grandchildIndex}`}
                              href={grandchild.path}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setNavDropdowns(prev => ({ ...prev, [item.name]: false }))}
                            >
                              {grandchild.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                
                // Regular menu item with link (no children)
                if (child.path) {
                  return (
                    <Link
                      key={`${item.name}-${child.name}-${childIndex}`}
                      href={child.path}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                        item.name === 'navgroup1' ? 'whitespace-nowrap' : ''
                      }`}
                      onClick={() => setNavDropdowns(prev => ({ ...prev, [item.name]: false }))}
                    >
                      {child.name}
                    </Link>
                  );
                }
                
                // Fallback for items without path or children
                return (
                  <span
                    key={`${item.name}-${child.name}-${childIndex}`}
                    className={`block px-4 py-2 text-sm text-gray-500 ${
                      item.name === 'navgroup1' ? 'whitespace-nowrap' : ''
                    }`}
                  >
                    {child.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      );
    } else {
      // Render regular navigation link only if path exists
      if (!item.path) {
        return (
          <span
            key={item.name}
            className="inline-flex items-center px-1 py-1 text-sm font-medium text-gray-500"
          >
            {item.name}
          </span>
        );
      }
      
      return (
        <Link
          key={item.name}
          href={item.path}
          className="inline-flex items-center px-1 py-1 text-sm font-medium text-gray-900 hover:text-gray-700"
        >
          {item.name}
        </Link>
      );
    }
  };

  const { firstRow, secondRow } = splitNavItems();

  return (
    <header 
      className={`shadow ${isAdminPage ? 'admin-header' : ''}`}
      style={{ 
        backgroundColor: isNwjarPage ? (colors['headerbg1_nwjar1'] || '#ffffff') :
                        isGconjarPage ? (colors['headerbg1_gconjar1'] || '#ffffff') :
                        isPedtorPage ? (colors['headerbg1_pedtor'] || '#ffffff') : 
                        isPedbarPage ? (colors['headerbg_pedbar'] || '#ffffff') : 
                        '#ffffff'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20"> {/* Increased height for 2 rows */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                {/* Logo Image */}
                <div className="relative h-10 w-10 flex-shrink-0">
                  <Image
                    src="/assets/images/snefuru-logo.png"
                    alt="Snefuru Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                    priority
                  />
                </div>
                {/* App Name */}
                <span className="text-xl font-bold text-indigo-600">
                  Snefuru4
                </span>
              </Link>
            </div>
            <nav className="ml-6 flex flex-col justify-center space-y-1"> {/* Changed to flex-col with space-y-1 */}
              {/* First row */}
              <div className="flex space-x-8">
                {firstRow.map((item) => renderNavItem(item))}
              </div>
              {/* Second row */}
              {secondRow.length > 0 && (
                <div className="flex space-x-8">
                  {secondRow.map((item) => renderNavItem(item))}
                </div>
              )}
            </nav>
          </div>
          <div className="flex items-center">
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  {user?.email?.[0].toUpperCase() || 'U'}
                </div>
              </button>
              {isUserDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    {user?.email}
                  </div>
                  <Link
                    href="/myhub"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    MyHub Account Settings
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    href="/downloadplugin"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Download Snefuruplin WP Plugin
                  </Link>
                  <Link
                    href="/ruplin-api-keys-p1"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    API Keys - Ruplin WP Plugin
                  </Link>
                  <Link
                    href="/clevnar3"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    API Keys - External
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 