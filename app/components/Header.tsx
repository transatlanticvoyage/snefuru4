'use client';

import React from "react";
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const [pedbarHeaderColor, setPedbarHeaderColor] = useState<string | null>(null);
  const [pedtorHeaderColor, setPedtorHeaderColor] = useState<string | null>(null);
  const [gconjarHeaderColor, setGconjarHeaderColor] = useState<string | null>(null);
  const [nwjarHeaderColor, setNwjarHeaderColor] = useState<string | null>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const navDropdownRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close user dropdown
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
      
      // Close nav dropdowns
      Object.keys(navDropdowns).forEach(key => {
        if (
          navDropdownRefs.current[key] &&
          !navDropdownRefs.current[key]?.contains(event.target as Node)
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

  useEffect(() => {
    // Fetch pedbar header color when on /pedbar page
    const fetchPedbarHeaderColor = async () => {
      if (isPedbarPage) {
        try {
          const { data, error } = await supabase
            .from('custom_colors')
            .select('hex_value')
            .eq('color_code', 'headerbg_pedbar')
            .single();
          
          if (error) {
            console.error('Error fetching pedbar header color:', error);
          } else {
            setPedbarHeaderColor(data?.hex_value || null);
          }
        } catch (error) {
          console.error('Error fetching pedbar header color:', error);
        }
      } else {
        setPedbarHeaderColor(null);
      }
    };

    fetchPedbarHeaderColor();
  }, [isPedbarPage, supabase]);

  useEffect(() => {
    // Fetch pedtor header color when on /pedtor page
    const fetchPedtorHeaderColor = async () => {
      if (isPedtorPage) {
        try {
          const { data, error } = await supabase
            .from('custom_colors')
            .select('hex_value')
            .eq('color_code', 'headerbg1_pedtor')
            .single();
          
          if (error) {
            console.error('Error fetching pedtor header color:', error);
          } else {
            setPedtorHeaderColor(data?.hex_value || null);
          }
        } catch (error) {
          console.error('Error fetching pedtor header color:', error);
        }
      } else {
        setPedtorHeaderColor(null);
      }
    };

    fetchPedtorHeaderColor();
  }, [isPedtorPage, supabase]);

  useEffect(() => {
    // Fetch gconjar1 header color when on /gconjar1 page
    const fetchGconjarHeaderColor = async () => {
      if (isGconjarPage) {
        try {
          const { data, error } = await supabase
            .from('custom_colors')
            .select('hex_value')
            .eq('color_code', 'headerbg1_gconjar1')
            .single();
          
          if (error) {
            console.error('Error fetching gconjar1 header color:', error);
          } else {
            setGconjarHeaderColor(data?.hex_value || null);
          }
        } catch (error) {
          console.error('Error fetching gconjar1 header color:', error);
        }
      } else {
        setGconjarHeaderColor(null);
      }
    };

    fetchGconjarHeaderColor();
  }, [isGconjarPage, supabase]);

  useEffect(() => {
    // Fetch nwjar1 header color when on /nwjar1 page
    const fetchNwjarHeaderColor = async () => {
      if (isNwjarPage) {
        try {
          const { data, error } = await supabase
            .from('custom_colors')
            .select('hex_value')
            .eq('color_code', 'headerbg1_nwjar1')
            .single();
          
          if (error) {
            console.error('Error fetching nwjar1 header color:', error);
          } else {
            setNwjarHeaderColor(data?.hex_value || null);
          }
        } catch (error) {
          console.error('Error fetching nwjar1 header color:', error);
        }
      } else {
        setNwjarHeaderColor(null);
      }
    };

    fetchNwjarHeaderColor();
  }, [isNwjarPage, supabase]);

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
    // Filter out admin pages from regular navigation
    const adminPages: NavItem[] = [];
    const nonAdminItems: NavItem[] = [];
    
    navItems.forEach(item => {
      if (item.path && item.path.includes('/admin/')) {
        adminPages.push(item);
      } else if (item.children) {
        // Check children for admin pages
        const adminChildren = item.children.filter(child => child.path && child.path.includes('/admin/'));
        const nonAdminChildren = item.children.filter(child => !child.path || !child.path.includes('/admin/'));
        
        // Add admin children to adminPages
        adminPages.push(...adminChildren);
        
        // Only add parent item if it has non-admin children
        if (nonAdminChildren.length > 0) {
          nonAdminItems.push({
            ...item,
            children: nonAdminChildren
          });
        }
      } else {
        nonAdminItems.push(item);
      }
    });

    // Create the admin menu item with all admin pages
    const adminMenuItem: NavItem = {
      name: 'admin',
      children: [
        {
          name: 'API Key Slots Management',
          path: 'https://snef.me/admin/create-new-api-key-slots?coltemp=option1'
        },
        {
          name: 'Custom Color Management',
          path: 'https://snef.me/admin/colors1'
        },
        {
          name: 'Download Plugin',
          path: '/admin/downloadplugin'
        },
        ...adminPages // Add any other admin pages found in navigation
      ]
    };

    // Create the special first item that always comes first
    const specialFirstItem: NavItem = {
      name: '$9,750/m profits w/ RNR',
      children: [
        {
          name: '/tebnar2 - Generate Images In A Batch',
          path: 'https://snef.me/bin34/tebnar2'
        },
        {
          name: '/nwjar1 - T.NWPI_CONTENT - UTG',
          path: '/nwjar1'
        },
        {
          name: '/nwivid - t.nwpi_content - item',
          path: '/nwivid'
        },
        {
          name: '/sitejar4 - T.SITESPREN - UTG',
          path: '/sitejar4'
        },
        {
          name: '/gconjar1 - T.GCON_PIECES - UTG',
          path: '/gconjar1'
        },
        {
          name: '/pedbar - t.gcon_pieces - item',
          path: '/pedbar'
        },
        {
          name: '/pedtor - t.gcon_pieces - item',
          path: '/pedtor'
        },
        {
          name: '/flatx1 - JSON Flattener (Elementor) - t.gcon_pieces - item',
          path: '/flatx1'
        },
        {
          name: '/slotx1 - Slot View (Elementor) - t.gcon_pieces - item',
          path: '/slotx1'
        },
        {
          name: '/fanex1 - Prex System Tools (Elementor) - t.gcon_pieces - item',
          path: '/fanex1'
        },
        {
          name: '/karfi1 - Karfi Arrangements - Arrange narpi_pushes.kareench1 into elementor data',
          path: 'https://snef.me/karfi1'
        },
        {
          name: '/narpo1 - Narpi Image Pushes',
          path: '/narpo1'
        }
      ]
    };

    // Create the final nav items array with admin first, then special item, then the rest (non-admin items)
    const finalNavItems = [adminMenuItem, specialFirstItem, ...nonAdminItems];

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
            {(item.name === 'admin' || item.name === '$9,750/m profits w/ RNR') && (
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
              item.name === '$9,750/m profits w/ RNR' ? 'w-auto min-w-96' : 'w-48'
            }`}>
              {item.children.map((child) => (
                <Link
                  key={child.path}
                  href={child.path!}
                  className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                    item.name === '$9,750/m profits w/ RNR' ? 'whitespace-nowrap' : ''
                  }`}
                  onClick={() => setNavDropdowns(prev => ({ ...prev, [item.name]: false }))}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      // Render regular navigation link
      return (
        <Link
          key={item.path}
          href={item.path!}
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
        backgroundColor: isNwjarPage && nwjarHeaderColor ? nwjarHeaderColor :
                        isGconjarPage && gconjarHeaderColor ? gconjarHeaderColor :
                        isPedtorPage && pedtorHeaderColor ? pedtorHeaderColor : 
                        isPedbarPage && pedbarHeaderColor ? pedbarHeaderColor : 
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
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile Settings
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