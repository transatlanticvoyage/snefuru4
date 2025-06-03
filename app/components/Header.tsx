'use client';

import React from "react";
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface NavItem {
  name: string;
  path: string;
  children?: NavItem[];
}

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const { firstRow, secondRow } = splitNavItems();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20"> {/* Increased height for 2 rows */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                Snefuru4
              </Link>
            </div>
            <nav className="ml-6 flex flex-col justify-center space-y-1"> {/* Changed to flex-col with space-y-1 */}
              {/* First row */}
              <div className="flex space-x-8">
                {firstRow.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="inline-flex items-center px-1 py-1 text-sm font-medium text-gray-900 hover:text-gray-700"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              {/* Second row */}
              {secondRow.length > 0 && (
                <div className="flex space-x-8">
                  {secondRow.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className="inline-flex items-center px-1 py-1 text-sm font-medium text-gray-900 hover:text-gray-700"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </nav>
          </div>
          <div className="flex items-center">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  {user?.email?.[0].toUpperCase() || 'U'}
                </div>
              </button>
              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    {user?.email}
                  </div>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    href="/papikeys"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    API Keys
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