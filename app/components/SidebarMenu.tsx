'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface SidebarMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  {
    name: '/tebnar2 - Generate Images In A Batch',
    path: '/tebnar2'
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
    name: '/pedazos1 - T.GCON_PIECES - UTG',
    path: '/pedazos1'
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
    path: '/karfi'
  },
  {
    name: '/narpo1 - Narpi Image Pushes',
    path: '/narpo1'
  }
];

export default function SidebarMenu({ isOpen, onToggle }: SidebarMenuProps) {
  const { user } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);
  const supabase = createClientComponentClient();

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

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Menu</h2>
          <button
            onClick={onToggle}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
                onClick={onToggle}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center text-xs text-gray-500">
            <svg 
              className="w-3 h-3 mr-1 text-black" 
              style={{ 
                filter: 'drop-shadow(0 0 1px white)'
              }}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Special Quick Access Menu
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-40 p-2 bg-white rounded-md shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        title="Toggle Quick Menu"
      >
        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
}