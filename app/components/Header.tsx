'use client';

import React from "react";
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface NavItem {
  name: string;
  path?: string;
  children?: NavItem[];
}

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [navDropdowns, setNavDropdowns] = useState<{[key: string]: boolean}>({});
  const [navItems, setNavItems] = useState<NavItem[]>([]);
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
    const panjar3Index = navItems.findIndex(item => item.name === 'panjar3');
    if (panjar3Index === -1) {
      // If panjar3 not found, split roughly in half
      const midPoint = Math.ceil(navItems.length / 2);
      return {
        firstRow: navItems.slice(0, midPoint),
        secondRow: navItems.slice(midPoint)
      };
    } else {
      // Split after panjar3 (include panjar3 in first row)
      return {
        firstRow: navItems.slice(0, panjar3Index + 1),
        secondRow: navItems.slice(panjar3Index + 1)
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
            <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
              {item.children.map((child) => (
                <Link
                  key={child.path}
                  href={child.path!}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
    <header className="bg-white shadow">
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