'use client';

// Updated sidebar with dark mode WP-admin styling and full navigation
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface SidebarMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  path?: string;
  children?: NavItem[];
}

export default function SidebarMenu({ isOpen, onToggle }: SidebarMenuProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [shouldShow, setShouldShow] = useState(false);
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const supabase = createClientComponentClient();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Admin menu items
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
      }
    ]
  };

  // Special starred menu
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
    // Fetch navigation items when component mounts
    const fetchNavItems = async () => {
      try {
        const response = await fetch('/api/navigation');
        const data = await response.json();
        setNavItems(data);
      } catch (error) {
        console.error('Error fetching navigation:', error);
      }
    };

    fetchNavItems();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
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
    const isStarred = item.name === 'admin' || item.name === '$9,750/m profits w/ RNR';

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
              {item.children?.map(child => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        href={item.path!}
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
    const items = [adminMenuItem, specialFirstItem];
    
    // Add other nav items from API
    navItems.forEach(item => {
      // Skip admin pages and items already in special menus
      if (!item.path?.includes('/admin/') && 
          item.name !== 'admin' && 
          item.name !== '$9,750/m profits w/ RNR') {
        items.push(item);
      }
    });

    return items;
  };

  if (!shouldShow) {
    return null;
  }

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
              <Image
                src="/assets/images/snefuru-logo.png"
                alt="Snefuru Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-semibold text-white">
              Snefuru4
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

        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center w-full text-left hover:bg-gray-800 p-2 rounded transition-colors"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
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
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onToggle();
                  }}
                >
                  Profile Settings
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
            Full Navigation Menu
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-40 p-2 bg-gray-800 rounded-md shadow-lg border border-gray-600 hover:bg-gray-700 transition-colors"
        title="Toggle Navigation Menu"
      >
        <svg className="h-5 w-5 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
}