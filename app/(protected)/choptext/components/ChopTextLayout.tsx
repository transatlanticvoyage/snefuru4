'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import SidebarMenu from '@/app/components/SidebarMenu';
import SelectedRowStyles from '@/app/components/SelectedRowStyles';

// Enhanced toggle states
type ToggleState = 'both-visible' | 'sidebar-only' | 'header-only' | 'both-hidden';

interface ChopTextLayoutProps {
  children: React.ReactNode;
}

export default function ChopTextLayout({ children }: ChopTextLayoutProps) {
  const [toggleState, setToggleState] = useState<ToggleState>('both-visible');

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('choptext-toggle-state');
    if (savedState && ['both-visible', 'sidebar-only', 'header-only', 'both-hidden'].includes(savedState)) {
      setToggleState(savedState as ToggleState);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('choptext-toggle-state', toggleState);
  }, [toggleState]);

  // Cycle through toggle states
  const cycleToggleState = () => {
    setToggleState(prevState => {
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

  // Get current visibility states
  const sidebarVisible = toggleState === 'both-visible' || toggleState === 'sidebar-only';
  const headerVisible = toggleState === 'both-visible' || toggleState === 'header-only';

  // Get toggle button properties based on current state
  const getToggleButtonProps = () => {
    switch (toggleState) {
      case 'both-visible':
        return {
          icon: "M4 6h16M4 12h16M4 18h16", // Classic hamburger (3 lines)
          bgColor: "bg-gray-800 hover:bg-gray-700",
          tooltip: "Hide header (keep sidebar)",
          label: "Both"
        };
      case 'sidebar-only':
        return {
          icon: "M4 6h16", // Single line at top (header hidden)
          bgColor: "bg-blue-800 hover:bg-blue-700",
          tooltip: "Hide sidebar (keep header)",
          label: "Side"
        };
      case 'header-only':
        return {
          icon: "M4 12h16M4 18h16", // Two lines at bottom (sidebar hidden)
          bgColor: "bg-orange-800 hover:bg-orange-700",
          tooltip: "Hide both sidebar and header",
          label: "Head"
        };
      case 'both-hidden':
        return {
          icon: "M3 3h18v18H3z", // Square/restore icon
          bgColor: "bg-red-800 hover:bg-red-700",
          tooltip: "Show sidebar and header",
          label: "Hide"
        };
      default:
        return {
          icon: "M4 6h16M4 12h16M4 18h16",
          bgColor: "bg-gray-800 hover:bg-gray-700",
          tooltip: "Toggle navigation",
          label: "Menu"
        };
    }
  };

  const buttonProps = getToggleButtonProps();

  // Enhanced toggle button component
  const EnhancedToggleButton = () => (
    <button
      onClick={cycleToggleState}
      className={`fixed top-4 left-4 z-50 p-2 rounded-md shadow-lg border border-gray-600 transition-colors ${buttonProps.bgColor}`}
      title={buttonProps.tooltip}
    >
      <svg className="h-5 w-5 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={buttonProps.icon} />
      </svg>
      
      {/* State indicator badge */}
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white">
        <div className={`w-full h-full rounded-full ${
          toggleState === 'both-visible' ? 'bg-green-500' :
          toggleState === 'sidebar-only' ? 'bg-blue-500' :
          toggleState === 'header-only' ? 'bg-orange-500' :
          'bg-red-500'
        }`} />
      </div>
    </button>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${sidebarVisible ? 'snefuru-app-container sidebar-open' : 'snefuru-app-container'}`}>
      {/* Enhanced Toggle Button - always visible */}
      <EnhancedToggleButton />
      
      {/* Sidebar Wrapper */}
      {sidebarVisible && (
        <div className="snefuru-sidebar-wrapper">
          <SidebarMenu 
            isOpen={sidebarVisible} 
            onToggle={cycleToggleState}
            showToggleButton={false} // Hide the original toggle button
          />
        </div>
      )}
      
      {/* Content Wrapper */}
      <div className={`${sidebarVisible ? 'snefuru-content-wrapper' : 'w-full'}`}>
        {/* Header - conditionally rendered */}
        {headerVisible && <Header />}
        
        {/* Main Content */}
        <main className={`py-6 px-4 transition-all duration-300 ${
          !headerVisible ? 'pt-16' : '' // Add top padding when header is hidden to account for toggle button
        } ${
          !sidebarVisible ? 'ml-0' : '' // Remove left margin when sidebar is hidden
        }`}>
          {children}
        </main>
      </div>
      
      <SelectedRowStyles />
      
      {/* State Debug Info (can remove in production) */}
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded z-40 font-mono">
        <div>State: <span className="font-bold">{toggleState}</span></div>
        <div>Sidebar: <span className={sidebarVisible ? 'text-green-400' : 'text-red-400'}>{sidebarVisible ? 'ON' : 'OFF'}</span></div>
        <div>Header: <span className={headerVisible ? 'text-green-400' : 'text-red-400'}>{headerVisible ? 'ON' : 'OFF'}</span></div>
      </div>
    </div>
  );
}