'use client';

import React, { useState, useEffect } from 'react';

export default function FavaNavToggle() {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    // Load header visibility state from localStorage
    const savedHeaderVisibility = localStorage.getItem('fava-header-visible');
    if (savedHeaderVisibility !== null) {
      setHeaderVisible(JSON.parse(savedHeaderVisibility));
    }

    // Load sidebar visibility state from localStorage
    const savedSidebarVisibility = localStorage.getItem('fava-sidebar-visible');
    if (savedSidebarVisibility !== null) {
      setSidebarVisible(JSON.parse(savedSidebarVisibility));
    }
  }, []);

  const toggleHeader = () => {
    const newVisibility = !headerVisible;
    setHeaderVisible(newVisibility);
    localStorage.setItem('fava-header-visible', JSON.stringify(newVisibility));
    
    // Dispatch custom event for header components
    window.dispatchEvent(new Event('fava-header-toggle'));
  };

  const toggleSidebar = () => {
    const newVisibility = !sidebarVisible;
    setSidebarVisible(newVisibility);
    localStorage.setItem('fava-sidebar-visible', JSON.stringify(newVisibility));
    
    // Dispatch custom event for sidebar components
    window.dispatchEvent(new Event('fava-sidebar-toggle'));
  };

  return (
    <div className="fava-nav-toggle-container">
      {/* Header Toggle (Top Half) */}
      <button
        className="fava-nav-toggle fava-header-toggle"
        onClick={toggleHeader}
        title={headerVisible ? 'Hide header' : 'Show header'}
        aria-label={headerVisible ? 'Hide header' : 'Show header'}
      >
        {headerVisible ? '▲' : '△'}
      </button>
      
      {/* Sidebar Toggle (Bottom Half) */}
      <button
        className="fava-nav-toggle fava-sidebar-toggle"
        onClick={toggleSidebar}
        title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
        aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
      >
        {sidebarVisible ? '◀' : '▷'}
      </button>
      
      <style jsx>{`
        .fava-nav-toggle-container {
          position: fixed;
          top: 4px;
          left: 4px;
          z-index: 1002;
          display: flex;
          flex-direction: column;
        }
        
        .fava-nav-toggle {
          width: 48px;
          height: 24px;
          border: none;
          background: #2563eb;
          color: white;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #1d4ed8;
        }
        
        .fava-header-toggle {
          border-bottom: none;
          border-radius: 0;
          margin-bottom: 1px;
        }
        
        .fava-sidebar-toggle {
          border-radius: 0;
        }
        
        .fava-nav-toggle:hover {
          background: #1d4ed8;
        }
        
        .fava-nav-toggle:active {
          background: #1e40af;
        }
        
        @media (max-width: 768px) {
          .fava-nav-toggle-container {
            top: 2px;
            left: 2px;
          }
          
          .fava-nav-toggle {
            width: 42px;
            height: 21px;
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}