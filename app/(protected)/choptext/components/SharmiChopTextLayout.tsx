'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import SidebarMenu from '@/app/components/SidebarMenu';
import SelectedRowStyles from '@/app/components/SelectedRowStyles';

// Sharmi enhanced toggle states for header and sidebar management
type SharmiToggleState = 'both-visible' | 'sidebar-only' | 'header-only' | 'both-hidden';

interface SharmiChopTextLayoutProps {
  children: React.ReactNode;
}

export default function SharmiChopTextLayout({ children }: SharmiChopTextLayoutProps) {
  const [sharmiToggleState, setSharmiToggleState] = useState<SharmiToggleState>('both-visible');

  // Load saved Sharmi state from localStorage on mount
  useEffect(() => {
    const savedSharmiState = localStorage.getItem('sharmi-choptext-toggle-state');
    if (savedSharmiState && ['both-visible', 'sidebar-only', 'header-only', 'both-hidden'].includes(savedSharmiState)) {
      setSharmiToggleState(savedSharmiState as SharmiToggleState);
    }
  }, []);

  // Save Sharmi state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sharmi-choptext-toggle-state', sharmiToggleState);
  }, [sharmiToggleState]);

  // Cycle through Sharmi toggle states for header and sidebar management
  const cycleSharmiToggleState = () => {
    setSharmiToggleState(prevState => {
      switch (prevState) {
        case 'both-visible':
          return 'sidebar-only'; // Hide header, keep sidebar
        case 'sidebar-only':
          return 'header-only'; // Hide sidebar, show header
        case 'header-only':
          return 'both-hidden'; // Hide both
        case 'both-hidden':
          return 'both-visible'; // Show both
        default:
          return 'both-visible';
      }
    });
  };

  // Get current Sharmi visibility states for header and sidebar
  const sharmiSidebarVisible = sharmiToggleState === 'both-visible' || sharmiToggleState === 'sidebar-only';
  const sharmiHeaderVisible = sharmiToggleState === 'both-visible' || sharmiToggleState === 'header-only';

  // Get Sharmi toggle button properties based on current state
  const getSharmiToggleButtonProps = () => {
    switch (sharmiToggleState) {
      case 'both-visible':
        return {
          icon: "M4 6h16M4 12h16M4 18h16", // Classic hamburger (3 lines)
          bgColor: "bg-gray-800 hover:bg-gray-700",
          tooltip: "Sharmi: Hide header (keep sidebar)",
          label: "Both"
        };
      case 'sidebar-only':
        return {
          icon: "M4 6h16", // Single line at top (header hidden)
          bgColor: "bg-blue-800 hover:bg-blue-700",
          tooltip: "Sharmi: Hide sidebar (keep header)",
          label: "Side"
        };
      case 'header-only':
        return {
          icon: "M4 12h16M4 18h16", // Two lines at bottom (sidebar hidden)
          bgColor: "bg-orange-800 hover:bg-orange-700",
          tooltip: "Sharmi: Hide both sidebar and header",
          label: "Head"
        };
      case 'both-hidden':
        return {
          icon: "M3 3h18v18H3z", // Square/restore icon
          bgColor: "bg-red-800 hover:bg-red-700",
          tooltip: "Sharmi: Show sidebar and header",
          label: "Hide"
        };
      default:
        return {
          icon: "M4 6h16M4 12h16M4 18h16",
          bgColor: "bg-gray-800 hover:bg-gray-700",
          tooltip: "Sharmi: Toggle navigation",
          label: "Menu"
        };
    }
  };

  const sharmiButtonProps = getSharmiToggleButtonProps();

  // Sharmi enhanced toggle button component for header and sidebar management
  const SharmiEnhancedToggleButton = () => (
    <button
      onClick={cycleSharmiToggleState}
      className={`fixed top-4 left-4 z-50 p-2 rounded-md shadow-lg border border-gray-600 transition-colors ${sharmiButtonProps.bgColor}`}
      title={sharmiButtonProps.tooltip}
    >
      <svg className="h-5 w-5 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sharmiButtonProps.icon} />
      </svg>
      
      {/* Sharmi state indicator badge */}
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white">
        <div className={`w-full h-full rounded-full ${
          sharmiToggleState === 'both-visible' ? 'bg-green-500' :
          sharmiToggleState === 'sidebar-only' ? 'bg-blue-500' :
          sharmiToggleState === 'header-only' ? 'bg-orange-500' :
          'bg-red-500'
        }`} />
      </div>
    </button>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${sharmiSidebarVisible ? 'snefuru-app-container sidebar-open' : 'snefuru-app-container'}`}>
      {/* Sharmi Enhanced Toggle Button - always visible */}
      <SharmiEnhancedToggleButton />
      
      {/* Sharmi Sidebar Wrapper */}
      {sharmiSidebarVisible && (
        <div className="snefuru-sidebar-wrapper">
          <SidebarMenu 
            isOpen={sharmiSidebarVisible} 
            onToggle={cycleSharmiToggleState}
            showToggleButton={false} // Hide the original toggle button (Sharmi handles this)
          />
        </div>
      )}
      
      {/* Sharmi Content Wrapper */}
      <div className={`${sharmiSidebarVisible ? 'snefuru-content-wrapper' : 'w-full'}`}>
        {/* Sharmi Header - conditionally rendered */}
        {sharmiHeaderVisible && <Header />}
        
        {/* Sharmi Main Content */}
        <main className={`py-6 px-4 transition-all duration-300 ${
          !sharmiHeaderVisible ? 'pt-16' : '' // Add top padding when Sharmi header is hidden to account for toggle button
        } ${
          !sharmiSidebarVisible ? 'ml-0' : '' // Remove left margin when Sharmi sidebar is hidden
        }`}>
          {children}
        </main>
      </div>
      
      <SelectedRowStyles />
      
      {/* Sharmi State Debug Info (can remove in production) */}
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded z-40 font-mono">
        <div>Sharmi State: <span className="font-bold">{sharmiToggleState}</span></div>
        <div>Sharmi Sidebar: <span className={sharmiSidebarVisible ? 'text-green-400' : 'text-red-400'}>{sharmiSidebarVisible ? 'ON' : 'OFF'}</span></div>
        <div>Sharmi Header: <span className={sharmiHeaderVisible ? 'text-green-400' : 'text-red-400'}>{sharmiHeaderVisible ? 'ON' : 'OFF'}</span></div>
      </div>
    </div>
  );
}