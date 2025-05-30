'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/home" className="text-2xl font-bold text-indigo-600">
                Snefuru
              </Link>
            </div>
            <nav className="ml-6 flex space-x-8">
              <Link href="/home" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                Home
              </Link>
              <Link href="/papikeys" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                Papikeys
              </Link>
              <Link href="/papikeys2" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                Papikeys2
              </Link>
              <Link href="/papikeys3" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                Papikeys3
              </Link>
              <Link href="/gambar1" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                Gambar1
              </Link>
              <Link href="/gambar2" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                Gambar2
              </Link>
              <Link href="/belt1" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                Belt1
              </Link>
              <Link href="/fbin2/panjar1" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                Panjar1
              </Link>
              <Link href="/fbin2/fapikeys1" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                FApikeys1
              </Link>
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